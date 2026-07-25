import { NextResponse } from 'next/server';
import { buildQuestSystemPrompt, buildQuestUserPrompt } from '@/lib/prompts';

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { character, logs, adventureTitle, location, existingQuests } = payload;

        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'DeepSeek API key is missing. Please set DEEPSEEK_API_KEY in .env.local (server-side only, no NEXT_PUBLIC_ prefix).' },
                { status: 400 }
            );
        }

        const systemPrompt = buildQuestSystemPrompt({ character, adventureTitle, location, existingQuests });
        const userPrompt = buildQuestUserPrompt({ logs });

        const response = await fetch('https://api.deepseek.com/chat/completions', {
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

        if (!response.ok) {
            const errText = await response.text();
            console.error('DeepSeek API raw error:', errText);
            throw new Error(`DeepSeek API responded with status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '{}';

        let parsed;
        try {
            const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
            parsed = JSON.parse(cleaned);
        } catch (e) {
            const match = content.match(/\{[\s\S]*\}/);
            if (match) {
                parsed = JSON.parse(match[0]);
            } else {
                throw new Error('Failed to parse DeepSeek JSON response.');
            }
        }

        return NextResponse.json({ quests: parsed.quests || [] });
    } catch (error: any) {
        console.error('DeepSeek Quest Route Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process quest generation with DeepSeek.' },
            { status: 500 }
        );
    }
}
