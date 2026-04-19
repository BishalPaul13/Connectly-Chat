import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { Avatar } from "./Avatar";

function formatMessageTime(dateString) {
    const date = new Date(dateString);
    if (isToday(date)) {
        return format(date, "h:mm a");
    }
    if (isYesterday(date)) {
        return `Yesterday ${format(date, "h:mm a")}`;
    }
    return format(date, "MMM d, h:mm a");
}

function MessageStatus({ status }) {
    switch (status) {
        case "sent":
            return <Check className="w-3.5 h-3.5 status-sent" />;
        case "delivered":
            return <CheckCheck className="w-3.5 h-3.5 status-delivered" />;
        case "read":
            return <CheckCheck className="w-3.5 h-3.5 status-read" />;
        default:
            return null;
    }
}

export function MessageBubble({ message, isOwn, senderProfile, showAvatar = true, isGroup = false }) {
    return (
        <div
            className={cn(
                "message-enter flex gap-2 px-2 py-1.5 sm:px-3",
                isOwn ? "justify-end" : "justify-start"
            )}
        >
            {!isOwn && showAvatar && isGroup && (
                <Avatar
                    src={senderProfile?.avatar_url}
                    name={senderProfile?.full_name || senderProfile?.username}
                    size="sm"
                    className="mt-auto"
                />
            )}

            <div
                className={cn(
                    "relative min-w-[120px] max-w-[82%] rounded-[1.6rem] px-4 py-3 shadow-message backdrop-blur-sm sm:max-w-[75%]",
                    isOwn
                        ? "rounded-br-md bg-message-sent text-message-sent-foreground"
                        : "rounded-bl-md border border-white/70 bg-message-received text-message-received-foreground dark:border-white/10"
                )}
            >
                {!isOwn && isGroup && senderProfile && (
                    <p className="mb-1 text-xs font-bold text-primary">
                        {senderProfile.full_name || senderProfile.username}
                    </p>
                )}

                <p className="break-words whitespace-pre-wrap text-[15px] leading-7">
                    {message.content}
                </p>

                <div
                    className={cn(
                        "mt-2 flex items-center justify-end gap-1",
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                >
                    <span className="text-[10px]">{formatMessageTime(message.created_at)}</span>
                    {isOwn && <MessageStatus status={message.status} />}
                </div>
            </div>
        </div>
    );
}
