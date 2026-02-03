// MongoDB collection names
export const COLLECTIONS = {
  USERS: 'users',
  PROFILES: 'profiles',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  TYPING_INDICATORS: 'typing_indicators',
};

// Helper function to convert MongoDB document to API format
export function formatDocument(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

// Helper function to format multiple documents
export function formatDocuments(docs) {
  return docs.map(formatDocument);
}
