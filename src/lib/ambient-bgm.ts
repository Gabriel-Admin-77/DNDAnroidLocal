/**
 * Procedural ambient BGM using the Web Audio API.
 *
 * No audio files needed — the engine synthesizes a soft drone in
 * the browser based on the adventure "mood" (peaceful, tense,
 * combat, dungeon, victory). This keeps the APK small and means
 * the BGM always matches the current scene.
 *
 * Player can mute and adjust master volume from Settings.
 */

export type AmbientMood = 'peaceful' | 'tense' | 'combat' | 'dungeon' | 'victory' | 'none';

const STORAGE_KEY = 'dnd_app_bgm_settings';

export interface BgmSettings {
    enabled: boolean;
    volume: number; // 0..1
}

const DEFAULT_SETTINGS: BgmSettings = {
    enabled: false,
    volume: 0.35,
};

export function getBgmSettings(): BgmSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_SETTINGS;
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function saveBgmSettings(settings: Partial<BgmSettings>): BgmSettings {
    const merged = { ...getBgmSettings(), ...settings };
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
    return merged;
}

/** Map a free-text location string to a mood. */
export function moodForLocation(location: string | null | undefined): AmbientMood {
    if (!location) return 'peaceful';
    const lower = location.toLowerCase();
    if (lower.includes('crypt') || lower.includes('haunt') || lower.includes('undead') || lower.includes('chapel')) return 'dungeon';
    if (lower.includes('combat') || lower.includes('siege') || lower.includes('war')) return 'combat';
    if (lower.includes('deep') || lower.includes('under') || lower.includes('sunken') || lower.includes('abyss')) return 'dungeon';
    if (lower.includes('forest') || lower.includes('village') || lower.includes('tavern') || lower.includes('oakhaven') || lower.includes('millbrook')) return 'peaceful';
    if (lower.includes('ruin') || lower.includes('temple') || lower.includes('keep') || lower.includes('mount') || lower.includes('ashenveil')) return 'tense';
    return 'peaceful';
}

class AmbientEngine {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private nodes: AudioNode[] = [];
    private currentMood: AmbientMood = 'none';
    private targetVolume = 0.3;
    private fadeInterval: ReturnType<typeof setInterval> | null = null;

    private ensureContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.ctx) {
            const Ctor = window.AudioContext || (window as any).webkitAudioContext;
            if (!Ctor) return null;
            try {
                this.ctx = new Ctor();
            } catch (e) {
                console.warn('[BGM] AudioContext init failed:', e);
                return null;
            }
            this.master = this.ctx.createGain();
            this.master.gain.value = 0;
            this.master.connect(this.ctx.destination);
        }
        return this.ctx;
    }

    /** Stop and clear all current ambient nodes. */
    private clearNodes() {
        for (const node of this.nodes) {
            try {
                if ('stop' in node && typeof (node as any).stop === 'function') {
                    (node as any).stop();
                }
                node.disconnect();
            } catch {
                // ignore
            }
        }
        this.nodes = [];
    }

    /** Build the oscillator + filter graph for a given mood. */
    private buildMood(mood: AmbientMood) {
        const ctx = this.ensureContext();
        if (!ctx || !this.master) return;
        if (mood === 'none') return;

        const presets: Record<Exclude<AmbientMood, 'none'>, {
            freqs: number[]; // base oscillator frequencies
            detune: number;  // cents of detune
            filterFreq: number;
            filterQ: number;
            lfoFreq: number; // very slow tremolo
            lfoDepth: number; // 0..1
            type: OscillatorType;
        }> = {
            peaceful: {
                freqs: [110, 165, 220], // A2, E3, A3
                detune: 6,
                filterFreq: 1200,
                filterQ: 1.2,
                lfoFreq: 0.1,
                lfoDepth: 0.15,
                type: 'sine'
            },
            tense: {
                freqs: [73, 110, 146], // D2, A2, D3 — minor third cluster
                detune: 12,
                filterFreq: 700,
                filterQ: 2.5,
                lfoFreq: 0.25,
                lfoDepth: 0.25,
                type: 'sawtooth'
            },
            combat: {
                freqs: [82, 98, 123], // low cluster
                detune: 18,
                filterFreq: 1500,
                filterQ: 3,
                lfoFreq: 0.6,
                lfoDepth: 0.4,
                type: 'square'
            },
            dungeon: {
                freqs: [55, 82, 110], // A1, E2, A2
                detune: 4,
                filterFreq: 400,
                filterQ: 4,
                lfoFreq: 0.05,
                lfoDepth: 0.1,
                type: 'sine'
            },
            victory: {
                freqs: [110, 220, 330], // major triad overtones
                detune: 3,
                filterFreq: 2500,
                filterQ: 1,
                lfoFreq: 0.2,
                lfoDepth: 0.2,
                type: 'triangle'
            }
        };

        const preset = presets[mood as Exclude<AmbientMood, 'none'>];

        // Filter shapes the timbre.
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = preset.filterFreq;
        filter.Q.value = preset.filterQ;

        // LFO modulates the filter cutoff slowly.
        const lfo = ctx.createOscillator();
        lfo.frequency.value = preset.lfoFreq;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = preset.filterFreq * preset.lfoDepth;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        // Mix several slightly-detuned oscillators.
        for (const f of preset.freqs) {
            const osc = ctx.createOscillator();
            osc.type = preset.type;
            osc.frequency.value = f;
            osc.detune.value = (Math.random() - 0.5) * preset.detune * 2;

            const oscGain = ctx.createGain();
            oscGain.gain.value = 0.25 / preset.freqs.length;
            osc.connect(oscGain);
            oscGain.connect(filter);
            osc.start();
            this.nodes.push(osc, oscGain);
        }

        filter.connect(this.master);
        lfo.start();
        this.nodes.push(filter, lfo, lfoGain);
    }

    /** Smoothly transition to a new mood. */
    setMood(mood: AmbientMood) {
        if (mood === this.currentMood) return;
        this.currentMood = mood;
        this.crossfadeTo(mood);
    }

    private crossfadeTo(mood: AmbientMood) {
        const ctx = this.ensureContext();
        if (!ctx || !this.master) return;

        // Fade out current.
        this.fadeMasterTo(0, 600).then(() => {
            this.clearNodes();
            this.buildMood(mood);
            this.fadeMasterTo(this.targetVolume, 800);
        });
    }

    private fadeMasterTo(target: number, ms: number): Promise<void> {
        return new Promise((resolve) => {
            if (!this.ctx || !this.master) {
                resolve();
                return;
            }
            const ctx = this.ctx;
            const master = this.master;
            const startVol = master.gain.value;
            const steps = 30;
            const stepTime = ms / steps;
            let i = 0;
            if (this.fadeInterval) {
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;
            }
            this.fadeInterval = setInterval(() => {
                i++;
                const t = i / steps;
                master.gain.value = startVol + (target - startVol) * t;
                if (i >= steps) {
                    if (this.fadeInterval) clearInterval(this.fadeInterval);
                    this.fadeInterval = null;
                    resolve();
                }
            }, stepTime);
        });
    }

    /** Apply current settings (master volume, enabled). */
    applySettings() {
        const settings = getBgmSettings();
        this.targetVolume = settings.enabled ? settings.volume : 0;
        if (this.master && this.ctx) {
            // Don't restart the mood, just update volume target.
            this.fadeMasterTo(this.targetVolume, 400);
        }
    }

    /** Resume the audio context (needed after first user gesture in Chrome). */
    async resume() {
        const ctx = this.ensureContext();
        if (ctx && ctx.state === 'suspended') {
            try {
                await ctx.resume();
            } catch (e) {
                console.warn('[BGM] resume failed:', e);
            }
        }
    }

    /** Stop and tear down. */
    destroy() {
        this.clearNodes();
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        if (this.ctx) {
            try { this.ctx.close(); } catch { /* ignore */ }
            this.ctx = null;
        }
        this.master = null;
        this.currentMood = 'none';
    }
}

let engine: AmbientEngine | null = null;

export function getAmbientEngine(): AmbientEngine {
    if (!engine) engine = new AmbientEngine();
    return engine;
}

/** Quick check that the browser has Web Audio support. */
export function isAmbientSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.AudioContext || (window as any).webkitAudioContext);
}
