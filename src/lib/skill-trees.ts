/**
 * Skill Tree / Feat System module.
 *
 * Provides branching subclass skill trees unlocked with skill points earned on level-ups.
 */

export interface SkillNode {
    id: string;
    name: string;
    description: string;
    tier: number; // 1, 2, 3
    cost: number; // skill points
    unlocked: boolean;
    prerequisiteId?: string;
    icon: string;
}

export const CLASS_SKILL_TREES: Record<string, SkillNode[]> = {
    Fighter: [
        { id: 'f-1', name: 'Weapon Master', description: '+1 damage to all melee weapon attacks.', tier: 1, cost: 1, unlocked: true, icon: '⚔️' },
        { id: 'f-2', name: 'Heavy Armor Mastery', description: 'Reduce non-magical damage by 2.', tier: 2, cost: 1, unlocked: false, prerequisiteId: 'f-1', icon: '🛡️' },
        { id: 'f-3', name: 'Indomitable Will', description: 'Reroll one failed saving throw per combat.', tier: 3, cost: 2, unlocked: false, prerequisiteId: 'f-2', icon: '👑' }
    ],
    Rogue: [
        { id: 'r-1', name: 'Shadow Step', description: '+2 advantage on stealth and agility checks.', tier: 1, cost: 1, unlocked: true, icon: '👣' },
        { id: 'r-2', name: 'Lethal Precision', description: 'Critical strikes deal double damage.', tier: 2, cost: 1, unlocked: false, prerequisiteId: 'r-1', icon: '🗡️' },
        { id: 'r-3', name: 'Evasion', description: 'Take half damage from area attacks.', tier: 3, cost: 2, unlocked: false, prerequisiteId: 'r-2', icon: '⚡' }
    ],
    Wizard: [
        { id: 'w-1', name: 'Arcane Focus', description: '+1 spell slot capacity.', tier: 1, cost: 1, unlocked: true, icon: '🔮' },
        { id: 'w-2', name: 'Spell Sculpting', description: 'Area spells do not injure friendly allies.', tier: 2, cost: 1, unlocked: false, prerequisiteId: 'w-1', icon: '✨' },
        { id: 'w-3', name: 'Archmage Mastery', description: 'Regenerate 1 spell slot after taking a short rest.', tier: 3, cost: 2, unlocked: false, prerequisiteId: 'w-2', icon: '🌟' }
    ]
};

export function getSkillTreeForClass(charClass: string): SkillNode[] {
    return CLASS_SKILL_TREES[charClass] || CLASS_SKILL_TREES.Fighter;
}
