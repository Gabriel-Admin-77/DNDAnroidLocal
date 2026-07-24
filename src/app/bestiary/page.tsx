'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Skull, Shield, Search, Lock, Flame } from 'lucide-react';
import { getAllBestiaryEntries, BestiaryEntry, ThreatLevel } from '@/lib/bestiary';

const THREAT_COLORS: Record<ThreatLevel, string> = {
    Fodder: 'bg-stone-800 text-stone-300 border-stone-700',
    Low: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
    Medium: 'bg-blue-950/80 text-blue-400 border-blue-800/60',
    High: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
    Boss: 'bg-crimson-950/80 text-red-400 border-red-800/60',
    Legendary: 'bg-purple-950/80 text-purple-300 border-purple-800/60 animate-pulse'
};

export default function BestiaryPage() {
    const [entries, setEntries] = useState<BestiaryEntry[]>([]);
    const [search, setSearch] = useState('');
    const [selectedEntry, setSelectedEntry] = useState<BestiaryEntry | null>(null);

    useEffect(() => {
        const loaded = getAllBestiaryEntries();
        setEntries(loaded);
        if (loaded.length > 0) {
            setSelectedEntry(loaded[0]);
        }
    }, []);

    const filtered = entries.filter(e => 
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.type.toLowerCase().includes(search.toLowerCase()) ||
        e.location.toLowerCase().includes(search.toLowerCase())
    );

    const discoveredCount = entries.filter(e => e.isDiscovered).length;

    return (
        <main className="min-h-screen bg-stone-950 p-6 relative overflow-hidden">
            {/* Background ambient gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--color-crimson-800)_0%,_transparent_60%)] opacity-15 pointer-events-none" />

            <div className="relative z-10 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800/50 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-stone-100 flex items-center gap-3">
                                <Skull className="w-8 h-8 text-crimson-600" />
                                Monster Bestiary
                            </h1>
                            <p className="text-stone-500 text-sm mt-1">Discovered codex of threats and beasts ({discoveredCount}/{entries.length})</p>
                        </div>
                    </div>

                    {/* Search bar */}
                    <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search creatures, locations..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-4 py-2 text-sm text-stone-200 focus:outline-none focus:border-gold-500/50 transition-colors"
                        />
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Entry List */}
                    <div className="lg:col-span-5 space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                        {filtered.map(entry => {
                            const isSelected = selectedEntry?.id === entry.id;
                            return (
                                <button
                                    key={entry.id}
                                    onClick={() => setSelectedEntry(entry)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${
                                        isSelected 
                                            ? 'bg-stone-900 border-gold-500/70 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                                            : 'bg-stone-950/60 border-stone-800/80 hover:border-stone-700'
                                    }`}
                                >
                                    <div className="w-12 h-12 rounded-lg bg-stone-900 overflow-hidden border border-stone-800 shrink-0 flex items-center justify-center relative">
                                        {entry.isDiscovered ? (
                                            <img src={entry.image} alt={entry.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Lock className="w-5 h-5 text-stone-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-serif text-base truncate ${entry.isDiscovered ? 'text-stone-200' : 'text-stone-500'}`}>
                                            {entry.isDiscovered ? entry.name : 'Unknown Creature'}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${THREAT_COLORS[entry.threat]}`}>
                                                {entry.threat}
                                            </span>
                                            <span className="text-xs text-stone-500">{entry.type}</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Entry Detail View */}
                    <div className="lg:col-span-7">
                        {selectedEntry ? (
                            <div className="bg-stone-900/60 border border-stone-800 rounded-3xl p-6 md:p-8 backdrop-blur-md">
                                {selectedEntry.isDiscovered ? (
                                    <>
                                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-stone-800 mb-6 group">
                                            <img 
                                                src={selectedEntry.image} 
                                                alt={selectedEntry.name} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />
                                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                                <div>
                                                    <span className={`text-xs uppercase font-bold px-2.5 py-1 rounded border ${THREAT_COLORS[selectedEntry.threat]}`}>
                                                        {selectedEntry.threat} Threat
                                                    </span>
                                                    <h2 className="text-2xl md:text-3xl font-serif text-white mt-1">{selectedEntry.name}</h2>
                                                </div>
                                                <span className="text-xs text-stone-400 font-serif">{selectedEntry.location}</span>
                                            </div>
                                        </div>

                                        <p className="text-stone-300 text-sm leading-relaxed mb-6 font-serif italic border-l-2 border-crimson-600 pl-4">
                                            "{selectedEntry.description}"
                                        </p>

                                        {/* Combat Stats Overview */}
                                        <div className="bg-stone-950 border border-stone-800/80 rounded-2xl p-5 mb-4">
                                            <h4 className="text-xs uppercase font-bold text-gold-400 tracking-wider mb-3 flex items-center gap-2">
                                                <Flame className="w-4 h-4" /> Tactical Intelligence
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4 mb-3">
                                                <div className="flex items-center gap-3">
                                                    <Shield className="w-5 h-5 text-stone-500" />
                                                    <div>
                                                        <p className="text-[10px] text-stone-500 uppercase font-bold">Armor Class</p>
                                                        <p className="text-lg font-serif text-stone-200">{selectedEntry.statsOverview.ac} AC</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Skull className="w-5 h-5 text-crimson-600" />
                                                    <div>
                                                        <p className="text-[10px] text-stone-500 uppercase font-bold">Health Pool</p>
                                                        <p className="text-lg font-serif text-stone-200">{selectedEntry.statsOverview.hp} HP</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-3 border-t border-stone-800/60">
                                                <p className="text-[10px] text-stone-500 uppercase font-bold">Primary Weapon / Ability</p>
                                                <p className="text-xs text-stone-300 font-mono mt-0.5">{selectedEntry.statsOverview.primaryAttack}</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center text-stone-600">
                                        <Lock className="w-16 h-16 mb-4 opacity-40" />
                                        <h3 className="text-xl font-serif text-stone-400 mb-2">Undiscovered Threat</h3>
                                        <p className="text-xs max-w-sm">Encounter this creature during your campaign to unlock full tactical intelligence and lore.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-64 text-stone-600">Select a creature to view details</div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
