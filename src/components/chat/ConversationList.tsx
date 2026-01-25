import { useState } from "react";
import { Search, Plus, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConversationItem } from "./ConversationItem";
import { NewChatDialog } from "./NewChatDialog";
import { NewGroupDialog } from "./NewGroupDialog";
import type { ConversationWithDetails } from "@/lib/supabase";
import { useChat } from "@/contexts/ChatContext";

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  activeConversationId?: string;
  onSelectConversation: (conversation: ConversationWithDetails) => void;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const { loading } = useChat();

  const filteredConversations = conversations.filter((conv) => {
    const searchLower = searchQuery.toLowerCase();
    if (conv.name?.toLowerCase().includes(searchLower)) return true;
    return conv.participants.some(
      (p) =>
        p.profile?.full_name?.toLowerCase().includes(searchLower) ||
        p.profile?.username?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <>
      <div className="flex flex-col h-full bg-sidebar">
        {/* Search and actions */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={() => setShowNewChat(true)}
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={() => setShowNewGroup(true)}
            >
              <Users className="w-4 h-4" />
              New Group
            </Button>
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-muted-foreground">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {!searchQuery && "Start a new chat to begin messaging"}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onClick={() => onSelectConversation(conversation)}
              />
            ))
          )}
        </div>
      </div>

      <NewChatDialog open={showNewChat} onOpenChange={setShowNewChat} />
      <NewGroupDialog open={showNewGroup} onOpenChange={setShowNewGroup} />
    </>
  );
}
