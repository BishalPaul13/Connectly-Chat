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
            <div className="flex flex-col flex-1 min-h-0 bg-sidebar/60">
                <div className="border-b border-border/70 p-4 pb-5">
                    <div className="mb-4 flex items-end justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                                Inbox
                            </p>
                            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
                                Messages
                            </h1>
                        </div>
                        <div className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {filteredConversations.length} active
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-12 rounded-2xl border-white/50 bg-white/70 pl-10 shadow-sm backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-white/10 dark:bg-white/5"
                        />
                    </div>

                    <div className="mt-3 flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-11 flex-1 gap-2 rounded-2xl border-white/60 bg-white/70 shadow-sm backdrop-blur-sm hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                            onClick={() => setShowNewChat(true)}
                        >
                            <Plus className="w-4 h-4" />
                            New Chat
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-11 flex-1 gap-2 rounded-2xl border-white/60 bg-white/70 shadow-sm backdrop-blur-sm hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                            onClick={() => setShowNewGroup(true)}
                        >
                            <Users className="w-4 h-4" />
                            New Group
                        </Button>
                    </div>
                </div>

                {requestConversations.length > 0 && (
                    <div className="px-4 pb-3 pt-4">
                        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
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
                                        className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-white/65 p-3 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5"
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
                                                className="rounded-xl"
                                                onClick={() => acceptConversationRequest(conversation.id)}
                                            >
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="rounded-xl"
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
                                        className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white/50 p-3 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5"
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

                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="px-4 py-8">
                            <div className="rounded-[1.75rem] border border-dashed border-border bg-white/40 px-5 py-10 text-center shadow-sm dark:bg-white/5">
                                <p className="font-semibold text-foreground">
                                    {searchQuery ? "No conversations found" : "No conversations yet"}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {!searchQuery && "Start a new chat to begin messaging"}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1 px-2 py-3">
                            {filteredConversations.map((conversation) => (
                                <ConversationItem
                                    key={conversation.id}
                                    conversation={conversation}
                                    isActive={conversation.id === activeConversationId}
                                    onClick={() => onSelectConversation(conversation)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <NewChatDialog open={showNewChat} onOpenChange={setShowNewChat} />
            <NewGroupDialog open={showNewGroup} onOpenChange={setShowNewGroup} />
        </>
    );
}
