'use client';
import { useState, useEffect } from 'react';
import { X, Key, Save, Check, Volume2, Play, Square } from 'lucide-react';
import { getDeepSeekApiKey } from '@/lib/ai-client';
import {
    getTtsSettings,
    saveTtsSettings,
    listVoices,
    isTtsSupported,
    speak as ttsSpeak,
    stopSpeaking
} from '@/lib/tts';
import {
    getBgmSettings,
    saveBgmSettings,
    isAmbientSupported,
    getAmbientEngine
} from '@/lib/ambient-bgm';

interface ApiKeySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ApiKeySettingsModal({ isOpen, onClose }: ApiKeySettingsModalProps) {
    const [deepseekKey, setDeepseekKey] = useState('');
    const [savedNotice, setSavedNotice] = useState(false);

    // TTS state
    const [ttsEnabled, setTtsEnabled] = useState(false);
    const [ttsAutoNarrate, setTtsAutoNarrate] = useState(true);
    const [ttsRate, setTtsRate] = useState(0.95);
    const [ttsPitch, setTtsPitch] = useState(0.9);
    const [ttsVolume, setTtsVolume] = useState(0.9);
    const [ttsVoiceName, setTtsVoiceName] = useState<string | null>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [ttsSupported] = useState(isTtsSupported);

    // BGM state
    const [bgmEnabled, setBgmEnabled] = useState(false);
    const [bgmVolume, setBgmVolume] = useState(0.35);
    const [bgmSupported] = useState(isAmbientSupported);

    useEffect(() => {
        if (isOpen) {
            setDeepseekKey(getDeepSeekApiKey());
            setSavedNotice(false);
            const tts = getTtsSettings();
            setTtsEnabled(tts.enabled);
            setTtsAutoNarrate(tts.autoNarrate);
            setTtsRate(tts.rate);
            setTtsPitch(tts.pitch);
            setTtsVolume(tts.volume);
            setTtsVoiceName(tts.voiceName);
            if (ttsSupported) {
                listVoices().then(setVoices);
            }
            const bgm = getBgmSettings();
            setBgmEnabled(bgm.enabled);
            setBgmVolume(bgm.volume);
        }
    }, [isOpen, ttsSupported]);

    if (!isOpen) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('dnd_app_deepseek_key', deepseekKey.trim());
        saveTtsSettings({
            enabled: ttsEnabled,
            autoNarrate: ttsAutoNarrate,
            rate: ttsRate,
            pitch: ttsPitch,
            volume: ttsVolume,
            voiceName: ttsVoiceName
        });
        saveBgmSettings({ enabled: bgmEnabled, volume: bgmVolume });
        // Apply BGM change immediately so the user hears it.
        getAmbientEngine().applySettings();
        setSavedNotice(true);
        setTimeout(() => {
            setSavedNotice(false);
            onClose();
        }, 1200);
    };

    const handlePreviewTts = () => {
        if (!ttsEnabled) {
            // Apply the settings temporarily for the preview.
            saveTtsSettings({
                enabled: true,
                autoNarrate: ttsAutoNarrate,
                rate: ttsRate,
                pitch: ttsPitch,
                volume: ttsVolume,
                voiceName: ttsVoiceName
            });
        }
        ttsSpeak('The dungeon master greets you, brave adventurer. Welcome to the realm.');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                    <div className="flex items-center gap-2 text-gold-400 font-serif font-bold text-lg">
                        <Key className="w-5 h-5" />
                        <span>Settings</span>
                    </div>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-100 p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    {/* AI API keys */}
                    <section className="space-y-3">
                        <h2 className="text-sm font-serif font-bold text-stone-200 flex items-center gap-2">
                            <Key className="w-4 h-4 text-gold-400" />
                            AI API Key
                        </h2>
                        <p className="text-stone-400 text-xs leading-relaxed">
                            Optional. If unset, the server's <code className="text-stone-300">.env.local</code> key is used.
                        </p>
                        <div>
                            <label className="block text-xs font-medium text-stone-300 mb-1">
                                DeepSeek API Key
                            </label>
                            <input
                                type="password"
                                value={deepseekKey}
                                onChange={e => setDeepseekKey(e.target.value)}
                                placeholder="sk-..."
                                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-gold-500/50 font-mono"
                            />
                        </div>
                    </section>

                    {/* BGM section */}
                    <section className="space-y-3 pt-4 border-t border-stone-800">
                        <h2 className="text-sm font-serif font-bold text-stone-200 flex items-center gap-2">
                            <span className="text-gold-400">♪</span>
                            Ambient Music
                        </h2>

                        {!bgmSupported ? (
                            <p className="text-stone-500 text-xs italic">
                                Your browser doesn't expose Web Audio. Try Chrome on Android.
                            </p>
                        ) : (
                            <>
                                <p className="text-stone-400 text-xs leading-relaxed">
                                    Procedural soundscape generated in the browser. Mood shifts with the location.
                                </p>
                                <label className="flex items-center gap-2 text-xs text-stone-300">
                                    <input
                                        type="checkbox"
                                        checked={bgmEnabled}
                                        onChange={e => setBgmEnabled(e.target.checked)}
                                        className="accent-gold-500"
                                    />
                                    Enable ambient BGM
                                </label>
                                <div>
                                    <label className="block text-xs font-medium text-stone-300 mb-1">
                                        Volume: {Math.round(bgmVolume * 100)}%
                                    </label>
                                    <input
                                        type="range" min="0" max="1" step="0.05"
                                        value={bgmVolume}
                                        onChange={e => setBgmVolume(parseFloat(e.target.value))}
                                        className="w-full accent-gold-500"
                                    />
                                </div>
                            </>
                        )}
                    </section>

                    {/* TTS section */}
                    <section className="space-y-3 pt-4 border-t border-stone-800">
                        <h2 className="text-sm font-serif font-bold text-stone-200 flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-gold-400" />
                            Narration (Text-to-Speech)
                        </h2>

                        {!ttsSupported ? (
                            <p className="text-stone-500 text-xs italic">
                                Your browser doesn't expose a TTS engine. Try Chrome on Android.
                            </p>
                        ) : (
                            <>
                                <label className="flex items-center gap-2 text-xs text-stone-300">
                                    <input
                                        type="checkbox"
                                        checked={ttsEnabled}
                                        onChange={e => setTtsEnabled(e.target.checked)}
                                        className="accent-gold-500"
                                    />
                                    Enable voice narration
                                </label>
                                <label className="flex items-center gap-2 text-xs text-stone-300">
                                    <input
                                        type="checkbox"
                                        checked={ttsAutoNarrate}
                                        onChange={e => setTtsAutoNarrate(e.target.checked)}
                                        className="accent-gold-500"
                                    />
                                    Auto-narrate new scenes
                                </label>

                                <div>
                                    <label className="block text-xs font-medium text-stone-300 mb-1">Voice</label>
                                    <select
                                        value={ttsVoiceName || ''}
                                        onChange={e => setTtsVoiceName(e.target.value || null)}
                                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-gold-500/50"
                                    >
                                        <option value="">System default</option>
                                        {voices.map(v => (
                                            <option key={v.name} value={v.name}>
                                                {v.name} ({v.lang})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-stone-300 mb-1">
                                        Speed: {ttsRate.toFixed(2)}x
                                    </label>
                                    <input
                                        type="range" min="0.5" max="2" step="0.05"
                                        value={ttsRate}
                                        onChange={e => setTtsRate(parseFloat(e.target.value))}
                                        className="w-full accent-gold-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-stone-300 mb-1">
                                        Pitch: {ttsPitch.toFixed(2)}
                                    </label>
                                    <input
                                        type="range" min="0" max="2" step="0.05"
                                        value={ttsPitch}
                                        onChange={e => setTtsPitch(parseFloat(e.target.value))}
                                        className="w-full accent-gold-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-stone-300 mb-1">
                                        Volume: {Math.round(ttsVolume * 100)}%
                                    </label>
                                    <input
                                        type="range" min="0" max="1" step="0.05"
                                        value={ttsVolume}
                                        onChange={e => setTtsVolume(parseFloat(e.target.value))}
                                        className="w-full accent-gold-500"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handlePreviewTts}
                                        className="flex-1 inline-flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                                    >
                                        <Play className="w-3.5 h-3.5" /> Preview
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => stopSpeaking()}
                                        className="flex-1 inline-flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                                    >
                                        <Square className="w-3.5 h-3.5" /> Stop
                                    </button>
                                </div>
                            </>
                        )}
                    </section>

                    <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                        {savedNotice ? (
                            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                                <Check className="w-4 h-4" /> Saved!
                            </span>
                        ) : (
                            <span className="text-[10px] text-stone-500">Stored in localStorage</span>
                        )}
                        <button
                            type="submit"
                            className="bg-gold-500 hover:bg-gold-600 text-stone-950 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            <span>Save</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
