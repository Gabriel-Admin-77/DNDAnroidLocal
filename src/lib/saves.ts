/**
 * Campaign save/load system. Stores named snapshots of campaign state
 * (character, inventory, story log, env) to localStorage so the player
 * can save at any turn and resume later — even on the same device
 * after closing the app.
 *
 * Each save is a self-contained record keyed by an id; the campaign
 * record itself stays in the DB and points to the active save.
 */

import { Character, InventoryItem, StoryLogEntry, Environment, Quest } from './types';

const SAVE_KEY_PREFIX = 'dnd_app_save_';
const SAVE_INDEX_KEY = 'dnd_app_saves_index';

export interface CampaignSave {
    id: string;
    name: string;
    campaignId: string;
    characterId: string;
    characterName: string;
    adventureTitle: string;
    turn: number;
    time: string;
    weather: string;
    location: string;
    createdAt: string;
    updatedAt: string;
    // Snapshot of the live state at save time.
    character: Character;
    inventory: InventoryItem[];
    storyLog: StoryLogEntry[];
    quests: Quest[];
}

export interface SaveIndexEntry {
    id: string;
    name: string;
    campaignId: string;
    characterId: string;
    characterName: string;
    adventureTitle: string;
    turn: number;
    location: string;
    updatedAt: string;
}

function readIndex(): SaveIndexEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(SAVE_INDEX_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function writeIndex(index: SaveIndexEntry[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(index));
}

function generateId(): string {
    return 'save_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

/** List all saves for a given character (newest first). */
export function listSaves(characterId?: string): SaveIndexEntry[] {
    return readIndex()
        .filter(s => !characterId || s.characterId === characterId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Create or update a save with the given snapshot. */
export function createSave(args: {
    name: string;
    character: Character;
    inventory: InventoryItem[];
    storyLog: StoryLogEntry[];
    quests: Quest[];
    env: Environment;
    campaignId: string;
    saveId?: string;
}): CampaignSave {
    const now = new Date().toISOString();
    const saveId = args.saveId || generateId();
    const save: CampaignSave = {
        id: saveId,
        name: args.name || `Save at ${new Date().toLocaleString()}`,
        campaignId: args.campaignId,
        characterId: args.character.id,
        characterName: args.character.name,
        adventureTitle: args.env.location,
        turn: args.env.turn,
        time: args.env.time,
        weather: args.env.weather,
        location: args.env.location,
        createdAt: now,
        updatedAt: now,
        character: args.character,
        inventory: args.inventory,
        storyLog: args.storyLog,
        quests: args.quests
    };

    if (typeof window !== 'undefined') {
        localStorage.setItem(SAVE_KEY_PREFIX + saveId, JSON.stringify(save));

        // Update index.
        const index = readIndex().filter(s => s.id !== saveId);
        index.push({
            id: save.id,
            name: save.name,
            campaignId: save.campaignId,
            characterId: save.characterId,
            characterName: save.characterName,
            adventureTitle: save.adventureTitle,
            turn: save.turn,
            location: save.location,
            updatedAt: save.updatedAt
        });
        writeIndex(index);
    }
    return save;
}

/** Load a save by id. Returns null if the save doesn't exist. */
export function loadSave(saveId: string): CampaignSave | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(SAVE_KEY_PREFIX + saveId);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/** Delete a save by id. */
export function deleteSave(saveId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SAVE_KEY_PREFIX + saveId);
    writeIndex(readIndex().filter(s => s.id !== saveId));
}
