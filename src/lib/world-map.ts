/**
 * World Map module.
 *
 * Coordinates, unlock statuses, and connections for campaign adventure locations.
 */

export interface MapNode {
    id: string;
    adventureTitle: string;
    x: number; // percentage 0 - 100
    y: number; // percentage 0 - 100
    difficulty: 'Beginner' | 'Intermediate' | 'Legendary';
    region: string;
    isUnlocked: boolean;
    image: string;
    connectedNodeIds: string[];
}

export const MAP_NODES: MapNode[] = [
    {
        id: 'oakhaven',
        adventureTitle: 'The Missing Heir of Oakhaven',
        x: 25,
        y: 65,
        difficulty: 'Beginner',
        region: 'Greenwood Valley',
        isUnlocked: true,
        image: '/images/adventure-oakhaven.png',
        connectedNodeIds: ['millbrook', 'deep-roads']
    },
    {
        id: 'millbrook',
        adventureTitle: 'Goblin Trouble at Millbrook',
        x: 42,
        y: 75,
        difficulty: 'Beginner',
        region: 'Millbrook Forest',
        isUnlocked: true,
        image: '/images/adventure-millbrook.png',
        connectedNodeIds: ['oakhaven', 'haunted-chapel']
    },
    {
        id: 'haunted-chapel',
        adventureTitle: 'The Haunted Chapel',
        x: 60,
        y: 80,
        difficulty: 'Beginner',
        region: 'Old Coast Shore',
        isUnlocked: true,
        image: '/images/adventure-haunted-chapel.png',
        connectedNodeIds: ['millbrook', 'sunken-temple']
    },
    {
        id: 'deep-roads',
        adventureTitle: 'Shadows in the Deep Roads',
        x: 35,
        y: 45,
        difficulty: 'Intermediate',
        region: 'Underdark Tunnel Pass',
        isUnlocked: false,
        image: '/images/adventure-deep-roads.png',
        connectedNodeIds: ['oakhaven', 'ravenhollow', 'ironkeep']
    },
    {
        id: 'sunken-temple',
        adventureTitle: 'The Sunken Temple of Thalassia',
        x: 75,
        y: 60,
        difficulty: 'Intermediate',
        region: 'Azure Sea Coast',
        isUnlocked: false,
        image: '/images/adventure-sunken-temple.png',
        connectedNodeIds: ['haunted-chapel', 'phylactery']
    },
    {
        id: 'ravenhollow',
        adventureTitle: 'Blood Moon Over Ravenhollow',
        x: 20,
        y: 30,
        difficulty: 'Intermediate',
        region: 'Misty Mountains',
        isUnlocked: false,
        image: '/images/adventure-ravenhollow.png',
        connectedNodeIds: ['deep-roads', 'ashenveil']
    },
    {
        id: 'ironkeep',
        adventureTitle: 'The Siege of Ironkeep',
        x: 55,
        y: 35,
        difficulty: 'Intermediate',
        region: 'Northern Marches',
        isUnlocked: false,
        image: '/images/adventure-ironkeep.png',
        connectedNodeIds: ['deep-roads', 'phylactery']
    },
    {
        id: 'phylactery',
        adventureTitle: "The Phylactery's Call",
        x: 70,
        y: 25,
        difficulty: 'Legendary',
        region: 'Obsidian Citadel',
        isUnlocked: false,
        image: '/images/adventure-phylactery.png',
        connectedNodeIds: ['ironkeep', 'sunken-temple', 'ashenveil']
    },
    {
        id: 'ashenveil',
        adventureTitle: "Dragon's Lair: Mount Ashenveil",
        x: 45,
        y: 15,
        difficulty: 'Legendary',
        region: 'Ashenveil Peaks',
        isUnlocked: false,
        image: '/images/adventure-ashenveil.png',
        connectedNodeIds: ['ravenhollow', 'phylactery']
    }
];

const UNLOCKED_MAP_STORAGE_KEY = 'dnd_app_unlocked_map_nodes';

export function getUnlockedNodeIds(): string[] {
    if (typeof window === 'undefined') return MAP_NODES.filter(n => n.isUnlocked).map(n => n.id);
    try {
        const raw = localStorage.getItem(UNLOCKED_MAP_STORAGE_KEY);
        if (!raw) {
            const defaults = MAP_NODES.filter(n => n.isUnlocked).map(n => n.id);
            localStorage.setItem(UNLOCKED_MAP_STORAGE_KEY, JSON.stringify(defaults));
            return defaults;
        }
        return JSON.parse(raw);
    } catch {
        return MAP_NODES.filter(n => n.isUnlocked).map(n => n.id);
    }
}

export function unlockMapNode(nodeId: string): void {
    if (typeof window === 'undefined') return;
    const current = getUnlockedNodeIds();
    if (!current.includes(nodeId)) {
        current.push(nodeId);
        localStorage.setItem(UNLOCKED_MAP_STORAGE_KEY, JSON.stringify(current));
    }
}
