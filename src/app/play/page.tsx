'use client';
import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Sun, CloudRain, MapPin, User, Shield,
    Backpack, ScrollText, Dice5, History, Loader2,
    Coins, Hammer, ShoppingCart, Menu, X, Sparkles, ListTodo,
    Save, FolderOpen, Trophy
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getChampionImage, calculateAC } from '@/lib/utils';
import { ADVENTURE_FILE_MAP, ADVENTURE_DEFINITIONS } from '@/lib/adventures';
import { Character, Campaign, InventoryItem, Environment, DiceRollState, StoryLogEntry, SceneEffects, CraftingRecipe, ClassAbility, StoryEngineRef, Quest } from '@/lib/types';
import { getLevelForXp, getHpGainOnLevelUp, rollHitDieForShortRest, getModifier } from '@/lib/rpg-rules';
import { CLASS_ABILITIES, CRAFTING_RECIPES } from '@/lib/game-data';
import { getAmbientEngine, moodForLocation } from '@/lib/ambient-bgm';
import { createSave, CampaignSave } from '@/lib/saves';
import { checkAchievements, getAchievementById } from '@/lib/achievements';
import { listNpcs } from '@/lib/npc-memory';
import DiceRollOverlay from './DiceRollOverlay';
import StoryEngine from './StoryEngine';
import QuestEditorModal from './QuestEditorModal';
import ApiKeySettingsModal from './ApiKeySettingsModal';
import EndingOverlay from './EndingOverlay';
import SaveLoadModal from './SaveLoadModal';
import AchievementsModal from './AchievementsModal';



function EnvironmentHeader({ env, onOpenMobileDrawer }: { env: Environment; onOpenMobileDrawer?: () => void }) {
    return (
        <header className="h-16 border-b border-stone-800 bg-stone-900/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 absolute top-0 left-0 right-0 z-10 w-full">
            <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-amber-500 font-serif">
                    <Sun className="w-4 h-4" /> <span>{env.time}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-400 font-serif">
                    <CloudRain className="w-4 h-4" /> <span className="hidden sm:inline">{env.weather}</span>
                </div>
                <div className="flex items-center gap-2 text-stone-300 font-serif">
                    <MapPin className="w-4 h-4 text-emerald-500" /> <span>{env.location}</span>
                </div>
            </div>
            <button onClick={onOpenMobileDrawer} className="lg:hidden p-2 text-stone-400 hover:text-stone-200">
                <User className="w-6 h-6" />
            </button>
        </header>
    );
}

interface LevelUpData {
    active: boolean;
    oldLevel: number;
    newLevel: number;
    pointsToAllocate: number;
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
}

function LevelUpOverlay({
    data,
    pointsRemaining,
    onChange,
    onConfirm
}: {
    data: LevelUpData;
    pointsRemaining: number;
    onChange: (stat: keyof LevelUpData, delta: number) => void;
    onConfirm: () => void;
}) {
    const stats: { key: keyof LevelUpData; label: string }[] = [
        { key: 'strength', label: 'Strength' },
        { key: 'dexterity', label: 'Dexterity' },
        { key: 'constitution', label: 'Constitution' },
        { key: 'intelligence', label: 'Intelligence' },
        { key: 'wisdom', label: 'Wisdom' },
        { key: 'charisma', label: 'Charisma' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <div className="text-center mb-6">
                    <Sparkles className="w-12 h-12 text-gold-500 mx-auto mb-2 animate-bounce" />
                    <h2 className="text-3xl font-serif text-white">LEVEL UP!</h2>
                    <p className="text-gold-400 font-bold uppercase tracking-wider text-sm mt-1">Reaching Level {data.newLevel}</p>
                    <p className="text-stone-400 text-xs mt-2">Allocate your new ability score points. Each point spent increases your score.</p>
                    <div className="mt-3 inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 font-bold text-sm">
                        Points Remaining: {pointsRemaining}
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    {stats.map(s => {
                        const score = data[s.key] as number;
                        const mod = Math.floor((score - 10) / 2);
                        return (
                            <div key={s.key} className="flex items-center justify-between bg-stone-950 p-3 rounded-xl border border-stone-800">
                                <div>
                                    <p className="text-stone-300 font-medium text-sm">{s.label}</p>
                                    <p className="text-stone-500 text-xs font-mono">Mod: {mod >= 0 ? `+${mod}` : mod}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => onChange(s.key, -1)}
                                        className="w-8 h-8 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 font-bold transition-colors disabled:opacity-40"
                                    >
                                        -
                                    </button>
                                    <span className="text-xl font-serif text-stone-100 font-bold w-8 text-center">{score}</span>
                                    <button
                                        onClick={() => onChange(s.key, 1)}
                                        disabled={pointsRemaining <= 0}
                                        className="w-8 h-8 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 font-bold transition-colors disabled:opacity-40"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={onConfirm}
                    disabled={pointsRemaining > 0}
                    className="w-full bg-gold-600 hover:bg-gold-500 disabled:opacity-50 text-stone-950 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                >
                    Confirm upgrades
                </button>
            </div>
        </div>
    );
}

interface CharacterSheetProps {
    char: Character;
    goldCount: number;
    ac: number;
    inventory?: InventoryItem[];
    spellSlots: number;
    classCharges: number;
    onUseAbility: (ability: ClassAbility) => void;
    onShortRest: () => void;
    onLongRest: () => void;
}

function CharacterSheet({
    char, goldCount, ac, inventory = [], spellSlots, classCharges, onUseAbility, onShortRest, onLongRest
}: CharacterSheetProps) {
    const modifier = getModifier;
    const equippedWeapon = inventory.find(i => i.item_type === 'weapon' && i.is_equipped);
    const equippedArmor = inventory.find(i => i.item_type === 'armor' && i.is_equipped);

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-8 lg:hidden">
                <h2 className="font-serif text-xl text-gold-500">Character Sheet</h2>
            </div>

            <div className="flex flex-col items-center text-center gap-2 border-b border-stone-800 pb-6 mb-6">
                <div className="w-20 h-20 rounded-full border-2 border-stone-700 overflow-hidden mb-2">
                    <img src={getChampionImage(char)} alt={char.name} className="w-full h-full object-cover" />
                </div>
                <h2 className="text-xl font-serif text-stone-100">{char.name}</h2>
                <p className="text-sm text-gold-400 w-full text-center">Level {char.level} {char.class}</p>
                <div className="flex items-center gap-1.5 mt-1">
                    <Coins className="w-3.5 h-3.5 text-gold-400" />
                    <span className="text-xs text-gold-400 font-bold">{goldCount} GP</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-stone-950 rounded-lg p-3 border border-stone-800 flex flex-col items-center gap-1 relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-1 bg-red-600 w-full" style={{ width: `${((char.hp_current || 0) / (char.hp_max || 1)) * 100}%` }} />
                    <span className="text-xs text-stone-400 font-bold tracking-widest uppercase">Health</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-serif text-stone-200">{char.hp_current}</span>
                        <span className="text-xs text-stone-500">/{char.hp_max}</span>
                    </div>
                </div>
                <div className="bg-stone-950 rounded-lg p-3 border border-stone-800 flex flex-col items-center gap-1">
                    <span className="text-xs text-stone-400 font-bold tracking-widest uppercase">Armor</span>
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-stone-500" />
                        <span className="text-2xl font-serif text-stone-200">{ac}</span>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-sm font-bold tracking-widest uppercase text-stone-500 mb-3">Core Attributes</h3>
                <div className="grid grid-cols-2 gap-2">
                    {([
                        { name: 'str', val: char.strength },
                        { name: 'dex', val: char.dexterity },
                        { name: 'con', val: char.constitution },
                        { name: 'int', val: char.intelligence },
                        { name: 'wis', val: char.wisdom },
                        { name: 'cha', val: char.charisma }
                    ] as const).map(({ name: stat, val }) => {
                        const mod = modifier(val || 10);
                        return (
                            <div key={stat} className="flex items-center justify-between bg-stone-950 p-2 rounded border border-stone-800/50 text-sm">
                                <span className="uppercase text-stone-400 text-xs tracking-wider">{stat}</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-stone-200">{val}</span>
                                    <span className="text-stone-500 text-xs w-5 text-right">{mod >= 0 ? `+${mod}` : mod}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="border-t border-stone-800/80 pt-4 mb-6">
                <h3 className="text-sm font-bold tracking-widest uppercase text-stone-500 mb-3">Equipped Gear</h3>
                <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between bg-stone-950 p-3 rounded-lg border border-stone-800/50 text-sm">
                        <span className="text-stone-400 text-xs uppercase tracking-wider">Weapon</span>
                        <span className="text-stone-200 font-medium">{equippedWeapon ? equippedWeapon.item_name : 'Unarmed'}</span>
                    </div>
                    <div className="flex items-center justify-between bg-stone-950 p-3 rounded-lg border border-stone-800/50 text-sm">
                        <span className="text-stone-400 text-xs uppercase tracking-wider">Armor</span>
                        <span className="text-stone-200 font-medium">{equippedArmor ? equippedArmor.item_name : 'No Armor'}</span>
                    </div>
                </div>
            </div>

            {/* Resting Section */}
            <div className="border-t border-stone-800/80 pt-4 mb-6">
                <h3 className="text-sm font-bold tracking-widest uppercase text-stone-500 mb-3">Resting Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={onShortRest}
                        className="py-2.5 px-3 bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 text-stone-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    >
                        ⛺ Short Rest
                    </button>
                    <button
                        onClick={onLongRest}
                        className="py-2.5 px-3 bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 text-stone-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    >
                        🔥 Long Rest
                    </button>
                </div>
            </div>

            {/* Abilities Section */}
            {char.class && CLASS_ABILITIES[char.class] && (
                <div className="border-t border-stone-800/80 pt-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold tracking-widest uppercase text-stone-500">Abilities & Spells</h3>
                        <div className="flex gap-2">
                            {CLASS_ABILITIES[char.class].some(a => a.costType === 'slot') && (
                                <span className="text-[10px] bg-purple-950/50 border border-purple-800/30 text-purple-300 px-1.5 py-0.5 rounded">
                                    Slots: {spellSlots}/2
                                </span>
                            )}
                            {CLASS_ABILITIES[char.class].some(a => a.costType === 'charge') && (
                                <span className="text-[10px] bg-blue-950/50 border border-blue-800/30 text-blue-300 px-1.5 py-0.5 rounded">
                                    Charges: {classCharges}/1
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        {CLASS_ABILITIES[char.class].map((ability, idx) => {
                            const isOutOfResource = (ability.costType === 'slot' && spellSlots <= 0) || (ability.costType === 'charge' && classCharges <= 0);

                            return (
                                <div key={idx} className="bg-stone-950 p-3 rounded-lg border border-stone-800/50 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-stone-200 text-sm font-bold">{ability.name}</span>
                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                                            ability.costType === 'slot' ? 'text-purple-400 border-purple-800/40 bg-purple-950/20' :
                                            ability.costType === 'charge' ? 'text-blue-400 border-blue-800/40 bg-blue-950/20' :
                                            'text-stone-500 border-stone-800 bg-stone-900/40'
                                        }`}>
                                            {ability.costType}
                                        </span>
                                    </div>
                                    <p className="text-stone-500 text-xs">{ability.description}</p>
                                    <button
                                        onClick={() => onUseAbility(ability)}
                                        disabled={isOutOfResource}
                                        className="w-full py-1.5 bg-stone-800 hover:bg-stone-700 disabled:bg-stone-950 disabled:text-stone-700 text-stone-200 rounded-md text-xs font-bold uppercase tracking-wider transition-colors"
                                    >
                                        {isOutOfResource ? 'Out of slots' : ability.type === 'mechanical' ? 'Use Ability' : 'Cast / Send'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function MapPanel({ env }: { env: Environment }) {
    return (
        <div className="space-y-4">
            <div className="bg-stone-950 border border-stone-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-stone-300 uppercase tracking-wider">Current Location</span>
                </div>
                <p className="text-gold-400 font-serif text-lg">{env.location}</p>
                <p className="text-stone-500 text-sm mt-1">Turn {env.turn} · {env.time} · {env.weather}</p>
            </div>
            <div className="bg-stone-950/50 border border-stone-800 rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px]">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 w-full">
                    {Object.keys(ADVENTURE_FILE_MAP).map((advTitle, idx) => {
                        const isCurrent = advTitle === env.location;
                        return (
                            <div key={idx} className={`p-3 rounded-lg border text-center flex flex-col items-center transition-all ${isCurrent ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-stone-950 border-stone-800/50 opacity-50'}`}>
                                <MapPin className={`w-5 h-5 mb-1 ${isCurrent ? 'text-amber-500 animate-bounce' : 'text-stone-600'}`} />
                                <div className={`text-xs font-serif leading-tight ${isCurrent ? 'text-amber-400 font-bold' : 'text-stone-500'}`}>{advTitle}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function JournalPanel({ journalLog, charName }: { journalLog: StoryLogEntry[]; charName: string }) {
    return (
        <div className="space-y-4">
            <div className="bg-stone-950 flex justify-between items-center border border-stone-800 rounded-xl p-4 mb-4">
                <div>
                    <p className="text-stone-500 text-xs uppercase tracking-wider font-bold mb-1">Chronicles of</p>
                    <p className="text-gold-400 font-serif text-lg">{charName}</p>
                </div>
                <History className="text-stone-700 w-8 h-8" />
            </div>
            {journalLog.length === 0 ? (
                <div className="text-center text-stone-600 py-8">
                    <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm italic">Your journey has just begun...</p>
                </div>
            ) : (
                <div className="space-y-3 pl-2 border-l-2 border-stone-800/50 ml-4 relative">
                    {journalLog.map((entry, idx) => (
                        <div key={idx} className="relative pl-4 pb-4 border-b border-stone-800/30 last:border-0 last:pb-0 animate-in fade-in slide-in-from-left-4">
                            <div className={`absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 ${idx === journalLog.length - 1 ? 'border-stone-900 bg-amber-500 ring-2 ring-stone-900' : 'border-stone-900 bg-stone-700'}`} />
                            <p className="text-stone-300 text-sm italic mb-2 leading-relaxed">"{entry.text.substring(0, 150)}{entry.text.length > 150 ? '...' : ''}"</p>
                            {entry.choiceMade && (
                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-stone-950/80 border border-stone-800 text-xs text-amber-500/80 rounded">
                                    <span className="text-[10px]">▸</span> {entry.choiceMade}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function InventoryPanel({
    inventory, goldCount, inventoryTab, setInventoryTab, onSell, onCraft, onEquip
}: {
    inventory: InventoryItem[];
    goldCount: number;
    inventoryTab: 'items' | 'sell' | 'craft';
    setInventoryTab: (tab: 'items' | 'sell' | 'craft') => void;
    onSell: (item: InventoryItem) => void;
    onCraft: (recipe: CraftingRecipe) => void;
    onEquip: (item: InventoryItem) => void;
}) {
    const getItemTypeColor = (type: string | null) => {
        switch (type) {
            case 'weapon': return 'text-red-400 border-red-800/50';
            case 'armor': return 'text-blue-400 border-blue-800/50';
            case 'potion': return 'text-emerald-400 border-emerald-800/50';
            case 'material': return 'text-amber-400 border-amber-800/50';
            default: return 'text-stone-500 border-stone-700';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between bg-stone-950 border border-stone-800 rounded-xl p-3">
                <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-gold-400" />
                    <span className="text-sm font-bold text-stone-300">Gold</span>
                </div>
                <span className="text-gold-400 font-serif text-xl font-bold">{goldCount} GP</span>
            </div>

            <div className="flex rounded-lg bg-stone-950 border border-stone-800 p-1 gap-1">
                {(['items', 'sell', 'craft'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setInventoryTab(tab)}
                        className={`flex-1 py-2 px-3 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${inventoryTab === tab ? 'bg-stone-800 text-gold-400' : 'text-stone-500 hover:text-stone-300'}`}
                    >
                        {tab === 'items' && <Backpack className="w-3.5 h-3.5" />}
                        {tab === 'sell' && <Coins className="w-3.5 h-3.5" />}
                        {tab === 'craft' && <Hammer className="w-3.5 h-3.5" />}
                        {tab}
                    </button>
                ))}
            </div>

            {inventoryTab === 'items' && (
                <div className="space-y-2">
                    {inventory.filter(i => i.item_name !== 'Gold Pieces').map(item => {
                        const canEquip = item.item_type === 'weapon' || item.item_type === 'armor';
                        return (
                            <div key={item.id} className="bg-stone-950/50 border border-stone-800 rounded-lg p-3 flex items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <p className="text-stone-200 text-sm font-medium truncate">{item.item_name}</p>
                                    <p className="text-stone-500 text-xs line-clamp-1">{item.description}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {canEquip && (
                                        <button
                                            onClick={() => onEquip(item)}
                                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors ${
                                                item.is_equipped
                                                    ? 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                                                    : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                                            }`}
                                        >
                                            {item.is_equipped ? 'Equipped' : 'Equip'}
                                        </button>
                                    )}
                                    <span className={`text-xs px-1.5 py-0.5 rounded border ${getItemTypeColor(item.item_type)}`}>{item.item_type}</span>
                                    <span className="text-gold-400 text-xs font-bold bg-stone-800 px-2 py-1 rounded">x{item.quantity}</span>
                                </div>
                            </div>
                        );
                    })}
                    {inventory.filter(i => i.item_name !== 'Gold Pieces').length === 0 && (
                        <div className="border border-dashed border-stone-800 rounded-lg p-4 text-center text-stone-600">
                            <Backpack className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-xs italic">Your pack is empty.</p>
                        </div>
                    )}
                </div>
            )}

            {inventoryTab === 'sell' && (
                <div className="space-y-2">
                    <p className="text-stone-500 text-xs italic mb-1">Tap an item to sell it for gold.</p>
                    {inventory.filter(i => i.item_name !== 'Gold Pieces' && (i.sell_value || 0) > 0).map(item => (
                        <button
                            key={item.id}
                            onClick={() => onSell(item)}
                            className="w-full bg-stone-950/50 border border-stone-800 rounded-lg p-3 flex items-center justify-between hover:border-gold-500/50 hover:bg-stone-800/50 transition-all text-left group"
                        >
                            <div>
                                <p className="text-stone-200 text-sm font-medium">{item.item_name}</p>
                                <p className="text-stone-500 text-xs">Qty: {item.quantity}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gold-400 text-sm font-bold">{item.sell_value} GP</span>
                                <ShoppingCart className="w-4 h-4 text-stone-600 group-hover:text-gold-400 transition-colors" />
                            </div>
                        </button>
                    ))}
                    {inventory.filter(i => i.item_name !== 'Gold Pieces' && (i.sell_value || 0) > 0).length === 0 && (
                        <div className="border border-dashed border-stone-800 rounded-lg p-4 text-center text-stone-600">
                            <Coins className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-xs italic">Nothing to sell.</p>
                        </div>
                    )}
                </div>
            )}

            {inventoryTab === 'craft' && (
                <div className="space-y-3">
                    {CRAFTING_RECIPES.map((recipe, i) => {
                        const canCraft = recipe.materials.every(mat => {
                            const invItem = inventory.find(inv => inv.item_name === mat.name);
                            return invItem && (invItem.quantity || 0) >= mat.qty;
                        });
                        return (
                            <div key={i} className={`bg-stone-950/50 border rounded-lg p-3 ${canCraft ? 'border-stone-800' : 'border-stone-800/50 opacity-50'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-stone-200 text-sm font-bold">{recipe.name}</p>
                                    <span className={`text-xs px-1.5 py-0.5 rounded border ${getItemTypeColor(recipe.result.item_type)}`}>{recipe.result.item_type}</span>
                                </div>
                                <p className="text-stone-500 text-xs mb-2">{recipe.result.description}</p>
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {recipe.materials.map((mat, j) => {
                                        const have = inventory.find(inv => inv.item_name === mat.name)?.quantity || 0;
                                        return (
                                            <span key={j} className={`text-xs px-2 py-1 rounded border ${have >= mat.qty ? 'text-emerald-400 border-emerald-800/50 bg-emerald-950/30' : 'text-red-400 border-red-800/50 bg-red-950/30'}`}>
                                                {mat.name} {have}/{mat.qty}
                                            </span>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => onCraft(recipe)}
                                    disabled={!canCraft}
                                    className="w-full py-2 bg-stone-800 hover:bg-stone-700 disabled:bg-stone-900 disabled:text-stone-600 text-stone-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                >
                                    <Hammer className="w-3.5 h-3.5" />
                                    {canCraft ? 'Craft' : 'Missing Materials'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function SlideOutPanel({
    activePanel, env, journalLog, charName, inventory, goldCount, inventoryTab, setInventoryTab, onSell, onCraft, onEquip, onClose
}: {
    activePanel: string;
    env: Environment;
    journalLog: StoryLogEntry[];
    charName: string;
    inventory: InventoryItem[];
    goldCount: number;
    inventoryTab: 'items' | 'sell' | 'craft';
    setInventoryTab: (tab: 'items' | 'sell' | 'craft') => void;
    onSell: (item: InventoryItem) => void;
    onCraft: (recipe: CraftingRecipe) => void;
    onEquip: (item: InventoryItem) => void;
    onClose: () => void;
}) {
    return (
        <div className="absolute inset-0 z-30 flex">
            <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md bg-stone-900 border-r border-stone-800 shadow-2xl overflow-y-auto animate-in slide-in-from-left-8 duration-300">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-800">
                        <h2 className="text-xl font-serif text-gold-400 flex items-center gap-3">
                            {activePanel === 'map' && <><MapPin className="w-5 h-5" /> World Map</>}
                            {activePanel === 'journal' && <><ScrollText className="w-5 h-5" /> Adventure Journal</>}
                            {activePanel === 'inventory' && <><Backpack className="w-5 h-5" /> Inventory</>}
                        </h2>
                        <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    {activePanel === 'map' && <MapPanel env={env} />}
                    {activePanel === 'journal' && <JournalPanel journalLog={journalLog} charName={charName} />}
                    {activePanel === 'inventory' && (
                        <InventoryPanel inventory={inventory} goldCount={goldCount} inventoryTab={inventoryTab} setInventoryTab={setInventoryTab} onSell={onSell} onCraft={onCraft} onEquip={onEquip} />
                    )}
                </div>
            </div>
        </div>
    );
}

function MobileNav({
    activePanel,
    togglePanel,
    onOpenQuests,
    activeQuestCount
}: {
    activePanel: string | null;
    togglePanel: (panel: string) => void;
    onOpenQuests: () => void;
    activeQuestCount: number;
}) {
    return (
        <nav className="lg:hidden flex items-center justify-around p-3 bg-stone-900 border-t border-stone-800 shrink-0 z-20 relative">
            <button title="Map" onClick={() => togglePanel('map')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${activePanel === 'map' ? 'text-gold-400' : 'text-stone-500 hover:text-stone-300'}`}>
                <MapPin className="w-5 h-5" /><span className="text-[10px] uppercase font-bold tracking-wider">Map</span>
            </button>
            <button title="Quests" onClick={onOpenQuests} className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-purple-400 hover:text-purple-300 relative">
                <ListTodo className="w-5 h-5" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Quests</span>
                {activeQuestCount > 0 && (
                    <span className="absolute top-1 right-2 bg-purple-600 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                        {activeQuestCount}
                    </span>
                )}
            </button>
            <Link href="/champions" className="flex flex-col items-center gap-1 p-2 bg-stone-800 rounded-lg text-gold-400 -mt-8 shadow-lg shadow-stone-950/50 border border-stone-700 relative z-10">
                <Dice5 className="w-6 h-6" /><span className="text-[10px] uppercase font-bold tracking-wider">Heroes</span>
            </Link>
            <button title="Inventory" onClick={() => togglePanel('inventory')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${activePanel === 'inventory' ? 'text-gold-400' : 'text-stone-500 hover:text-stone-300'}`}>
                <Backpack className="w-5 h-5" /><span className="text-[10px] uppercase font-bold tracking-wider">Pack</span>
            </button>
            <button title="Journal" onClick={() => togglePanel('journal')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${activePanel === 'journal' ? 'text-gold-400' : 'text-stone-500 hover:text-stone-300'}`}>
                <ScrollText className="w-5 h-5" /><span className="text-[10px] uppercase font-bold tracking-wider">Journal</span>
            </button>
        </nav>
    );
}


function PlayDashboardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [campaignId, setCampaignId] = useState<string | null>(null);

    useEffect(() => {
        let id = searchParams.get('campaignId');
        if (!id && typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            id = params.get('campaignId');
        }
        if (id) {
            setCampaignId(id);
        } else {
            router.push('/adventures');
        }
    }, [searchParams, router]);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [activePanel, setActivePanel] = useState<string | null>(null);

    const [char, setChar] = useState<Character | null>(null);
    const [env, setEnv] = useState<Environment | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const supabase = useRef(createClient()).current;

    const [diceRoll, setDiceRoll] = useState<DiceRollState | null>(null);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [inventoryTab, setInventoryTab] = useState<'items' | 'sell' | 'craft'>('items');
    const [goldCount, setGoldCount] = useState(15);
    const [storyFile, setStoryFile] = useState<string | null>(null);
    const [adventureEnded, setAdventureEnded] = useState<'victory' | 'defeat' | 'neutral' | null>(null);
    const [endingXp, setEndingXp] = useState<number>(0);
    const [journalLog, setJournalLog] = useState<StoryLogEntry[]>([]);
    
    // Quest Editor & Settings State
    const [quests, setQuests] = useState<Quest[]>([]);
    const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
    const [saveLoadMode, setSaveLoadMode] = useState<'save' | 'load' | null>(null);


    const handleSaveQuests = (newQuests: Quest[]) => {
        setQuests(newQuests);
        if (campaignId) {
            try {
                localStorage.setItem(`dnd_app_quests_${campaignId}`, JSON.stringify(newQuests));
            } catch (e) {
                console.error('Failed saving quests to localStorage:', e);
            }
        }
    };
    
    // Level Up State

    const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);
    const [originalStats, setOriginalStats] = useState<Record<string, number>>({});
    const [levelUpPointsSpent, setLevelUpPointsSpent] = useState<Record<string, number>>({});

    const storyEngineRef = useRef<StoryEngineRef>(null);
    const [spellSlots, setSpellSlots] = useState(2);
    const [classCharges, setClassCharges] = useState(1);

    const togglePanel = (panel: string) => {
        setActivePanel(prev => prev === panel ? null : panel);
    };

    interface ToastMessage {
        id: string;
        text: string;
        type: 'hp-gain' | 'hp-loss' | 'gold-gain' | 'gold-loss' | 'item-gain' | 'item-loss' | 'xp-gain' | 'info';
    }
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((text: string, type: ToastMessage['type']) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, text, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    /**
     * Check achievements and surface any newly-unlocked ones as toasts.
     * Reads minimal context from the running campaign + localStorage
     * to avoid coupling this page to a deep state machine.
     */
    const checkAndUnlockAchievements = useCallback(() => {
        if (!char) return;
        const npcsMet = campaignId ? listNpcs(campaignId).length : 0;
        const ctx = {
            level: char.level || 1,
            xp: char.xp || 0,
            victories: parseInt(localStorage.getItem('dnd_app_victory_count') || '0', 10),
            campaignsStarted: 1, // any active campaign counts
            classesPlayed: [char.class || ''],
            maxLevelReached: char.level || 1,
            adventuresCompleted: [],
            npcsMet
        };
        const newlyUnlocked = checkAchievements(char.id, ctx);
        for (const id of newlyUnlocked) {
            const a = getAchievementById(id);
            if (a) {
                showToast(`🏆 Achievement Unlocked: ${a.title}`, 'xp-gain');
            }
        }
    }, [char, campaignId, showToast]);

    const handleDiceRoll = useCallback((roll: number, dc: number, reason: string, success: boolean) => {
        setDiceRoll({ roll, modifier: 0, total: roll, dc, reason, visible: true });
    }, []);

    const handleEnvUpdate = useCallback(async (newEnv: Environment) => {
        setEnv(newEnv);
        if (campaignId) {
            await supabase.from('campaigns').update({
                current_turn: newEnv.turn,
                time_of_day: newEnv.time,
                weather: newEnv.weather
            }).eq('id', campaignId);
        }
    }, [campaignId, supabase]);

    const handleEffects = useCallback((effects: SceneEffects) => {
        if (effects.hp && char) {
            const nextHp = Math.max(0, Math.min(char.hp_max || 0, (char.hp_current || 0) + effects.hp!));
            setChar(prev => prev ? { ...prev, hp_current: nextHp } : prev);
            supabase.from('characters').update({ hp_current: nextHp }).eq('id', char.id);
            
            if (effects.hp > 0) {
                showToast(`Healed +${effects.hp} HP`, 'hp-gain');
            } else {
                showToast(`Took ${Math.abs(effects.hp)} Damage`, 'hp-loss');
            }
        }
        if (effects.gold) {
            const goldItem = inventory.find(i => i.item_name === 'Gold Pieces');
            if (goldItem) {
                const nextGold = Math.max(0, (goldItem.quantity || 0) + effects.gold!);
                setGoldCount(nextGold);
                supabase.from('inventory').update({ quantity: nextGold }).eq('id', goldItem.id);
                setInventory(prev => prev.map(i => i.item_name === 'Gold Pieces' ? { ...i, quantity: nextGold } : i));
                
                if (effects.gold > 0) {
                    showToast(`Gained +${effects.gold} Gold Pieces`, 'gold-gain');
                } else {
                    showToast(`Lost ${Math.abs(effects.gold)} Gold Pieces`, 'gold-loss');
                }
            }
        }
        if (effects.addItem) {
            const itemName = effects.addItem;
            const existing = inventory.find(i => i.item_name === itemName);
            if (existing) {
                const nextQty = (existing.quantity || 0) + 1;
                supabase.from('inventory').update({ quantity: nextQty }).eq('id', existing.id);
                setInventory(prev => prev.map(i => i.id === existing.id ? { ...i, quantity: nextQty } : i));
            } else {
                const newItem = {
                    campaign_id: campaignId,
                    item_name: itemName,
                    description: 'An item found during your travels.',
                    item_type: 'misc',
                    quantity: 1,
                    sell_value: 10,
                    is_equipped: false
                };
                (async () => {
                    const { data, error } = await supabase.from('inventory').insert([newItem]).select();
                    if (!error && data && data[0]) {
                        setInventory(prev => [...prev, data[0] as InventoryItem]);
                    }
                })();
            }
            showToast(`Found Item: ${itemName}`, 'item-gain');
        }
        if (effects.removeItem) {
            const itemName = effects.removeItem;
            const existing = inventory.find(i => i.item_name === itemName);
            if (existing) {
                if ((existing.quantity || 0) > 1) {
                    const nextQty = (existing.quantity || 0) - 1;
                    supabase.from('inventory').update({ quantity: nextQty }).eq('id', existing.id);
                    setInventory(prev => prev.map(i => i.id === existing.id ? { ...i, quantity: nextQty } : i));
                } else {
                    supabase.from('inventory').delete().eq('id', existing.id);
                    setInventory(prev => prev.filter(i => i.id !== existing.id));
                }
                showToast(`Lost Item: ${itemName}`, 'item-loss');
            }
        }
    }, [char, inventory, campaignId, supabase, showToast]);

    const handleUseAbility = async (ability: ClassAbility) => {
        if (!char) return;

        // Check resource cost
        if (ability.costType === 'slot' && spellSlots <= 0) {
            showToast("No spell slots remaining. Take a Long Rest to restore.", 'info');
            return;
        }
        if (ability.costType === 'charge' && classCharges <= 0) {
            showToast("No class charges remaining. Take a rest to restore.", 'info');
            return;
        }

        // Deduct cost
        if (ability.costType === 'slot') {
            setSpellSlots(prev => prev - 1);
        } else if (ability.costType === 'charge') {
            setClassCharges(prev => prev - 1);
        }

        if (ability.type === 'mechanical' && ability.effectType === 'heal') {
            let healing = 5;
            if (ability.dice === '1d10') {
                const roll = Math.floor(Math.random() * 10) + 1;
                healing = roll + (char.level || 1);
            } else if (ability.dice === '1d8') {
                const roll = Math.floor(Math.random() * 8) + 1;
                const wisMod = getModifier(char.wisdom ?? 10);
                healing = Math.max(1, roll + wisMod);
            } else if (ability.dice === '4') {
                healing = 4;
            }

            const nextHp = Math.min(char.hp_max || 10, (char.hp_current || 0) + healing);
            setChar(prev => prev ? { ...prev, hp_current: nextHp } : null);
            await supabase.from('characters').update({ hp_current: nextHp }).eq('id', char.id);

            showToast(`Healed +${healing} HP via ${ability.name}`, 'hp-gain');

            // Insert local log entry to document the spellcast
            const restLog: StoryLogEntry = {
                sceneId: `ability_${Date.now()}`,
                text: `You cast ${ability.name}, healing yourself for ${healing} HP. Current HP: ${nextHp}/${char.hp_max}.`,
                choiceMade: `Casting ${ability.name}`
            };
            await storyEngineRef.current?.insertLocalLog(restLog);

            // Notify AI DM in the background so it reflects this in the next scene
            void storyEngineRef.current?.triggerAction(`[Ability Used] I cast ${ability.name} on myself, healing for ${healing} HP. My current HP is now ${nextHp}/${char.hp_max}.`);
        } else {
            // Narrative ability
            const abilityText = `[Ability: ${ability.name}] I use ${ability.name}. ${ability.description}`;
            void storyEngineRef.current?.triggerAction(abilityText);
        }
    };

    const handleShortRest = async () => {
        if (!char || !env) return;

        const { total: healing } = rollHitDieForShortRest(char.class, char.constitution ?? 10);
        const nextHp = Math.min(char.hp_max || 10, (char.hp_current || 0) + healing);

        setChar(prev => prev ? { ...prev, hp_current: nextHp } : null);
        await supabase.from('characters').update({ hp_current: nextHp }).eq('id', char.id);

        // Restore fighter's Second Wind / Paladin charges
        setClassCharges(1);

        showToast(`Short Rest: Healed +${healing} HP! Class charges restored.`, 'hp-gain');

        // Create log entry
        const restLog: StoryLogEntry = {
            sceneId: `rest_${Date.now()}`,
            text: `You take a short rest, dressing your wounds and catching your breath. You regain ${healing} HP. Current HP: ${nextHp}/${char.hp_max}. Your class charges are restored.`,
            choiceMade: "Short Rest"
        };
        await storyEngineRef.current?.insertLocalLog(restLog);

        // Advance environment turn
        const nextTurn = env.turn + 1;
        const timeCycle = ['Dawn', 'Morning', 'Noon', 'Afternoon', 'Dusk', 'Night', 'Midnight'];
        const timeIndex = Math.floor(nextTurn / 3) % timeCycle.length;
        const nextTime = timeCycle[timeIndex];
        
        handleEnvUpdate({
            ...env,
            turn: nextTurn,
            time: nextTime
        });

        // Trigger AI DM reaction to resting
        void storyEngineRef.current?.triggerAction(`[Rest taken] I took a short rest, healing for ${healing} HP. My current HP is now ${nextHp}/${char.hp_max}. We bind our wounds and prepare to proceed.`);
    };

    const handleLongRest = async () => {
        if (!char || !env) return;

        // Fully heal
        const nextHp = char.hp_max || 10;
        setChar(prev => prev ? { ...prev, hp_current: nextHp } : null);
        await supabase.from('characters').update({ hp_current: nextHp }).eq('id', char.id);

        // Restore spell slots and charges
        setSpellSlots(2);
        setClassCharges(1);

        showToast(`Long Rest: Fully Healed! Spells and charges restored.`, 'hp-gain');

        // Create log entry
        const restLog: StoryLogEntry = {
            sceneId: `rest_${Date.now()}`,
            text: `You build a campfire and take a long rest, sleeping deeply through the night. Your wounds heal completely, and your magical energy and abilities are fully restored. Current HP: ${nextHp}/${char.hp_max}.`,
            choiceMade: "Long Rest"
        };
        await storyEngineRef.current?.insertLocalLog(restLog);

        // Advance environment turn to next morning (Dawn)
        const nextTurn = env.turn + 6; // sleep for 6 turns
        
        // Pick a random weather
        const weathers = ['Clear', 'Overcast', 'Rainy', 'Foggy', 'Stormy', 'Windy'];
        const nextWeather = weathers[Math.floor(Math.random() * weathers.length)];

        handleEnvUpdate({
            ...env,
            turn: nextTurn,
            time: 'Dawn',
            weather: nextWeather
        });

        // Trigger AI DM reaction to long rest
        void storyEngineRef.current?.triggerAction(`[Long Rest taken] I set up camp and slept through the night, fully healing my HP (${nextHp}/${char.hp_max}) and restoring my spell slots. A new day begins.`);
    };

    const handleEnding = useCallback(async (type: 'victory' | 'defeat' | 'neutral') => {
        setAdventureEnded(type);
        if (type === 'victory' && char) {
            const currentAdventureDef = ADVENTURE_DEFINITIONS.find(a => a.title === env?.location);
            const difficulty = currentAdventureDef?.difficulty || 'Beginner';
            const xpReward = difficulty === 'Beginner' ? 100 : difficulty === 'Intermediate' ? 250 : 500;
            setEndingXp(xpReward);

            // Track total victories for achievement context.
            try {
                const cur = parseInt(localStorage.getItem('dnd_app_victory_count') || '0', 10);
                localStorage.setItem('dnd_app_victory_count', String(cur + 1));
            } catch { /* ignore */ }

            const newXp = (char.xp || 0) + xpReward;
            const newLevel = getLevelForXp(newXp);
            const oldLevel = char.level || 1;

            const { error } = await supabase.from('characters').update({ xp: newXp }).eq('id', char.id);
            if (!error) {
                setChar(prev => prev ? { ...prev, xp: newXp } : prev);
                
                if (newLevel > oldLevel) {
                    setOriginalStats({
                        strength: char.strength || 10,
                        dexterity: char.dexterity || 10,
                        constitution: char.constitution || 10,
                        intelligence: char.intelligence || 10,
                        wisdom: char.wisdom || 10,
                        charisma: char.charisma || 10
                    });
                    setLevelUpPointsSpent({
                        strength: 0,
                        dexterity: 0,
                        constitution: 0,
                        intelligence: 0,
                        wisdom: 0,
                        charisma: 0
                    });
                    setLevelUpData({
                        active: true,
                        oldLevel,
                        newLevel,
                        pointsToAllocate: 2 * (newLevel - oldLevel),
                        strength: char.strength || 10,
                        dexterity: char.dexterity || 10,
                        constitution: char.constitution || 10,
                        intelligence: char.intelligence || 10,
                        wisdom: char.wisdom || 10,
                        charisma: char.charisma || 10
                    });
                } else {
                    showToast(`Victory! You gained ${xpReward} XP.`, 'xp-gain');
                }
                // Check for newly-unlocked achievements (level, victory, etc).
                checkAndUnlockAchievements();
            }
        }
    }, [char, env?.location, supabase]);

    /**
     * Triggered by the "Rewind" button on the defeat/neutral ending
     * overlay. Delegates to the StoryEngine to pop the last log entry,
     * then closes the overlay so the player sees the previous scene.
     */
    const handleRewind = useCallback(async () => {
        await storyEngineRef.current?.goBack();
        setAdventureEnded(null);
        setEndingXp(0);
    }, []);

    const handleDismissEnding = useCallback(() => {
        setAdventureEnded(null);
        setEndingXp(0);
    }, []);

    /**
     * Snapshot the live campaign state and write it to localStorage.
     * Triggered by the "Save" button in the side nav.
     */
    const handleSave = useCallback((name: string) => {
        if (!char || !env) return;
        const storyLog = storyEngineRef.current?.getStoryLog() || [];
        createSave({
            name,
            character: char,
            inventory,
            storyLog,
            quests,
            env,
            campaignId: campaignId || ''
        });
        showToast(`Saved as "${name}".`, 'info');
    }, [char, env, inventory, quests, campaignId, showToast]);

    /**
     * Apply a previously-saved snapshot to the running campaign.
     * Replaces the character, inventory, story log, and env in state,
     * and rewrites the chat_logs table so a reload lands on the same place.
     */
    const handleLoad = useCallback(async (save: CampaignSave) => {
        setChar(save.character);
        setInventory(save.inventory);
        setGoldCount(save.inventory.find(i => i.item_name === 'Gold Pieces')?.quantity || 0);
        // Rebuild env from the save snapshot.
        setEnv({
            time: save.time,
            weather: save.weather,
            location: save.location,
            turn: save.turn
        });
        // Persist the loaded character + inventory.
        const supabase = createClient();
        await supabase.from('characters').update({
            hp_current: save.character.hp_current,
            hp_max: save.character.hp_max,
            level: save.character.level,
            xp: save.character.xp,
            strength: save.character.strength,
            dexterity: save.character.dexterity,
            constitution: save.character.constitution,
            intelligence: save.character.intelligence,
            wisdom: save.character.wisdom,
            charisma: save.character.charisma
        }).eq('id', save.character.id);

        // Replace chat logs with the saved log.
        if (campaignId) {
            await supabase.from('chat_logs').delete().eq('campaign_id', campaignId);
            for (const entry of save.storyLog) {
                await supabase.from('chat_logs').insert([{
                    campaign_id: campaignId,
                    role: 'story_entry',
                    content: JSON.stringify(entry)
                }]);
            }
        }

        // Refresh the quest log if there were any saved.
        if (save.quests) {
            handleSaveQuests(save.quests);
        }

        showToast(`Loaded "${save.name}".`, 'info');
    }, [campaignId, showToast]);

    const handleStatChange = (stat: keyof LevelUpData, delta: number) => {
        if (!levelUpData) return;
        const currentSpent = levelUpPointsSpent[stat as string] || 0;
        const newSpent = currentSpent + delta;

        if (newSpent < 0) return; // Cannot go below original stat
        
        const totalPointsSpent = Object.values(levelUpPointsSpent).reduce((a, b) => a + b, 0);
        if (delta > 0 && totalPointsSpent >= levelUpData.pointsToAllocate) return; // Out of points

        setLevelUpPointsSpent(prev => ({ ...prev, [stat]: newSpent }));
        setLevelUpData(prev => prev ? {
            ...prev,
            [stat]: (originalStats[stat as string] || 10) + newSpent
        } : prev);
    };

    const handleConfirmLevelUp = async () => {
        if (!char || !levelUpData) return;

        const levelDiff = levelUpData.newLevel - levelUpData.oldLevel;
        const hpIncrease = getHpGainOnLevelUp(char.class, levelUpData.constitution, levelDiff);
        const newHpMax = (char.hp_max || 10) + hpIncrease;
        const newHpCurrent = (char.hp_current || 10) + hpIncrease;

        const updates = {
            level: levelUpData.newLevel,
            hp_max: newHpMax,
            hp_current: newHpCurrent,
            strength: levelUpData.strength,
            dexterity: levelUpData.dexterity,
            constitution: levelUpData.constitution,
            intelligence: levelUpData.intelligence,
            wisdom: levelUpData.wisdom,
            charisma: levelUpData.charisma
        };

        const { error } = await supabase.from('characters').update(updates).eq('id', char.id);
        if (!error) {
            setChar(prev => prev ? { ...prev, ...updates } : prev);
            setLevelUpData(null);
            showToast(`Level up! You reached Level ${levelUpData.newLevel}.`, 'hp-gain');
            checkAndUnlockAchievements();
        } else {
            showToast(`Failed to save level up: ${error.message}`, 'hp-loss');
        }
    };

    const handleManualRoll = useCallback(() => {
        const roll = Math.floor(Math.random() * 20) + 1;
        setDiceRoll({ roll, reason: 'Manual Roll', visible: true });
    }, []);

    useEffect(() => {
        if (!campaignId) {
            // campaignId is being resolved from URL params asynchronously - wait
            return;
        }

        let cancelled = false;

        async function fetchCampaignData() {
            setLoadingData(true);
            try {
                const { data: cData } = await supabase.from('campaigns').select('*').eq('id', campaignId as string).single();
                if (cancelled) return;
                if (cData) {
                    setEnv({
                        time: (cData.time_of_day as string) || 'Dawn',
                        weather: (cData.weather as string) || 'Clear',
                        location: (cData.adventure_title as string) || '',
                        turn: (cData.current_turn as number) || 0
                    });

                    const file = ADVENTURE_FILE_MAP[(cData.adventure_title as string) || ''] || (cData.adventure_title as string);
                    if (file) setStoryFile(file);

                    const { data: charData } = await supabase.from('characters').select('*').eq('id', cData.character_id).single();
                    if (cancelled) return;
                    if (charData) {
                        setChar(charData as unknown as Character);
                    }
                }

                const { data: invData } = await supabase.from('inventory').select('*').eq('campaign_id', campaignId);
                if (cancelled) return;
                if (invData) {
                    setInventory(invData as InventoryItem[]);
                    const goldItem = (invData as InventoryItem[]).find(i => i.item_name === 'Gold Pieces');
                    if (goldItem) setGoldCount(goldItem.quantity || 0);
                }

                // Load saved quests
                try {
                    const saved = localStorage.getItem(`dnd_app_quests_${campaignId}`);
                    if (saved) {
                        setQuests(JSON.parse(saved));
                    }
                } catch (e) {
                    console.error('Error loading quests:', e);
                }
            } catch (err) {
                console.error('fetchCampaignData error:', err);
            } finally {
                if (!cancelled) {
                    setLoadingData(false);
                }
            }
        }

        fetchCampaignData();

        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignId]);

    const handleSellItem = async (item: InventoryItem) => {
        if (item.item_name === 'Gold Pieces' || (item.sell_value || 0) <= 0) return;
        const sellQty = 1;
        const earnings = (item.sell_value || 0) * sellQty;

        const goldItem = inventory.find(i => i.item_name === 'Gold Pieces');
        if (!goldItem) return;

        const newGold = (goldItem.quantity || 0) + earnings;

        if ((item.quantity || 0) <= sellQty) {
            const { error } = await supabase.from('inventory').delete().eq('id', item.id);
            if (error) { showToast('Failed to sell item.', 'hp-loss'); return; }
            setInventory(prev => prev.filter(i => i.id !== item.id));
        } else {
            const { error } = await supabase.from('inventory').update({ quantity: (item.quantity || 0) - sellQty }).eq('id', item.id);
            if (error) { showToast('Failed to sell item.', 'hp-loss'); return; }
            setInventory(prev => prev.map(i => i.id === item.id ? { ...i, quantity: (i.quantity || 0) - sellQty } : i));
        }

        const { error: goldError } = await supabase.from('inventory').update({ quantity: newGold }).eq('id', goldItem.id);
        if (!goldError) {
            setInventory(prev => prev.map(i => i.item_name === 'Gold Pieces' ? { ...i, quantity: newGold } : i));
            setGoldCount(newGold);
        }
    };

    const handleEquipItem = async (item: InventoryItem) => {
        const newEquippedState = !item.is_equipped;

        if (newEquippedState && item.item_type === 'armor') {
            const currentEquippedArmor = inventory.find(i => i.item_type === 'armor' && i.is_equipped && i.id !== item.id);
            if (currentEquippedArmor) {
                await supabase.from('inventory').update({ is_equipped: false }).eq('id', currentEquippedArmor.id);
            }
        }
        
        if (newEquippedState && item.item_type === 'weapon') {
            const currentEquippedWeapon = inventory.find(i => i.item_type === 'weapon' && i.is_equipped && i.id !== item.id);
            if (currentEquippedWeapon) {
                await supabase.from('inventory').update({ is_equipped: false }).eq('id', currentEquippedWeapon.id);
            }
        }

        const { error } = await supabase.from('inventory').update({ is_equipped: newEquippedState }).eq('id', item.id);
        if (!error) {
            setInventory(prev => prev.map(i => {
                if (i.id === item.id) {
                    return { ...i, is_equipped: newEquippedState };
                }
                if (newEquippedState && i.item_type === item.item_type && i.id !== item.id) {
                    return { ...i, is_equipped: false };
                }
                return i;
            }));
        } else {
            showToast('Failed to update equipment state.', 'hp-loss');
        }
    };

    const handleCraftItem = async (recipe: CraftingRecipe) => {
        for (const mat of recipe.materials) {
            const invItem = inventory.find(i => i.item_name === mat.name);
            if (!invItem || (invItem.quantity || 0) < mat.qty) {
                showToast(`Not enough ${mat.name}! Need ${mat.qty}, have ${invItem?.quantity || 0}.`, 'info');
                return;
            }
        }

        for (const mat of recipe.materials) {
            const invItem = inventory.find(i => i.item_name === mat.name)!;
            if ((invItem.quantity || 0) <= mat.qty) {
                const { error } = await supabase.from('inventory').delete().eq('id', invItem.id);
                if (error) { showToast('Failed to consume materials.', 'hp-loss'); return; }
                setInventory(prev => prev.filter(i => i.id !== invItem.id));
            } else {
                const { error } = await supabase.from('inventory').update({ quantity: (invItem.quantity || 0) - mat.qty }).eq('id', invItem.id);
                if (error) { showToast('Failed to consume materials.', 'hp-loss'); return; }
                setInventory(prev => prev.map(i => i.id === invItem.id ? { ...i, quantity: (i.quantity || 0) - mat.qty } : i));
            }
        }

        const existing = inventory.find(i => i.item_name === recipe.result.item_name);
        if (existing) {
            const { error } = await supabase.from('inventory').update({ quantity: (existing.quantity || 0) + 1 }).eq('id', existing.id);
            if (!error) {
                setInventory(prev => prev.map(i => i.id === existing.id ? { ...i, quantity: (i.quantity || 0) + 1 } : i));
            }
        } else {
            const { data, error } = await supabase.from('inventory').insert([{
                campaign_id: campaignId,
                ...recipe.result,
                quantity: 1,
            }]).select();
            if (!error && data && data[0]) setInventory(prev => [...prev, data[0] as InventoryItem]);
        }
    };

    useEffect(() => {
        if (!campaignId || !char) return;

        // BGM: set ambient mood based on current location. The engine
        // is a no-op if the user hasn't enabled BGM in Settings.
        if (env) {
            const mood = moodForLocation(env.location);
            const engine = getAmbientEngine();
            engine.resume().then(() => engine.setMood(mood));
        }

        const campaignSub = supabase.channel('campaign-updates')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'campaigns', filter: `id=eq.${campaignId}` }, (payload: { new: Record<string, unknown> }) => {
                const newData = payload.new as unknown as Campaign;
                setEnv(prev => prev ? {
                    ...prev,
                    time: newData.time_of_day || prev.time,
                    weather: newData.weather || prev.weather,
                    turn: newData.current_turn || prev.turn
                } : prev);
            }).subscribe();

        const charSub = supabase.channel('character-updates')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'characters', filter: `id=eq.${char.id}` }, (payload: { new: Record<string, unknown> }) => {
                const newData = payload.new as unknown as Character;
                setChar(prev => prev ? { ...prev, hp_current: newData.hp_current } : prev);
            }).subscribe();

        return () => {
            supabase.removeChannel(campaignSub);
            supabase.removeChannel(charSub);
        };
    }, [campaignId, char?.id]);

    if (loadingData) {
        return (
            <div className="h-screen bg-stone-950 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-gold-500 animate-spin" />
            </div>
        );
    }

    if (!char || !env) {
        return (
            <div className="h-screen bg-stone-950 flex items-center justify-center">
                <div className="text-center p-6 bg-stone-900 border border-stone-800 rounded-2xl max-w-md">
                    <p className="text-red-400 text-xl font-serif mb-2">Campaign Not Found</p>
                    <p className="text-stone-400 text-sm mb-6">The requested campaign or character data could not be found.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/adventures" className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-sm font-medium transition-colors border border-stone-700">
                            Adventures
                        </Link>
                        <Link href="/champions" className="px-4 py-2 bg-gold-600 hover:bg-gold-500 text-stone-950 rounded-lg text-sm font-bold transition-colors">
                            Select Champion
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!storyFile) {
        return (
            <div className="h-screen bg-stone-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 text-lg mb-2">Adventure not found</p>
                    <p className="text-stone-500 text-sm">No story file mapped for this adventure.</p>
                    <Link href="/adventures" className="mt-4 inline-block text-gold-400 underline">Choose another adventure</Link>
                </div>
            </div>
        );
    }

    const ac = calculateAC(char, inventory);

    return (
        <div className="h-screen bg-stone-950 text-stone-200 flex overflow-hidden">
            <nav className="hidden lg:flex w-20 flex-col items-center py-6 bg-stone-900 border-r border-stone-800 gap-8">
                <Link href="/champions" className="p-3 bg-stone-800 rounded-xl hover:bg-stone-700 transition-colors text-gold-400">
                    <Dice5 className="w-8 h-8" />
                </Link>
                <div className="flex flex-col gap-4">
                    <button title="Map" onClick={() => togglePanel('map')} className={`p-3 rounded-lg transition-all ${activePanel === 'map' ? 'text-gold-400 bg-stone-800' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'}`}><MapPin className="w-6 h-6" /></button>
                    <button
                        title="Quests & Task Editor"
                        onClick={() => setIsQuestModalOpen(true)}
                        className="p-3 rounded-lg transition-all text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 relative"
                    >
                        <ListTodo className="w-6 h-6" />
                        {quests.filter(q => q.status === 'active').length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {quests.filter(q => q.status === 'active').length}
                            </span>
                        )}
                    </button>
                    <button title="Journal" onClick={() => togglePanel('journal')} className={`p-3 rounded-lg transition-all ${activePanel === 'journal' ? 'text-gold-400 bg-stone-800' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'}`}><ScrollText className="w-6 h-6" /></button>
                    <button title="Inventory" onClick={() => togglePanel('inventory')} className={`p-3 rounded-lg transition-all ${activePanel === 'inventory' ? 'text-gold-400 bg-stone-800' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'}`}><Backpack className="w-6 h-6" /></button>
                </div>
                <div className="mt-auto flex flex-col gap-4">
                    <button title="Save Game" onClick={() => setSaveLoadMode('save')} className="p-3 text-stone-500 hover:text-stone-300 hover:bg-stone-800/50 rounded-lg transition-all"><Save className="w-6 h-6" /></button>
                    <button title="Load Game" onClick={() => setSaveLoadMode('load')} className="p-3 text-stone-500 hover:text-stone-300 hover:bg-stone-800/50 rounded-lg transition-all"><FolderOpen className="w-6 h-6" /></button>
                    <button title="Achievements" onClick={() => setIsAchievementsOpen(true)} className="p-3 text-stone-500 hover:text-gold-300 hover:bg-stone-800/50 rounded-lg transition-all"><Trophy className="w-6 h-6" /></button>
                    <button title="History Logs" className="p-3 text-stone-500 hover:text-stone-300 hover:bg-stone-800/50 rounded-lg transition-all"><History className="w-6 h-6" /></button>
                    <button title="Settings" onClick={() => setIsSettingsModalOpen(true)} className="p-3 text-stone-500 hover:text-stone-300 hover:bg-stone-800/50 rounded-lg transition-all"><Menu className="w-6 h-6" /></button>
                </div>
            </nav>


            <main className="flex-1 flex flex-col h-full relative">
                <EnvironmentHeader env={env} onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)} />

                <div className="flex-1 overflow-hidden w-full pt-16 flex flex-col">
                    <StoryEngine
                        ref={storyEngineRef}
                        campaignId={campaignId || undefined}
                        adventureFile={storyFile}
                        character={char}
                        inventory={inventory}
                        env={env}
                        characterStats={{
                            strength: char.strength || 10,
                            dexterity: char.dexterity || 10,
                            constitution: char.constitution || 10,
                            intelligence: char.intelligence || 10,
                            wisdom: char.wisdom || 10,
                            charisma: char.charisma || 10,
                        }}
                        onDiceRoll={handleDiceRoll}
                        onEffects={handleEffects}
                        onEnding={handleEnding}
                        onLogUpdate={setJournalLog}
                        onEnvUpdate={handleEnvUpdate}
                    />
                </div>

                {activePanel && (
                    <SlideOutPanel
                        activePanel={activePanel}
                        env={env}
                        journalLog={journalLog}
                        charName={char.name}
                        inventory={inventory}
                        goldCount={goldCount}
                        inventoryTab={inventoryTab}
                        setInventoryTab={setInventoryTab}
                        onSell={handleSellItem}
                        onCraft={handleCraftItem}
                        onEquip={handleEquipItem}
                        onClose={() => setActivePanel(null)}
                    />
                )}

                <MobileNav
                    activePanel={activePanel}
                    togglePanel={togglePanel}
                    onOpenQuests={() => setIsQuestModalOpen(true)}
                    activeQuestCount={quests.filter(q => q.status === 'active').length}
                />
            </main>

            <aside className={`
                fixed inset-y-0 right-0 z-50 w-80 bg-stone-900 border-l border-stone-800 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 overflow-y-auto
                ${isMobileDrawerOpen ? 'translate-x-0 shadow-2xl pointer-events-auto' : 'translate-x-full pointer-events-none lg:pointer-events-auto'}
            `}>
                <div className="flex items-center justify-between mb-8 lg:hidden px-6 pt-6">
                    <h2 className="font-serif text-xl text-gold-500">Character Sheet</h2>
                    <button onClick={() => setIsMobileDrawerOpen(false)} className="text-stone-400 p-1"><X className="w-6 h-6" /></button>
                </div>
                <CharacterSheet
                    char={char}
                    goldCount={goldCount}
                    ac={ac}
                    inventory={inventory}
                    spellSlots={spellSlots}
                    classCharges={classCharges}
                    onUseAbility={handleUseAbility}
                    onShortRest={handleShortRest}
                    onLongRest={handleLongRest}
                />
            </aside>

            {isMobileDrawerOpen && (
                <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileDrawerOpen(false)} />
            )}

            <QuestEditorModal
                isOpen={isQuestModalOpen}
                onClose={() => setIsQuestModalOpen(false)}
                quests={quests}
                onSaveQuests={handleSaveQuests}
                character={char}
                logs={journalLog}
                adventureTitle={env.location}
                location={env.location}
            />

            <ApiKeySettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />

            <SaveLoadModal
                isOpen={saveLoadMode !== null}
                onClose={() => setSaveLoadMode(null)}
                mode={saveLoadMode || 'save'}
                characterId={char.id}
                onSave={handleSave}
                onLoad={handleLoad}
            />

            <AchievementsModal
                isOpen={isAchievementsOpen}
                onClose={() => setIsAchievementsOpen(false)}
                characterId={char.id}
            />



            {diceRoll?.visible && (
                <DiceRollOverlay
                    roll={diceRoll.roll}
                    modifier={diceRoll.modifier}
                    total={diceRoll.total}
                    dc={diceRoll.dc}
                    reason={diceRoll.reason}
                    onComplete={() => setDiceRoll(null)}
                />
            )}

            {levelUpData && (
                <LevelUpOverlay
                    data={levelUpData}
                    pointsRemaining={levelUpData.pointsToAllocate - Object.values(levelUpPointsSpent).reduce((a, b) => a + b, 0)}
                    onChange={handleStatChange}
                    onConfirm={handleConfirmLevelUp}
                />
            )}

            {adventureEnded && (
                <EndingOverlay
                    type={adventureEnded}
                    characterName={char.name}
                    xpAwarded={adventureEnded === 'victory' ? endingXp : undefined}
                    onReplayLastScene={adventureEnded !== 'victory' ? handleRewind : undefined}
                    onClose={handleDismissEnding}
                />
            )}

            {/* Toast Notifications */}
            <div className="fixed bottom-20 right-4 z-[99] flex flex-col gap-2 max-w-sm pointer-events-none">
                {toasts.map(t => {
                    let bgColor = 'bg-stone-900 border-stone-800 text-stone-200';
                    if (t.type === 'hp-gain') bgColor = 'bg-emerald-950/95 border-emerald-500/30 text-emerald-300';
                    if (t.type === 'hp-loss') bgColor = 'bg-red-950/95 border-red-500/30 text-red-300';
                    if (t.type === 'gold-gain') bgColor = 'bg-amber-950/95 border-amber-500/30 text-gold-400 font-bold';
                    if (t.type === 'gold-loss') bgColor = 'bg-stone-900/95 border-amber-900/30 text-amber-600';
                    if (t.type === 'item-gain') bgColor = 'bg-stone-900/95 border-gold-500/30 text-gold-300';
                    if (t.type === 'item-loss') bgColor = 'bg-stone-900/95 border-stone-800 text-stone-400';
                    if (t.type === 'xp-gain') bgColor = 'bg-purple-950/95 border-purple-500/40 text-purple-200';
                    if (t.type === 'info') bgColor = 'bg-stone-900/95 border-blue-800/40 text-blue-200';

                    return (
                        <div key={t.id} className={`px-4 py-3 rounded-xl border shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300 ${bgColor}`}>
                            <Sparkles className="w-4 h-4 text-gold-400 shrink-0" />
                            <span className="text-sm font-medium">{t.text}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function PlayDashboard() {
    return (
        <Suspense fallback={<div className="h-screen bg-stone-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-gold-500 animate-spin" /></div>}>
            <PlayDashboardContent />
        </Suspense>
    );
}
