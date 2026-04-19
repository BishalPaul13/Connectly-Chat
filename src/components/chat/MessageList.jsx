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
    const prevCountRef = useRef(0);
    const prevConversationIdRef = useRef(null);

    useEffect(() => {
        const convoChanged = prevConversationIdRef.current !== conversation?.id;
        if (convoChanged) {
            prevConversationIdRef.current = conversation?.id || null;
            prevCountRef.current = 0;
        }

        if (messages.length === 0) {
            prevCountRef.current = 0;
            return;
        }

        const container = containerRef.current;
        const isNearBottom = container
            ? container.scrollHeight - container.scrollTop - container.clientHeight < 120
            : true;

        const isInitialLoad = prevCountRef.current === 0;
        if (convoChanged || isNearBottom || isInitialLoad) {
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }

        prevCountRef.current = messages.length;
    }, [messages.length, typingUsers.length, conversation?.id]);

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
            className="flex-1 overflow-y-auto chat-pattern scrollbar-thin overscroll-contain"
        >
            <div className="flex min-h-full flex-col justify-end px-2 py-6 sm:px-4">
                {messageGroups.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="rounded-[1.75rem] border border-white/60 bg-white/65 px-6 py-8 text-center text-muted-foreground shadow-md backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                            <p className="text-lg font-bold text-foreground">No messages yet</p>
                            <p className="mt-1 text-sm">Start the conversation by sending a message</p>
                        </div>
                    </div>
                ) : (
                    messageGroups.map((group) => (
                        <div key={group.date}>
                            <div className="my-5 flex justify-center">
                                <span className="rounded-full border border-white/60 bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                                    {formatDateSeparator(group.date)}
                                </span>
                            </div>
                            {group.messages.map((message, messageIndex) => {
                                const isOwn = message.sender_id === currentUserId;
                                const senderProfile = getProfile(message.sender_id);
                                const prevMessage = messageIndex > 0 ? group.messages[messageIndex - 1] : null;
                                const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id;

                                return (
                                    <MessageBubble
                                        key={message.client_id || message.id}
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
