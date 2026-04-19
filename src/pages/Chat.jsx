import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ChatProvider, useChat } from "@/contexts/ChatContext";
import { UserProfile } from "@/components/chat/UserProfile";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatPanel } from "@/components/chat/ChatPanel";
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
            <div className="min-h-screen bg-background p-3 md:p-4">
                <div className="mx-auto h-[100svh] supports-[height:100dvh]:h-[100dvh] max-w-[1500px] animate-pulse overflow-hidden md:rounded-[2rem] md:border md:border-white/40 md:bg-background/40 md:backdrop-blur-2xl dark:md:border-white/10 dark:md:bg-background/20">
                    <div className="flex h-full">
                        <aside className="hidden w-[24rem] flex-col border-r border-border/70 bg-sidebar/80 md:flex">
                            <div className="border-b border-border/70 p-4">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="h-11 w-11 rounded-full bg-muted" />
                                    <div className="space-y-2">
                                        <div className="h-3 w-28 rounded bg-muted" />
                                        <div className="h-2 w-20 rounded bg-muted/70" />
                                    </div>
                                </div>
                                <div className="h-11 rounded-2xl bg-muted" />
                            </div>
                            <div className="space-y-3 p-4">
                                {[...Array(6)].map((_, idx) => (
                                    <div key={idx} className="flex items-center gap-3 rounded-2xl p-2">
                                        <div className="h-10 w-10 rounded-full bg-muted" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 w-32 rounded bg-muted" />
                                            <div className="h-2 w-20 rounded bg-muted/70" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </aside>
                        <main className="flex flex-1 flex-col bg-chat-bg/40 p-6">
                            <div className="mb-6 h-14 w-full rounded-2xl bg-muted/70" />
                            <div className="flex-1 space-y-4">
                                <div className="ml-auto h-16 w-2/5 rounded-2xl bg-muted/70" />
                                <div className="h-20 w-1/2 rounded-2xl bg-muted" />
                                <div className="ml-auto h-14 w-1/3 rounded-2xl bg-muted/70" />
                            </div>
                            <div className="mt-6 h-14 w-full rounded-2xl bg-muted" />
                        </main>
                    </div>
                </div>
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
