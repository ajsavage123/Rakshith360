export const callGeminiProvider = async (
    message: string,
    apiKey: string,
    retry: boolean = false
): Promise<any> => {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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

    if (response.status === 429 && !retry) {
        console.warn('⚠️ 429 Too Many Requests received. Delaying 2 seconds and retrying...');
        // wait 2 seconds and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return callGeminiProvider(message, apiKey, true);
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
    }

    throw new Error('Invalid response format from Gemini API');
};
