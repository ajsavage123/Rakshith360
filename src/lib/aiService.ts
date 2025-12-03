import { storageService } from './storage';

export type AIModel = 'gemini' | 'deepseek' | 'openai';

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
}

export const GEMINI_MODELS: GeminiModelOption[] = [
  { id: 'gemini-2.5-pro-preview-06-05', name: 'Gemini 2.5 Pro', description: 'Most capable model for complex tasks' },
  { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash', description: 'Fast and efficient for most tasks' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fast multimodal model' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: 'Lightweight and fast' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Best for complex reasoning' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast and versatile' },
  { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', description: 'Smallest and fastest' },
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
  }
};

// Get API key for a provider
export const getApiKey = (provider: AIModel): string | null => {
  const config = AI_MODELS[provider];
  if (!config) return null;
  
  // Try localStorage first
  const savedKey = storageService.getApiKey(config.apiKeyName);
  if (savedKey) return savedKey;
  
  // Fallback to environment variable
  const envKey = import.meta.env[`VITE_${config.apiKeyName.toUpperCase()}_API_KEY`];
  return envKey || null;
};

// Get selected model preference
export const getSelectedModel = (): AIModel => {
  try {
    const saved = localStorage.getItem('selected_ai_model');
    if (saved && (saved === 'gemini' || saved === 'deepseek' || saved === 'openai')) {
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
  return GEMINI_MODELS[0].id; // Default to first model (Gemini 2.5 Pro)
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
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hi' }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 10,
          }
        })
      }
    );
    return response.ok;
  } catch (error) {
    console.error(`Error testing model ${modelId}:`, error);
    return false;
  }
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

// Call a single Gemini model (no fallback)
const callSingleGeminiModel = async (prompt: string, apiKey: string, modelId: string): Promise<{ success: boolean; result?: string; error?: string; status?: number }> => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return { success: true, result: data.candidates[0].content.parts[0].text };
      }
      return { success: false, error: 'Invalid response from Gemini API' };
    } else {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `API error: ${response.status}`;
      return { success: false, error: errorMessage, status: response.status };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Call Gemini API with auto-fallback to other models
export const callGeminiAPI = async (prompt: string, apiKey: string, model?: string): Promise<string> => {
  const selectedModel = model || getSelectedGeminiModel();
  
  // Try the selected model first
  console.log(`🎯 Trying selected model: ${selectedModel}`);
  const result = await callSingleGeminiModel(prompt, apiKey, selectedModel);
  
  if (result.success && result.result) {
    return result.result;
  }
  
  // If selected model failed with 404 (not available), try fallback models
  if (result.status === 404) {
    console.log(`⚠️ Model ${selectedModel} not available, trying fallback models...`);
    
    // Try other models in order
    for (const fallbackModel of GEMINI_MODELS) {
      if (fallbackModel.id === selectedModel) continue; // Skip already tried model
      
      console.log(`🔄 Trying fallback: ${fallbackModel.name} (${fallbackModel.id})`);
      const fallbackResult = await callSingleGeminiModel(prompt, apiKey, fallbackModel.id);
      
      if (fallbackResult.success && fallbackResult.result) {
        // Save the working model for future use
        console.log(`✅ Fallback successful! Saving ${fallbackModel.id} as default`);
        saveSelectedGeminiModel(fallbackModel.id);
        window.dispatchEvent(new Event('geminiModelAutoChanged'));
        return fallbackResult.result;
      }
    }
    
    throw new Error('No Gemini models available with your API key. Please check your API key in Account Settings.');
  }
  
  // Handle other errors
  if (result.status === 429) {
    throw new Error('Rate limit exceeded. Please wait a moment and try again.');
  } else if (result.status === 400) {
    throw new Error(`Invalid request: ${result.error}`);
  }
  
  throw new Error(result.error || 'Unknown error calling Gemini API');
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

// Unified AI API call function
export const callAIAPI = async (prompt: string, model?: AIModel): Promise<string> => {
  const selectedModel = model || getSelectedModel();
  const apiKey = getApiKey(selectedModel);
  
  if (!apiKey) {
    throw new Error(`Please configure your ${AI_MODELS[selectedModel].name} API key in Account Settings.`);
  }

  console.log(`🤖 Calling ${AI_MODELS[selectedModel].name} API...`);

  switch (selectedModel) {
    case 'gemini':
      const geminiModel = getSelectedGeminiModel();
      console.log(`Using Gemini model: ${geminiModel}`);
      return await callGeminiAPI(prompt, apiKey, geminiModel);
    case 'deepseek':
      return await callDeepSeekAPI(prompt, apiKey);
    case 'openai':
      return await callOpenAIAPI(prompt, apiKey);
    default:
      throw new Error(`Unsupported AI model: ${selectedModel}`);
  }
};

