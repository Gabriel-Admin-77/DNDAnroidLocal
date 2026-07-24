/**
 * Bestiary / Monster Codex module.
 *
 * Tracks encountered monsters across adventures and provides a curated
 * codex of iconic D&D creatures. Auto-populates from NPC memory entries
 * marked as hostile or monster encounters.
 */

export type ThreatLevel = 'Fodder' | 'Low' | 'Medium' | 'High' | 'Boss' | 'Legendary';

export interface BestiaryEntry {
    id: string;
    name: string;
    type: string; // e.g. "Humanoid", "Fiend", "Undead", "Dragon", "Beast"
    threat: ThreatLevel;
    description: string;
    statsOverview: {
        ac: number;
        hp: number;
        primaryAttack: string;
    };
    location: string;
    image: string;
    isDiscovered: boolean;
}

const BESTIARY_STORAGE_KEY = 'dnd_app_bestiary_discovered';

export const BASE_BESTIARY: BestiaryEntry[] = [
    {
        id: 'goblin-scout',
        name: 'Goblin Scout',
        type: 'Humanoid',
        threat: 'Fodder',
        description: 'Small, malicious humanoids that rely on numbers and stealth to ambush unsuspecting travelers.',
        statsOverview: { ac: 13, hp: 7, primaryAttack: 'Scimitar (+4 to hit, 1d6+2 slashing)' },
        location: 'Millbrook Forest',
        image: '/images/adventure-millbrook.png',
        isDiscovered: true
    },
    {
        id: 'skeleton-warrior',
        name: 'Skeleton Warrior',
        type: 'Undead',
        threat: 'Low',
        description: 'Animated by dark necromancy, these unyielding bones obey their master without fear or pain.',
        statsOverview: { ac: 13, hp: 13, primaryAttack: 'Shortsword (+4 to hit, 1d6+2 piercing)' },
        location: 'The Haunted Chapel',
        image: '/images/adventure-haunted-chapel.png',
        isDiscovered: true
    },
    {
        id: 'shadow-stalker',
        name: 'Shadow Stalker',
        type: 'Undead',
        threat: 'Medium',
        description: 'Incorporeal fiends born of dark crypts that drain the vitality of living creatures on contact.',
        statsOverview: { ac: 14, hp: 22, primaryAttack: 'Strength Drain (+4 to hit, 2d6 necrotic)' },
        location: 'Deep Roads',
        image: '/images/adventure-deep-roads.png',
        isDiscovered: false
    },
    {
        id: 'deep-cultist',
        name: 'Deep Sea Cultist',
        type: 'Humanoid',
        threat: 'Medium',
        description: 'Fanatics devoted to leviathans of the ocean depths, wielding shadowy hydro-mancy spells.',
        statsOverview: { ac: 12, hp: 27, primaryAttack: 'Eldritch Blast (+5 to hit, 1d10 force)' },
        location: 'Sunken Temple of Thalassia',
        image: '/images/adventure-sunken-temple.png',
        isDiscovered: false
    },
    {
        id: 'dire-werewolf',
        name: 'Dire Werewolf',
        type: 'Monstrosity',
        threat: 'High',
        description: 'A savage lycanthrope that haunts misty woods. Highly resistant to non-silvered weapons.',
        statsOverview: { ac: 15, hp: 58, primaryAttack: 'Bite & Claws (+6 to hit, 2d8+4 slashing)' },
        location: 'Ravenhollow',
        image: '/images/adventure-ravenhollow.png',
        isDiscovered: false
    },
    {
        id: 'orc-warchief',
        name: 'Orc Warchief',
        type: 'Humanoid',
        threat: 'High',
        description: 'A battle-hardened commander who inspires allies with warcries and cleaves through armor.',
        statsOverview: { ac: 16, hp: 65, primaryAttack: 'Greataxe (+6 to hit, 1d12+4 slashing)' },
        location: 'Ironkeep',
        image: '/images/adventure-ironkeep.png',
        isDiscovered: false
    },
    {
        id: 'arch-lich-vorn',
        name: 'Arch-Lich Vorn',
        type: 'Undead',
        threat: 'Boss',
        description: 'An ancient sorcerer who bound his soul to an obsidian phylactery to achieve eternal dark mastery.',
        statsOverview: { ac: 17, hp: 135, primaryAttack: 'Finger of Death (7d8+30 necrotic)' },
        location: 'Obsidian Citadel',
        image: '/images/adventure-phylactery.png',
        isDiscovered: false
    },
    {
        id: 'cinderflame-red-dragon',
        name: 'Cinderflame the Red Dragon',
        type: 'Dragon',
        threat: 'Legendary',
        description: 'An ancient red dragon whose fiery breath turns armor to liquid metal and incinerates armies.',
        statsOverview: { ac: 19, hp: 210, primaryAttack: 'Fire Breath (18d6 fire damage)' },
        location: 'Mount Ashenveil',
        image: '/images/adventure-ashenveil.png',
        isDiscovered: false
    }
];

export function getDiscoveredMonsterIds(): string[] {
    if (typeof window === 'undefined') return BASE_BESTIARY.filter(b => b.isDiscovered).map(b => b.id);
    try {
        const raw = localStorage.getItem(BESTIARY_STORAGE_KEY);
        if (!raw) {
            const defaults = BASE_BESTIARY.filter(b => b.isDiscovered).map(b => b.id);
            localStorage.setItem(BESTIARY_STORAGE_KEY, JSON.stringify(defaults));
            return defaults;
        }
        return JSON.parse(raw);
    } catch {
        return BASE_BESTIARY.filter(b => b.isDiscovered).map(b => b.id);
    }
}

export function discoverMonster(monsterId: string): void {
    if (typeof window === 'undefined') return;
    const current = getDiscoveredMonsterIds();
    if (!current.includes(monsterId)) {
        current.push(monsterId);
        localStorage.setItem(BESTIARY_STORAGE_KEY, JSON.stringify(current));
    }
}

export function getAllBestiaryEntries(): BestiaryEntry[] {
    const discovered = getDiscoveredMonsterIds();
    return BASE_BESTIARY.map(entry => ({
        ...entry,
        isDiscovered: discovered.includes(entry.id)
    }));
}
