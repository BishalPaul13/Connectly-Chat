import { supabase } from "@/integrations/supabase/client";

export { supabase };

// Helper types
export type Profile = {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  status: string | null;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  id: string;
  name: string | null;
  is_group: boolean;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ConversationParticipant = {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
};

export type ConversationWithDetails = Conversation & {
  participants: (ConversationParticipant & { profile: Profile })[];
  last_message?: Message;
  unread_count: number;
};
