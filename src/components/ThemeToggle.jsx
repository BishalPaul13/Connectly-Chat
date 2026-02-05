import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }) {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = theme === "dark" || (theme === "system" && resolvedTheme === "dark");
    const label = isDark ? "Switch to light theme" : "Switch to dark theme";

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={cn("text-muted-foreground hover:text-foreground", className)}
        >
            {mounted ? (
                isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />
            ) : (
                <span className="w-5 h-5" />
            )}
        </Button>
    );
}
