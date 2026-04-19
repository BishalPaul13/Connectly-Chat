import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday, isYesterday } from "date-fns";
import { Check, CheckCheck } from "lucide-react";

function formatTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MM/dd/yy");
}

export function ConversationItem({ conversation, isActive, onClick }) {
    const { user } = useAuth();

    const otherParticipants = conversation.participants.filter(
        (p) => p.user_id !== user?.id
    );

    const displayName = conversation.is_group
        ? conversation.name
        : otherParticipants[0]?.profile?.full_name || otherParticipants[0]?.profile?.username || "Unknown";

    const avatarUrl = conversation.is_group
        ? conversation.avatar_url
        : otherParticipants[0]?.profile?.avatar_url;

    const isOnline = !conversation.is_group && otherParticipants[0]?.profile?.is_online;

    const lastMessage = conversation.last_message;
    const lastMessageContent = lastMessage?.content || "No messages yet";
    const lastMessageTime = formatTime(lastMessage?.created_at);
    const isOwnMessage = lastMessage?.sender_id === user?.id;
    const isPending = !conversation.is_group && conversation.request_status === "pending";
    const isRequester = isPending && conversation.requested_by === user?.id;
    const blockedByMe = !conversation.is_group && conversation.blocked_by_me;
    const blockedMe = !conversation.is_group && conversation.blocked_me;

    let previewText = lastMessageContent;
    if (blockedByMe) previewText = "You blocked this user";
    else if (blockedMe) previewText = "You are blocked";
    else if (isPending) previewText = isRequester ? "Request sent" : "Chat request";

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-full rounded-[1.35rem] border border-transparent px-4 py-3 text-left transition-colors duration-200",
                "hover:border-white/70 hover:bg-white/65 hover:shadow-sm dark:hover:border-white/10 dark:hover:bg-white/5",
                isActive && "border-primary/20 bg-white/90 shadow-sm dark:bg-white/10 dark:border-primary/30"
            )}
        >
            <div className="flex items-center gap-3">
                <Avatar
                    src={avatarUrl}
                    name={displayName}
                    size="lg"
                    isOnline={!conversation.is_group ? isOnline : undefined}
                />

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-extrabold tracking-tight text-foreground">{displayName}</span>
                        <span className="flex-shrink-0 text-[11px] font-medium text-muted-foreground">{lastMessageTime}</span>
                    </div>

                    <div className="mt-1 flex items-center gap-1">
                        {isOwnMessage && lastMessage && (
                            <span className="flex-shrink-0">
                                {lastMessage.status === "read" ? (
                                    <CheckCheck className="w-4 h-4 status-read" />
                                ) : lastMessage.status === "delivered" ? (
                                    <CheckCheck className="w-4 h-4 status-delivered" />
                                ) : (
                                    <Check className="w-4 h-4 status-sent" />
                                )}
                            </span>
                        )}
                        <p className="flex-1 truncate text-sm text-muted-foreground">{previewText}</p>
                        {conversation.unread_count > 0 && (
                            <span className="flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground shadow-sm">
                                {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </button>
    );
}
