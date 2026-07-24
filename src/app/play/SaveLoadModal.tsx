'use client';

import { useEffect, useState } from 'react';
import { X, Save, FolderOpen, Trash2, Clock, MapPin, User } from 'lucide-react';
import { listSaves, loadSave, deleteSave, SaveIndexEntry, CampaignSave } from '@/lib/saves';

interface SaveLoadModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'save' | 'load';
    characterId: string;
    onSave?: (name: string) => void;
    onLoad?: (save: CampaignSave) => void;
}

export default function SaveLoadModal({
    isOpen,
    onClose,
    mode,
    characterId,
    onSave,
    onLoad
}: SaveLoadModalProps) {
    const [saves, setSaves] = useState<SaveIndexEntry[]>([]);
    const [saveName, setSaveName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSaves(listSaves(characterId));
            setSaveName(`Save at ${new Date().toLocaleString()}`);
        }
    }, [isOpen, characterId]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!saveName.trim() || !onSave) return;
        onSave(saveName.trim());
        onClose();
    };

    const handleLoad = (id: string) => {
        const save = loadSave(id);
        if (save && onLoad) {
            onLoad(save);
            onClose();
        }
    };

    const handleDelete = (id: string) => {
        if (!confirm('Delete this save? This cannot be undone.')) return;
        deleteSave(id);
        setSaves(listSaves(characterId));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
                    <h2 className="text-lg font-serif font-bold text-gold-400 flex items-center gap-2">
                        {mode === 'save' ? <><Save className="w-5 h-5" /> Save Game</> : <><FolderOpen className="w-5 h-5" /> Load Game</>}
                    </h2>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-100 p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {mode === 'save' && (
                    <div className="mb-4 space-y-2">
                        <label className="block text-xs font-medium text-stone-300">Save name</label>
                        <input
                            type="text"
                            value={saveName}
                            onChange={e => setSaveName(e.target.value)}
                            placeholder="My heroic moment"
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-gold-500/50"
                        />
                        <button
                            onClick={handleSave}
                            disabled={!saveName.trim()}
                            className="w-full inline-flex items-center justify-center gap-2 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 text-stone-950 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
                        >
                            <Save className="w-4 h-4" /> Save Now
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto space-y-2">
                    {saves.length === 0 ? (
                        <div className="text-center text-stone-500 py-8 italic text-sm">
                            No saves yet for this character.
                        </div>
                    ) : (
                        saves.map(s => (
                            <div
                                key={s.id}
                                className="bg-stone-950 border border-stone-800 rounded-xl p-3 hover:border-stone-600 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-stone-200 font-medium text-sm truncate">{s.name}</p>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-stone-500">
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" /> {s.characterName}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {s.location}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Turn {s.turn}
                                            </span>
                                        </div>
                                        <p className="text-stone-600 text-[10px] mt-1">
                                            {new Date(s.updatedAt).toLocaleString()}
                                        </p>
                                    </div>
                                    {mode === 'load' && (
                                        <button
                                            onClick={() => handleLoad(s.id)}
                                            className="shrink-0 inline-flex items-center gap-1 bg-gold-600 hover:bg-gold-500 text-stone-950 px-3 py-1.5 rounded-lg text-xs font-bold"
                                        >
                                            <FolderOpen className="w-3.5 h-3.5" /> Load
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(s.id)}
                                        className="shrink-0 p-1.5 text-stone-500 hover:text-red-400 hover:bg-stone-900 rounded-lg"
                                        title="Delete save"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
