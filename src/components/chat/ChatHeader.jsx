import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "./Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

export function ChatHeader({ conversation, onBack }) {
    const { user } = useAuth();

    // Get the other participant(s) info
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

    const lastSeen = !conversation.is_group && otherParticipants[0]?.profile?.last_seen
        ? formatDistanceToNow(new Date(otherParticipants[0].profile.last_seen), { addSuffix: true })
        : null;

    const statusText = conversation.is_group
        ? `${conversation.participants.length} members`
        : isOnline
            ? "online"
            : lastSeen
                ? `last seen ${lastSeen}`
                : "";

    return (
        <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.5rem)] bg-chat-header border-b shadow-sm">
            {onBack && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="md:hidden -ml-2 text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
            )}

            <Avatar
                src={avatarUrl}
                name={displayName}
                size="md"
                isOnline={!conversation.is_group ? isOnline : undefined}
            />

            <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-foreground truncate">{displayName}</h2>
                <p className="text-xs text-muted-foreground truncate">{statusText}</p>
            </div>

            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground rounded-full"
                >
                    <Video className="w-5 h-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground rounded-full"
                >
                    <Phone className="w-5 h-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground rounded-full"
                >
                    <MoreVertical className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
