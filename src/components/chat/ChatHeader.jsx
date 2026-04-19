import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "./Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { useChat } from "@/contexts/ChatContext";
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GroupMembersDialog } from "./GroupMembersDialog";
import { useEffect, useState } from "react";

export function ChatHeader({ conversation, onBack }) {
    const { user } = useAuth();
    const { deleteConversation, blockConversation, unblockConversation } = useChat();
    const { toast } = useToast();
    const [showGroupMembers, setShowGroupMembers] = useState(false);
    const [shouldMarquee, setShouldMarquee] = useState(false);

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
    const isPending = !conversation.is_group && conversation.request_status === "pending";
    const isRequester = isPending && conversation.requested_by === user?.id;
    const blockedByMe = !conversation.is_group && conversation.blocked_by_me;
    const blockedMe = !conversation.is_group && conversation.blocked_me;

    const lastSeen = !conversation.is_group && otherParticipants[0]?.profile?.last_seen
        ? formatDistanceToNow(new Date(otherParticipants[0].profile.last_seen), { addSuffix: true })
        : null;

    const statusText = conversation.is_group
        ? `${conversation.participants.length} members`
        : blockedByMe
            ? "blocked"
            : blockedMe
                ? "you are blocked"
                : isPending
                    ? isRequester
                        ? "request sent"
                        : "request received"
                    : isOnline
                        ? "online"
                        : lastSeen
                            ? `last seen ${lastSeen}`
                            : "";

    const handleDelete = async () => {
        const ok = await deleteConversation(conversation.id);
        if (ok) {
            toast({
                title: "Chat deleted",
                description: "This chat was removed from your list.",
            });
        }
    };

    const handleBlock = async () => {
        const ok = await blockConversation(conversation.id);
        if (ok) {
            toast({
                title: "User blocked",
                description: "They can no longer message you.",
            });
        }
    };

    const handleUnblock = async () => {
        const ok = await unblockConversation(conversation.id);
        if (ok) {
            toast({
                title: "User unblocked",
                description: "You can message this user again.",
            });
        }
    };

    useEffect(() => {
        setShouldMarquee(true);
        const t = setTimeout(() => setShouldMarquee(false), 1200);
        return () => clearTimeout(t);
    }, [conversation?.id]);

    return (
        <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-border/70 bg-chat-header/90 px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] shadow-sm backdrop-blur-2xl">
            {onBack && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="md:hidden -ml-2 rounded-full bg-background/60 text-muted-foreground shadow-sm hover:bg-background hover:text-foreground"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
            )}

            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[1.35rem] border border-white/50 bg-white/55 px-3 py-2 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                <Avatar
                    src={avatarUrl}
                    name={displayName}
                    size="md"
                    isOnline={!conversation.is_group ? isOnline : undefined}
                />

                <div className="min-w-0 flex-1 pr-1">
                    <h2 className="truncate text-sm font-extrabold tracking-tight text-foreground sm:text-base">{displayName}</h2>
                    <p className="overflow-hidden text-[11px] leading-tight text-muted-foreground sm:text-xs">
                        <span className={shouldMarquee ? "status-marquee" : ""}>
                            {statusText}
                        </span>
                    </p>
                </div>
            </div>

            <div className="flex flex-none items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full bg-background/60 text-muted-foreground shadow-sm hover:bg-background hover:text-foreground sm:h-10 sm:w-10"
                >
                    <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full bg-background/60 text-muted-foreground shadow-sm hover:bg-background hover:text-foreground sm:h-10 sm:w-10"
                >
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full bg-background/60 text-muted-foreground shadow-sm hover:bg-background hover:text-foreground"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                        {conversation.is_group && (
                            <>
                                <DropdownMenuItem
                                    onClick={() => setShowGroupMembers(true)}
                                    className="cursor-pointer"
                                >
                                    Manage members
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </>
                        )}
                        <DropdownMenuItem onClick={handleDelete} className="cursor-pointer">
                            Delete chat
                        </DropdownMenuItem>
                        {!conversation.is_group && (
                            <>
                                <DropdownMenuSeparator />
                                {blockedByMe ? (
                                    <DropdownMenuItem
                                        onClick={handleUnblock}
                                        className="cursor-pointer"
                                    >
                                        Unblock user
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem
                                        onClick={handleBlock}
                                        className="cursor-pointer text-destructive"
                                    >
                                        Block user
                                    </DropdownMenuItem>
                                )}
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {conversation.is_group && (
                <GroupMembersDialog
                    open={showGroupMembers}
                    onOpenChange={setShowGroupMembers}
                    conversation={conversation}
                />
            )}
        </div>
    );
}
