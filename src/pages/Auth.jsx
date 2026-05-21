import { useEffect, useRef, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MessageSquare, AlertCircle, Mail, Lock, User, UserCircle, ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";

export default function Auth() {
    const { user, loading, signIn, signUp } = useAuth();
    const { theme, setTheme } = useTheme();
    const previousThemeRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("login");

    // Login form state
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // Register form state
    const [registerEmail, setRegisterEmail] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [registerUsername, setRegisterUsername] = useState("");
    const [registerFullName, setRegisterFullName] = useState("");

    useEffect(() => {
        if (previousThemeRef.current === null) {
            previousThemeRef.current = theme ?? "system";
        }

        if (theme !== "light") {
            setTheme("light");
        }

        return () => {
            if (previousThemeRef.current) {
                setTheme(previousThemeRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (activeTab !== "register") {
            setError(null);
        }
    }, [activeTab]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (user) {
        return <Navigate to="/" replace />;
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const { error } = await signIn(loginEmail, loginPassword);

            if (error) {
                setError(error.message || "Failed to sign in. Please check your credentials.");
            }
        } catch (err) {
            setError(err.message || "Failed to connect to server. Make sure the backend is running.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);

        if (!registerUsername.trim()) {
            setError("Username is required");
            return;
        }

        if (registerPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);

        try {
            const trimmedEmail = registerEmail.trim().toLowerCase();
            const trimmedUsername = registerUsername.trim();
            const fullName = registerFullName.trim() || trimmedUsername;
            const { error } = await signUp(
                trimmedEmail,
                registerPassword,
                trimmedUsername,
                fullName
            );

            if (error) {
                setError(error.message || "Unable to complete signup.");
            }
        } catch (err) {
            setError(err.message || "Failed to connect to server. Make sure the backend is running.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex overflow-hidden bg-background relative selection:bg-primary/30">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
            
            {/* Left Side - Visual (Hidden on mobile) */}
            <div className="hidden lg:flex flex-1 bg-muted/30 relative items-center justify-center overflow-hidden border-r border-border/50">
                <div className="absolute inset-0 opacity-[0.05]" />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 max-w-lg p-12"
                >
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-xl mb-8">
                        <MessageSquare className="w-8 h-8 fill-current" />
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight text-foreground mb-6">
                        Join the next generation of <span className="text-primary">seamless</span> communication.
                    </h2>
                    <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                        Secure, fast, and beautiful. Connectly brings people together with an experience built for the modern web.
                    </p>
                    
                    <div className="space-y-6">
                        {[
                            { icon: ShieldCheck, text: "End-to-end encrypted messages" },
                            { icon: Zap, text: "Real-time lightning fast sync" },
                            { icon: Sparkles, text: "Premium personalized experience" }
                        ].map((item, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + (i * 0.1) }}
                                className="flex items-center gap-4 text-foreground/80 font-medium"
                            >
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <item.icon className="w-5 h-5" />
                                </div>
                                {item.text}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[420px]"
                >
                    {/* Mobile Logo */}
                    <Link to="/" className="flex lg:hidden items-center gap-2 mb-12 justify-center group">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg group-hover:scale-105 transition-transform">
                            <MessageSquare className="w-6 h-6 fill-current" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">Connectly</span>
                    </Link>

                    <div className="mb-10 text-center lg:text-left">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                            {activeTab === "login" ? "Welcome Back" : "Create Account"}
                        </h1>
                        <p className="text-muted-foreground">
                            {activeTab === "login" 
                                ? "Enter your credentials to access your account" 
                                : "Join our community and start chatting today"}
                        </p>
                    </div>

                    <Card className="border-border/50 shadow-2xl rounded-3xl overflow-hidden">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <CardHeader className="pb-4 bg-muted/50 border-b border-border/50 pt-1">
                                <TabsList className="grid w-full grid-cols-2 bg-transparent h-12 p-1">
                                    <TabsTrigger 
                                        value="login" 
                                        className="rounded-2xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                                    >
                                        Sign In
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="register" 
                                        className="rounded-2xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                                    >
                                        Sign Up
                                    </TabsTrigger>
                                </TabsList>
                            </CardHeader>

                            <CardContent className="pt-8 px-8">
                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                            animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        >
                                            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive rounded-2xl py-3">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                                            </Alert>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <TabsContent value="login" className="mt-0 outline-none">
                                    <form onSubmit={handleLogin} className="space-y-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="login-email" className="text-foreground/70 ml-1">Email Address</Label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                                    <Mail className="w-4 h-4" />
                                                </div>
                                                <Input
                                                    id="login-email"
                                                    type="email"
                                                    placeholder="name@example.com"
                                                    className="pl-11 h-12 bg-background/50 rounded-2xl border-border/50 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                                                    value={loginEmail}
                                                    onChange={(e) => setLoginEmail(e.target.value)}
                                                    required
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between ml-1">
                                                <Label htmlFor="login-password" title="password label" className="text-foreground/70">Password</Label>
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                                    <Lock className="w-4 h-4" />
                                                </div>
                                                <Input
                                                    id="login-password"
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="pl-11 h-12 bg-background/50 rounded-2xl border-border/50 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                                                    value={loginPassword}
                                                    onChange={(e) => setLoginPassword(e.target.value)}
                                                    required
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>
                                        <Button type="submit" className="w-full h-12 rounded-2xl text-base font-semibold shadow-lg shadow-primary/25 mt-2 hover:scale-[1.01] active:scale-[0.99] transition-all" disabled={isLoading}>
                                            {isLoading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    Sign In <ArrowRight className="w-4 h-4" />
                                                </span>
                                            )}
                                        </Button>
                                    </form>
                                </TabsContent>

                                <TabsContent value="register" className="mt-0 outline-none">
                                    <form onSubmit={handleRegister} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="register-username" className="text-foreground/70 ml-1">Username</Label>
                                                <div className="relative group">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <Input
                                                        id="register-username"
                                                        type="text"
                                                        placeholder="johndoe"
                                                        className="pl-11 h-12 bg-background/50 rounded-2xl border-border/50 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                                                        value={registerUsername}
                                                        onChange={(e) => setRegisterUsername(e.target.value)}
                                                        required
                                                        disabled={isLoading}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="register-fullname" className="text-foreground/70 ml-1">Full Name</Label>
                                                <div className="relative group">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                                        <UserCircle className="w-4 h-4" />
                                                    </div>
                                                    <Input
                                                        id="register-fullname"
                                                        type="text"
                                                        placeholder="John Doe"
                                                        className="pl-11 h-12 bg-background/50 rounded-2xl border-border/50 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                                                        value={registerFullName}
                                                        onChange={(e) => setRegisterFullName(e.target.value)}
                                                        disabled={isLoading}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="register-email" className="text-foreground/70 ml-1">Email Address</Label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                                    <Mail className="w-4 h-4" />
                                                </div>
                                                <Input
                                                    id="register-email"
                                                    type="email"
                                                    placeholder="name@example.com"
                                                    className="pl-11 h-12 bg-background/50 rounded-2xl border-border/50 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                                                    value={registerEmail}
                                                    onChange={(e) => setRegisterEmail(e.target.value)}
                                                    required
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="register-password" title="register password label" className="text-foreground/70 ml-1">Create Password</Label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                                    <Lock className="w-4 h-4" />
                                                </div>
                                                <Input
                                                    id="register-password"
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="pl-11 h-12 bg-background/50 rounded-2xl border-border/50 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                                                    value={registerPassword}
                                                    onChange={(e) => setRegisterPassword(e.target.value)}
                                                    required
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>
                                        <Button type="submit" className="w-full h-12 rounded-2xl text-base font-semibold shadow-lg shadow-primary/25 mt-4 hover:scale-[1.01] active:scale-[0.99] transition-all" disabled={isLoading}>
                                            {isLoading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                "Create Account"
                                            )}
                                        </Button>
                                    </form>
                                </TabsContent>
                            </CardContent>

                            <CardFooter className="pb-8 pt-4 px-8 border-t border-border/30 mt-6 bg-muted/20">
                                <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                                    By continuing, you agree to Connectly's 
                                    <button className="mx-1 text-primary hover:underline font-medium">Terms of Service</button> 
                                    and 
                                    <button className="ml-1 text-primary hover:underline font-medium">Privacy Policy</button>.
                                </p>
                            </CardFooter>
                        </Tabs>
                    </Card>
                    
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-8 text-center text-sm text-muted-foreground"
                    >
                        &copy; {new Date().getFullYear()} Connectly Inc. All rights reserved.
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
}
