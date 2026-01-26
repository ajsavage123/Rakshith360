import { supabase } from './supabaseClient';

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  summary?: string;
  messages: Array<{
    id: number;
    text?: string;
    sender: "user" | "ai";
    timestamp: Date;
    isInteractive?: boolean;
    question?: string;
    options?: Array<{ id: string; label: string; value: string }>;
    selectedOption?: string;
    showHospitals?: boolean;
    summary?: string;
    specialty?: string;
    summaryType?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  medicalHistory?: string;
  preferences?: {
    notifications: boolean;
    language: string;
  };
}

class StorageService {
  // Chat Sessions
  async saveChatSession(session: ChatSession): Promise<void> {
    if (!session.userId) {
      console.error("Cannot save chat session: userId is missing.");
      throw new Error("userId is required to save chat session");
    }

    if (!session.title) {
      console.error("Cannot save chat session: title is missing.");
      throw new Error("title is required to save chat session");
    }

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .upsert({
          id: session.id,
          user_id: session.userId,
          title: session.title,
          summary: session.summary,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Supabase error saving chat session:', error);
        throw error;
      }

      // Save messages separately
      const messagesToSave = session.messages.map((msg, index) => ({
        session_id: session.id,
        role: msg.sender === 'ai' ? 'assistant' : 'user',
        content: JSON.stringify(msg),
        created_at: msg.timestamp?.toISOString() || new Date().toISOString()
      }));

      if (messagesToSave.length > 0) {
        // First delete old messages for this session
        const { error: deleteError } = await supabase
          .from('messages')
          .delete()
          .eq('session_id', session.id);

        if (deleteError) {
          console.error('Error deleting old messages:', deleteError);
        }

        // Then insert new messages
        const { error: msgError } = await supabase
          .from('messages')
          .insert(messagesToSave);

        if (msgError) {
          console.error('Supabase error saving messages:', msgError);
          throw msgError;
        }
      }

      console.log('✅ Chat session saved successfully:', session.id);
    } catch (error) {
      console.error('Error saving chat session:', error);
      throw new Error(`Failed to save chat session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getChatSessions(userId: string): Promise<ChatSession[]> {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get messages for each session
      const sessions = await Promise.all(
        (data || []).map(async (session) => {
          const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select('*')
            .eq('session_id', session.id);

          if (msgError) {
            console.error('Error loading messages:', msgError);
            return {
              id: session.id,
              userId: session.user_id,
              title: session.title,
              summary: session.summary,
              messages: [],
              createdAt: new Date(session.created_at),
              updatedAt: new Date(session.updated_at)
            };
          }

          return {
            id: session.id,
            userId: session.user_id,
            title: session.title,
            summary: session.summary,
            messages: (messages || []).map(msg => {
              try {
                const parsed = JSON.parse(msg.content);
                return {
                  ...parsed,
                  timestamp: new Date(msg.created_at)
                };
              } catch {
                return {
                  id: Math.random(),
                  text: msg.content,
                  sender: msg.role === 'assistant' ? 'ai' : 'user',
                  timestamp: new Date(msg.created_at)
                };
              }
            }),
            createdAt: new Date(session.created_at),
            updatedAt: new Date(session.updated_at)
          };
        })
      );

      return sessions;
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      return [];
    }
  }

  async getChatSession(sessionId: string, userId: string): Promise<ChatSession | null> {
    if (!userId || !sessionId) return null;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId);

      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        summary: data.summary,
        messages: (messages || []).map(msg => {
          try {
            const parsed = JSON.parse(msg.content);
            return {
              ...parsed,
              timestamp: new Date(msg.created_at)
            };
          } catch {
            return {
              id: Math.random(),
              text: msg.content,
              sender: msg.role === 'assistant' ? 'ai' : 'user',
              timestamp: new Date(msg.created_at)
            };
          }
        }),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error loading chat session:', error);
      return null;
    }
  }

  async deleteChatSession(sessionId: string, userId: string): Promise<void> {
    if (!userId || !sessionId) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw new Error('Failed to delete chat session');
    }
  }

  // User Profiles
  saveUserProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(`user_profile_${profile.id}`, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  }

  getUserProfile(userId: string): UserProfile | null {
    try {
      const data = localStorage.getItem(`user_profile_${userId}`);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }

  // Medical History
  async saveMedicalHistory(
    userId: string,
    data: {
      allergies?: string;
      medications?: string;
      pastConditions?: string;
      vaccinations?: string;
    }
  ): Promise<void> {
    if (!userId) {
      throw new Error('userId is required');
    }

    try {
      const { error } = await supabase
        .from('medical_history')
        .upsert({
          user_id: userId,
          allergies: data.allergies,
          medications: data.medications,
          past_conditions: data.pastConditions,
          vaccinations: data.vaccinations,
          updated_at: new Date()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving medical history:', error);
      throw new Error('Failed to save medical history');
    }
  }

  async getMedicalHistory(userId: string): Promise<any | null> {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('medical_history')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      return {
        allergies: data.allergies,
        medications: data.medications,
        pastConditions: data.past_conditions,
        vaccinations: data.vaccinations
      };
    } catch (error) {
      console.error('Error loading medical history:', error);
      return null;
    }
  }

  // App Settings
  saveSettings(userId: string, settings: any): void {
    try {
      localStorage.setItem(`app_settings_${userId}`, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  getSettings(userId: string): any {
    try {
      const data = localStorage.getItem(`app_settings_${userId}`);
      if (!data) return {};
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      return {};
    }
  }

  // Clear all data for a user
  async clearUserData(userId: string): Promise<void> {
    try {
      // Delete all user's sessions (this will cascade delete messages)
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      // Delete API keys
      const { error: keyError } = await supabase
        .from('api_keys')
        .delete()
        .eq('user_id', userId);

      if (keyError) throw keyError;

      // Delete medical history
      const { error: historyError } = await supabase
        .from('medical_history')
        .delete()
        .eq('user_id', userId);

      if (historyError) throw historyError;

      // Clear local preferences
      localStorage.removeItem(`app_settings_${userId}`);
      localStorage.removeItem(`user_profile_${userId}`);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw new Error('Failed to clear storage');
    }
  }

  // Onboarding state management
  saveOnboardingCompleted(userId: string): void {
    try {
      localStorage.setItem(`onboarding_completed_${userId}`, 'true');
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  }

  isOnboardingCompleted(userId: string): boolean {
    try {
      const completed = localStorage.getItem(`onboarding_completed_${userId}`);
      return completed === 'true';
    } catch (error) {
      console.error('Error checking onboarding state:', error);
      return false;
    }
  }

  // API Key Management - Supabase async methods
  async saveApiKeySupabase(userId: string, provider: string, key: string): Promise<void> {
    if (!userId || !provider || !key) {
      throw new Error('userId, provider, and key are required');
    }

    try {
      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: userId,
          provider,
          key_value: key
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving API key:', error);
      throw new Error('Failed to save API key');
    }
  }

  async getApiKeySupabase(userId: string, provider: string): Promise<string | null> {
    if (!userId || !provider) return null;

    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('key_value')
        .eq('user_id', userId)
        .eq('provider', provider)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;
      return data.key_value;
    } catch (error) {
      console.error('Error loading API key:', error);
      return null;
    }
  }

  async deleteApiKeySupabase(userId: string, provider: string): Promise<void> {
    if (!userId || !provider) return;

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('user_id', userId)
        .eq('provider', provider);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting API key:', error);
      throw new Error('Failed to delete API key');
    }
  }

  // API Key Management - localStorage synchronous methods for React components
  saveApiKey(provider: string, key: string): void {
    try {
      localStorage.setItem(`api_key_${provider}`, key);
      console.log(`✅ API key saved for ${provider}`);
    } catch (error) {
      console.error(`Error saving API key for ${provider}:`, error);
      throw new Error(`Failed to save API key for ${provider}`);
    }
  }

  getApiKey(provider: string): string | null {
    try {
      return localStorage.getItem(`api_key_${provider}`) || null;
    } catch (error) {
      console.error(`Error loading API key for ${provider}:`, error);
      return null;
    }
  }

  deleteApiKey(provider: string): void {
    try {
      localStorage.removeItem(`api_key_${provider}`);
      console.log(`✅ API key deleted for ${provider}`);
    } catch (error) {
      console.error(`Error deleting API key for ${provider}:`, error);
      throw new Error(`Failed to delete API key for ${provider}`);
    }
  }

  getAllApiKeys(): Record<string, string> {
    try {
      const keys: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('api_key_')) {
          const keyName = key.replace('api_key_', '');
          keys[keyName] = localStorage.getItem(key) || '';
        }
      }
      return keys;
    } catch (error) {
      console.error('Error loading all API keys:', error);
      return {};
    }
  }

  // AI Model Selection
  saveSelectedAIModel(model: string): void {
    try {
      localStorage.setItem('selected_ai_model', model);
    } catch (error) {
      console.error('Error saving selected AI model:', error);
    }
  }

  getSelectedAIModel(): string {
    try {
      return localStorage.getItem('selected_ai_model') || 'gemini';
    } catch (error) {
      console.error('Error loading selected AI model:', error);
      return 'gemini';
    }
  }
}

export const storageService = new StorageService(); 