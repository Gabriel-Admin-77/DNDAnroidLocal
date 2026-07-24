/**
 * Companion System module.
 *
 * Manages active party companions who assist in combat and narrative scenes.
 */

export interface Companion {
    id: string;
    name: string;
    class: string;
    hpCurrent: number;
    hpMax: number;
    loyalty: number; // 0 - 100
    perk: string;
    image: string;
}

export const RECRUITABLE_COMPANIONS: Companion[] = [
    {
        id: 'sir-gideon',
        name: 'Sir Gideon the Valiant',
        class: 'Paladin',
        hpCurrent: 24,
        hpMax: 24,
        loyalty: 80,
        perk: 'Aura of Protection: +1 to armor and defensive checks',
        image: '/images/champion-paladin.png'
    },
    {
        id: 'whisper-elyse',
        name: 'Elyse Nightshade',
        class: 'Rogue Scout',
        hpCurrent: 18,
        hpMax: 18,
        loyalty: 75,
        perk: 'Scout Ahead: Detects hidden traps and ambushes',
        image: '/images/champion-rogue.png'
    },
    {
        id: 'brother-theron',
        name: 'Brother Theron',
        class: 'Cleric Healer',
        hpCurrent: 20,
        hpMax: 20,
        loyalty: 90,
        perk: 'Blessing of Healing: Heals 5 HP after each scene',
        image: '/images/champion-cleric.png'
    }
];
