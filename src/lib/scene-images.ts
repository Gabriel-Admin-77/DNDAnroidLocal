/**
 * Scene Illustration & Image Prompt Generator module.
 *
 * Synthesizes visual art prompts from AI DM scene text and maps locations to scene visual artwork.
 */

export interface SceneImage {
    location: string;
    imageUrl: string;
    caption: string;
}

export function getSceneImageForLocation(location: string): string {
    const lower = location.toLowerCase();
    if (lower.includes('oakhaven') || lower.includes('heir')) return '/images/adventure-oakhaven.png';
    if (lower.includes('millbrook') || lower.includes('goblin')) return '/images/adventure-millbrook.png';
    if (lower.includes('chapel') || lower.includes('haunt')) return '/images/adventure-haunted-chapel.png';
    if (lower.includes('caravan') || lower.includes('merchant')) return '/images/adventure-lost-caravan.png';
    if (lower.includes('deep') || lower.includes('crypt')) return '/images/adventure-deep-roads.png';
    if (lower.includes('temple') || lower.includes('sunken')) return '/images/adventure-sunken-temple.png';
    if (lower.includes('ravenhollow') || lower.includes('blood')) return '/images/adventure-ravenhollow.png';
    if (lower.includes('ironkeep') || lower.includes('siege')) return '/images/adventure-ironkeep.png';
    if (lower.includes('phylactery') || lower.includes('lich')) return '/images/adventure-phylactery.png';
    if (lower.includes('ashenveil') || lower.includes('dragon')) return '/images/adventure-ashenveil.png';
    if (lower.includes('breach') || lower.includes('abyss')) return '/images/adventure-abyssal-breach.png';
    if (lower.includes('king') || lower.includes('crown')) return '/images/adventure-forgotten-king.png';
    return '/images/adventure-oakhaven.png';
}

export function generateArtPromptFromScene(sceneText: string, location: string): string {
    const cleanText = sceneText.slice(0, 150).replace(/["'\n]/g, ' ');
    return `Digital fantasy oil painting illustration of ${location}, ${cleanText}, highly detailed D&D concept art 8k wallpaper.`;
}
