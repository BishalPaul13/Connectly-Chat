import { useState } from "react";
import { Search, Plus, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConversationItem } from "./ConversationItem";
import { NewChatDialog } from "./NewChatDialog";
import { NewGroupDialog } from "./NewGroupDialog";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "./Avatar";

export function ConversationList({
    conversations,
    activeConversationId,
    onSelectConversation,
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [showNewChat, setShowNewChat] = useState(false);
    const [showNewGroup, setShowNewGroup] = useState(false);
    const { loading, acceptConversationRequest, deleteConversationRequest } = useChat();
    const { user } = useAuth();

    const requestConversations = conversations.filter(
        (conv) =>
            !conv.is_group &&
            (conv.request_status ?? "active") !== "active"
    );

    const incomingRequests = requestConversations.filter(
        (conv) => conv.requested_by !== user?.id
    );

    const outgoingRequests = requestConversations.filter(
        (conv) => conv.requested_by === user?.id
    );

    const filteredConversations = conversations.filter((conv) => {
        const searchLower = searchQuery.toLowerCase();
        const requestStatus = conv.request_status ?? "active";
        if (!conv.is_group && requestStatus !== "active") return false;
        if (conv.name?.toLowerCase().includes(searchLower)) return true;
        return conv.participants.some(
            (p) =>
                p.profile?.full_name?.toLowerCase().includes(searchLower) ||
                p.profile?.username?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <>
            <div className="flex flex-col flex-1 min-h-0 bg-sidebar">
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

                {/* Requests */}
                {requestConversations.length > 0 && (
                    <div className="px-4 pb-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Requests
                        </div>
                        <div className="space-y-2">
                            {incomingRequests.map((conversation) => {
                                const other = conversation.participants.find((p) => p.user_id !== user?.id);
                                const displayName =
                                    other?.profile?.full_name ||
                                    other?.profile?.username ||
                                    "Unknown";
                                return (
                                    <div
                                        key={conversation.id}
                                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/40"
                                    >
                                        <Avatar
                                            src={other?.profile?.avatar_url}
                                            name={displayName}
                                            size="sm"
                                            isOnline={other?.profile?.is_online}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{displayName}</div>
                                            <div className="text-xs text-muted-foreground">Wants to chat</div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                onClick={() => acceptConversationRequest(conversation.id)}
                                            >
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => deleteConversationRequest(conversation.id)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                            {outgoingRequests.map((conversation) => {
                                const other = conversation.participants.find((p) => p.user_id !== user?.id);
                                const displayName =
                                    other?.profile?.full_name ||
                                    other?.profile?.username ||
                                    "Unknown";
                                return (
                                    <div
                                        key={conversation.id}
                                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                                    >
                                        <Avatar
                                            src={other?.profile?.avatar_url}
                                            name={displayName}
                                            size="sm"
                                            isOnline={other?.profile?.is_online}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{displayName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                Request sent
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

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
