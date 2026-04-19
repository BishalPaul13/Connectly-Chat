import { useEffect } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChatPanel({ onBack }) {
    const { user } = useAuth();
    const {
        activeConversation,
        messages,
        typingUsers,
        sendMessage,
        setTyping,
        markAsRead,
        acceptConversationRequest,
        deleteConversationRequest,
    } = useChat();

    useEffect(() => {
        if (activeConversation) {
            markAsRead();
        }
    }, [activeConversation, messages.length, markAsRead]);

    if (!activeConversation) {
        return (
            <div className="chat-pattern flex flex-1 items-center justify-center">
                <div className="mx-4 max-w-md rounded-[2rem] border border-white/60 bg-white/70 px-8 py-10 text-center shadow-lg backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-primary/10 shadow-sm">
                        <MessageSquare className="h-10 w-10 text-primary" />
                    </div>
                    <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-foreground">Welcome to Connectly</h2>
                    <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                        Select a conversation from the sidebar or start a new chat to begin messaging
                    </p>
                </div>
            </div>
        );
    }

    const isDirect = !activeConversation.is_group;
    const requestStatus = isDirect ? activeConversation.request_status ?? "active" : "active";
    const isPending = isDirect && requestStatus !== "active";
    const isRequester = isPending && activeConversation.requested_by === user?.id;
    const blockedByMe = isDirect && activeConversation.blocked_by_me;
    const blockedMe = isDirect && activeConversation.blocked_me;

    let inputDisabled = !activeConversation || blockedByMe || blockedMe || isPending;
    let disabledReason = "";
    if (blockedByMe) disabledReason = "You blocked this user";
    if (blockedMe) disabledReason = "You are blocked by this user";
    if (isPending) {
        disabledReason = isRequester
            ? "Request sent. Waiting for approval."
            : "Approve this request to start messaging";
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-chat-bg">
            <ChatHeader conversation={activeConversation} onBack={onBack} />

            {isPending && (
                <div className="border-b border-border/70 bg-card/70 px-4 py-3 backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-sm text-foreground">
                            {isRequester
                                ? "Chat request sent. You can message after it’s accepted."
                                : "New chat request. Accept to start messaging."}
                        </div>
                        {!isRequester && (
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={() => acceptConversationRequest(activeConversation.id)}
                                >
                                    Accept
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="rounded-xl"
                                    onClick={() => deleteConversationRequest(activeConversation.id)}
                                >
                                    Delete request
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {(blockedByMe || blockedMe) && (
                <div className="border-b border-border/70 bg-card/70 px-4 py-3 backdrop-blur-xl">
                    <div className="text-sm text-foreground">
                        {blockedByMe
                            ? "You blocked this user. Messaging is disabled."
                            : "You can’t message this user because you are blocked."}
                    </div>
                </div>
            )}

            <MessageList
                messages={messages}
                currentUserId={user?.id || ""}
                conversation={activeConversation}
                typingUsers={typingUsers}
            />
            <MessageInput
                onSendMessage={sendMessage}
                onTyping={setTyping}
                disabled={inputDisabled}
                disabledReason={disabledReason}
            />
        </div>
    );
}
