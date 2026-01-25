import { Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "./Avatar";
import { useAuth } from "@/contexts/AuthContext";
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
    <div className="flex items-center justify-between px-4 py-3 bg-sidebar border-b">
      <div className="flex items-center gap-3">
        <Avatar
          src={profile.avatar_url}
          name={profile.full_name || profile.username}
          size="md"
          isOnline={true}
        />
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">
            {profile.full_name || profile.username}
          </p>
          <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
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
  );
}
