import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Message, ConversationWithDetails, Profile } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

interface ChatContextType {
  conversations: ConversationWithDetails[];
  activeConversation: ConversationWithDetails | null;
  messages: Message[];
  typingUsers: Profile[];
  loading: boolean;
  setActiveConversation: (conversation: ConversationWithDetails | null) => void;
  sendMessage: (content: string) => Promise<void>;
  createConversation: (participantId: string) => Promise<ConversationWithDetails | null>;
  createGroupConversation: (name: string, participantIds: string[]) => Promise<ConversationWithDetails | null>;
  setTyping: (isTyping: boolean) => Promise<void>;
  markAsRead: () => Promise<void>;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    const { data: participantData } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (!participantData?.length) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const conversationIds = participantData.map((p) => p.conversation_id);

    const { data: convData } = await supabase
      .from("conversations")
      .select("*")
      .in("id", conversationIds);

    if (!convData) {
      setLoading(false);
      return;
    }

    // Get all participants for these conversations
    const { data: allParticipants } = await supabase
      .from("conversation_participants")
      .select("*, profiles:user_id(*)")
      .in("conversation_id", conversationIds);

    // Get last message for each conversation
    const { data: lastMessages } = await supabase
      .from("messages")
      .select("*")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    // Build conversation details
    const conversationsWithDetails: ConversationWithDetails[] = convData.map((conv) => {
      const participants = allParticipants
        ?.filter((p) => p.conversation_id === conv.id)
        .map((p) => ({
          ...p,
          profile: p.profiles as unknown as Profile,
        })) || [];

      const lastMessage = lastMessages?.find((m) => m.conversation_id === conv.id);

      // Count unread messages
      const userParticipant = participants.find((p) => p.user_id === user.id);
      const unreadCount = lastMessages?.filter(
        (m) =>
          m.conversation_id === conv.id &&
          m.sender_id !== user.id &&
          new Date(m.created_at) > new Date(userParticipant?.last_read_at || 0)
      ).length || 0;

      return {
        ...conv,
        participants,
        last_message: lastMessage as Message,
        unread_count: unreadCount,
      };
    });

    // Sort by last message time
    conversationsWithDetails.sort((a, b) => {
      const aTime = a.last_message?.created_at || a.created_at;
      const bTime = b.last_message?.created_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    setConversations(conversationsWithDetails);
    setLoading(false);
  }, [user]);

  const refreshConversations = useCallback(async () => {
    await fetchConversations();
  }, [fetchConversations]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async () => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", activeConversation.id)
      .order("created_at", { ascending: true });

    setMessages((data as Message[]) || []);
  }, [activeConversation]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          // Update messages if it's for the active conversation
          if (activeConversation && newMessage.conversation_id === activeConversation.id) {
            setMessages((prev) => [...prev, newMessage]);
          }

          // Update conversations list
          fetchConversations();
        }
      )
      .subscribe();

    // Subscribe to typing indicators
    const typingChannel = supabase
      .channel("typing-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
        },
        async (payload) => {
          if (!activeConversation) return;

          const typingData = payload.new as { conversation_id: string; user_id: string; is_typing: boolean };
          
          if (typingData.conversation_id !== activeConversation.id) return;
          if (typingData.user_id === user.id) return;

          if (typingData.is_typing) {
            // Fetch the profile of the typing user
            const { data: profileData } = await supabase
              .from("profiles")
              .select("*")
              .eq("user_id", typingData.user_id)
              .single();

            if (profileData) {
              setTypingUsers((prev) => {
                if (prev.find((p) => p.user_id === typingData.user_id)) return prev;
                return [...prev, profileData as Profile];
              });
            }
          } else {
            setTypingUsers((prev) => prev.filter((p) => p.user_id !== typingData.user_id));
          }
        }
      )
      .subscribe();

    // Subscribe to profile updates (online status)
    const profilesChannel = supabase
      .channel("profiles-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [user, activeConversation, fetchConversations]);

  // Clear typing users when conversation changes
  useEffect(() => {
    setTypingUsers([]);
  }, [activeConversation]);

  const sendMessage = async (content: string) => {
    if (!user || !activeConversation || !content.trim()) return;

    await supabase.from("messages").insert({
      conversation_id: activeConversation.id,
      sender_id: user.id,
      content: content.trim(),
    });

    // Clear typing indicator
    await setTyping(false);
  };

  const createConversation = async (participantId: string): Promise<ConversationWithDetails | null> => {
    if (!user) return null;

    // Check if conversation already exists
    const existingConv = conversations.find((conv) => {
      if (conv.is_group) return false;
      const participants = conv.participants.map((p) => p.user_id);
      return participants.includes(participantId) && participants.includes(user.id) && participants.length === 2;
    });

    if (existingConv) {
      setActiveConversation(existingConv);
      return existingConv;
    }

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({
        created_by: user.id,
        is_group: false,
      })
      .select()
      .single();

    if (error || !newConv) return null;

    // Add participants
    await supabase.from("conversation_participants").insert([
      { conversation_id: newConv.id, user_id: user.id },
      { conversation_id: newConv.id, user_id: participantId },
    ]);

    await fetchConversations();

    // Find and return the new conversation
    const { data: participantData } = await supabase
      .from("conversation_participants")
      .select("*, profiles:user_id(*)")
      .eq("conversation_id", newConv.id);

    const conversationWithDetails: ConversationWithDetails = {
      ...newConv,
      participants: participantData?.map((p) => ({
        ...p,
        profile: p.profiles as unknown as Profile,
      })) || [],
      unread_count: 0,
    };

    setActiveConversation(conversationWithDetails);
    return conversationWithDetails;
  };

  const createGroupConversation = async (name: string, participantIds: string[]): Promise<ConversationWithDetails | null> => {
    if (!user) return null;

    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({
        name,
        created_by: user.id,
        is_group: true,
      })
      .select()
      .single();

    if (error || !newConv) return null;

    // Add all participants including the creator
    const participantsToAdd = [...new Set([user.id, ...participantIds])];
    await supabase.from("conversation_participants").insert(
      participantsToAdd.map((id) => ({
        conversation_id: newConv.id,
        user_id: id,
      }))
    );

    await fetchConversations();

    const { data: participantData } = await supabase
      .from("conversation_participants")
      .select("*, profiles:user_id(*)")
      .eq("conversation_id", newConv.id);

    const conversationWithDetails: ConversationWithDetails = {
      ...newConv,
      participants: participantData?.map((p) => ({
        ...p,
        profile: p.profiles as unknown as Profile,
      })) || [],
      unread_count: 0,
    };

    setActiveConversation(conversationWithDetails);
    return conversationWithDetails;
  };

  const setTyping = async (isTyping: boolean) => {
    if (!user || !activeConversation) return;

    await supabase.from("typing_indicators").upsert(
      {
        conversation_id: activeConversation.id,
        user_id: user.id,
        is_typing: isTyping,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "conversation_id,user_id",
      }
    );
  };

  const markAsRead = async () => {
    if (!user || !activeConversation) return;

    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", activeConversation.id)
      .eq("user_id", user.id);

    // Update message statuses
    await supabase
      .from("messages")
      .update({ status: "read" })
      .eq("conversation_id", activeConversation.id)
      .neq("sender_id", user.id);

    await fetchConversations();
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        typingUsers,
        loading,
        setActiveConversation,
        sendMessage,
        createConversation,
        createGroupConversation,
        setTyping,
        markAsRead,
        refreshConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
