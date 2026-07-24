/**
 * Player Stats tracking system.
 *
 * Tracks aggregate gameplay statistics across all campaigns:
 * dice rolls, damage, gold, deaths, crafting, play time, etc.
 *
 * Persisted in localStorage as a global record (not per-character)
 * so stats accumulate over the lifetime of the app.
 */

export interface PlayerStats {
    // Campaign stats
    campaignsStarted: number;
    campaignsCompleted: number;
    campaignsFailed: number;
    // Dice stats
    totalDiceRolls: number;
    nat20s: number;
    nat1s: number;
    // Combat stats
    totalDamageDealt: number;
    totalDamageTaken: number;
    totalHealing: number;
    // Economy stats
    totalGoldEarned: number;
    totalGoldSpent: number;
    totalItemsCrafted: number;
    totalItemsSold: number;
    // Social stats
    totalNpcsMet: number;
    // Progression stats
    highestLevelReached: number;
    totalDeaths: number;
    totalVictories: number;
    // Time stats
    totalPlayTimeMs: number;
    // Class diversity
    classesPlayed: string[];
    // Adventures completed
    adventuresCompleted: string[];
}

const STATS_KEY = 'dnd_app_player_stats';

const DEFAULT_STATS: PlayerStats = {
    campaignsStarted: 0,
    campaignsCompleted: 0,
    campaignsFailed: 0,
    totalDiceRolls: 0,
    nat20s: 0,
    nat1s: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    totalHealing: 0,
    totalGoldEarned: 0,
    totalGoldSpent: 0,
    totalItemsCrafted: 0,
    totalItemsSold: 0,
    totalNpcsMet: 0,
    highestLevelReached: 1,
    totalDeaths: 0,
    totalVictories: 0,
    totalPlayTimeMs: 0,
    classesPlayed: [],
    adventuresCompleted: [],
};

export function getPlayerStats(): PlayerStats {
    if (typeof window === 'undefined') return { ...DEFAULT_STATS };
    try {
        const raw = localStorage.getItem(STATS_KEY);
        if (!raw) return { ...DEFAULT_STATS };
        return { ...DEFAULT_STATS, ...JSON.parse(raw) };
    } catch {
        return { ...DEFAULT_STATS };
    }
}

export function savePlayerStats(stats: PlayerStats): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
        // ignore
    }
}

/** Increment a numeric stat by the given delta. */
export function bumpStat(field: keyof PlayerStats, delta: number = 1): PlayerStats {
    const stats = getPlayerStats();
    const current = stats[field];
    if (typeof current === 'number') {
        (stats as unknown as Record<string, number>)[field] = current + delta;
    }
    savePlayerStats(stats);
    return stats;
}

/** Set a numeric stat to the max of its current value and the new value. */
export function maxStat(field: keyof PlayerStats, value: number): PlayerStats {
    const stats = getPlayerStats();
    const current = stats[field];
    if (typeof current === 'number' && value > current) {
        (stats as unknown as Record<string, number>)[field] = value;
    }
    savePlayerStats(stats);
    return stats;
}

/** Add a unique string to an array stat (classesPlayed, adventuresCompleted). */
export function addToArrayStat(field: 'classesPlayed' | 'adventuresCompleted', value: string): PlayerStats {
    const stats = getPlayerStats();
    const arr = stats[field] || [];
    if (!arr.includes(value)) {
        arr.push(value);
        (stats as unknown as Record<string, string[]>)[field] = arr;
        savePlayerStats(stats);
    }
    return stats;
}

/** Format milliseconds as a human-readable duration. */
export function formatPlayTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}
