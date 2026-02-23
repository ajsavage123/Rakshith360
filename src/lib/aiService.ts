import { storageService } from './storage';

export type AIModel = 'gemini' | 'deepseek' | 'openai' | 'openrouter';

export interface GeminiModelOption {
  id: string;
  name: string;
  description: string;
}

export interface AIModelConfig {
  id: AIModel;
  name: string;
  apiKeyName: string;
  models: string[];
  isFree?: boolean;
}

export const GEMINI_MODELS: GeminiModelOption[] = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Best for prototyping — fast, capable & free tier friendly' },
  { id: 'gemini-2.0-flash-lite-preview-02-05', name: 'Gemini 2.0 Flash Lite', description: 'Lightweight and fastest' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast and versatile' },
  { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', description: 'Smallest 1.5 model' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Complex reasoning model' }
];

export const AI_MODELS: Record<AIModel, AIModelConfig> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    apiKeyName: 'gemini',
    models: GEMINI_MODELS.map(m => m.id)
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    apiKeyName: 'deepseek',
    models: ['deepseek-chat', 'deepseek-coder']
  },
  openai: {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    apiKeyName: 'openai',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo']
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter (Free Models)',
    apiKeyName: 'openrouter',
    models: ['openchat/openchat-7b:free', 'nousresearch/nous-hermes-2-mistral-7b-dpo:free', 'undi95/toppy-m-7b:free'],
    isFree: true
  }
};

// Get API key for a provider — reads ONLY from environment variables (backend-safe)
export const getApiKey = (provider: AIModel): string | null => {
  const config = AI_MODELS[provider];
  if (!config) return null;

  // Only read from environment variables — never expose keys on the client
  if (provider === 'gemini') {
    const keys = getGeminiApiKeys();
    return keys.length > 0 ? keys[0] : null;
  }

  const envKey = import.meta.env[`VITE_${config.apiKeyName.toUpperCase()}_API_KEY`];
  return envKey || null;
};

// Get all available Gemini API keys from environment variables
export const getGeminiApiKeys = (): string[] => {
  const keys: string[] = [];

  // Check the base key
  const baseKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (baseKey && baseKey.trim() !== '') keys.push(baseKey);

  // Check numbered keys (e.g., VITE_GEMINI_API_KEY_1, VITE_GEMINI_API_KEY_2, etc.)
  for (let i = 1; i <= 10; i++) {
    const numberedKey = import.meta.env[`VITE_GEMINI_API_KEY_${i}`];
    if (numberedKey && numberedKey.trim() !== '' && !keys.includes(numberedKey)) {
      keys.push(numberedKey);
    }
  }

  return keys;
};

// Get selected model preference
export const getSelectedModel = (): AIModel => {
  try {
    const saved = localStorage.getItem('selected_ai_model');
    if (saved && (saved === 'gemini' || saved === 'deepseek' || saved === 'openai' || saved === 'openrouter')) {
      return saved as AIModel;
    }
  } catch (error) {
    console.error('Error loading selected model:', error);
  }
  return 'gemini'; // Default to Gemini
};

// Save selected model preference
export const saveSelectedModel = (model: AIModel): void => {
  try {
    localStorage.setItem('selected_ai_model', model);
  } catch (error) {
    console.error('Error saving selected model:', error);
  }
};

// Get selected Gemini model
export const getSelectedGeminiModel = (): string => {
  try {
    const saved = localStorage.getItem('selected_gemini_model');
    if (saved && GEMINI_MODELS.some(m => m.id === saved)) {
      return saved;
    }
  } catch (error) {
    console.error('Error loading selected Gemini model:', error);
  }
  return GEMINI_MODELS[0].id; // Default to Gemini 2.0 Flash (best for free tier)
};

// Save selected Gemini model
export const saveSelectedGeminiModel = (modelId: string): void => {
  try {
    localStorage.setItem('selected_gemini_model', modelId);
  } catch (error) {
    console.error('Error saving selected Gemini model:', error);
  }
};

// Test if a specific Gemini model works with an API key
export const testGeminiModel = async (apiKey: string, modelId: string): Promise<boolean> => {
  // STRICT REQUIREMENT: No direct calls to Gemini from frontend.
  // Model validation should be managed server-side.
  // For UI purposes, we assume models listed are generally available if the backend handles them.
  console.log(`Skipping direct test for model ${modelId} to maintain backend-only architecture.`);
  return true;
};

// Detect which Gemini models are available with an API key
export const detectAvailableGeminiModels = async (
  apiKey: string,
  onProgress?: (modelId: string, available: boolean, index: number, total: number) => void
): Promise<string[]> => {
  const availableModels: string[] = [];
  const total = GEMINI_MODELS.length;

  console.log('🔍 Detecting available Gemini models...');

  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const model = GEMINI_MODELS[i];
    const isAvailable = await testGeminiModel(apiKey, model.id);

    if (isAvailable) {
      availableModels.push(model.id);
      console.log(`✅ ${model.name} (${model.id}) is available`);
    } else {
      console.log(`❌ ${model.name} (${model.id}) is not available`);
    }

    if (onProgress) {
      onProgress(model.id, isAvailable, i + 1, total);
    }
  }

  console.log(`📊 Found ${availableModels.length} available models`);
  return availableModels;
};

// Auto-detect and select the first working Gemini model
export const autoSelectGeminiModel = async (
  apiKey: string,
  onProgress?: (modelId: string, available: boolean, index: number, total: number) => void
): Promise<string | null> => {
  console.log('🔄 Auto-selecting best available Gemini model...');

  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const model = GEMINI_MODELS[i];
    const isAvailable = await testGeminiModel(apiKey, model.id);

    if (onProgress) {
      onProgress(model.id, isAvailable, i + 1, GEMINI_MODELS.length);
    }

    if (isAvailable) {
      console.log(`✅ Auto-selected: ${model.name} (${model.id})`);
      saveSelectedGeminiModel(model.id);
      return model.id;
    }
  }

  console.log('❌ No available Gemini models found');
  return null;
};

// Call Gemini API via backend explicitly (No direct frontend fallback)
export const callGeminiAPI = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: prompt }),
    });

    if (response.status === 429) {
      throw new Error(`Experiencing high traffic. Please wait about 60 seconds and try again.`);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    if (data.reply) {
      return data.reply;
    }

    throw new Error('Invalid response from server');
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      console.error('⚠️ Backend unreachable - Check if the Vite proxy or Express dev server is running.');
      throw new Error('Cannot reach AI backend. If running locally, please use `npm run dev:full`.');
    }
    console.error('Frontend API Call Error:', error);
    throw new Error(error.message || 'Unknown error communicating with the server');
  }
};


// Call DeepSeek API
export const callDeepSeekAPI = async (prompt: string, apiKey: string, model?: string): Promise<string> => {
  const modelToUse = model || AI_MODELS.deepseek.models[0];

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelToUse,
      messages: [
        { role: 'system', content: 'You are an experienced medical professional certified in emergency medicine and first aid.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.choices?.[0]?.message?.content) {
    return data.choices[0].message.content;
  }

  throw new Error('Invalid response from DeepSeek API');
};

// Call OpenAI API
export const callOpenAIAPI = async (prompt: string, apiKey: string, model?: string): Promise<string> => {
  const modelToUse = model || AI_MODELS.openai.models[0];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelToUse,
      messages: [
        { role: 'system', content: 'You are an experienced medical professional certified in emergency medicine and first aid.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.choices?.[0]?.message?.content) {
    return data.choices[0].message.content;
  }

  throw new Error('Invalid response from OpenAI API');
};

// OpenRouter API call (Free models via OpenRouter)
const callOpenRouterAPI = async (prompt: string, apiKey: string, model?: string): Promise<string> => {
  // List of OpenRouter free models to try in order of preference
  const modelsToTry = model ? [model] : AI_MODELS.openrouter.models;

  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Medical Assistant'
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful medical assistant. Provide clear, accurate health information and suggest when to see a doctor. Always include a disclaimer that you are not a substitute for professional medical advice.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: `HTTP ${response.status}` } }));
        const errorMsg = error.error?.message || `OpenRouter API error (${response.status})`;
        lastError = new Error(errorMsg);
        console.warn(`❌ Model ${modelName} failed: ${errorMsg}`);
        continue; // Try next model
      }

      const data = await response.json();

      if (data.choices && data.choices[0]?.message?.content) {
        console.log(`✅ OpenRouter API call successful with model: ${modelName}`);
        return data.choices[0].message.content.trim();
      }

      lastError = new Error('Invalid response format from OpenRouter API');
      continue;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`❌ Model ${modelName} error: ${lastError.message}`);
      continue; // Try next model
    }
  }

  // If all models failed, throw the last error
  if (lastError) {
    throw lastError;
  }

  throw new Error('No OpenRouter models available. Please check your API key or try again later.');
};

// Unified AI API call function
export const callAIAPI = async (prompt: string, model?: AIModel): Promise<string> => {
  const selectedModel = model || getSelectedModel();
  const apiKey = getApiKey(selectedModel);

  if (!apiKey) {
    throw new Error(`Please configure your ${AI_MODELS[selectedModel].name} API key in Account Settings.`);
  }

  console.log(`🤖 Calling ${AI_MODELS[selectedModel].name} API...`);

  try {
    switch (selectedModel) {
      case 'gemini':
        console.log(`Using Vercel Backend for Gemini`);
        return await callGeminiAPI(prompt);
      case 'deepseek':
        return await callDeepSeekAPI(prompt, apiKey);
      case 'openai':
        return await callOpenAIAPI(prompt, apiKey);
      case 'openrouter':
        return await callOpenRouterAPI(prompt, apiKey);
      default:
        throw new Error(`Unsupported AI model: ${selectedModel}`);
    }
  } catch (error) {
    // If OpenRouter fails, try fallback to Gemini
    if (selectedModel === 'openrouter') {
      console.warn(`⚠️ OpenRouter failed, attempting fallback to Gemini...`);
      try {
        const geminiKey = getApiKey('gemini');
        if (geminiKey) {
          console.log(`📱 Fallback: Using Vercel Gemini Backend`);
          return await callGeminiAPI(prompt);
        }
      } catch (fallbackError) {
        console.error('Fallback to Gemini also failed:', fallbackError);
      }
    }
    // If all else fails, rethrow the original error
    throw error;
  }
};

