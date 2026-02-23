export const callGeminiProvider = async (
    message: string,
    apiKeys: string[],
    currentKeyIndex: number = 0
): Promise<any> => {
    if (currentKeyIndex >= apiKeys.length) {
        throw new Error(`Experiencing high traffic. All ${apiKeys.length} API keys exhausted their rate limits. Please wait about 60 seconds.`);
    }

    const currentKey = apiKeys[currentKeyIndex];

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: message }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                },
            }),
        }
    );

    let isQuotaError = response.status === 429;
    let errorData = null;

    if (!response.ok) {
        errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message?.toLowerCase() || '';
        // Catch Google's specific hard-limit quota errors which often return as 400 or 403
        if (
            response.status === 403 ||
            errorMessage.includes('quota exceeded') ||
            errorMessage.includes('rate limit') ||
            errorMessage.includes('too many requests')
        ) {
            isQuotaError = true;
        }
    }

    if (isQuotaError) {
        console.warn(`⚠️ Quota/Rate Limit hit on key index ${currentKeyIndex}. Status: ${response.status}`);

        if (currentKeyIndex < apiKeys.length - 1) {
            console.log(`🔄 Rotating to backup API key index ${currentKeyIndex + 1}...`);
            return callGeminiProvider(message, apiKeys, currentKeyIndex + 1);
        } else {
            console.log(`⏳ No more backup keys available. All keys are depleted.`);
            if (!errorData) errorData = await response.json().catch(() => ({}));
            throw new Error(errorData?.error?.message || `All ${apiKeys.length} API keys exceeded their quotas. Please try again later.`);
        }
    }

    if (!response.ok) {
        throw new Error(errorData?.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
    }

    throw new Error('Invalid response format from Gemini API');
};

export const getAvailableApiKeys = (): string[] => {
    const keys: Set<string> = new Set();

    // Try to load primary keys
    if (process.env.GEMINI_API_KEY) keys.add(process.env.GEMINI_API_KEY);
    if (process.env.VITE_GEMINI_API_KEY) keys.add(process.env.VITE_GEMINI_API_KEY);

    // Try to load rotation keys dynamically (1 through 10)
    for (let i = 1; i <= 10; i++) {
        const k1 = process.env[`GEMINI_API_KEY_${i}`];
        if (k1 && k1.trim() !== '') keys.add(k1.trim());

        const k2 = process.env[`VITE_GEMINI_API_KEY_${i}`];
        if (k2 && k2.trim() !== '') keys.add(k2.trim());
    }

    return Array.from(keys);
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const apiKeys = getAvailableApiKeys();
    if (apiKeys.length === 0) {
        return res.status(500).json({ error: 'Server configuration error: No GEMINI_API_KEY found in Vercel settings.' });
    }

    try {
        const reply = await callGeminiProvider(message, apiKeys);
        return res.status(200).json({ reply });
    } catch (error: any) {
        console.error('Gemini API Error:', error);
        const statusCode = error.message && error.message.includes('429') ? 429 : 500;
        return res.status(statusCode).json({ error: error.message || 'Error generating AI response' });
    }
}

