import { DndArchetype } from './types';

export const DND_ARCHETYPES: DndArchetype[] = [
    {
        name: "Thrain Ironfoot",
        class: "Fighter",
        race: "Human",
        hp: 12,
        stats: { str: 16, dex: 12, con: 15, int: 10, wis: 12, cha: 10 },
        image: "/images/champion-fighter.png",
        description: "A seasoned veteran of many wars, Thrain relies on steel and endurance to overcome any foe."
    },
    {
        name: "Valerius Shadowstep",
        class: "Rogue",
        race: "Elf",
        hp: 10,
        stats: { str: 10, dex: 16, con: 12, int: 14, wis: 12, cha: 10 },
        image: "/images/champion-rogue.png",
        description: "Moving like a whisper in the night, Valerius strikes from the shadows with deadly precision."
    },
    {
        name: "Elowen Moonwhisper",
        class: "Cleric",
        race: "Dwarf",
        hp: 11,
        stats: { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 12 },
        image: "/images/champion-cleric.png",
        description: "A devoted servant of the Moon Weaver, Elowen brings light and healing to a dark world."
    },
    {
        name: "Balthazar Thorne",
        class: "Wizard",
        race: "High Elf",
        hp: 8,
        stats: { str: 8, dex: 14, con: 12, int: 16, wis: 12, cha: 10 },
        image: "/images/champion-wizard.png",
        description: "A master of the arcane who has spent decades unraveling the mysteries of the universe."
    },
    {
        name: "Kaelen the Swift",
        class: "Ranger",
        race: "Halfling",
        hp: 12,
        stats: { str: 10, dex: 16, con: 12, int: 10, wis: 14, cha: 12 },
        image: "/images/champion-ranger.png",
        description: "At home in the wildest forests, Kaelen is a tracker without peer and a master of the bow."
    },
    {
        name: "Gromm the Oathbound",
        class: "Paladin",
        race: "Half-Orc",
        hp: 14,
        stats: { str: 16, dex: 10, con: 14, int: 8, wis: 10, cha: 14 },
        image: "/images/champion-paladin.png",
        description: "Sworn to a sacred oath, Gromm is a bulwark against the darkness, fueled by divine conviction."
    },
    {
        name: "Karg Bloodfury",
        class: "Barbarian",
        race: "Half-Orc",
        hp: 15,
        stats: { str: 17, dex: 13, con: 15, int: 8, wis: 12, cha: 10 },
        image: "/images/champion-barbarian.png",
        description: "Driven by primal instinct, Karg unleashes a terrifying rage that few can withstand."
    },
    {
        name: "Lyra Silverstring",
        class: "Bard",
        race: "Half-Elf",
        hp: 10,
        stats: { str: 10, dex: 14, con: 12, int: 12, wis: 10, cha: 16 },
        image: "/images/champion-bard.png",
        description: "With a silver tongue and a magic lute, Lyra can inspire heroes and charm the fiercest beasts."
    },
    {
        name: "Aria Willowstep",
        class: "Druid",
        race: "Wood Elf",
        hp: 10,
        stats: { str: 10, dex: 14, con: 12, int: 12, wis: 16, cha: 10 },
        image: "/images/champion-druid.png",
        description: "A guardian of the old woods who can command the very forces of nature itself."
    },
    {
        name: "Brother Kenji",
        class: "Monk",
        race: "Human",
        hp: 11,
        stats: { str: 12, dex: 16, con: 14, int: 10, wis: 14, cha: 10 },
        image: "/images/champion-monk.png",
        description: "Having mastered his inner ki, Kenji's hands and feet are as deadly as any steel blade."
    },
    {
        name: "Ignis Emberflame",
        class: "Sorcerer",
        race: "Draconic",
        hp: 9,
        stats: { str: 10, dex: 12, con: 14, int: 10, wis: 10, cha: 16 },
        image: "/images/champion-sorcerer.png",
        description: "Magic flows through Ignis's veins like fire, a gift of his powerful dragon ancestors."
    },
    {
        name: "Malphas the Dark",
        class: "Warlock",
        race: "Tiefling",
        hp: 10,
        stats: { str: 10, dex: 12, con: 12, int: 14, wis: 10, cha: 17 },
        image: "/images/champion-warlock.png",
        description: "Bound to a mysterious patron from beyond, Malphas wields shadows and forbidden knowledge."
    }
];
