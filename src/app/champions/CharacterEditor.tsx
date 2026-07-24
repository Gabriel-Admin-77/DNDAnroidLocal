'use client';
import { useState } from 'react';
import { Shield, Sparkles, Check, X, RotateCcw } from 'lucide-react';
import { Character } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface CharacterEditorProps {
    isOpen: boolean;
    onClose: () => void;
    champion: Character;
    onSaveSuccess: (updated: Character) => void;
}

const POINT_BUY_BUDGET = 27;

const BASE_COSTS: Record<number, number> = {
    8: 0,
    9: 1,
    10: 2,
    11: 3,
    12: 4,
    13: 5,
    14: 7,
    15: 9
};

const SUBCLASSES_BY_CLASS: Record<string, string[]> = {
    Fighter: ['Champion', 'Battle Master', 'Eldritch Knight'],
    Rogue: ['Thief', 'Assassin', 'Arcane Trickster'],
    Cleric: ['Life Domain', 'War Domain', 'Light Domain'],
    Wizard: ['School of Evocation', 'School of Abjuration', 'School of Necromancy'],
    Ranger: ['Hunter', 'Beast Master', 'Gloom Stalker'],
    Paladin: ['Oath of Devotion', 'Oath of Vengeance', 'Oath of Ancients'],
    Barbarian: ['Path of the Berserker', 'Path of the Totem Warrior'],
    Bard: ['College of Lore', 'College of Valor'],
    Druid: ['Circle of the Land', 'Circle of the Moon'],
    Monk: ['Way of the Open Hand', 'Way of Shadow'],
    Sorcerer: ['Draconic Bloodline', 'Wild Magic'],
    Warlock: ['The Fiend', 'The Great Old One']
};

export default function CharacterEditor({ isOpen, onClose, champion, onSaveSuccess }: CharacterEditorProps) {
    const [name, setName] = useState(champion.name);
    const [subclass, setSubclass] = useState<string>(() => {
        try {
            return localStorage.getItem(`dnd_app_subclass_${champion.id}`) || SUBCLASSES_BY_CLASS[champion.class || 'Fighter']?.[0] || 'Standard';
        } catch {
            return 'Standard';
        }
    });

    const [stats, setStats] = useState({
        strength: champion.strength || 10,
        dexterity: champion.dexterity || 10,
        constitution: champion.constitution || 10,
        intelligence: champion.intelligence || 10,
        wisdom: champion.wisdom || 10,
        charisma: champion.charisma || 10
    });

    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const availableSubclasses = SUBCLASSES_BY_CLASS[champion.class || 'Fighter'] || ['Standard Archetype'];

    const calculatePointsSpent = (currentStats: typeof stats) => {
        return Object.values(currentStats).reduce((sum, val) => {
            const cost = BASE_COSTS[Math.min(15, Math.max(8, val))] ?? 0;
            return sum + cost;
        }, 0);
    };

    const pointsSpent = calculatePointsSpent(stats);
    const pointsRemaining = POINT_BUY_BUDGET - pointsSpent;

    const handleStatChange = (stat: keyof typeof stats, delta: number) => {
        const currentVal = stats[stat];
        const nextVal = currentVal + delta;
        if (nextVal < 8 || nextVal > 15) return;

        const nextStats = { ...stats, [stat]: nextVal };
        const nextSpent = calculatePointsSpent(nextStats);
        if (nextSpent > POINT_BUY_BUDGET) return;

        setStats(nextStats);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const supabase = createClient();
            const updates = {
                name,
                ...stats
            };
            const { error } = await supabase.from('characters').update(updates).eq('id', champion.id);
            if (!error) {
                try {
                    localStorage.setItem(`dnd_app_subclass_${champion.id}`, subclass);
                } catch {
                    // ignore
                }
                onSaveSuccess({ ...champion, ...updates });
                onClose();
            }
        } catch (e) {
            console.error('Failed to save character edits:', e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-xl p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-stone-500 hover:text-stone-300 rounded-full hover:bg-stone-800/50 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-7 h-7 text-gold-400" />
                    <div>
                        <h2 className="text-2xl font-serif text-white">Customization & Point-Buy</h2>
                        <p className="text-stone-400 text-xs uppercase tracking-wider">{champion.class} Hero</p>
                    </div>
                </div>

                <div className="space-y-5 mb-8">
                    {/* Character Name */}
                    <div>
                        <label className="block text-xs uppercase font-bold text-stone-400 mb-1">Champion Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-200 text-sm focus:outline-none focus:border-gold-500/50"
                        />
                    </div>

                    {/* Subclass Selection */}
                    <div>
                        <label className="block text-xs uppercase font-bold text-stone-400 mb-1">Subclass / Archetype Path</label>
                        <select
                            value={subclass}
                            onChange={(e) => setSubclass(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-200 text-sm focus:outline-none focus:border-gold-500/50"
                        >
                            {availableSubclasses.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                    </div>

                    {/* Point Buy Stats */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-xs uppercase font-bold text-stone-400">Ability Score Allocation (27 PT Budget)</label>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${pointsRemaining >= 0 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                {pointsRemaining} Points Remaining
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map(stat => {
                                const val = stats[stat];
                                const mod = Math.floor((val - 10) / 2);
                                return (
                                    <div key={stat} className="flex items-center justify-between p-3 bg-stone-950 rounded-xl border border-stone-800">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-stone-500">{stat.slice(0, 3)}</p>
                                            <p className="text-sm font-serif text-stone-200 font-bold">{val} <span className="text-xs font-sans text-stone-500">({mod >= 0 ? `+${mod}` : mod})</span></p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleStatChange(stat, -1)}
                                                disabled={val <= 8}
                                                className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-200 flex items-center justify-center font-bold text-sm"
                                            >
                                                -
                                            </button>
                                            <button
                                                onClick={() => handleStatChange(stat, 1)}
                                                disabled={val >= 15 || pointsRemaining <= 0}
                                                className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-200 flex items-center justify-center font-bold text-sm"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 bg-gold-500 hover:bg-gold-400 text-stone-950 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" /> Save Customization
                    </button>
                </div>
            </div>
        </div>
    );
}
