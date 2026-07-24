'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trophy, Skull, BookOpen, RotateCcw, Home, Sparkles } from 'lucide-react';

interface EndingOverlayProps {
    type: 'victory' | 'defeat' | 'neutral';
    characterName: string;
    xpAwarded?: number;
    onReplayLastScene?: () => void;
    onClose?: () => void;
}

/**
 * End-of-adventure screen. Shown after the AI DM (or a static scene)
 * marks a campaign as concluded. Routes the player forward into the
 * next thing — replay from a save, retry, or pick a new adventure.
 */
export default function EndingOverlay({
    type,
    characterName,
    xpAwarded,
    onReplayLastScene,
    onClose
}: EndingOverlayProps) {
    const [replaying, setReplaying] = useState(false);

    const config = {
        victory: {
            icon: Trophy,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/40',
            ring: 'shadow-[0_0_60px_rgba(245,158,11,0.25)]',
            title: 'Victory!',
            subtitle: `${characterName} has triumphed.`
        },
        defeat: {
            icon: Skull,
            color: 'text-red-400',
            bg: 'bg-red-500/10',
            border: 'border-red-500/40',
            ring: 'shadow-[0_0_60px_rgba(220,38,38,0.25)]',
            title: 'Defeat',
            subtitle: `${characterName} has fallen. The tale ends here — for now.`
        },
        neutral: {
            icon: BookOpen,
            color: 'text-stone-300',
            bg: 'bg-stone-700/20',
            border: 'border-stone-500/40',
            ring: 'shadow-[0_0_60px_rgba(120,113,108,0.25)]',
            title: 'The End',
            subtitle: `${characterName} returns home, story complete.`
        }
    }[type];

    const Icon = config.icon;

    const handleReplay = async () => {
        if (!onReplayLastScene) return;
        setReplaying(true);
        try {
            await onReplayLastScene();
        } finally {
            setReplaying(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md">
            <div className={`bg-stone-900 border ${config.border} rounded-3xl w-full max-w-md p-6 shadow-2xl ${config.ring} relative`}>
                <div className={`mx-auto mb-5 w-20 h-20 rounded-full ${config.bg} ${config.border} border-2 flex items-center justify-center`}>
                    <Icon className={`w-10 h-10 ${config.color}`} />
                </div>

                <h2 className={`text-4xl font-serif text-center ${config.color} mb-2 tracking-wide`}>
                    {config.title}
                </h2>
                <p className="text-stone-400 text-center text-sm mb-6 italic">
                    {config.subtitle}
                </p>

                {type === 'victory' && xpAwarded !== undefined && xpAwarded > 0 && (
                    <div className="mb-5 px-4 py-3 bg-purple-950/40 border border-purple-800/40 rounded-xl flex items-center justify-center gap-2 text-purple-200">
                        <Sparkles className="w-4 h-4 text-purple-300" />
                        <span className="text-sm font-bold">+{xpAwarded} XP earned</span>
                    </div>
                )}

                <div className="space-y-2">
                    {onReplayLastScene && (
                        <button
                            onClick={handleReplay}
                            disabled={replaying}
                            className="w-full inline-flex items-center justify-center gap-2 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 text-stone-950 px-4 py-3 rounded-xl font-bold text-sm transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                            {replaying ? 'Rewinding…' : 'Rewind to Last Save Point'}
                        </button>
                    )}
                    <Link
                        href={`/champions`}
                        className="w-full inline-flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 px-4 py-3 rounded-xl font-medium text-sm transition-colors"
                    >
                        <Home className="w-4 h-4" /> Back to Champions
                    </Link>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-full text-stone-500 hover:text-stone-300 text-xs py-2 transition-colors"
                        >
                            Review the journey
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

