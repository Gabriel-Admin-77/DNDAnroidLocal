'use client';

import { useEffect, useState } from 'react';
import { X, Trophy } from 'lucide-react';
import { ACHIEVEMENTS, getUnlocked, Achievement } from '@/lib/achievements';

interface AchievementsModalProps {
    isOpen: boolean;
    onClose: () => void;
    characterId: string;
}

export default function AchievementsModal({ isOpen, onClose, characterId }: AchievementsModalProps) {
    const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setUnlockedIds(getUnlocked(characterId));
        }
    }, [isOpen, characterId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
                    <h2 className="text-lg font-serif font-bold text-gold-400 flex items-center gap-2">
                        <Trophy className="w-5 h-5" /> Achievements
                    </h2>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-100 p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="text-xs text-stone-500 mb-3 text-center">
                    {unlockedIds.length} of {ACHIEVEMENTS.length} unlocked
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                    {ACHIEVEMENTS.map((a) => {
                        const isUnlocked = unlockedIds.includes(a.id);
                        return <AchievementRow key={a.id} achievement={a} isUnlocked={isUnlocked} />;
                    })}
                </div>
            </div>
        </div>
    );
}

function AchievementRow({ achievement, isUnlocked }: { achievement: Achievement; isUnlocked: boolean }) {
    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isUnlocked
                    ? 'bg-gold-950/30 border-gold-700/50'
                    : 'bg-stone-950 border-stone-800 opacity-60'
            }`}
        >
            <div className={`shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                isUnlocked ? 'bg-gold-900/50' : 'bg-stone-900 grayscale'
            }`}>
                {achievement.icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${isUnlocked ? 'text-gold-300' : 'text-stone-400'}`}>
                    {achievement.title}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">{achievement.description}</p>
            </div>
            {isUnlocked && (
                <Trophy className="w-4 h-4 text-gold-400 shrink-0" />
            )}
        </div>
    );
}
