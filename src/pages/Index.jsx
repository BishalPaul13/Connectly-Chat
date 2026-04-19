import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, MessageSquare, Shield, Zap, Sparkles, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className="glass p-6 md:p-8 rounded-3xl border border-white/10 dark:border-white/5 hover:border-primary/50 transition-colors group relative overflow-hidden"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="bg-primary/10 p-3 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
            <Icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-3 text-foreground">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
);

const Index = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Redirect logged-in users directly to chat
    if (user) {
        return <Navigate to="/chat" replace />;
    }

    return (
        <div className="min-h-screen bg-background relative flex flex-col selection:bg-primary/30">
            {/* Dynamic Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none opacity-50 dark:opacity-20" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none opacity-50 dark:opacity-20" />
            
            <Navbar />
            <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-10 lg:px-12 mt-20 md:mt-24 relative z-10 w-full overflow-x-hidden">
                <div className="max-w-6xl mx-auto w-full pt-12 pb-16 md:py-24 flex flex-col lg:flex-row items-center gap-10 md:gap-16 lg:gap-8">
                    
                    {/* Hero Text */}
                    <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20 backdrop-blur-md shadow-sm"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>The modern way to communicate</span>
                        </motion.div>

                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6 text-foreground leading-[1.15]"
                        >
                            Connect{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400 drop-shadow-sm">Instantly.</span>
                            <br />
                            Chat Seamlessly.
                        </motion.h1>

                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-2xl lg:max-w-xl leading-relaxed"
                        >
                            Experience real-time messaging with end-to-end security, beautiful design, and all the features you need to stay close with your vibrant community.
                        </motion.p>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 w-full sm:w-auto"
                        >
                            <Button asChild size="lg" className="rounded-full px-8 text-sm sm:text-base h-12 sm:h-14 shadow-lg shadow-primary/25 w-full sm:w-auto hover:scale-105 transition-transform">
                                <Link to="/auth">Start Chatting</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="rounded-full px-8 text-sm sm:text-base h-12 sm:h-14 w-full sm:w-auto bg-background/50 backdrop-blur-md hover:bg-background/80 transition-colors">
                                <a href="#features">Explore Features</a>
                            </Button>
                        </motion.div>
                    </div>

                    {/* Hero Visual Mockup */}
                    <motion.div 
                        initial={{ opacity: 0, x: 50, rotate: -5 }}
                        animate={{ opacity: 1, x: 0, rotate: 0 }}
                        transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
                        className="flex-1 w-full max-w-sm sm:max-w-md relative lg:ml-auto"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-blue-500/30 rounded-[3rem] blur-3xl transform -rotate-6 scale-105 opacity-60 dark:opacity-40" />
                        
                        <div className="glass border border-white/20 dark:border-white/10 rounded-[2.5rem] p-5 shadow-2xl relative bg-background/70 backdrop-blur-2xl">
                            {/* Fake Chat UI Header */}
                            <div className="flex items-center gap-4 mb-8 pb-5 border-b border-white/10 dark:border-white/5">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-green-400 to-primary flex items-center justify-center text-white font-bold shadow-md text-lg">
                                    C
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-base text-foreground">Connectly Team</h4>
                                    <p className="text-xs text-primary flex items-center gap-1.5 font-medium mt-0.5">
                                        <span className="w-2 h-2 rounded-full bg-primary inline-block animate-pulse" />
                                        Online
                                    </p>
                                </div>
                            </div>
                            
                            {/* Fake Messages */}
                            <div className="space-y-5 mb-8">
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1 }}
                                    className="flex gap-2 justify-start"
                                >
                                    <div className="bg-secondary text-secondary-foreground p-3.5 px-5 rounded-2xl rounded-tl-sm text-sm max-w-[85%] shadow-sm leading-relaxed">
                                        Welcome to Connectly! 👋 Ready to experience the modern chat?
                                    </div>
                                </motion.div>
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.8 }}
                                    className="flex gap-2 justify-end"
                                >
                                    <div className="bg-primary text-primary-foreground p-3.5 px-5 rounded-2xl rounded-tr-sm text-sm max-w-[85%] shadow-md leading-relaxed">
                                        Absolutely! The design looks stunning ✨
                                    </div>
                                </motion.div>
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 2.6 }}
                                    className="flex gap-2 justify-start items-end"
                                >
                                    <div className="bg-secondary text-secondary-foreground p-3.5 px-5 rounded-2xl rounded-tl-sm text-sm max-w-[85%] shadow-sm leading-relaxed">
                                        <div className="flex gap-1 items-center h-5">
                                            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Fake Input */}
                            <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-full border border-white/5 dark:border-white/5 backdrop-blur-md">
                                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted-foreground shadow-sm">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <div className="flex-1 h-10 rounded-full bg-transparent px-3 flex items-center text-sm text-muted-foreground">
                                    Type a message...
                                </div>
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors cursor-pointer">
                                    <Zap className="w-5 h-5 fill-current" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Features Section */}
                <div id="features" className="w-full max-w-7xl mx-auto py-16 md:py-32 scroll-mt-24">
                    <div className="text-center mb-16 md:mb-24">
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-foreground"
                        >
                            Why Choose Connectly?
                        </motion.h2>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                        >
                            Everything you need for an amazing communication experience, built right into a beautiful interface.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
                        <FeatureCard 
                            icon={Zap}
                            title="Lightning Fast"
                            description="Experience zero-latency messaging. Your messages are delivered instantly, making conversations feel natural and incredibly fluid."
                            delay={0.1}
                        />
                        <FeatureCard 
                            icon={Shield}
                            title="Secure & Private"
                            description="Your conversations belong to you. We prioritize your privacy with robust security measures built from the ground up."
                            delay={0.2}
                        />
                        <FeatureCard 
                            icon={Smartphone}
                            title="Works Everywhere"
                            description="Responsive design ensures you get the same beautiful experience whether you are on your phone, tablet, or desktop."
                            delay={0.3}
                        />
                    </div>
                </div>
            </main>
            
            {/* Simple Footer */}
            <footer className="py-8 md:py-10 text-center text-sm text-muted-foreground border-t border-border/50 mt-auto relative z-10 bg-background/50 backdrop-blur-md">
                <p>&copy; {new Date().getFullYear()} Connectly Chat. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Index;
