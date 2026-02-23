import { callGeminiProvider } from './utils/gemini';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is missing' });
    }

    try {
        const reply = await callGeminiProvider(message, apiKey);
        return res.status(200).json({ reply });
    } catch (error: any) {
        console.error('Gemini API Error:', error);
        return res.status(500).json({ error: error.message || 'Error generating AI response' });
    }
}
