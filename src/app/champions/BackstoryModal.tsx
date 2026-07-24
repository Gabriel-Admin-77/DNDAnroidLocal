import { useState } from 'react';
import { Sparkles, Loader2, BookOpen, RefreshCw, X } from 'lucide-react';
import { generateTextDirectly } from '@/lib/ai-client';
import { DndArchetype, Character } from '@/lib/types';

interface BackstoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    champion: DndArchetype | Character;
}

export default function BackstoryModal({ isOpen, onClose, champion }: BackstoryModalProps) {
    const [backstory, setBackstory] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        try {
            return localStorage.getItem(`dnd_app_backstory_${champion.name}`) || null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const generateBackstory = async () => {
        setLoading(true);
        try {
            const prompt = `Write an atmospheric, heroic 3-paragraph D&D backstory for a character named "${champion.name}", who is a Level ${'level' in champion ? champion.level : 1} ${champion.class}. Include details on their origin, a pivotal moment in their past, and their personal motivation for adventuring. Keep the tone immersive and dark fantasy.`;
            const result = await generateTextDirectly(prompt);
            setBackstory(result);
            try {
                localStorage.setItem(`dnd_app_backstory_${champion.name}`, result);
            } catch {
                // ignore
            }
        } catch (e) {
            console.error('Failed to generate backstory:', e);
            setBackstory('The mists of history shroud this hero\'s origin... (Failed to generate backstory, please check your API settings).');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-2xl p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-stone-500 hover:text-stone-300 rounded-full hover:bg-stone-800/50 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <BookOpen className="w-7 h-7 text-gold-400" />
                    <div>
                        <h2 className="text-2xl font-serif text-white">Heroic Lore</h2>
                        <p className="text-stone-400 text-xs uppercase tracking-wider">{champion.name} · {champion.class}</p>
                    </div>
                </div>

                <div className="min-h-[200px] max-h-[400px] overflow-y-auto pr-2 mb-6 text-stone-300 text-sm leading-relaxed space-y-4 font-serif border-t border-b border-stone-800/60 py-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-stone-500">
                            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
                            <p className="text-xs uppercase tracking-widest font-sans">Consulting the ancient scrolls...</p>
                        </div>
                    ) : backstory ? (
                        backstory.split('\n\n').map((paragraph, idx) => (
                            <p key={idx}>{paragraph}</p>
                        ))
                    ) : (
                        <div className="text-center py-12 text-stone-500 font-sans">
                            <p>No backstory recorded yet for this champion.</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-4">
                    <button
                        onClick={generateBackstory}
                        disabled={loading}
                        className="px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-gold-400 font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (backstory ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />)}
                        {backstory ? 'Regenerate Backstory' : 'Generate Backstory with AI'}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
