/**
 * Multiplayer / Party Mode state and room helper module.
 *
 * Provides real-time party lobby management and room state structure.
 */

export interface PartyMember {
    id: string;
    username: string;
    characterName: string;
    characterClass: string;
    level: number;
    hpCurrent: number;
    hpMax: number;
    isHost: boolean;
    isReady: boolean;
}

export interface PartyRoom {
    roomCode: string;
    adventureTitle: string;
    hostId: string;
    currentTurnMemberId: string;
    members: PartyMember[];
    isGameStarted: boolean;
}

export function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
