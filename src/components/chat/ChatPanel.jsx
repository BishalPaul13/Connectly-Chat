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
        deleteConversation,
    } = useChat();

    useEffect(() => {
        if (activeConversation) {
            markAsRead();
        }
    }, [activeConversation, messages.length, markAsRead]);

    if (!activeConversation) {
        return (
            <div className="flex-1 flex items-center justify-center bg-chat-bg">
                <div className="text-center px-4">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">Welcome to ChatApp</h2>
                    <p className="text-muted-foreground max-w-sm">
                        Select a conversation from the sidebar or start a new chat to begin messaging
                    </p>
                </div>
            </div>
        );
    }

    const isDirect = !activeConversation.is_group;
    const isPending = isDirect && activeConversation.request_status === "pending";
    const isRequester = isPending && activeConversation.requested_by === user?.id;
    const blockedByMe = isDirect && activeConversation.blocked_by_me;
    const blockedMe = isDirect && activeConversation.blocked_me;

    let inputDisabled = !activeConversation || blockedByMe || blockedMe || isPending;
    let disabledReason = "";
    if (blockedByMe) disabledReason = "You blocked this user";
    if (blockedMe) disabledReason = "You are blocked by this user";
    if (isPending) disabledReason = isRequester ? "Request sent. Waiting for approval." : "Approve this request to start messaging";

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-chat-bg">
            <ChatHeader conversation={activeConversation} onBack={onBack} />

            {isPending && (
                <div className="px-4 py-3 bg-muted/60 border-b">
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
                                    onClick={() => acceptConversationRequest(activeConversation.id)}
                                >
                                    Accept
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteConversation(activeConversation.id)}
                                >
                                    Decline
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {(blockedByMe || blockedMe) && (
                <div className="px-4 py-3 bg-muted/60 border-b">
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
