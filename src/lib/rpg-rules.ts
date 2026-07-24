/**
 * D&D 5e rules helpers used by the player character sheet,
 * the level-up flow, and the short/long rest flow.
 *
 * Sources: 5e SRD. All values are intentionally simple — we only need
 * the parts that drive the actual UI/UX (no spell slots, no proficiency
 * bonus tables yet — those are in the extension backlog).
 */

/** XP thresholds by level (5e). */
const XP_THRESHOLDS: readonly number[] = [
    0,        // level 1
    300,      // level 2
    900,      // level 3
    2700,     // level 4
    6500,     // level 5
    14000,    // level 6
    23000,    // level 7
    34000,    // level 8
    48000,    // level 9
    64000,    // level 10
    85000,    // level 11
    100000,   // level 12
    120000,   // level 13
    140000,   // level 14
    165000,   // level 15
    195000,   // level 16
    225000,   // level 17
    265000,   // level 18
    305000,   // level 19
    355000,   // level 20
];

/** Returns the highest level reachable for the given XP total. */
export function getLevelForXp(xp: number): number {
    if (xp <= 0) return 1;
    let level = 1;
    for (let i = 1; i < XP_THRESHOLDS.length; i++) {
        if (xp >= XP_THRESHOLDS[i]) {
            level = i + 1;
        } else {
            break;
        }
    }
    return level;
}

/** Returns the XP threshold required to reach the given level. */
export function getXpForLevel(level: number): number {
    if (level < 1) return 0;
    if (level > XP_THRESHOLDS.length) return XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
    return XP_THRESHOLDS[level - 1];
}

/** Hit die size (the maximum roll) per class. */
export function getHitDieForClass(charClass: string | null | undefined): number {
    switch (charClass) {
        case 'Fighter':
        case 'Paladin':
        case 'Ranger':
            return 10;
        case 'Barbarian':
            return 12;
        case 'Wizard':
        case 'Sorcerer':
            return 6;
        case 'Bard':
        case 'Cleric':
        case 'Druid':
        case 'Monk':
        case 'Warlock':
        case 'Rogue':
            return 8;
        default:
            return 8;
    }
}

/**
 * Compute the HP increase when a character levels up.
 * Uses the average of the hit die (rounded up) + Con modifier per level,
 * matching the standard 5e "average" rule.
 */
export function getHpGainOnLevelUp(
    charClass: string | null | undefined,
    newConstitution: number,
    levelsGained: number
): number {
    if (levelsGained <= 0) return 0;
    const hitDie = getHitDieForClass(charClass);
    const avgRoll = Math.floor(hitDie / 2) + 1; // d6 -> 4, d8 -> 5, d10 -> 6, d12 -> 7
    const conMod = Math.floor((newConstitution - 10) / 2);
    return (avgRoll + conMod) * levelsGained;
}

/**
 * Roll a hit die for short rest healing and return the result + the
 * constitution modifier that was applied. Used by the short-rest flow.
 */
export function rollHitDieForShortRest(charClass: string | null | undefined, constitution: number): {
    roll: number;
    constitutionMod: number;
    total: number;
} {
    const hitDie = getHitDieForClass(charClass);
    const roll = Math.floor(Math.random() * hitDie) + 1;
    const constitutionMod = Math.floor((constitution - 10) / 2);
    const total = Math.max(1, roll + constitutionMod);
    return { roll, constitutionMod, total };
}

/** 5e ability modifier for a stat value. */
export function getModifier(stat: number): number {
    return Math.floor((stat - 10) / 2);
}
