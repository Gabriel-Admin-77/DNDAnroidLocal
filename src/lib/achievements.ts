/**
 * Achievements / medals system.
 *
 * Each achievement has an id, title, description, and a predicate that
 * checks the current character/campaign state. When a predicate
 * transitions from false to true, the achievement is unlocked and
 * the player gets a toast.
 *
 * Persistence is in localStorage keyed by character id.
 */

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string; // emoji for now; could become an icon component later
    check: (ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
    level: number;
    xp: number;
    victories: number;
    campaignsStarted: number;
    classesPlayed: string[];
    maxLevelReached: number;
    adventuresCompleted: string[];
    npcsMet: number;
    // --- Phase 1.1 additions ---
    nat20Count: number;
    nat1Count: number;
    totalDamageTaken: number;
    totalItemsCrafted: number;
    totalGoldEarned: number;
    inventorySize: number;
    consecutiveSuccesses: number;
    currentHp: number;
    currentMaxHp: number;
    timeOfDay: string;
    abilitiesUsed: string[];
    totalDiceRolls: number;
    deathCount: number;
}

const ACHIEVEMENTS_KEY_PREFIX = 'dnd_app_achievements_';
const UNLOCKED_HISTORY_KEY = 'dnd_app_unlocked_history';

function storageKey(characterId: string): string {
    return ACHIEVEMENTS_KEY_PREFIX + characterId;
}

export function getUnlocked(characterId: string): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(storageKey(characterId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function isUnlocked(characterId: string, achievementId: string): boolean {
    return getUnlocked(characterId).includes(achievementId);
}

export function unlockAchievement(characterId: string, achievementId: string): boolean {
    if (isUnlocked(characterId, achievementId)) return false;
    const current = getUnlocked(characterId);
    current.push(achievementId);
    if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey(characterId), JSON.stringify(current));
        // Also log to a global history so future analytics can show
        // which achievements are most popular.
        try {
            const historyRaw = localStorage.getItem(UNLOCKED_HISTORY_KEY);
            const history: { id: string; at: string }[] = historyRaw ? JSON.parse(historyRaw) : [];
            history.push({ id: achievementId, at: new Date().toISOString() });
            localStorage.setItem(UNLOCKED_HISTORY_KEY, JSON.stringify(history));
        } catch {
            // ignore
        }
    }
    return true;
}

export const ACHIEVEMENTS: Achievement[] = [
    // === Original achievements ===
    {
        id: 'first-steps',
        title: 'First Steps',
        description: 'Embark on your first adventure.',
        icon: '🚶',
        check: (ctx) => ctx.campaignsStarted >= 1
    },
    {
        id: 'first-victory',
        title: 'Triumphant',
        description: 'Win your first adventure.',
        icon: '🏆',
        check: (ctx) => ctx.victories >= 1
    },
    {
        id: 'level-five',
        title: 'Apprentice No More',
        description: 'Reach character level 5.',
        icon: '⭐',
        check: (ctx) => ctx.level >= 5
    },
    {
        id: 'level-ten',
        title: 'Veteran',
        description: 'Reach character level 10.',
        icon: '🌟',
        check: (ctx) => ctx.level >= 10
    },
    {
        id: 'level-twenty',
        title: 'Living Legend',
        description: 'Reach character level 20 — the pinnacle of mortal power.',
        icon: '👑',
        check: (ctx) => ctx.level >= 20
    },
    {
        id: 'three-victories',
        title: 'Seasoned Hero',
        description: 'Win three adventures.',
        icon: '⚔️',
        check: (ctx) => ctx.victories >= 3
    },
    {
        id: 'all-difficulties',
        title: 'Courage in All Forms',
        description: 'Complete at least one adventure of each difficulty.',
        icon: '🎖️',
        // Best-effort check — looks at completed adventure titles, but
        // we don't track difficulty here. The full check needs the
        // ADVENTURE_DEFINITIONS list which the lib intentionally avoids.
        check: (ctx) => ctx.adventuresCompleted.length >= 3
    },
    {
        id: 'social-butterfly',
        title: 'Well-Connected',
        description: 'Meet 10 different NPCs across your adventures.',
        icon: '🤝',
        check: (ctx) => ctx.npcsMet >= 10
    },
    {
        id: 'class-collector',
        title: 'Class Collector',
        description: 'Play 3 different character classes.',
        icon: '🎭',
        check: (ctx) => new Set(ctx.classesPlayed).size >= 3
    },
    // === Phase 1.1 — New achievements ===
    {
        id: 'natural-twenty',
        title: 'Natural Twenty!',
        description: 'Roll a natural 20 on a dice check.',
        icon: '🎯',
        check: (ctx) => ctx.nat20Count >= 1
    },
    {
        id: 'critical-fail',
        title: 'Fumble!',
        description: 'Roll a natural 1 on a dice check. Oops.',
        icon: '💥',
        check: (ctx) => ctx.nat1Count >= 1
    },
    {
        id: 'deaths-door',
        title: "Death's Door",
        description: 'Survive a scene with 1 HP remaining.',
        icon: '💀',
        check: (ctx) => ctx.currentHp === 1 && ctx.currentMaxHp > 1
    },
    {
        id: 'hoarder',
        title: 'Hoarder',
        description: 'Have 20 or more items in your inventory.',
        icon: '🧳',
        check: (ctx) => ctx.inventorySize >= 20
    },
    {
        id: 'iron-wall',
        title: 'Iron Wall',
        description: 'Take 50+ total damage in one campaign and survive.',
        icon: '🛡️',
        check: (ctx) => ctx.totalDamageTaken >= 50
    },
    {
        id: 'combo-master',
        title: 'Combo Master',
        description: 'Make 3 consecutive successful dice checks.',
        icon: '🗡️',
        check: (ctx) => ctx.consecutiveSuccesses >= 3
    },
    {
        id: 'night-owl',
        title: 'Night Owl',
        description: 'Play a scene during Night time.',
        icon: '🌙',
        check: (ctx) => ctx.timeOfDay.toLowerCase().includes('night')
    },
    {
        id: 'alchemist',
        title: 'Alchemist',
        description: 'Craft 5 items total.',
        icon: '🧪',
        check: (ctx) => ctx.totalItemsCrafted >= 5
    },
    {
        id: 'wealthy',
        title: 'Wealthy',
        description: 'Accumulate 1,000+ gold across your career.',
        icon: '💰',
        check: (ctx) => ctx.totalGoldEarned >= 1000
    },
    {
        id: 'dice-addict',
        title: 'Dice Addict',
        description: 'Roll dice 50 times total.',
        icon: '🎲',
        check: (ctx) => ctx.totalDiceRolls >= 50
    },
    {
        id: 'five-victories',
        title: 'Legendary Champion',
        description: 'Win five adventures.',
        icon: '🔱',
        check: (ctx) => ctx.victories >= 5
    },
    {
        id: 'phoenix',
        title: 'Phoenix',
        description: 'Die and come back — complete an adventure after dying at least once.',
        icon: '🔥',
        check: (ctx) => ctx.deathCount >= 1 && ctx.victories >= 1
    },
];

/** Check all achievements for a character and unlock any new ones. Returns IDs that were newly unlocked. */
export function checkAchievements(characterId: string, ctx: AchievementContext): string[] {
    const newlyUnlocked: string[] = [];
    for (const a of ACHIEVEMENTS) {
        if (isUnlocked(characterId, a.id)) continue;
        try {
            if (a.check(ctx)) {
                if (unlockAchievement(characterId, a.id)) {
                    newlyUnlocked.push(a.id);
                }
            }
        } catch {
            // ignore
        }
    }
    return newlyUnlocked;
}

export function getAchievementById(id: string): Achievement | undefined {
    return ACHIEVEMENTS.find(a => a.id === id);
}
