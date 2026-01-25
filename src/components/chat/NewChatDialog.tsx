import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewChatDialog({ open, onOpenChange }: NewChatDialogProps) {
  const { user } = useAuth();
  const { createConversation } = useChat();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setUsers([]);
      return;
    }

    const searchUsers = async () => {
      if (!user) return;
      setLoading(true);

      let query = supabase.from("profiles").select("*").neq("user_id", user.id);

      if (searchQuery) {
        query = query.or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);
      }

      const { data } = await query.limit(20);
      setUsers((data as Profile[]) || []);
      setLoading(false);
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [open, searchQuery, user]);

  const handleSelectUser = async (selectedUser: Profile) => {
    setCreating(true);
    await createConversation(selectedUser.user_id);
    setCreating(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto scrollbar-thin -mx-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No users found" : "Search for users to start a conversation"}
            </div>
          ) : (
            users.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleSelectUser(profile)}
                disabled={creating}
                className={cn(
                  "w-full flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors text-left",
                  creating && "opacity-50 cursor-not-allowed"
                )}
              >
                <Avatar
                  src={profile.avatar_url}
                  name={profile.full_name || profile.username}
                  size="md"
                  isOnline={profile.is_online}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {profile.full_name || profile.username}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
