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

    useEffect(() => {
        if (!activeConversation) {
            setShowMobileChat(false);
        }
    }, [activeConversation]);

    return (
        <div className="chat-shell h-[100svh] supports-[height:100dvh]:h-[100dvh] overflow-hidden bg-transparent p-0 md:p-4">
            <div className="relative z-10 flex h-full overflow-hidden md:rounded-[2rem] md:border md:border-white/40 md:bg-background/40 md:shadow-lg md:backdrop-blur-2xl dark:md:border-white/10 dark:md:bg-background/20">
                <aside
                    className={cn(
                        "flex min-h-0 w-full flex-shrink-0 flex-col border-r border-border/70 bg-sidebar/90 backdrop-blur-2xl md:relative md:w-[22rem] md:translate-x-0 lg:w-[25rem]",
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

                <main
                    className={cn(
                        "flex min-h-0 min-w-0 flex-1 flex-col bg-chat-bg/60 backdrop-blur-xl",
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
