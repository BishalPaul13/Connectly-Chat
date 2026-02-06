import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "./Avatar";
import { conversationsApi, profilesApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { X } from "lucide-react";

export function GroupMembersDialog({ open, onOpenChange, conversation }) {
    const { user } = useAuth();
    const { addGroupParticipant, removeGroupParticipant } = useChat();
    const [effectiveConversation, setEffectiveConversation] = useState(conversation);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) {
            setSearchQuery("");
            setSearchResults([]);
            setSaving(false);
            setEffectiveConversation(conversation);
        }
    }, [open, conversation]);

    useEffect(() => {
        if (!open || !conversation?.id) return;
        const loadConversation = async () => {
            try {
                const fresh = await conversationsApi.getById(conversation.id);
                if (fresh) {
                    setEffectiveConversation(fresh);
                }
            } catch (error) {
                console.error("Error loading conversation:", error);
            }
        };
        loadConversation();
    }, [open, conversation?.id]);

    useEffect(() => {
        if (!open) return;
        if (!user) return;

        const fetchUsers = async () => {
            setLoading(true);
            try {
                const data = await profilesApi.getAll(searchQuery || undefined, user.id);
                setSearchResults(data || []);
            } catch (error) {
                console.error("Error searching users:", error);
                setSearchResults([]);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchUsers, 300);
        return () => clearTimeout(debounce);
    }, [open, searchQuery, user]);

    const participantIds = useMemo(
        () => new Set((effectiveConversation?.participants || []).map((p) => p.user_id)),
        [effectiveConversation]
    );

    const handleAdd = async (profile) => {
        if (saving || !effectiveConversation) return;
        setSaving(true);
        const updated = await addGroupParticipant(effectiveConversation.id, profile.user_id);
        if (updated) {
            setEffectiveConversation(updated);
        }
        setSaving(false);
    };

    const handleRemove = async (profile) => {
        if (saving || !effectiveConversation) return;
        setSaving(true);
        const updated = await removeGroupParticipant(effectiveConversation.id, profile.user_id);
        if (updated) {
            setEffectiveConversation(updated);
        }
        setSaving(false);
    };

    const creatorId =
        typeof effectiveConversation?.created_by === "string"
            ? effectiveConversation.created_by
            : effectiveConversation?.created_by?.id || effectiveConversation?.created_by?.user_id || null;
    const isAdmin = !!user?.id && creatorId === user.id;

    if (!effectiveConversation) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Group Members</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    {!isAdmin && (
                        <div className="text-xs text-muted-foreground">
                            Only the group admin can add or remove members.
                        </div>
                    )}
                    <Input
                        placeholder="Search users to add..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    <div className="max-h-[220px] overflow-y-auto scrollbar-thin space-y-2">
                        {loading ? (
                            <div className="text-sm text-muted-foreground">Searching...</div>
                        ) : searchResults.length === 0 ? (
                            <div className="text-sm text-muted-foreground">
                                {searchQuery ? "No users found" : "Type to search users"}
                            </div>
                        ) : (
                            searchResults.map((profile) => {
                                const isMember = participantIds.has(profile.user_id);
                                return (
                                    <div
                                        key={profile.user_id}
                                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                                    >
                                        <Avatar
                                            src={profile.avatar_url}
                                            name={profile.full_name || profile.username}
                                            size="sm"
                                            isOnline={profile.is_online}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">
                                                {profile.full_name || profile.username}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                @{profile.username}
                                            </div>
                                        </div>
                                        {isMember ? (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleRemove(profile)}
                                                disabled={saving || !isAdmin}
                                                className="text-destructive"
                                            >
                                                Remove
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                onClick={() => handleAdd(profile)}
                                                disabled={saving || !isAdmin}
                                            >
                                                Add
                                            </Button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="border-t pt-3">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Current members
                        </div>
                        <div className="space-y-2">
                            {(effectiveConversation.participants || []).map((p) => (
                                <div
                                    key={p.user_id}
                                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/20"
                                >
                                    <Avatar
                                        src={p.profile?.avatar_url}
                                        name={p.profile?.full_name || p.profile?.username || "User"}
                                        size="sm"
                                        isOnline={p.profile?.is_online}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">
                                            {p.profile?.full_name || p.profile?.username || "User"}
                                        </div>
                                        {p.profile?.username && (
                                            <div className="text-xs text-muted-foreground truncate">
                                                @{p.profile.username}
                                            </div>
                                        )}
                                    </div>
                                    {p.user_id !== user?.id && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleRemove({ user_id: p.user_id })}
                                            disabled={saving || !isAdmin}
                                            className="text-destructive"
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
