import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { callGeminiProvider } from '../api/utils/gemini.ts';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req: Request, res: Response) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    // Use VITE_GEMINI_API_KEY from .env locally
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('CRITICAL ERROR: No Gemini API Key found in .env file.');
        return res.status(500).json({
            error: 'Server configuration error: VITE_GEMINI_API_KEY or GEMINI_API_KEY is missing'
        });
    }

    try {
        const reply = await callGeminiProvider(message, apiKey);
        return res.status(200).json({ reply });
    } catch (error: any) {
        console.error('Local Dev Server Gemini API Error:', error);
        const statusCode = error.message && error.message.includes('429') ? 429 : 500;
        return res.status(statusCode).json({ error: error.message || 'Error generating AI response' });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Local Development Express Server running on http://localhost:${PORT}`);
    console.log(`📡 Simulating Vercel Serverless Function '/api/chat' for Gemini 2.0 Flash\n`);
});
