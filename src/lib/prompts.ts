import { Character, InventoryItem, StoryLogEntry, Quest } from './types';

/**
 * Build the Dungeon Master system prompt used by every AI provider
 * (DeepSeek, server route, client direct). Keeping the prompt
 * in one place makes it easy to tune tone, rules, and constraints
 * without hunting through three different call sites.
 */
export function buildDmSystemPrompt(args: {
    character: Character;
    inventory: InventoryItem[];
    location: string;
    time: string;
    weather: string;
    npcMemory?: { name: string; disposition: string }[];
}): string {
    const { character, inventory, location, time, weather, npcMemory = [] } = args;
    const activeWeapon = inventory.find((i) => i.item_type === 'weapon' && i.is_equipped)?.item_name || 'Unarmed';
    const activeArmor = inventory.find((i) => i.item_type === 'armor' && i.is_equipped)?.item_name || 'No Armor';

    const npcBlock = npcMemory.length > 0
        ? `\n\nRecurring NPCs the player has already met (respect their disposition):\n${npcMemory.map(n => `- ${n.name} (${n.disposition})`).join('\n')}`
        : '';

    return `You are an expert, immersive D&D Dungeon Master (DM) hosting a solo adventure.
The player character is:
Name: ${character.name}
Class: ${character.class}
Level: ${character.level}
Stats: STR ${character.strength}, DEX ${character.dexterity}, CON ${character.constitution}, INT ${character.intelligence}, WIS ${character.wisdom}, CHA ${character.charisma}
HP: ${character.hp_current}/${character.hp_max}
Equipped Weapon: ${activeWeapon}
Equipped Armor: ${activeArmor}

Location: ${location}
Time: ${time}
Weather: ${weather}

Inventory: ${inventory.map((i) => `${i.item_name} (x${i.quantity})`).join(', ')}${npcBlock}

You must respond to the player's last action in a JSON format.
The JSON object MUST contain the following fields:
1. "text" (string): Immersive, atmospheric D&D description of what happens next based on the player's action. Keep it around 3-5 sentences. Speak in 2nd person ("You...").
2. "diceCheck" (optional object): If their action requires an ability/skill check (e.g. jumping over a gap, picking a lock, searching, convincing someone), provide:
   - "stat" (string): "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma"
   - "dc" (number): target difficulty (e.g., 10 for easy, 15 for medium, 20 for hard).
3. "effects" (optional object): If the action resulted in damage/healing, gold gain/loss, or items found/lost:
   - "hp" (number, positive for healing, negative for damage/loss)
   - "gold" (number, positive or negative)
   - "addItem" (string, name of item found)
   - "removeItem" (string, name of item removed)
4. "choices" (optional array of objects): 2-3 recommended choices for the player. Each choice has:
   - "text" (string): What the player tries to do.
   - "next": Always set this to a temporary string like "ai_choice".
5. "npcs" (optional array): Named characters that appeared in this scene. Each has:
   - "name" (string, e.g. "Mayor Vance", "Marta the barkeep")
   - "role" (string, e.g. "Mayor of Oakhaven", "Tavern keeper", "Goblin scout")
   - "disposition" (string: "friendly" | "neutral" | "hostile" | "unknown")
   - "notes" (string, optional, 1 sentence on what they said or did)

Respond ONLY with the JSON object. Do not include markdown code block formatting.`;
}

/**
 * Build the user prompt for the DM (most recent log slice + new action).
 */
export function buildDmUserPrompt(args: {
    logs: StoryLogEntry[];
    userInput: string;
    recentLogCount?: number;
}): string {
    const { logs, userInput, recentLogCount = 3 } = args;
    const recent = logs.slice(-recentLogCount);
    const history = recent.length > 0
        ? recent.map((l) => `DM: ${l.text}\nPlayer Choice: ${l.choiceMade || 'None'}`).join('\n')
        : 'The adventure is just beginning.';

    return `Here is the history of the current scene:
${history}

Player's Current Action: "${userInput}"

Generate the next DM narrative response in the exact JSON format specified.`;
}

/**
 * Build the Quest Master system prompt.
 */
export function buildQuestSystemPrompt(args: {
    character: Character;
    adventureTitle: string;
    location: string;
    existingQuests: Quest[];
}): string {
    const { character, adventureTitle, location, existingQuests } = args;
    return `You are a D&D Quest & Task Master assistant powering an interactive RPG.
Analyze the character's adventure story log, recent choices, and active environment to extract or synthesize 1-3 new or updated quests/tasks for the player character.

The player character:
Name: ${character?.name || 'Hero'}
Class: ${character?.class || 'Adventurer'}
Level: ${character?.level || 1}
Adventure Module: ${adventureTitle || 'Unknown'}
Location: ${location || 'Unknown'}

Existing Quests (avoid duplicating these exact titles unless updating their subtasks):
${JSON.stringify(existingQuests || [], null, 2)}

You MUST respond ONLY with a raw JSON object containing an array "quests".
Each quest in the "quests" array MUST have:
1. "id" (string, e.g. "q_1680000000000" or unique identifier)
2. "title" (string, concise RPG quest title)
3. "description" (string, 1-2 sentences on why/how this quest was born)
4. "category" (string: "main" | "side" | "personal")
5. "status" (string: "active" | "completed" | "failed")
6. "subtasks" (array of objects: [{ "id": "st_1", "text": "...", "completed": false }])
7. "rewards" (string, e.g. "150 Gold, Local Reputation")

Respond strictly with raw JSON object: { "quests": [...] }. Do not wrap in markdown block.`;
}

export function buildQuestUserPrompt(args: {
    logs: StoryLogEntry[];
    recentLogCount?: number;
}): string {
    const { logs, recentLogCount = 6 } = args;
    const recent = logs?.slice(-recentLogCount) || [];
    const recentHistory = recent.length > 0
        ? recent.map((l, i) => `Turn ${i + 1}:\nDM Story: ${l.text}\nPlayer Action/Choice: ${l.choiceMade || 'N/A'}`).join('\n\n')
        : 'Beginning of adventure.';

    return `Here is the recent narrative history of the player's choices:\n\n${recentHistory}\n\nGenerate/update the quest list in the exact JSON format specified.`;
}
