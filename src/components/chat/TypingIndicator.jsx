
export function TypingIndicator({ users }) {
    if (users.length === 0) return null;

    const names = users.map((u) => u.full_name || u.username).join(", ");
    const text = users.length === 1 ? `${names} is typing` : `${names} are typing`;

    return (
        <div className="flex items-center gap-3 px-4 py-2">
            <div className="bg-message-received rounded-2xl rounded-bl-md px-4 py-3 shadow-message">
                <div className="flex items-center gap-1.5">
                    <span className="typing-dot w-2 h-2 bg-typing rounded-full" />
                    <span className="typing-dot w-2 h-2 bg-typing rounded-full" />
                    <span className="typing-dot w-2 h-2 bg-typing rounded-full" />
                </div>
            </div>
            <span className="text-xs text-muted-foreground">{text}</span>
        </div>
    );
}
