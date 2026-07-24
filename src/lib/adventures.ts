import { AdventureDefinition } from './types';

export const ADVENTURE_FILE_MAP: Record<string, string> = {
    'The Missing Heir of Oakhaven': 'oakhaven.json',
    'Goblin Trouble at Millbrook': 'millbrook.json',
    'The Haunted Chapel': 'haunted-chapel.json',
    "Merchant's Lost Caravan": 'lost-caravan.json',
    'Shadows in the Deep Roads': 'deep-roads.json',
    'The Sunken Temple of Thalassia': 'sunken-temple.json',
    'Blood Moon Over Ravenhollow': 'ravenhollow.json',
    'The Siege of Ironkeep': 'ironkeep.json',
    "The Phylactery's Call": 'phylactery.json',
    "Dragon's Lair: Mount Ashenveil": 'ashenveil.json',
    'The Abyssal Breach': 'abyssal-breach.json',
    'Crown of the Forgotten King': 'forgotten-king.json',
};

export const ADVENTURE_DEFINITIONS: AdventureDefinition[] = [
    {
        id: "camp-1",
        title: "The Missing Heir of Oakhaven",
        difficulty: "Beginner",
        estimatedTurns: "15-20",
        tags: ["Investigation", "Roleplay", "Low Combat"],
        image: "/images/adventure-oakhaven.png",
        lore: "The Mayor's son has vanished without a trace. The local guard is baffled, and time is running out. You must follow the clues hidden in the sleepy village of Oakhaven before the trail goes cold.",
        reward: "150 GP, Local Reputation"
    },
    {
        id: "camp-millbrook",
        title: "Goblin Trouble at Millbrook",
        difficulty: "Beginner",
        estimatedTurns: "15-20",
        tags: ["Combat", "Forest", "Goblins"],
        image: "/images/adventure-millbrook.png",
        lore: "The peaceful village of Millbrook is under siege by a well-organized band of goblins. The local mill has been seized, and the winter grain stores are at risk. Can you drive them back?",
        reward: "100 GP, Free Lodging"
    },
    {
        id: "camp-chapel",
        title: "The Haunted Chapel",
        difficulty: "Beginner",
        estimatedTurns: "20",
        tags: ["Undead", "Spooky", "Graveyard"],
        image: "/images/adventure-haunted-chapel.png",
        lore: "A thick, unnatural fog has settled over the Old Shore Chapel. The dead are restless, and the village priest claims to hear voices calling from the crypts. Cleanse the holy ground.",
        reward: "Blessed Amulet, 200 GP"
    },
    {
        id: "camp-caravan",
        title: "Merchant's Lost Caravan",
        difficulty: "Beginner",
        estimatedTurns: "15",
        tags: ["Wilderness", "Survival", "Bandits"],
        image: "/images/adventure-lost-caravan.png",
        lore: "A wealthy merchant's caravan has gone missing in the Whispering Woods. It carried a ledger of vital importance — and a chest of silver. Track the bandits and recover the goods.",
        reward: "250 GP, Merchant Favor"
    },
    {
        id: "camp-2",
        title: "Shadows in the Deep Roads",
        difficulty: "Intermediate",
        estimatedTurns: "30-40",
        tags: ["Dungeon Crawl", "Traps", "High Combat"],
        image: "/images/adventure-deep-roads.png",
        lore: "Dwarven miners have broken into an ancient, sealed crypt deep underground. Strange shadows now stalk the tunnels, and the mining operations have ceased. Clear the crypt and uncover its dark history.",
        reward: "Masterwork Weapon, 500 GP"
    },
    {
        id: "camp-temple",
        title: "The Sunken Temple of Thalassia",
        difficulty: "Intermediate",
        estimatedTurns: "35-45",
        tags: ["Underwater", "Cultists", "Puzzles"],
        image: "/images/adventure-sunken-temple.png",
        lore: "The tides have receded, revealing the ruins of Thalassia for the first time in centuries. A cult of the Deep Ones has occupied the temple, seeking to summon an ancient leviathan. Stop them!",
        reward: "Trident of Waves, 800 GP"
    },
    {
        id: "camp-raven",
        title: "Blood Moon Over Ravenhollow",
        difficulty: "Intermediate",
        estimatedTurns: "40",
        tags: ["Werewolves", "Mystery", "Investigation"],
        image: "/images/adventure-ravenhollow.png",
        lore: "When the moon turns red, the killing starts. Ravenhollow's citizens are living in terror of a beast that stalk the streets. Is it a simple monster, or a curse from within?",
        reward: "Silvered Blade, 1000 GP"
    },
    {
        id: "camp-ironkeep",
        title: "The Siege of Ironkeep",
        difficulty: "Intermediate",
        estimatedTurns: "30",
        tags: ["Warfare", "Orcs", "Defense"],
        image: "/images/adventure-ironkeep.png",
        lore: "Ironkeep is the last bastion against the Orcish Horde. The walls are crumbling, the supplies are low, and the enemy is at the gate. Lead the defense and break the siege.",
        reward: "Knighthood, 1200 GP"
    },
    {
        id: "camp-3",
        title: "The Phylactery's Call",
        difficulty: "Legendary",
        estimatedTurns: "50+ (Epic)",
        tags: ["Lich", "Puzzles", "Lethal Combat", "Magic"],
        image: "/images/adventure-phylactery.png",
        lore: "An ancient prophecy foretells the awakening of the Arch-Lich Vorn. You must infiltrate his hovering obsidian fortress, bypass his arcane wards, and shatter his phylactery before the eclipse.",
        reward: "Legendary Artifact, Kingdom Title"
    },
    {
        id: "camp-ashenveil",
        title: "Dragon's Lair: Mount Ashenveil",
        difficulty: "Legendary",
        estimatedTurns: "50",
        tags: ["Dragon", "Fire", "Treasure"],
        image: "/images/adventure-ashenveil.png",
        lore: "Cinderflame the Red has claimed the volcano of Mount Ashenveil. Entire cities have been reduced to ash to satisfy his greed. Scour the lava tunnels and face the dragon in his hoard.",
        reward: "Dragon Slayer Title, MASSIVE GOLD"
    },
    {
        id: "camp-breach",
        title: "The Abyssal Breach",
        difficulty: "Legendary",
        estimatedTurns: "60",
        tags: ["Demons", "Chaos", "Planar Travel"],
        image: "/images/adventure-abyssal-breach.png",
        lore: "A tear in reality has opened above the capital city. Demons are pouring through, and the world is slowly being consumed by the Abyss. You must cross the threshold and close the gate from the other side.",
        reward: "Planar Warden Status, 5000 GP"
    },
    {
        id: "camp-king",
        title: "Crown of the Forgotten King",
        difficulty: "Legendary",
        estimatedTurns: "70",
        tags: ["Gods", "Lore", "Multiple Endings"],
        image: "/images/adventure-forgotten-king.png",
        lore: "The Forgotten King — a ruler so powerful the gods erased his name — left behind a Crown of Dominion. Three factions race to find it. Will you destroy the ultimate power, or claim it for yourself?",
        reward: "Ultimate Power?, 10,000 GP"
    }
];
