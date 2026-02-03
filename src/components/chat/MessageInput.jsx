import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MessageInput({ onSendMessage, onTyping, disabled }) {
    const [message, setMessage] = useState("");
    const textareaRef = useRef(null);
    const typingTimeoutRef = useRef();

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

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    }, [message, disabled, onSendMessage, onTyping]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex items-end gap-2 p-4 bg-card border-t">
            <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 text-muted-foreground hover:text-foreground rounded-full"
            >
                <Smile className="w-5 h-5" />
            </Button>

            <div className="flex-1 relative">
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => {
                        setMessage(e.target.value);
                        handleTyping();
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    disabled={disabled}
                    rows={1}
                    className={cn(
                        "w-full resize-none rounded-2xl border bg-secondary/50 px-4 py-3 text-sm",
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
                className="flex-shrink-0 rounded-full h-10 w-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
            >
                <Send className="w-4 h-4" />
            </Button>
        </div>
    );
}
