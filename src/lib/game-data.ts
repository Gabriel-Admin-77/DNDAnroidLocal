import { ClassAbility, CraftingRecipe } from './types';

/**
 * Class abilities table used by the character sheet and the AI DM prompt.
 * Lives in /lib so it can be shared between the play page and any
 * future codex/journal pages without duplicating ~50 lines of data.
 */
export const CLASS_ABILITIES: Record<string, ClassAbility[]> = {
    'Fighter': [
        { name: 'Second Wind', description: 'Heal 1d10 + Level HP (consumes 1 charge).', type: 'mechanical', effectType: 'heal', dice: '1d10', costType: 'charge' },
        { name: 'Action Surge', description: 'Take another action this turn.', type: 'narrative', costType: 'free' }
    ],
    'Rogue': [
        { name: 'Sneak Attack', description: 'Deal extra damage to an exposed foe.', type: 'narrative', costType: 'free' },
        { name: 'Thieves Tools', description: 'Try to pick a lock or disable a trap.', type: 'narrative', costType: 'free' }
    ],
    'Cleric': [
        { name: 'Cure Wounds', description: 'Heal 1d8 + Wis modifier HP (consumes 1 spell slot).', type: 'mechanical', effectType: 'heal', dice: '1d8', costType: 'slot' },
        { name: 'Turn Undead', description: 'Repel nearby undead monsters.', type: 'narrative', costType: 'free' }
    ],
    'Wizard': [
        { name: 'Magic Missile', description: 'Unleash automatic force darts at a target.', type: 'narrative', costType: 'slot' },
        { name: 'Detect Magic', description: 'Search the area for magical auras.', type: 'narrative', costType: 'free' }
    ],
    'Ranger': [
        { name: "Hunter's Mark", description: 'Mark a target to trace it and deal extra damage.', type: 'narrative', costType: 'free' },
        { name: 'Cure Wounds', description: 'Heal 1d8 + Wis modifier HP (consumes 1 spell slot).', type: 'mechanical', effectType: 'heal', dice: '1d8', costType: 'slot' }
    ],
    'Paladin': [
        { name: 'Lay on Hands', description: 'Heal exactly 5 HP (consumes 1 charge).', type: 'mechanical', effectType: 'heal', dice: '5', costType: 'charge' },
        { name: 'Divine Smite', description: 'Imbue your weapon with holy power.', type: 'narrative', costType: 'free' }
    ],
    'Barbarian': [
        { name: 'Rage', description: 'Fly into a fury to gain strength and resistance.', type: 'narrative', costType: 'charge' },
        { name: 'Reckless Attack', description: 'Strike with advantage, exposing yourself.', type: 'narrative', costType: 'free' }
    ],
    'Bard': [
        { name: 'Bardic Inspiration', description: 'Inspire your allies or yourself on a check.', type: 'narrative', costType: 'charge' },
        { name: 'Vicious Mockery', description: 'Unleash enchanted insults at a target.', type: 'narrative', costType: 'free' }
    ],
    'Druid': [
        { name: 'Wild Shape', description: 'Transform into a beast (bear or wolf).', type: 'narrative', costType: 'charge' },
        { name: 'Goodberry', description: 'Heal exactly 4 HP (consumes 1 spell slot).', type: 'mechanical', effectType: 'heal', dice: '4', costType: 'slot' }
    ],
    'Monk': [
        { name: 'Flurry of Blows', description: 'Unleash Ki to strike twice in quick succession.', type: 'narrative', costType: 'free' },
        { name: 'Patient Defense', description: 'Focus Ki to dodge attacks.', type: 'narrative', costType: 'free' }
    ],
    'Sorcerer': [
        { name: 'Fireball', description: 'Unleash a sphere of roaring flame.', type: 'narrative', costType: 'slot' },
        { name: 'Sorcery Points', description: 'Tap into your bloodline for magical power.', type: 'narrative', costType: 'free' }
    ],
    'Warlock': [
        { name: 'Eldritch Blast', description: 'Shoot a beam of crackling energy.', type: 'narrative', costType: 'free' },
        { name: 'Hex', description: 'Curse a target, weakening its abilities.', type: 'narrative', costType: 'slot' }
    ]
};

/**
 * Starter crafting recipes. The DM can award more advanced recipes
 * during play, but these are the safe baseline that new players
 * can use to learn the crafting UI.
 */
export const CRAFTING_RECIPES: CraftingRecipe[] = [
    { name: 'Health Potion', materials: [{ name: 'Herb', qty: 2 }, { name: 'Glass Vial', qty: 1 }], result: { item_name: 'Health Potion', description: 'Restores 2d4+2 HP', item_type: 'potion', sell_value: 25 } },
    { name: 'Iron Shortsword', materials: [{ name: 'Iron Ore', qty: 3 }, { name: 'Leather Strips', qty: 1 }], result: { item_name: 'Iron Shortsword', description: '+1 Attack weapon', item_type: 'weapon', sell_value: 30 } },
    { name: 'Leather Armor', materials: [{ name: 'Leather Strips', qty: 4 }], result: { item_name: 'Leather Armor', description: '+1 AC armor', item_type: 'armor', sell_value: 35 } },
    { name: 'Torch Bundle', materials: [{ name: 'Wood', qty: 2 }, { name: 'Cloth', qty: 1 }], result: { item_name: 'Torch Bundle (x5)', description: '5 torches for exploring', item_type: 'misc', sell_value: 3 } },
];
