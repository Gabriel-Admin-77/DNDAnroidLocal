'use client';
import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Character, InventoryItem, Environment, StoryLogEntry, Choice, DiceCheck, StoryEngineRef } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { callAiDmDirectly } from '@/lib/ai-client';
import { getModifier } from '@/lib/rpg-rules';
import { speak as ttsSpeak, getTtsSettings } from '@/lib/tts';
import { getNpcContext, mergeNpcs } from '@/lib/npc-memory';



export interface SceneEffects {
    hp?: number;
    gold?: number;
    addItem?: string;
    removeItem?: string;
}

export interface Scene {
    text: string;
    choices: Choice[];
    effects?: SceneEffects;
    isEnding?: boolean;
    endingType?: 'victory' | 'defeat' | 'neutral';
}

export interface Adventure {
    title: string;
    scenes: Record<string, Scene>;
}

interface StoryEngineProps {
    campaignId?: string;
    adventureFile: string;
    character: Character;
    inventory: InventoryItem[];
    env: Environment;
    characterStats: {
        strength: number;
        dexterity: number;
        constitution: number;
        intelligence: number;
        wisdom: number;
        charisma: number;
    };
    onDiceRoll: (roll: number, dc: number, reason: string, success: boolean) => void;
    onEffects: (effects: SceneEffects) => void;
    onEnding?: (type: 'victory' | 'defeat' | 'neutral') => void;
    onLogUpdate?: (log: StoryLogEntry[]) => void;
    onEnvUpdate?: (newEnv: Environment) => void;
}

const StoryEngine = forwardRef<StoryEngineRef, StoryEngineProps>(({
    campaignId, adventureFile, character, inventory, env, characterStats,
    onDiceRoll, onEffects, onEnding, onLogUpdate, onEnvUpdate
}, ref) => {
    const [adventure, setAdventure] = useState<Adventure | null>(null);
    const [currentSceneId, setCurrentSceneId] = useState('start');
    const [storyLog, setStoryLog] = useState<StoryLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // AI DM State
    const [customAction, setCustomAction] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiChoices, setAiChoices] = useState<Choice[] | null>(null);
    const [activeDiceCheck, setActiveDiceCheck] = useState<{ stat: string; dc: number } | null>(null);

    const [pendingDiceCheck, setPendingDiceCheck] = useState<{ choice: Choice; rolling: boolean } | null>(null);
    const logEndRef = useRef<HTMLDivElement>(null);

    // Mirror of the story log that the imperative ref can read at any time.
    const storyLogRef = useRef<StoryLogEntry[]>([]);
    useEffect(() => {
        storyLogRef.current = storyLog;
    }, [storyLog]);

    // Serial queue: prevents two concurrent triggerAction calls from
    // clobbering each other (e.g. player mashing Short Rest + Cast Spell).
    const aiCallChain = useRef<Promise<void>>(Promise.resolve());

    const enqueueAiCall = (action: string, rollResult?: { roll: number; dc: number; stat: string; success: boolean }) => {
        const next = aiCallChain.current.then(() => callAiDm(action, rollResult));
        // Swallow errors at the chain level so one failure doesn't poison
        // the queue forever; callAiDm already surfaces the error in state.
        aiCallChain.current = next.catch(() => undefined);
        return next;
    };

    useImperativeHandle(ref, () => ({
        triggerAction: (actionText: string, rollResult?: { roll: number; dc: number; stat: string; success: boolean }) => {
            return enqueueAiCall(actionText, rollResult);
        },
        getStoryLog: () => storyLogRef.current,
        insertLocalLog: async (entry: StoryLogEntry) => {
            setStoryLog(prev => [...prev, entry]);
            setCurrentSceneId(entry.sceneId);
            if (campaignId) {
                const supabase = createClient();
                await supabase.from('chat_logs').insert([{
                    campaign_id: campaignId,
                    role: 'story_entry',
                    content: JSON.stringify(entry)
                }]);
            }
        },
        goBack: async () => {
            // Pop the last log entry and resume from the previous scene.
            // Used by the defeat/neutral ending screen so the player can
            // try a different choice without restarting the whole adventure.
            if (storyLog.length === 0) return;
            const lastEntry = storyLog[storyLog.length - 1];
            const previousEntry = storyLog[storyLog.length - 2];

            setStoryLog(prev => prev.slice(0, -1));
            if (previousEntry) {
                setCurrentSceneId(previousEntry.sceneId);
            } else {
                setCurrentSceneId('start');
            }

            // Reset active dice check / ai choices that belonged to the
            // popped scene so the player sees the previous choice list.
            setActiveDiceCheck(null);
            setAiChoices(null);

            // Persist: delete the last chat_log row so reloading the
            // campaign also lands on the previous scene.
            if (campaignId) {
                const supabase = createClient();
                // Find the row whose content matches the popped entry.
                const { data: rows } = await supabase
                    .from('chat_logs')
                    .select('id, content')
                    .eq('campaign_id', campaignId);
                if (rows) {
                    const match = (rows as { id: string; content: string }[]).find(r => {
                        try {
                            const parsed = JSON.parse(r.content);
                            return parsed?.sceneId === lastEntry.sceneId;
                        } catch {
                            return false;
                        }
                    });
                    if (match) {
                        await supabase.from('chat_logs').delete().eq('id', match.id);
                    }
                }
            }
        }
    }));
    const onEffectsRef = useRef(onEffects);
    const onEndingRef = useRef(onEnding);
    const onLogUpdateRef = useRef(onLogUpdate);

    useEffect(() => {
        onEffectsRef.current = onEffects;
    }, [onEffects]);

    useEffect(() => {
        onEndingRef.current = onEnding;
    }, [onEnding]);

    useEffect(() => {
        onLogUpdateRef.current = onLogUpdate;
    }, [onLogUpdate]);

    useEffect(() => {
        setLoading(true);
        setError(null);
        setAiChoices(null);
        setActiveDiceCheck(null);

        async function initStory() {
            try {
                const res = await fetch(`/modules/${adventureFile}`);
                if (!res.ok) throw new Error('Adventure not found');
                const data: Adventure = await res.json();
                setAdventure(data);

                if (campaignId) {
                    const supabase = createClient();
                    const { data: dbLogs, error: dbErr } = await supabase
                        .from('chat_logs')
                        .select('*')
                        .eq('campaign_id', campaignId);
                    
                    if (!dbErr && dbLogs && dbLogs.length > 0) {
                        const sortedLogs = [...dbLogs].sort(
                            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                        );
                        const parsedLogs: StoryLogEntry[] = sortedLogs.map(row => JSON.parse(row.content));
                        setStoryLog(parsedLogs);
                        
                        const lastLog = parsedLogs[parsedLogs.length - 1];
                        setCurrentSceneId(lastLog.sceneId);

                        if (lastLog.activeDiceCheck) {
                            setActiveDiceCheck(lastLog.activeDiceCheck);
                            setAiChoices(null);
                        } else if (lastLog.aiChoices) {
                            setAiChoices(lastLog.aiChoices);
                            setActiveDiceCheck(null);
                        } else {
                            setAiChoices(null);
                            setActiveDiceCheck(null);
                        }
                        setLoading(false);
                        return;
                    }
                }

                // If no logs exist, initialize start
                const startScene = data.scenes['start'];
                if (!startScene) throw new Error('Start scene not found in adventure');

                const firstEntry: StoryLogEntry = {
                    sceneId: 'start',
                    text: startScene.text
                };

                if (campaignId) {
                    const supabase = createClient();
                    await supabase.from('chat_logs').insert([{
                        campaign_id: campaignId,
                        role: 'story_entry',
                        content: JSON.stringify(firstEntry)
                    }]);
                }

                setStoryLog([firstEntry]);
                setCurrentSceneId('start');
                if (startScene.effects) {
                    onEffectsRef.current(startScene.effects);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        initStory();
    }, [adventureFile, campaignId]);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [storyLog, currentSceneId, aiLoading]);

    // Auto-narrate the most recent scene text when TTS is enabled and
    // auto-narrate is on. Skips the very first render (initial load) and
    // skips dice roll results / error entries to avoid garbled output.
    const firstRenderRef = useRef(true);
    useEffect(() => {
        if (firstRenderRef.current) {
            firstRenderRef.current = false;
            return;
        }
        const current = storyLogRef.current;
        if (current.length === 0) return;
        const last = current[current.length - 1];
        if (!last?.text) return;
        const settings = getTtsSettings();
        if (settings.enabled && settings.autoNarrate) {
            ttsSpeak(last.text);
        }
        // Intentionally only depend on the length: we only want to fire
        // TTS when a new entry is appended, not when the array mutates
        // for other reasons (e.g. chat_logs sync).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storyLog.length]);

    useEffect(() => {
        if (onLogUpdateRef.current) onLogUpdateRef.current(storyLog);
    }, [storyLog]);

    const advanceTurn = () => {
        if (!onEnvUpdate || !env) return;

        const nextTurn = env.turn + 1;

        const timeCycle = ['Dawn', 'Morning', 'Noon', 'Afternoon', 'Dusk', 'Night', 'Midnight'];
        const timeIndex = Math.floor(nextTurn / 3) % timeCycle.length;
        const nextTime = timeCycle[timeIndex];

        const weathers = ['Clear', 'Overcast', 'Rainy', 'Foggy', 'Stormy', 'Windy'];
        let nextWeather = env.weather;
        if (Math.random() < 0.25) {
            const filtered = weathers.filter(w => w !== env.weather);
            nextWeather = filtered[Math.floor(Math.random() * filtered.length)];
        }

        onEnvUpdate({
            ...env,
            turn: nextTurn,
            time: nextTime,
            weather: nextWeather
        });
    };

    const callAiDm = async (action: string, rollResult?: { roll: number; dc: number; stat: string; success: boolean }): Promise<void> => {
        setAiLoading(true);
        try {
            let data: { text?: string; choices?: Choice[]; diceCheck?: { stat: string; dc: number; successScene?: string; failScene?: string }; effects?: SceneEffects; npcs?: unknown[] } | null = null;
            const npcMemory = campaignId ? getNpcContext(campaignId, 5) : [];
            const payload = {
                character,
                inventory,
                logs: storyLog,
                userInput: action,
                location: env.location,
                time: env.time,
                weather: env.weather,
                npcMemory
            };

            try {
                const res = await fetch('/api/game-master', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const text = await res.text();
                if (res.ok && !text.trim().startsWith('<')) {
                    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
                    data = JSON.parse(cleaned);
                }
            } catch (err) {
                console.warn('Server API route call failed or served static HTML. Falling back to direct client API call:', err);
            }

            if (!data) {
                data = await callAiDmDirectly(payload);
            }

            if (!data) {
                throw new Error('No response from AI DM (server and direct both failed)');
            }

            // Apply any effects returned by the AI DM

            if (data.effects) {
                onEffectsRef.current(data.effects);
            }

            // Merge any NPCs the AI introduced in this scene into the
            // campaign's persistent memory so future prompts remember them.
            if (data.npcs && Array.isArray(data.npcs) && campaignId) {
                try {
                    mergeNpcs(campaignId, data.npcs.map((n) => {
                        const npc = n as { name?: string; role?: string; disposition?: string; notes?: string };
                        const allowedDispositions: ('friendly' | 'neutral' | 'hostile' | 'unknown')[] = ['friendly', 'neutral', 'hostile', 'unknown'];
                        const rawDisp = (npc.disposition || 'unknown').toLowerCase();
                        const disposition = (allowedDispositions.includes(rawDisp as 'friendly' | 'neutral' | 'hostile' | 'unknown')
                            ? rawDisp
                            : 'unknown') as 'friendly' | 'neutral' | 'hostile' | 'unknown';
                        return {
                            name: npc.name || 'Unknown',
                            role: npc.role,
                            disposition,
                            notes: npc.notes,
                            last_seen_turn: env.turn
                        };
                    }));
                } catch (e) {
                    console.warn('[NPC] merge failed:', e);
                }
            }

            // Append response to history
            const nextSceneId = `ai_${Date.now()}`;
            const newEntry: StoryLogEntry = {
                sceneId: nextSceneId,
                text: data.text || '(The DM paused silently.)',
                choiceMade: action,
                aiChoices: data.choices,
                activeDiceCheck: data.diceCheck,
                rollResult: rollResult
            };

            setStoryLog(prev => [...prev, newEntry]);
            setCurrentSceneId(nextSceneId);

            if (campaignId) {
                const supabase = createClient();
                await supabase.from('chat_logs').insert([{
                    campaign_id: campaignId,
                    role: 'story_entry',
                    content: JSON.stringify(newEntry)
                }]);
            }

            // Advance environment turn
            advanceTurn();

            // Handle AI recommendations or dice checks
            if (data.diceCheck) {
                setActiveDiceCheck(data.diceCheck);
                setAiChoices(null);
            } else if (data.choices) {
                setAiChoices(data.choices);
                setActiveDiceCheck(null);
            } else {
                setAiChoices([
                    { text: "Continue onward", next: "ai_choice" },
                    { text: "Look around carefully", next: "ai_choice" }
                ]);
                setActiveDiceCheck(null);
            }
        } catch (err: any) {
            console.error(err);
            setStoryLog(prev => [
                ...prev,
                {
                    sceneId: 'error',
                    text: `The DM seems momentarily distracted. (Error: ${err.message || err}). Please check that the Gemini API key is configured correctly on the server.`,
                    choiceMade: action
                }
            ]);
        } finally {
            setAiLoading(false);
        }
    };

    const handleChoice = (choice: Choice) => {
        setAiChoices(null);
        setActiveDiceCheck(null);
        if (choice.next === 'ai_choice') {
            void enqueueAiCall(choice.text);
            return;
        }

        if (!adventure) return;

        if (choice.diceCheck) {
            setPendingDiceCheck({ choice, rolling: true });
            const stat = choice.diceCheck.stat as keyof typeof characterStats;
            const modifier = getModifier(characterStats[stat] || 10);
            const roll = Math.floor(Math.random() * 20) + 1;
            const total = roll + modifier;
            const success = total >= choice.diceCheck.dc;

            onDiceRoll(roll, choice.diceCheck.dc, `${choice.diceCheck.stat.charAt(0).toUpperCase() + choice.diceCheck.stat.slice(1)} Check`, success);

            setTimeout(async () => {
                try {
                    const nextSceneId = success ? choice.diceCheck!.successScene : choice.diceCheck!.failScene;
                    const nextScene = adventure.scenes[nextSceneId];
                    if (!nextScene) {
                        setError(`Scene "${nextSceneId}" not found in adventure.`);
                        return;
                    }

                    const newEntry: StoryLogEntry = {
                        sceneId: nextSceneId,
                        text: nextScene.text,
                        choiceMade: choice.text,
                        rollResult: { roll, dc: choice.diceCheck!.dc, stat: choice.diceCheck!.stat, success }
                    };

                    setStoryLog(prev => [...prev, newEntry]);
                    setCurrentSceneId(nextSceneId);

                    if (campaignId) {
                        const supabase = createClient();
                        await supabase.from('chat_logs').insert([{
                            campaign_id: campaignId,
                            role: 'story_entry',
                            content: JSON.stringify(newEntry)
                        }]);
                    }

                    advanceTurn();

                    if (nextScene.effects) onEffectsRef.current(nextScene.effects);
                    if (nextScene.isEnding && onEndingRef.current) onEndingRef.current(nextScene.endingType || 'neutral');
                } catch (err: unknown) {
                    console.error('Error handling dice check scene transition:', err);
                } finally {
                    setPendingDiceCheck(null);
                }
            }, 3000);
        } else {
            const nextScene = adventure.scenes[choice.next];
            if (!nextScene) {
                setError(`Scene "${choice.next}" not found in adventure.`);
                return;
            }

            const newEntry: StoryLogEntry = {
                sceneId: choice.next,
                text: nextScene.text,
                choiceMade: choice.text
            };

            setStoryLog(prev => [...prev, newEntry]);
            setCurrentSceneId(choice.next);

            async function saveAndAdvance() {
                if (campaignId) {
                    const supabase = createClient();
                    await supabase.from('chat_logs').insert([{
                        campaign_id: campaignId,
                        role: 'story_entry',
                        content: JSON.stringify(newEntry)
                    }]);
                }
                advanceTurn();
            }
            saveAndAdvance();

            if (nextScene.effects) onEffectsRef.current(nextScene.effects);
            if (nextScene.isEnding && onEndingRef.current) onEndingRef.current(nextScene.endingType || 'neutral');
        }
    };

    const handleAiDiceCheck = () => {
        if (!activeDiceCheck) return;
        const stat = activeDiceCheck.stat as keyof typeof characterStats;
        const modifier = getModifier(characterStats[stat] || 10);
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + modifier;
        const success = total >= activeDiceCheck.dc;

        // Perform dice animation
        onDiceRoll(roll, activeDiceCheck.dc, `${activeDiceCheck.stat.charAt(0).toUpperCase() + activeDiceCheck.stat.slice(1)} Check`, success);

        // Clear active check and notify AI DM of the roll outcome
        setTimeout(() => {
            const resultMsg = `I rolled a ${activeDiceCheck.stat.toUpperCase()} check. Die roll: ${roll} + Mod: ${modifier} = Total: ${total} vs DC ${activeDiceCheck.dc}. ${success ? 'I succeeded!' : 'I failed!'}`;
            setActiveDiceCheck(null);
            void enqueueAiCall(resultMsg, { roll, dc: activeDiceCheck.dc, stat: activeDiceCheck.stat, success });
        }, 3000);
    };

    const handleCustomActionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customAction.trim() || aiLoading) return;
        const action = customAction.trim();
        setCustomAction('');
        void enqueueAiCall(action);
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-stone-400 text-sm">Loading adventure...</p>
                </div>
            </div>
        );
    }

    if (error || !adventure) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-red-400">
                    <p className="text-lg font-medium mb-2">Adventure Failed to Load</p>
                    <p className="text-sm text-stone-500">{error || 'Unknown error'}</p>
                </div>
            </div>
        );
    }

    const currentScene = adventure.scenes[currentSceneId];
    const isEnding = Boolean(currentScene?.isEnding && (!aiChoices || aiChoices.length === 0));
    const displayChoices = (aiChoices && aiChoices.length > 0)
        ? aiChoices
        : (currentScene?.choices && currentScene.choices.length > 0)
            ? currentScene.choices
            : (!isEnding ? [{ text: "Continue adventure", next: "ai_choice" }] : []);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin">
                {storyLog.map((entry, i) => (
                    <div key={i} className="space-y-2 animate-fadeIn">
                        {entry.choiceMade && (
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-px flex-1 bg-stone-800" />
                                <span className="text-xs text-amber-500/70 uppercase tracking-wider font-medium px-3 py-1 bg-amber-500/5 rounded-full border border-amber-500/10">
                                    ▸ {entry.choiceMade}
                                </span>
                                <div className="h-px flex-1 bg-stone-800" />
                            </div>
                        )}

                        {entry.rollResult && (
                            <div className={`text-center text-sm font-medium py-2 px-4 rounded-lg mb-2 ${entry.rollResult.success
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                🎲 {entry.rollResult.stat.charAt(0).toUpperCase() + entry.rollResult.stat.slice(1)} Check — Rolled {entry.rollResult.roll} vs DC {entry.rollResult.dc} — {entry.rollResult.success ? '✓ Success!' : '✗ Failed!'}
                            </div>
                        )}

                        <div className="bg-stone-900/60 border border-stone-800/60 rounded-xl p-5">
                            <p className="text-stone-200 leading-relaxed whitespace-pre-line text-[15px]">{entry.text}</p>
                        </div>
                    </div>
                ))}
                
                {aiLoading && (
                    <div className="space-y-2 animate-pulse">
                        <div className="bg-stone-900/40 border border-stone-800/30 rounded-xl p-5 text-stone-400 italic text-sm flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
                            Algorithmic Dungeon Master is preparing the next scene...
                        </div>
                    </div>
                )}
                <div ref={logEndRef} />
            </div>

            {/* Dice Check Box for AI GM */}
            {activeDiceCheck && !aiLoading && (
                <div className="border-t border-stone-800 bg-stone-900/80 backdrop-blur-md px-4 py-4 text-center">
                    <p className="text-xs text-stone-400 uppercase tracking-wider mb-2 font-medium">Dice Check Required!</p>
                    <button
                        onClick={handleAiDiceCheck}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg border border-purple-500/30 transition-all flex items-center justify-center gap-2 mx-auto"
                    >
                        🎲 Roll {activeDiceCheck.stat.toUpperCase()} (DC {activeDiceCheck.dc})
                    </button>
                </div>
            )}

            {/* Standard Choice Grid */}
            {!isEnding && !activeDiceCheck && (
                <div className="border-t border-stone-800 bg-stone-900/80 backdrop-blur-md px-4 py-4 space-y-4">
                    {displayChoices.length > 0 && (
                        <div>
                            <p className="text-xs text-stone-500 uppercase tracking-wider mb-2 font-medium">Recommended Choices</p>
                            <div className="grid gap-2">
                                {displayChoices.map((choice, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleChoice(choice)}
                                        disabled={!!pendingDiceCheck || aiLoading}
                                        className="group text-left px-4 py-3 rounded-lg border border-stone-700/60 bg-stone-800/40 hover:bg-stone-700/60 hover:border-amber-500/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="shrink-0 w-6 h-6 rounded-full bg-stone-700/80 group-hover:bg-amber-500/20 flex items-center justify-center text-xs font-bold text-stone-400 group-hover:text-amber-400 transition-colors">
                                                {i + 1}
                                            </span>
                                            <span className="text-sm text-stone-300 group-hover:text-stone-100 transition-colors">
                                                {choice.text}
                                            </span>
                                            {choice.diceCheck && (
                                                <span className="shrink-0 ml-auto text-xs text-purple-400/80 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20">
                                                    🎲 {choice.diceCheck.stat.toUpperCase()} DC {choice.diceCheck.dc}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Custom Input for AI DM */}
                    <form onSubmit={handleCustomActionSubmit} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Type any action... (e.g. 'I inspect the bookcase' or 'I try to sneak past')"
                            value={customAction}
                            onChange={e => setCustomAction(e.target.value)}
                            disabled={aiLoading}
                            className="flex-1 px-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 placeholder-stone-600 text-sm focus:outline-none focus:border-gold-500/50 transition-colors disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!customAction.trim() || aiLoading}
                            className="px-5 py-3 bg-gold-600 hover:bg-gold-500 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 font-bold rounded-xl text-sm transition-colors uppercase tracking-wider shrink-0"
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}

            {isEnding && (
                <div className="border-t border-stone-800 bg-stone-900/80 backdrop-blur-md px-4 py-6 text-center">
                    <div className={`inline-block px-6 py-3 rounded-xl text-lg font-serif ${currentScene.endingType === 'victory'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : currentScene.endingType === 'defeat'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : 'bg-stone-700/30 text-stone-300 border border-stone-600/30'
                        }`}>
                        {currentScene.endingType === 'victory' ? '🏆 Victory!' : currentScene.endingType === 'defeat' ? '💀 Defeat' : '📖 The End'}
                    </div>
                    <p className="text-stone-500 text-sm mt-3">This adventure has concluded.</p>
                </div>
            )}
        </div>
    );
});

export default StoryEngine;
