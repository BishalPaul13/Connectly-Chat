import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi, profilesApi, removeToken } from "@/lib/api";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session on mount
        const checkSession = async () => {
            try {
                const { user: currentUser, profile: currentProfile } = await authApi.getMe();
                setUser(currentUser);
                setProfile(currentProfile);
                setSession({ user: currentUser, token: localStorage.getItem('auth_token') || '' });

                // Update online status
                if (currentUser) {
                    await profilesApi.updateStatus(currentUser.id, true);
                }
            } catch (error) {
                // No valid session
                setUser(null);
                setProfile(null);
                setSession(null);
                removeToken();
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Clean up and set offline on unmount
        return () => {
            if (user) {
                profilesApi.updateStatus(user.id, false).catch(console.error);
            }
        };
    }, []);

    // Set up visibility change listener for online status
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (!user) return;

            const isOnline = document.visibilityState === "visible";
            await profilesApi.updateStatus(user.id, isOnline).catch(console.error);
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [user]);

    const signUp = async (email, password, username, fullName) => {
        try {
            const { data } = await authApi.signUp(email, password, username, fullName);
            setUser(data.user);
            setProfile(data.profile);
            setSession({ user: data.user, token: data.token });
            return { error: null };
        } catch (error) {
            console.error('Sign up error:', error);
            return { error: error };
        }
    };

    const signIn = async (email, password) => {
        try {
            const { data } = await authApi.signIn(email, password);
            setUser(data.user);
            setProfile(data.profile);
            setSession({ user: data.user, token: data.token });
            return { error: null };
        } catch (error) {
            return { error: error };
        }
    };

    const signOut = async () => {
        if (user) {
            await profilesApi.updateStatus(user.id, false).catch(console.error);
        }
        setUser(null);
        setProfile(null);
        setSession(null);
        removeToken();
    };

    const updateProfile = async (updates) => {
        if (!user) return { error: new Error("Not authenticated") };

        try {
            const updatedProfile = await profilesApi.update(user.id, updates);
            setProfile(updatedProfile);
            return { error: null };
        } catch (error) {
            return { error: error };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                profile,
                loading,
                signUp,
                signIn,
                signOut,
                updateProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
