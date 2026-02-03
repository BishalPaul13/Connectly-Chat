import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { format, isToday, isYesterday } from "date-fns";

function formatDateSeparator(dateString) {
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
}

export function MessageList({ messages, currentUserId, conversation, typingUsers }) {
    const bottomRef = useRef(null);
    const containerRef = useRef(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typingUsers]);

    // Group messages by date
    const messageGroups = [];
    let currentDate = "";

    messages.forEach((message) => {
        const messageDate = new Date(message.created_at).toDateString();
        if (messageDate !== currentDate) {
            currentDate = messageDate;
            messageGroups.push({ date: message.created_at, messages: [message] });
        } else {
            messageGroups[messageGroups.length - 1].messages.push(message);
        }
    });

    const getProfile = (userId) => {
        return conversation.participants.find((p) => p.user_id === userId)?.profile;
    };

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto chat-pattern scrollbar-thin"
        >
            <div className="py-4 min-h-full flex flex-col justify-end">
                {messageGroups.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-muted-foreground px-4">
                            <p className="text-lg font-medium">No messages yet</p>
                            <p className="text-sm mt-1">Start the conversation by sending a message</p>
                        </div>
                    </div>
                ) : (
                    messageGroups.map((group) => (
                        <div key={group.date}>
                            <div className="flex justify-center my-4">
                                <span className="px-3 py-1 bg-muted/80 rounded-full text-xs text-muted-foreground shadow-sm">
                                    {formatDateSeparator(group.date)}
                                </span>
                            </div>
                            {group.messages.map((message, messageIndex) => {
                                const isOwn = message.sender_id === currentUserId;
                                const senderProfile = getProfile(message.sender_id);

                                // Show avatar for first message in a sequence from same sender
                                const prevMessage = messageIndex > 0 ? group.messages[messageIndex - 1] : null;
                                const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id;

                                return (
                                    <MessageBubble
                                        key={message.id}
                                        message={message}
                                        isOwn={isOwn}
                                        senderProfile={senderProfile}
                                        showAvatar={showAvatar}
                                        isGroup={conversation.is_group}
                                    />
                                );
                            })}
                        </div>
                    ))
                )}

                <TypingIndicator users={typingUsers} />
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
