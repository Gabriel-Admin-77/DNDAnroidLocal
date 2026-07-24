export interface Profile {
    id: string;
    username: string | null;
    created_at: string | null;
}

export interface Character {
    id: string;
    user_id: string | null;
    name: string;
    class: string | null;
    level: number | null;
    xp: number | null;
    hp_current: number | null;
    hp_max: number | null;
    strength: number | null;
    dexterity: number | null;
    intelligence: number | null;
    wisdom: number | null;
    charisma: number | null;
    constitution: number | null;
    image_url: string | null;
    created_at: string | null;
}

export interface Campaign {
    id: string;
    user_id: string | null;
    character_id: string | null;
    adventure_title: string | null;
    current_turn: number | null;
    time_of_day: string | null;
    weather: string | null;
    is_active: boolean | null;
    last_updated: string | null;
}

export interface ChatLog {
    id: string;
    campaign_id: string | null;
    role: string | null;
    content: string;
    created_at: string | null;
}

export interface InventoryItem {
    id: string;
    campaign_id: string | null;
    item_name: string;
    description: string | null;
    item_type: string | null;
    quantity: number | null;
    sell_value: number | null;
    is_equipped: boolean | null;
    created_at: string | null;
}

export interface CharacterStats {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
}

export interface ArchetypeStats {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
}

export interface Environment {
    time: string;
    weather: string;
    location: string;
    turn: number;
}

export interface DiceRollState {
    roll: number;
    modifier?: number;
    total?: number;
    dc?: number;
    reason?: string;
    visible: boolean;
}

export interface CraftingRecipe {
    name: string;
    materials: { name: string; qty: number }[];
    result: {
        item_name: string;
        description: string;
        item_type: string;
        sell_value: number;
    };
}

export interface AdventureDefinition {
    id: string;
    title: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Legendary';
    estimatedTurns: string;
    tags: string[];
    image: string;
    lore: string;
    reward: string;
}

export interface DndArchetype {
    name: string;
    class: string;
    race: string;
    hp: number;
    stats: ArchetypeStats;
    image: string;
    description: string;
}

export interface DiceCheck {
    stat: string;
    dc: number;
    successScene: string;
    failScene: string;
}

export interface Choice {
    text: string;
    next: string;
    diceCheck?: DiceCheck;
}

export interface StoryLogEntry {
    sceneId: string;
    text: string;
    choiceMade?: string;
    rollResult?: { roll: number; dc: number; stat: string; success: boolean };
    aiChoices?: Choice[];
    activeDiceCheck?: { stat: string; dc: number };
}

export interface SceneEffects {
    hp?: number;
    gold?: number;
    addItem?: string;
    removeItem?: string;
}

export interface ClassAbility {
    name: string;
    description: string;
    type: 'narrative' | 'mechanical';
    effectType?: 'heal' | 'buff';
    dice?: string;
    costType: 'slot' | 'charge' | 'free';
}

export interface StoryEngineRef {
    triggerAction: (actionText: string, rollResult?: { roll: number; dc: number; stat: string; success: boolean }) => Promise<void>;
    insertLocalLog: (entry: StoryLogEntry) => Promise<void>;
    /**
     * Rewinds the story by removing the last log entry and setting the
     * current scene back to whatever came before it. Used by the
     * "Rewind" button on the defeat ending screen so the player can
     * try a different path.
     */
    goBack: () => Promise<void>;
    /**
     * Returns the current story log so the parent can build a save
     * snapshot. Kept in sync with the engine's internal state.
     */
    getStoryLog: () => StoryLogEntry[];
}

export interface QuestSubtask {
    id: string;
    text: string;
    completed: boolean;
}

export interface Quest {
    id: string;
    campaign_id?: string;
    title: string;
    description: string;
    category: 'main' | 'side' | 'personal';
    status: 'active' | 'completed' | 'failed';
    subtasks: QuestSubtask[];
    rewards?: string;
    sourceChoice?: string;
    created_at?: string;
}

export interface NpcMemory {
    id: string;
    campaign_id: string | null;
    name: string;
    role: string | null;
    disposition: 'friendly' | 'neutral' | 'hostile' | 'unknown';
    notes: string | null;
    last_seen_turn: number | null;
    created_at: string | null;
}

