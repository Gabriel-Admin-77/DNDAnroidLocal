import { Character, InventoryItem, StoryLogEntry, Quest } from './types';
import { buildDmSystemPrompt, buildDmUserPrompt, buildQuestSystemPrompt, buildQuestUserPrompt } from './prompts';

function cleanAndParseJson(rawText: string) {
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
            return JSON.parse(match[0]);
        }
        throw new Error('Could not parse JSON from AI response.');
    }
}

// SECURITY: Client-side API key access is intentionally limited to localStorage
// (user-set keys via Settings modal). Server-side env keys (DEEPSEEK_API_KEY,
// GOOGLE_GENERATIVE_AI_API_KEY) are never exposed to the browser bundle —
// those are consumed only by the /api/* route handlers.
export function getGeminiApiKey(): string {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('dnd_app_gemini_key');
        if (stored?.trim()) return stored.trim();
    }
    return '';
}

export function getDeepSeekApiKey(): string {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('dnd_app_deepseek_key');
        if (stored?.trim()) return stored.trim();
    }
    return '';
}

interface DmPayload {
    character: Character;
    inventory: InventoryItem[];
    logs: StoryLogEntry[];
    userInput: string;
    location: string;
    time: string;
    weather: string;
    npcMemory?: { name: string; disposition: string }[];
}

async function callDeepSeekDm(payload: DmPayload): Promise<any> {
    const apiKey = getDeepSeekApiKey();
    if (!apiKey) {
        throw new Error('DeepSeek API key missing. Please enter your API key in Settings.');
    }
    const { logs, userInput } = payload;
    const systemPrompt = buildDmSystemPrompt(payload);
    const userPrompt = buildDmUserPrompt({ logs, userInput });

    const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
        })
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`DeepSeek DM API Error (${res.status}): ${errText}`);
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    return cleanAndParseJson(content);
}

async function callGeminiDm(payload: DmPayload): Promise<any> {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        throw new Error('Gemini API key missing.');
    }
    const { logs, userInput } = payload;
    const systemPrompt = buildDmSystemPrompt(payload);
    const userPrompt = buildDmUserPrompt({ logs, userInput });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: { responseMimeType: 'application/json' }
        })
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API Error (${res.status}): ${errText}`);
    }
    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return cleanAndParseJson(rawText);
}

/**
 * Direct client-side call to the AI DM.
 * Prefers DeepSeek if a DeepSeek key is in localStorage, otherwise Gemini.
 * Falls back to the server proxy only when neither is set.
 */
export async function callAiDmDirectly(payload: DmPayload) {
    const deepseekKey = getDeepSeekApiKey();
    if (deepseekKey) return callDeepSeekDm(payload);
    const geminiKey = getGeminiApiKey();
    if (geminiKey) return callGeminiDm(payload);
    throw new Error('No AI API key configured. Open Settings to add your DeepSeek or Gemini key.');
}

interface QuestPayload {
    character: Character;
    logs: StoryLogEntry[];
    adventureTitle: string;
    location: string;
    existingQuests: Quest[];
}

/**
 * Direct client-side call to DeepSeek for quest generation.
 */
export async function callDeepSeekDirectly(payload: QuestPayload): Promise<Quest[]> {
    const apiKey = getDeepSeekApiKey();
    if (!apiKey) {
        throw new Error('DeepSeek API key missing. Please enter your API key in Settings.');
    }
    const { logs } = payload;
    const systemPrompt = buildQuestSystemPrompt(payload);
    const userPrompt = buildQuestUserPrompt({ logs });

    const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
        })
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`DeepSeek API Error (${res.status}): ${errText}`);
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    const parsed = cleanAndParseJson(content);
    return parsed.quests || [];
}

/**
 * Simple text generation helper using available client keys or fallback server API.
 */
export async function generateTextDirectly(prompt: string): Promise<string> {
    const deepseekKey = getDeepSeekApiKey();
    if (deepseekKey) {
        const res = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${deepseekKey.trim()}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.8
            })
        });
        if (res.ok) {
            const data = await res.json();
            return data.choices?.[0]?.message?.content || '';
        }
    }
    const geminiKey = getGeminiApiKey();
    if (geminiKey) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        if (res.ok) {
            const data = await res.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
    }
    throw new Error('No AI API key configured. Open Settings to add your DeepSeek or Gemini key.');
}

