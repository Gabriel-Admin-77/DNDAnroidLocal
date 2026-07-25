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

// The fallback key is embedded here for the Android APK (static export — no server available).
// A user-entered key in Settings will always take priority over this default.
const DEEPSEEK_DEFAULT_KEY = 'sk-04de390e8bf1468caa1f9573b0b0dbe3';

export function getDeepSeekApiKey(): string {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('dnd_app_deepseek_key');
        if (stored?.trim()) return stored.trim();
    }
    return DEEPSEEK_DEFAULT_KEY;
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
            model: 'deepseek-v4-flash',
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

/**
 * Direct client-side call to the AI DM using DeepSeek.
 */
export async function callAiDmDirectly(payload: DmPayload) {
    const deepseekKey = getDeepSeekApiKey();
    if (deepseekKey) return callDeepSeekDm(payload);
    throw new Error('No AI API key configured. Open Settings to add your DeepSeek key.');
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
            model: 'deepseek-v4-flash',
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
 * Simple text generation helper using available client key or fallback server API.
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
                model: 'deepseek-v4-flash',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.8
            })
        });
        if (res.ok) {
            const data = await res.json();
            return data.choices?.[0]?.message?.content || '';
        }
    }
    throw new Error('No AI API key configured. Open Settings to add your DeepSeek key.');
}

