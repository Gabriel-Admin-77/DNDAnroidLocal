/**
 * NPC memory store. The DM prompt asks the AI to return an "npcs" array
 * with the named characters in the current scene; we persist those
 * here and inject the most-recent 5 into future prompts so the AI
 * remembers recurring characters.
 */

import { NpcMemory } from './types';

const NPC_KEY_PREFIX = 'dnd_app_npcs_';

function key(campaignId: string): string {
    return NPC_KEY_PREFIX + campaignId;
}

export function listNpcs(campaignId: string): NpcMemory[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(key(campaignId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function writeNpcs(campaignId: string, npcs: NpcMemory[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key(campaignId), JSON.stringify(npcs));
}

/**
 * Merge a batch of AI-returned NPCs into the campaign's NPC list.
 * Matches by name (case-insensitive). Updates disposition/role if
 * the AI provides a newer description; otherwise leaves existing data.
 */
export function mergeNpcs(campaignId: string, incoming: Partial<NpcMemory>[]): NpcMemory[] {
    const existing = listNpcs(campaignId);
    const now = new Date().toISOString();

    for (const npc of incoming) {
        if (!npc.name) continue;
        const idx = existing.findIndex(
            e => e.name.toLowerCase() === npc.name!.toLowerCase()
        );
        if (idx >= 0) {
            existing[idx] = {
                ...existing[idx],
                ...npc,
                name: existing[idx].name // preserve casing
            } as NpcMemory;
        } else {
            existing.push({
                id: 'npc_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
                campaign_id: campaignId,
                name: npc.name,
                role: npc.role || null,
                disposition: npc.disposition || 'unknown',
                notes: npc.notes || null,
                last_seen_turn: npc.last_seen_turn || null,
                created_at: now
            } as NpcMemory);
        }
    }

    writeNpcs(campaignId, existing);
    return existing;
}

/** Return up to `limit` NPCs in a prompt-friendly form. */
export function getNpcContext(campaignId: string, limit = 5): { name: string; disposition: string }[] {
    return listNpcs(campaignId)
        .slice(-limit)
        .map(n => ({ name: n.name, disposition: n.disposition }));
}
