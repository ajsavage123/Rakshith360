// Storage service — fully localStorage-based (Supabase bypassed)

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  summary?: string;
  messages: Array<{
    id: number;
    text?: string;
    sender: 'user' | 'ai';
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

const sessionKey = (userId: string) => `rakshith360_sessions_${userId}`;

class StorageService {
  // ─── Chat Sessions ─────────────────────────────────────────────────────────

  async saveChatSession(session: ChatSession): Promise<void> {
    if (!session.userId) throw new Error('userId is required to save chat session');
    if (!session.title) throw new Error('title is required to save chat session');

    const sessions = await this.getChatSessions(session.userId);
    const idx = sessions.findIndex((s) => s.id === session.id);
    const updated = { ...session, updatedAt: new Date() };

    if (idx >= 0) {
      sessions[idx] = updated;
    } else {
      sessions.unshift(updated);
    }

    localStorage.setItem(sessionKey(session.userId), JSON.stringify(sessions));
    console.log('✅ Chat session saved:', session.id);
  }

  async getChatSessions(userId: string): Promise<ChatSession[]> {
    if (!userId) return [];
    try {
      const raw = localStorage.getItem(sessionKey(userId));
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ChatSession[];
      // Rehydrate dates
      return parsed.map((s) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
        messages: s.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
      }));
    } catch {
      return [];
    }
  }

  async getChatSession(sessionId: string, userId: string): Promise<ChatSession | null> {
    if (!sessionId || !userId) return null;
    const sessions = await this.getChatSessions(userId);
    return sessions.find((s) => s.id === sessionId) || null;
  }

  async deleteChatSession(sessionId: string, userId: string): Promise<void> {
    if (!sessionId || !userId) return;
    const sessions = await this.getChatSessions(userId);
    const filtered = sessions.filter((s) => s.id !== sessionId);
    localStorage.setItem(sessionKey(userId), JSON.stringify(filtered));
  }

  // ─── User Profiles ─────────────────────────────────────────────────────────

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
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // ─── Medical History ────────────────────────────────────────────────────────

  async saveMedicalHistory(
    userId: string,
    data: {
      allergies?: string;
      medications?: string;
      pastConditions?: string;
      vaccinations?: string;
    }
  ): Promise<void> {
    if (!userId) throw new Error('userId is required');
    localStorage.setItem(`medical_history_${userId}`, JSON.stringify(data));
  }

  async getMedicalHistory(userId: string): Promise<any | null> {
    if (!userId) return null;
    try {
      const raw = localStorage.getItem(`medical_history_${userId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // ─── App Settings ───────────────────────────────────────────────────────────

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
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  // ─── Clear User Data ────────────────────────────────────────────────────────

  async clearUserData(userId: string): Promise<void> {
    localStorage.removeItem(sessionKey(userId));
    localStorage.removeItem(`user_profile_${userId}`);
    localStorage.removeItem(`medical_history_${userId}`);
    localStorage.removeItem(`app_settings_${userId}`);
    // Remove API keys
    const providers = ['gemini', 'deepseek', 'openai', 'openrouter'];
    providers.forEach((p) => localStorage.removeItem(`api_key_${p}`));
    console.log('✅ User data cleared');
  }

  // ─── Onboarding ─────────────────────────────────────────────────────────────

  saveOnboardingCompleted(userId: string): void {
    try {
      localStorage.setItem(`onboarding_completed_${userId}`, 'true');
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  }

  isOnboardingCompleted(userId: string): boolean {
    try {
      return localStorage.getItem(`onboarding_completed_${userId}`) === 'true';
    } catch {
      return false;
    }
  }

  // ─── API Key Management (localStorage) ─────────────────────────────────────

  saveApiKey(provider: string, key: string): void {
    try {
      localStorage.setItem(`api_key_${provider}`, key);
      console.log(`✅ API key saved for ${provider}`);
    } catch (error) {
      console.error(`Error saving API key for ${provider}:`, error);
    }
  }

  getApiKey(provider: string): string | null {
    try {
      return localStorage.getItem(`api_key_${provider}`) || null;
    } catch {
      return null;
    }
  }

  deleteApiKey(provider: string): void {
    try {
      localStorage.removeItem(`api_key_${provider}`);
      console.log(`✅ API key deleted for ${provider}`);
    } catch (error) {
      console.error(`Error deleting API key for ${provider}:`, error);
    }
  }

  getAllApiKeys(): Record<string, string> {
    const keys: Record<string, string> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('api_key_')) {
          keys[key.replace('api_key_', '')] = localStorage.getItem(key) || '';
        }
      }
    } catch (error) {
      console.error('Error loading all API keys:', error);
    }
    return keys;
  }

  // Supabase compat stubs (used in AccountSettings etc.)
  async saveApiKeySupabase(userId: string, provider: string, key: string): Promise<void> {
    this.saveApiKey(provider, key);
  }

  async getApiKeySupabase(userId: string, provider: string): Promise<string | null> {
    return this.getApiKey(provider);
  }

  async deleteApiKeySupabase(userId: string, provider: string): Promise<void> {
    this.deleteApiKey(provider);
  }

  // ─── AI Model Selection ─────────────────────────────────────────────────────

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
    } catch {
      return 'gemini';
    }
  }
}

export const storageService = new StorageService();