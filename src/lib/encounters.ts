/**
 * Random Encounter Engine.
 *
 * Provides dynamic roadside/dungeon encounters during exploration turns.
 */

import { Choice } from './types';

export interface RandomEncounter {
    id: string;
    title: string;
    text: string;
    choices: Choice[];
    effectsOnTrigger?: {
        hp?: number;
        gold?: number;
    };
}

export const RANDOM_ENCOUNTERS: RandomEncounter[] = [
    {
        id: 'wandering-merchant',
        title: 'Wandering Merchant',
        text: 'A hooded peddler resting by a campfire greets you. "Greetings, traveler! Care to trade herbs or rest your weary bones for a moment?"',
        choices: [
            { text: 'Buy a healing potion for 20 GP', next: 'ai_choice' },
            { text: 'Share travel stories over tea', next: 'ai_choice' },
            { text: 'Politely pass by and keep moving', next: 'ai_choice' }
        ]
    },
    {
        id: 'trapped-chest',
        title: 'Mysterious Iron Chest',
        text: 'You spot an old iron-bound chest half-buried under moss and roots. Faint runes glow on the latch.',
        choices: [
            { text: 'Pick the lock carefully', next: 'ai_choice', diceCheck: { stat: 'dexterity', dc: 13, successScene: 'ai_choice', failScene: 'ai_choice' } },
            { text: 'Smash the lock with your weapon', next: 'ai_choice', diceCheck: { stat: 'strength', dc: 15, successScene: 'ai_choice', failScene: 'ai_choice' } },
            { text: 'Leave it alone', next: 'ai_choice' }
        ]
    },
    {
        id: 'goblin-ambush',
        title: 'Forest Ambush',
        text: 'Two goblin raiders leap out from the canopy overhead, snickering as they draw rusty daggers!',
        choices: [
            { text: 'Draw weapon and attack', next: 'ai_choice', diceCheck: { stat: 'strength', dc: 11, successScene: 'ai_choice', failScene: 'ai_choice' } },
            { text: 'Dodge and roll into cover', next: 'ai_choice', diceCheck: { stat: 'dexterity', dc: 12, successScene: 'ai_choice', failScene: 'ai_choice' } }
        ]
    },
    {
        id: 'ancient-shrine',
        title: 'Shrine of the Forgotten God',
        text: 'A weathered stone altar stands shrouded in silver moonlight. Pristine spring water pools at its base.',
        choices: [
            { text: 'Drink the holy water', next: 'ai_choice' },
            { text: 'Offer a gold piece as tribute', next: 'ai_choice' },
            { text: 'Inspect the ancient inscription', next: 'ai_choice', diceCheck: { stat: 'intelligence', dc: 12, successScene: 'ai_choice', failScene: 'ai_choice' } }
        ]
    }
];

export function rollRandomEncounter(chance = 0.2): RandomEncounter | null {
    if (Math.random() < chance) {
        const idx = Math.floor(Math.random() * RANDOM_ENCOUNTERS.length);
        return RANDOM_ENCOUNTERS[idx];
    }
    return null;
}
