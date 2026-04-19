import { Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "./Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserProfile() {
    const { profile, signOut } = useAuth();

    if (!profile) return null;

    return (
        <div className="border-b border-border/70 bg-sidebar/70 px-4 py-4 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 rounded-[1.35rem] border border-white/50 bg-white/60 p-3 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                        src={profile.avatar_url}
                        name={profile.full_name || profile.username}
                        size="md"
                        isOnline={true}
                    />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold tracking-tight text-foreground">
                            {profile.full_name || profile.username}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">@{profile.username}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <ThemeToggle className="rounded-full bg-background/70 shadow-sm hover:bg-background" />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full bg-background/70 text-muted-foreground shadow-sm hover:bg-background hover:text-foreground"
                            >
                                <Settings className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="cursor-pointer">
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
