import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { conversationsApi, messagesApi, typingApi, profilesApi } from "@/lib/api";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { useAuth } from "./AuthContext";

const ChatContext = createContext(undefined);

export function ChatProvider({ children }) {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConversation, _setActiveConversation] = useState(null);

    const setActiveConversation = useCallback((conversation) => {
        _setActiveConversation(conversation);
        if (conversation) {
            setConversations(prev => prev.map(c =>
                c.id === conversation.id
                    ? { ...c, unread_count: 0 }
                    : c
            ));
        }
    }, []);
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const data = await conversationsApi.getAll();
            setConversations(data);
            setLoading(false);
        } catch (error) {
            console.error("Error in fetchConversations:", error);
            setLoading(false);
        }
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

        try {
            const data = await messagesApi.getByConversation(activeConversation.id);
            setMessages(data);
        } catch (error) {
            console.error("Error in fetchMessages:", error);
            setMessages([]);
        }
    }, [activeConversation]);

    // Initial fetch
    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    // Real-time subscriptions with Socket.io
    useEffect(() => {
        if (!user) return;

        const socket = getSocket();
        socket.emit("join-user", user.id);

        // Join all user's conversation rooms
        conversations.forEach(conv => {
            socket.emit('join-conversation', conv.id);
        });

        // Listen for new messages
        socket.on('new-message', async (message) => {
            // 1. Update active conversation messages
            if (activeConversation && message.conversation_id === activeConversation.id) {
                setMessages((prev) => {
                    if (prev.find((m) => m.id === message.id)) {
                        return prev;
                    }
                    const updated = [...prev, message];
                    return updated.sort((a, b) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );
                });

                // Mark as read immediately if user is active
                try {
                    await conversationsApi.markAsRead(activeConversation.id);
                } catch (err) {
                    console.error("Error marking as read:", err);
                }
            }

            // 2. Update conversations list (optimistic + fetch if new)
            setConversations((prevConversations) => {
                const index = prevConversations.findIndex(c => c.id === message.conversation_id);

                if (index === -1) {
                    // New conversation - fetch and add
                    conversationsApi.getById(message.conversation_id).then(newConv => {
                        if (newConv) {
                            setConversations(prev => {
                                // Double check it hasn't been added in the meantime
                                if (prev.find(c => c.id === newConv.id)) return prev;
                                return [newConv, ...prev];
                            });
                        }
                    }).catch(console.error);
                    return prevConversations;
                }

                // Existing conversation - update and move to top
                const updatedConversations = [...prevConversations];
                const conversation = updatedConversations[index];
                updatedConversations.splice(index, 1);

                // Determine if we should increment unread count
                // Increment if:
                // 1. It's NOT the active conv
                // OR
                // 2. It IS the active conv but the window/tab isn't focused (optional, but good UX - skipping for now to keep simple)
                // AND
                // 3. The sender is NOT the current user
                const isUnread = (!activeConversation || activeConversation.id !== message.conversation_id) && message.sender_id !== user.id;

                const updatedConv = {
                    ...conversation,
                    last_message: message,
                    unread_count: isUnread ? (conversation.unread_count || 0) + 1 : 0, // Reset if active, else increment
                    updated_at: message.created_at
                };

                updatedConversations.unshift(updatedConv);
                return updatedConversations;
            });
        });

        // Listen for typing indicators
        socket.on('typing', async (data) => {
            if (!activeConversation || data.conversation_id !== activeConversation.id) return;
            if (data.user_id === user.id) return;

            if (data.is_typing) {
                try {
                    const profile = await profilesApi.getById(data.user_id);
                    setTypingUsers((prev) => {
                        if (prev.find((p) => p.user_id === data.user_id)) return prev;
                        return [...prev, profile];
                    });
                } catch (error) {
                    console.error("Error fetching typing user profile:", error);
                }
            } else {
                setTypingUsers((prev) => prev.filter((p) => p.user_id !== data.user_id));
            }
        });

        // Listen for message read status updates
        socket.on('message-read', (data) => {
            const { conversation_id, reader_id } = data;
            // Update messages in active conversation
            if (activeConversation && activeConversation.id === conversation_id) {
                setMessages((prev) =>
                    prev.map((msg) => {
                        // Update status to 'read' for messages sent by current user
                        if (msg.sender_id === user.id && msg.status !== 'read') {
                            return { ...msg, status: 'read' };
                        }
                        return msg;
                    })
                );
            }
            // Update last_message status in conversations list
            setConversations((prev) =>
                prev.map((conv) => {
                    if (conv.id === conversation_id && conv.last_message && conv.last_message.sender_id === user.id) {
                        return {
                            ...conv,
                            last_message: { ...conv.last_message, status: 'read' }
                        };
                    }
                    return conv;
                })
            );
        });

        socket.on("conversation-created", async (data) => {
            if (!data?.conversation_id) return;
            try {
                const newConv = await conversationsApi.getById(data.conversation_id);
                if (!newConv) return;
                setConversations((prev) => {
                    if (prev.find((c) => c.id === newConv.id)) return prev;
                    return [newConv, ...prev];
                });
            } catch (error) {
                console.error("Error handling conversation-created:", error);
            }
        });

        socket.on("conversation-updated", async (data) => {
            if (!data?.conversation_id) return;
            try {
                const updated = await conversationsApi.getById(data.conversation_id);
                if (!updated) return;
                setConversations((prev) => {
                    const index = prev.findIndex((c) => c.id === updated.id);
                    if (index === -1) return [updated, ...prev];
                    const next = [...prev];
                    next[index] = { ...next[index], ...updated };
                    return next;
                });
                if (activeConversation?.id === updated.id) {
                    _setActiveConversation((prev) => (prev ? { ...prev, ...updated } : prev));
                }
            } catch (error) {
                console.error("Error handling conversation-updated:", error);
            }
        });

        socket.on("conversation-deleted", (data) => {
            if (!data?.conversation_id) return;
            setConversations((prev) => prev.filter((c) => c.id !== data.conversation_id));
            if (activeConversation?.id === data.conversation_id) {
                _setActiveConversation(null);
            }
        });

        return () => {
            socket.off('new-message');
            socket.off('typing');
            socket.off('message-read');
            socket.off('conversation-created');
            socket.off('conversation-updated');
            socket.off('conversation-deleted');
        };
    }, [user, activeConversation, conversations]);

    // Join/leave conversation room when active conversation changes
    useEffect(() => {
        const socket = getSocket();

        if (activeConversation) {
            socket.emit('join-conversation', activeConversation.id);
        }

        return () => {
            if (activeConversation) {
                socket.emit('leave-conversation', activeConversation.id);
            }
        };
    }, [activeConversation]);

    // Clear typing users when conversation changes
    useEffect(() => {
        setTypingUsers([]);
    }, [activeConversation]);

    const sendMessage = async (content) => {
        if (!user || !activeConversation || !content.trim()) return;
        if (!activeConversation.is_group) {
            const requestStatus = activeConversation.request_status ?? "active";
            if (requestStatus !== "active") {
                return;
            }
            if (activeConversation.blocked_by_me || activeConversation.blocked_me) {
                return;
            }
        }

        try {
            const newMessage = await messagesApi.create(activeConversation.id, content);

            // Add message to local state immediately if not already added via socket
            if (newMessage) {
                setMessages((prev) => {
                    if (prev.find((m) => m.id === newMessage.id)) return prev;
                    return [...prev, newMessage].sort((a, b) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );
                });

                // Update conversation list optimistically
                setConversations((prevConversations) => {
                    const index = prevConversations.findIndex(c => c.id === activeConversation.id);
                    if (index === -1) return prevConversations;

                    const updatedConversations = [...prevConversations];
                    const conversation = updatedConversations[index];
                    updatedConversations.splice(index, 1);

                    const updatedConv = {
                        ...conversation,
                        last_message: newMessage,
                        updated_at: newMessage.created_at
                    };

                    updatedConversations.unshift(updatedConv);
                    return updatedConversations;
                });
            }

            // Clear typing indicator
            await setTyping(false);
        } catch (error) {
            console.error("Error in sendMessage:", error);
        }
    };

    const createConversation = async (participantId) => {
        if (!user) {
            console.error("Cannot create conversation: user not authenticated");
            return null;
        }

        try {
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
            const newConv = await conversationsApi.create(participantId, false);

            if (!newConv) {
                console.error("Failed to create conversation: no data returned");
                return null;
            }

            // Refresh conversations to get the latest data
            await fetchConversations();

            setActiveConversation(newConv);
            return newConv;
        } catch (error) {
            console.error("Error in createConversation:", error);
            return null;
        }
    };

    const createGroupConversation = async (name, participantIds) => {
        if (!user) return null;

        try {
            const newConv = await conversationsApi.create(undefined, true, name, participantIds);

            if (!newConv) return null;

            await fetchConversations();
            setActiveConversation(newConv);
            return newConv;
        } catch (error) {
            console.error("Error in createGroupConversation:", error);
            return null;
        }
    };

    const setTyping = async (isTyping) => {
        if (!user || !activeConversation) return;

        try {
            await typingApi.update(activeConversation.id, isTyping);

            // Emit typing event via socket
            const socket = getSocket();
            socket.emit('typing', {
                conversation_id: activeConversation.id,
                user_id: user.id,
                is_typing: isTyping,
            });
        } catch (error) {
            console.error("Error setting typing:", error);
        }
    };

    const markAsRead = async () => {
        if (!user || !activeConversation) return;

        try {
            await conversationsApi.markAsRead(activeConversation.id);
            await fetchConversations();
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const acceptConversationRequest = async (conversationId) => {
        if (!user) return null;

        try {
            const updated = await conversationsApi.acceptRequest(conversationId);
            await fetchConversations();
            if (activeConversation?.id === conversationId) {
                _setActiveConversation((prev) =>
                    prev ? { ...prev, request_status: "active", approved_at: updated?.approved_at } : prev
                );
            }
            return updated;
        } catch (error) {
            console.error("Error accepting conversation request:", error);
            return null;
        }
    };

    const deleteConversationRequest = async (conversationId) => {
        if (!user) return null;

        try {
            await conversationsApi.deleteRequest(conversationId);
            setConversations((prev) => prev.filter((c) => c.id !== conversationId));
            if (activeConversation?.id === conversationId) {
                _setActiveConversation(null);
            }
            return true;
        } catch (error) {
            console.error("Error deleting conversation request:", error);
            return null;
        }
    };

    const deleteConversation = async (conversationId) => {
        if (!user) return false;

        try {
            await conversationsApi.delete(conversationId);
            setConversations((prev) => prev.filter((c) => c.id !== conversationId));
            if (activeConversation?.id === conversationId) {
                _setActiveConversation(null);
            }
            return true;
        } catch (error) {
            console.error("Error deleting conversation:", error);
            return false;
        }
    };

    const blockConversation = async (conversationId) => {
        if (!user) return false;

        try {
            await conversationsApi.block(conversationId);
            await fetchConversations();
            if (activeConversation?.id === conversationId) {
                _setActiveConversation((prev) =>
                    prev ? { ...prev, blocked_by_me: true, blocked_me: false } : prev
                );
            }
            return true;
        } catch (error) {
            console.error("Error blocking user:", error);
            return false;
        }
    };

    const unblockConversation = async (conversationId) => {
        if (!user) return false;

        try {
            await conversationsApi.unblock(conversationId);
            await fetchConversations();
            if (activeConversation?.id === conversationId) {
                _setActiveConversation((prev) =>
                    prev ? { ...prev, blocked_by_me: false } : prev
                );
            }
            return true;
        } catch (error) {
            console.error("Error unblocking user:", error);
            return false;
        }
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
                acceptConversationRequest,
                deleteConversationRequest,
                deleteConversation,
                blockConversation,
                unblockConversation,
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
