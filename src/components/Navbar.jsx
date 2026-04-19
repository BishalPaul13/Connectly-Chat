import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
            scrolled 
                ? "bg-background/80 backdrop-blur-xl border-border shadow-sm py-4" 
                : "bg-transparent border-transparent py-6"
        )}>
            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2.5 group">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg group-hover:scale-105 transition-transform">
                        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                    </div>
                    <span className="font-bold text-lg sm:text-xl tracking-tight hidden xs:block">Connectly</span>
                </Link>

                <div className="flex items-center gap-3 sm:gap-4">
                    <Button asChild variant="ghost" className="hidden sm:inline-flex rounded-full text-muted-foreground hover:text-foreground">
                        <Link to="/auth">Sign In</Link>
                    </Button>
                    <Button asChild className="h-9 sm:h-10 px-5 sm:px-6 rounded-full shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm font-bold tracking-wide">
                        <Link to="/auth">Get Started</Link>
                    </Button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
