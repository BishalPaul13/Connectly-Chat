import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ChatProvider, useChat } from "@/contexts/ChatContext";
import { UserProfile } from "@/components/chat/UserProfile";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function ChatLayout() {
  const [showMobileChat, setShowMobileChat] = useState(false);
  const { conversations, activeConversation, setActiveConversation } = useChat();

  // Reset mobile view when conversation is cleared
  useEffect(() => {
    if (!activeConversation) {
      setShowMobileChat(false);
    }
  }, [activeConversation]);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col border-r bg-sidebar",
          "md:relative md:translate-x-0",
          showMobileChat && "hidden md:flex"
        )}
      >
        <UserProfile />
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversation?.id}
          onSelectConversation={(conv) => {
            setActiveConversation(conv);
            setShowMobileChat(true);
          }}
        />
      </aside>

      {/* Chat Panel */}
      <main
        className={cn(
          "flex-1 flex flex-col min-w-0",
          !showMobileChat && "hidden md:flex"
        )}
      >
        <ChatPanel
          onBack={() => {
            setActiveConversation(null);
            setShowMobileChat(false);
          }}
        />
      </main>
    </div>
  );
}

export default function Chat() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <ChatProvider>
      <ChatLayout />
    </ChatProvider>
  );
}
