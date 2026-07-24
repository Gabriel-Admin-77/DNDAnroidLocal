/**
 * Status Effects & Conditions System.
 *
 * Tracks active conditions (Poisoned, Blessed, Shielded, Raging, Cursed, etc.)
 * with durations and dice modifier adjustments.
 */

export interface StatusEffect {
    id: string;
    name: string;
    icon: string;
    description: string;
    durationTurns: number;
    modifier: number; // modifier applied to dice checks
    type: 'buff' | 'debuff';
}

export const PRESET_EFFECTS: Record<string, Omit<StatusEffect, 'id'>> = {
    blessed: {
        name: 'Blessed',
        icon: '✨',
        description: '+2 bonus to all ability and skill checks.',
        durationTurns: 4,
        modifier: 2,
        type: 'buff'
    },
    poisoned: {
        name: 'Poisoned',
        icon: '🤢',
        description: '-2 penalty to all physical checks.',
        durationTurns: 3,
        modifier: -2,
        type: 'debuff'
    },
    shielded: {
        name: 'Shielded',
        icon: '🛡️',
        description: '+2 bonus to AC and defensive saves.',
        durationTurns: 3,
        modifier: 2,
        type: 'buff'
    },
    raging: {
        name: 'Raging',
        icon: '🔥',
        description: '+3 bonus to Strength checks and combat damage.',
        durationTurns: 3,
        modifier: 3,
        type: 'buff'
    },
    cursed: {
        name: 'Cursed',
        icon: '👁️',
        description: '-3 penalty to all checks.',
        durationTurns: 5,
        modifier: -3,
        type: 'debuff'
    }
};

export function tickStatusEffects(effects: StatusEffect[]): StatusEffect[] {
    return effects
        .map(e => ({ ...e, durationTurns: e.durationTurns - 1 }))
        .filter(e => e.durationTurns > 0);
}

export function calculateTotalModifier(effects: StatusEffect[]): number {
    return effects.reduce((sum, e) => sum + e.modifier, 0);
}
