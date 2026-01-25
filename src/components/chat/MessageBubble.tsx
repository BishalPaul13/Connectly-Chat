import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import type { Message, Profile } from "@/lib/supabase";
import { Avatar } from "./Avatar";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderProfile?: Profile;
  showAvatar?: boolean;
  isGroup?: boolean;
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) {
    return format(date, "h:mm a");
  }
  if (isYesterday(date)) {
    return `Yesterday ${format(date, "h:mm a")}`;
  }
  return format(date, "MMM d, h:mm a");
}

function MessageStatus({ status }: { status: string }) {
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

export function MessageBubble({ message, isOwn, senderProfile, showAvatar = true, isGroup = false }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex gap-2 px-4 py-1 message-enter",
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
          "relative max-w-[75%] min-w-[120px] rounded-2xl px-4 py-2 shadow-message",
          isOwn
            ? "bg-message-sent text-message-sent-foreground rounded-br-md"
            : "bg-message-received text-message-received-foreground rounded-bl-md"
        )}
      >
        {!isOwn && isGroup && senderProfile && (
          <p className="text-xs font-medium text-primary mb-1">
            {senderProfile.full_name || senderProfile.username}
          </p>
        )}
        
        <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
          {message.content}
        </p>
        
        <div
          className={cn(
            "flex items-center justify-end gap-1 mt-1",
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
