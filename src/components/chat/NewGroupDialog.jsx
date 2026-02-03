import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Loader2, X } from "lucide-react";
import { profilesApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils";

export function NewGroupDialog({ open, onOpenChange }) {
    const { user } = useAuth();
    const { createGroupConversation } = useChat();
    const [groupName, setGroupName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!open) {
            setGroupName("");
            setSearchQuery("");
            setUsers([]);
            setSelectedUsers([]);
            return;
        }

        const searchUsers = async () => {
            if (!user) return;
            setLoading(true);

            try {
                const data = await profilesApi.getAll(searchQuery || undefined, user.id);
                setUsers(data);
            } catch (error) {
                console.error("Error searching users:", error);
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(searchUsers, 300);
        return () => clearTimeout(debounce);
    }, [open, searchQuery, user]);

    const toggleUser = (profile) => {
        setSelectedUsers((prev) => {
            const isSelected = prev.some((u) => u.user_id === profile.user_id);
            if (isSelected) {
                return prev.filter((u) => u.user_id !== profile.user_id);
            }
            return [...prev, profile];
        });
    };

    const removeUser = (userId) => {
        setSelectedUsers((prev) => prev.filter((u) => u.user_id !== userId));
    };

    const handleCreate = async () => {
        if (!groupName.trim() || selectedUsers.length < 1) return;

        setCreating(true);
        await createGroupConversation(
            groupName.trim(),
            selectedUsers.map((u) => u.user_id)
        );
        setCreating(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Group</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="group-name">Group Name</Label>
                        <Input
                            id="group-name"
                            placeholder="Enter group name..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>

                    {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {selectedUsers.map((profile) => (
                                <div
                                    key={profile.user_id}
                                    className="flex items-center gap-1 bg-primary/10 text-primary rounded-full pl-1 pr-2 py-1"
                                >
                                    <Avatar
                                        src={profile.avatar_url}
                                        name={profile.full_name || profile.username}
                                        size="sm"
                                    />
                                    <span className="text-sm font-medium">
                                        {profile.full_name || profile.username}
                                    </span>
                                    <button
                                        onClick={() => removeUser(profile.user_id)}
                                        className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users to add..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="max-h-[200px] overflow-y-auto scrollbar-thin -mx-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground text-sm">
                                {searchQuery ? "No users found" : "Search for users to add to the group"}
                            </div>
                        ) : (
                            users.map((profile) => {
                                const isSelected = selectedUsers.some((u) => u.user_id === profile.user_id);
                                return (
                                    <button
                                        key={profile.id}
                                        onClick={() => toggleUser(profile)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-6 py-2.5 hover:bg-muted/50 transition-colors text-left",
                                            isSelected && "bg-primary/5"
                                        )}
                                    >
                                        <Avatar
                                            src={profile.avatar_url}
                                            name={profile.full_name || profile.username}
                                            size="sm"
                                            isOnline={profile.is_online}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">
                                                {profile.full_name || profile.username}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
                                        </div>
                                        <div
                                            className={cn(
                                                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                                isSelected
                                                    ? "bg-primary border-primary"
                                                    : "border-muted-foreground/30"
                                            )}
                                        >
                                            {isSelected && (
                                                <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={!groupName.trim() || selectedUsers.length < 1 || creating}
                    >
                        {creating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Group"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
