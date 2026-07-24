'use client';
import { useState } from 'react';
import { Users, Sparkles, Shield, Check, Copy, Play, Plus, Key } from 'lucide-react';
import { PartyMember, PartyRoom, generateRoomCode } from '@/lib/multiplayer';

interface PartyLobbyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PartyLobbyModal({ isOpen, onClose }: PartyLobbyModalProps) {
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [joinCodeInput, setJoinCodeInput] = useState('');
    const [members, setMembers] = useState<PartyMember[]>([]);
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCreateRoom = () => {
        const code = generateRoomCode();
        setRoomCode(code);
        setMembers([
            {
                id: 'p_host',
                username: 'You (Host)',
                characterName: 'Thrain Ironfoot',
                characterClass: 'Fighter',
                level: 3,
                hpCurrent: 24,
                hpMax: 24,
                isHost: true,
                isReady: true
            }
        ]);
    };

    const handleJoinRoom = () => {
        if (!joinCodeInput || joinCodeInput.length < 6) return;
        setRoomCode(joinCodeInput.toUpperCase());
        setMembers([
            {
                id: 'p_host',
                username: 'Party Leader',
                characterName: 'Elowen',
                characterClass: 'Cleric',
                level: 3,
                hpCurrent: 22,
                hpMax: 22,
                isHost: true,
                isReady: true
            },
            {
                id: 'p_me',
                username: 'You',
                characterName: 'Valerius',
                characterClass: 'Rogue',
                level: 3,
                hpCurrent: 18,
                hpMax: 18,
                isHost: false,
                isReady: true
            }
        ]);
    };

    const copyCode = () => {
        if (!roomCode) return;
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-xl p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-7 h-7 text-gold-400" />
                        <div>
                            <h2 className="text-2xl font-serif text-white">Multiplayer Party Lobby</h2>
                            <p className="text-stone-400 text-xs uppercase tracking-wider">Co-op Tabletop Session</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold transition-colors"
                    >
                        Close
                    </button>
                </div>

                {!roomCode ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                        {/* Host Room Option */}
                        <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 flex flex-col justify-between">
                            <div>
                                <Plus className="w-10 h-10 text-gold-400 mb-3" />
                                <h3 className="text-lg font-serif text-white font-bold mb-1">Host Party Session</h3>
                                <p className="text-stone-400 text-xs leading-relaxed mb-6">Create a room and invite up to 3 friends to join your campaign.</p>
                            </div>
                            <button
                                onClick={handleCreateRoom}
                                className="w-full py-3 bg-gold-500 hover:bg-gold-400 text-stone-950 rounded-xl font-bold text-sm transition-all"
                            >
                                Create New Room
                            </button>
                        </div>

                        {/* Join Room Option */}
                        <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 flex flex-col justify-between">
                            <div>
                                <Key className="w-10 h-10 text-purple-400 mb-3" />
                                <h3 className="text-lg font-serif text-white font-bold mb-1">Join Party Session</h3>
                                <p className="text-stone-400 text-xs leading-relaxed mb-4">Enter a 6-character room code from your Party Leader.</p>
                                <input
                                    type="text"
                                    placeholder="Enter Room Code (e.g. AB12CD)"
                                    value={joinCodeInput}
                                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                                    maxLength={6}
                                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2 text-stone-200 font-mono text-center tracking-widest text-sm mb-4"
                                />
                            </div>
                            <button
                                onClick={handleJoinRoom}
                                disabled={!joinCodeInput || joinCodeInput.length < 6}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl font-bold text-sm transition-all"
                            >
                                Join Party Room
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Active Room View */
                    <div className="space-y-6">
                        {/* Room Code Display */}
                        <div className="flex items-center justify-between p-4 bg-stone-950 rounded-2xl border border-gold-500/30">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-stone-500">Party Room Code</p>
                                <p className="text-2xl font-mono font-bold text-gold-400 tracking-widest">{roomCode}</p>
                            </div>
                            <button
                                onClick={copyCode}
                                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                                {copied ? <><Check className="w-4 h-4 text-emerald-400" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Code</>}
                            </button>
                        </div>

                        {/* Connected Party Members */}
                        <div>
                            <h4 className="text-xs uppercase font-bold text-stone-400 tracking-wider mb-3">Party Members ({members.length}/4)</h4>
                            <div className="space-y-2">
                                {members.map(m => (
                                    <div key={m.id} className="flex items-center justify-between p-3.5 bg-stone-950 rounded-xl border border-stone-800">
                                        <div className="flex items-center gap-3">
                                            <Shield className="w-5 h-5 text-gold-400" />
                                            <div>
                                                <p className="text-sm font-serif text-stone-200 font-bold">{m.characterName} <span className="text-xs font-sans text-stone-500">({m.username})</span></p>
                                                <p className="text-[10px] text-stone-400 uppercase">Level {m.level} {m.characterClass}</p>
                                            </div>
                                        </div>
                                        {m.isHost && (
                                            <span className="text-[10px] uppercase font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded">
                                                Host
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-gold-500 hover:bg-gold-400 text-stone-950 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2"
                        >
                            <Play className="w-5 h-5 fill-stone-950" /> Start Co-op Campaign
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
