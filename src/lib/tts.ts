/**
 * Client-side text-to-speech using the Web Speech API.
 *
 * The Android WebView (Chrome) ships with system TTS voices, so this
 * works out of the box on the user's primary target without any
 * extra downloads or API keys.
 *
 * Settings (voice, rate, pitch, enabled) are stored in localStorage
 * so the player's choice persists between sessions.
 */

const STORAGE_KEY = 'dnd_app_tts_settings';

export interface TtsSettings {
    enabled: boolean;
    rate: number; // 0.5 - 2.0
    pitch: number; // 0.0 - 2.0
    voiceName: string | null;
    autoNarrate: boolean; // auto-play new scenes
    volume: number; // 0.0 - 1.0
}

const DEFAULT_SETTINGS: TtsSettings = {
    enabled: false,
    rate: 0.95,
    pitch: 0.9,
    voiceName: null,
    autoNarrate: true,
    volume: 0.9,
};

export function getTtsSettings(): TtsSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_SETTINGS;
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function saveTtsSettings(settings: Partial<TtsSettings>): TtsSettings {
    const merged = { ...getTtsSettings(), ...settings };
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
    return merged;
}

/** Return available TTS voices (browser-dependent). */
export function listVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            resolve([]);
            return;
        }
        const synth = window.speechSynthesis;
        const existing = synth.getVoices();
        if (existing && existing.length > 0) {
            resolve(existing);
            return;
        }
        // Some browsers fire the voiceschanged event asynchronously.
        const handler = () => {
            synth.removeEventListener('voiceschanged', handler);
            resolve(synth.getVoices() || []);
        };
        synth.addEventListener('voiceschanged', handler);
        // Safety timeout so we never hang on a browser that doesn't fire the event.
        setTimeout(() => {
            synth.removeEventListener('voiceschanged', handler);
            resolve(synth.getVoices() || []);
        }, 1000);
    });
}

/** Pick a voice matching the user's saved preference, else a sensible default. */
function pickVoice(voices: SpeechSynthesisVoice[], preferred: string | null): SpeechSynthesisVoice | null {
    if (voices.length === 0) return null;
    if (preferred) {
        const match = voices.find(v => v.name === preferred);
        if (match) return match;
    }
    // Prefer a deeper / English voice for the DM narrator feel.
    const english = voices.filter(v => v.lang?.toLowerCase().startsWith('en'));
    const pool = english.length > 0 ? english : voices;
    // Heuristic: pick a voice whose name doesn't scream "child" or "female".
    const deep = pool.find(v => /male|deep|baritone|daniel|alex|fred/i.test(v.name));
    if (deep) return deep;
    return pool[0];
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

/** Speak the given text with current TTS settings. Cancels any in-flight narration. */
export function speak(text: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const settings = getTtsSettings();
    if (!settings.enabled) return;

    // Clean the text: drop markdown asterisks, collapse whitespace.
    const cleaned = text
        .replace(/[*_`~]/g, '')
        .replace(/\n+/g, '. ')
        .trim();

    if (!cleaned) return;

    try {
        window.speechSynthesis.cancel();
    } catch {
        // ignore
    }

    const utter = new SpeechSynthesisUtterance(cleaned);
    utter.rate = settings.rate;
    utter.pitch = settings.pitch;
    utter.volume = settings.volume;
    listVoices().then(voices => {
        const voice = pickVoice(voices, settings.voiceName);
        if (voice) utter.voice = voice;
        try {
            window.speechSynthesis.speak(utter);
        } catch (e) {
            console.warn('[TTS] speak failed:', e);
        }
    });
    currentUtterance = utter;
}

/** Stop any in-flight TTS playback. Safe to call when nothing is playing. */
export function stopSpeaking(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
        window.speechSynthesis.cancel();
    } catch {
        // ignore
    }
    currentUtterance = null;
}

/** Quick test: returns true if the browser exposes a usable TTS engine. */
export function isTtsSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}
