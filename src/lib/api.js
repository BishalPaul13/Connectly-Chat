// API client for MongoDB backend

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
function getToken() {
    return localStorage.getItem('auth_token');
}

// Set auth token
export function setToken(token) {
    localStorage.setItem('auth_token', token);
}

// Remove auth token
export function removeToken() {
    localStorage.removeItem('auth_token');
}

// API request helper
async function apiRequest(
    endpoint,
    options = {}
) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error(`Cannot connect to server. Make sure the backend is running on ${API_URL}`);
        }
        throw error;
    }
}

// Auth API
export const authApi = {
    signUp: async (email, password, username, fullName) => {
        const data = await apiRequest('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, username, fullName }),
        });
        setToken(data.token);
        return { data, error: null };
    },

    signIn: async (email, password) => {
        const data = await apiRequest('/auth/signin', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        setToken(data.token);
        return { data, error: null };
    },

    getMe: async () => {
        return apiRequest('/auth/me');
    },

    signOut: () => {
        removeToken();
    },
};

// Profiles API
export const profilesApi = {
    getAll: async (search, excludeUserId) => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (excludeUserId) params.append('excludeUserId', excludeUserId);
        return apiRequest(`/profiles?${params.toString()}`);
    },

    getById: async (userId) => {
        return apiRequest(`/profiles/${userId}`);
    },

    update: async (userId, updates) => {
        return apiRequest(`/profiles/${userId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    },

    updateStatus: async (userId, isOnline) => {
        return apiRequest(`/profiles/${userId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ is_online: isOnline }),
        });
    },
};

// Conversations API
export const conversationsApi = {
    getAll: async () => {
        return apiRequest('/conversations');
    },

    getById: async (conversationId) => {
        return apiRequest(`/conversations/${conversationId}`);
    },

    create: async (participantId, isGroup, name, participantIds) => {
        return apiRequest('/conversations', {
            method: 'POST',
            body: JSON.stringify({ participantId, isGroup, name, participantIds }),
        });
    },

    acceptRequest: async (conversationId) => {
        return apiRequest(`/conversations/${conversationId}/accept`, {
            method: 'POST',
        });
    },

    deleteRequest: async (conversationId) => {
        return apiRequest(`/conversations/${conversationId}/delete-request`, {
            method: 'POST',
        });
    },

    markAsRead: async (conversationId) => {
        return apiRequest(`/conversations/${conversationId}/read`, {
            method: 'PATCH',
        });
    },

    delete: async (conversationId) => {
        return apiRequest(`/conversations/${conversationId}`, {
            method: 'DELETE',
        });
    },

    block: async (conversationId) => {
        return apiRequest(`/conversations/${conversationId}/block`, {
            method: 'POST',
        });
    },

    unblock: async (conversationId) => {
        return apiRequest(`/conversations/${conversationId}/unblock`, {
            method: 'POST',
        });
    },

    addParticipant: async (conversationId, userId) => {
        return apiRequest(`/conversations/${conversationId}/participants`, {
            method: 'POST',
            body: JSON.stringify({ userId }),
        });
    },

    removeParticipant: async (conversationId, userId) => {
        return apiRequest(`/conversations/${conversationId}/participants/${userId}`, {
            method: 'DELETE',
        });
    },
};

// Messages API
export const messagesApi = {
    getByConversation: async (conversationId) => {
        return apiRequest(`/messages/conversation/${conversationId}`);
    },

    create: async (conversationId, content, sentAt) => {
        return apiRequest('/messages', {
            method: 'POST',
            body: JSON.stringify({ conversation_id: conversationId, content, sent_at: sentAt }),
        });
    },
};

// Typing API
export const typingApi = {
    update: async (conversationId, isTyping) => {
        return apiRequest('/typing', {
            method: 'POST',
            body: JSON.stringify({ conversation_id: conversationId, is_typing: isTyping }),
        });
    },
};
