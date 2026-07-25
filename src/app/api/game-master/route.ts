import { NextResponse } from 'next/server';
import { buildDmSystemPrompt, buildDmUserPrompt } from '@/lib/prompts';

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { character, inventory, logs, userInput, location, time, weather } = payload;

        const systemPrompt = buildDmSystemPrompt({ character, inventory, location, time, weather });
        const userPrompt = buildDmUserPrompt({ logs, userInput });

        const deepseekKey = process.env.DEEPSEEK_API_KEY;
        if (!deepseekKey) {
            throw new Error('DEEPSEEK_API_KEY is not set in environment variables.');
        }

        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${deepseekKey.trim()}`
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
        if (!dsRes.ok) {
            const err = await dsRes.text();
            throw new Error(`DeepSeek API error ${dsRes.status}: ${err}`);
        }
        const dsData = await dsRes.json();
        const rawText = dsData.choices?.[0]?.message?.content || '{}';


        // Robustly parse the JSON response
        let jsonResponse;
        try {
            const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            jsonResponse = JSON.parse(cleanedText);
        } catch (e) {
            console.warn('Direct JSON parse failed, attempting regex extraction:', e);
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    jsonResponse = JSON.parse(jsonMatch[0]);
                } catch (innerErr) {
                    console.error('Failed parsing extracted JSON:', innerErr);
                    throw new Error('Failed to parse extracted JSON block.');
                }
            } else {
                throw new Error('No JSON object found in AI response.');
            }
        }

        return NextResponse.json(jsonResponse);
    } catch (error: any) {
        console.error('AI GM Route Error:', error);
        return NextResponse.json({
            text: "The whispers in the fog grow incomprehensible... (AI DM failed to process your request. Check your API key configuration in .env.local)",
            choices: [
                { text: "Try again", next: "start" }
            ]
        }, { status: 500 });
    }
}
