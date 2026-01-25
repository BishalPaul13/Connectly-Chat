import { useEffect } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare } from "lucide-react";

interface ChatPanelProps {
  onBack?: () => void;
}

export function ChatPanel({ onBack }: ChatPanelProps) {
  const { user } = useAuth();
  const { activeConversation, messages, typingUsers, sendMessage, setTyping, markAsRead } = useChat();

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

  return (
    <div className="flex-1 flex flex-col bg-chat-bg">
      <ChatHeader conversation={activeConversation} onBack={onBack} />
      <MessageList
        messages={messages}
        currentUserId={user?.id || ""}
        conversation={activeConversation}
        typingUsers={typingUsers}
      />
      <MessageInput
        onSendMessage={sendMessage}
        onTyping={setTyping}
      />
    </div>
  );
}
