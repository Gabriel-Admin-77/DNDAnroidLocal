/**
 * Adventure Journal / Chronicle system.
 *
 * Stores AI-synthesized recaps and chronicle logs of completed campaigns
 * indexed by character or global player profile.
 */

export interface JournalRecord {
    id: string;
    adventureTitle: string;
    characterName: string;
    characterClass: string;
    outcome: 'victory' | 'defeat' | 'retired';
    date: string;
    turnsTaken: number;
    summary: string;
    keyNpcsMet: string[];
    xpEarned: number;
}

const JOURNAL_STORAGE_KEY = 'dnd_app_journal_records';

export function getJournalRecords(): JournalRecord[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(JOURNAL_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveJournalRecord(record: JournalRecord): void {
    if (typeof window === 'undefined') return;
    const current = getJournalRecords();
    current.unshift(record); // newest first
    try {
        localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(current));
    } catch {
        // ignore
    }
}
