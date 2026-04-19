import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MessageInput({ onSendMessage, onTyping, disabled, disabledReason }) {
    const [message, setMessage] = useState("");
    const textareaRef = useRef(null);
    const typingTimeoutRef = useRef();

    const focusInputForEmoji = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        const length = el.value.length;
        try {
            el.setSelectionRange(length, length);
        } catch {
            // noop: some browsers don't support setSelectionRange on textarea
        }
    }, []);

    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
        }
    }, []);

    useEffect(() => {
        adjustTextareaHeight();
    }, [message, adjustTextareaHeight]);

    useEffect(() => {
        if (disabled) {
            setMessage("");
        }
        requestAnimationFrame(() => {
            adjustTextareaHeight();
        });
    }, [disabled, disabledReason, adjustTextareaHeight]);

    const handleTyping = useCallback(() => {
        onTyping(true);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            onTyping(false);
        }, 2000);
    }, [onTyping]);

    const handleSend = useCallback(() => {
        if (!message.trim() || disabled) return;

        onSendMessage(message.trim());
        setMessage("");

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        onTyping(false);

        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }

        requestAnimationFrame(() => {
            if (textareaRef.current && !disabled) {
                textareaRef.current.focus();
            }
        });
    }, [message, disabled, onSendMessage, onTyping]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="w-full border-t border-border/70 bg-card/70 p-4 backdrop-blur-2xl">
            <div className="flex items-end gap-2 rounded-[1.75rem] border border-white/60 bg-white/65 p-2 shadow-md dark:border-white/10 dark:bg-white/5">
                <Button
                    variant="ghost"
                    size="icon"
                    className="self-center rounded-full text-muted-foreground hover:bg-background/70 hover:text-foreground"
                    onClick={focusInputForEmoji}
                    aria-label="Open emoji picker"
                >
                    <Smile className="w-5 h-5" />
                </Button>

                <div className="flex-1 min-w-0 relative">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            handleTyping();
                        }}
                        onKeyDown={handleKeyDown}
                        inputMode="text"
                        enterKeyHint="send"
                        placeholder={disabled && disabledReason ? disabledReason : "Type a message..."}
                        disabled={disabled}
                        rows={1}
                        className={cn(
                            "w-full min-w-0 resize-none rounded-[1.35rem] border-0 bg-transparent px-4 py-3 text-sm leading-6",
                            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                            "placeholder:text-muted-foreground disabled:opacity-50",
                            "scrollbar-thin"
                        )}
                    />
                </div>

                <Button
                    onClick={handleSend}
                    disabled={!message.trim() || disabled}
                    size="icon"
                    className="self-center h-11 w-11 flex-shrink-0 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                    onMouseDown={(e) => e.preventDefault()}
                    onTouchStart={(e) => e.preventDefault()}
                >
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
