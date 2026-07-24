'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Scroll, Trophy, Skull, Calendar, User, Sparkles } from 'lucide-react';
import { getJournalRecords, JournalRecord } from '@/lib/journal';

export default function JournalPage() {
    const [records, setRecords] = useState<JournalRecord[]>([]);

    useEffect(() => {
        setRecords(getJournalRecords());
    }, []);

    return (
        <main className="min-h-screen bg-stone-950 p-6 relative overflow-hidden">
            {/* Background ambient effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-gold-500)_0%,_transparent_70%)] opacity-10 pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="p-2 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800/50 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-stone-100 flex items-center gap-3">
                            <BookOpen className="w-8 h-8 text-gold-400" />
                            Adventure Journal & Chronicle
                        </h1>
                        <p className="text-stone-500 text-sm mt-1">Archived heroic recaps and epic sagas</p>
                    </div>
                </div>

                {/* Records List */}
                {records.length > 0 ? (
                    <div className="space-y-6">
                        {records.map((rec) => (
                            <div key={rec.id} className="bg-stone-900/60 border border-stone-800 rounded-3xl p-6 md:p-8 backdrop-blur-md relative overflow-hidden group hover:border-stone-700 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-stone-800/80">
                                    <div>
                                        <span className={`inline-flex items-center gap-1.5 text-xs uppercase font-bold px-2.5 py-0.5 rounded-full border mb-2 ${
                                            rec.outcome === 'victory' 
                                                ? 'bg-amber-950/80 text-amber-400 border-amber-800/60' 
                                                : 'bg-crimson-950/80 text-red-400 border-red-800/60'
                                        }`}>
                                            {rec.outcome === 'victory' ? <Trophy className="w-3.5 h-3.5" /> : <Skull className="w-3.5 h-3.5" />}
                                            {rec.outcome.toUpperCase()}
                                        </span>
                                        <h2 className="text-2xl font-serif text-white">{rec.adventureTitle}</h2>
                                    </div>

                                    <div className="text-xs text-stone-400 space-y-1 sm:text-right">
                                        <p className="flex items-center gap-1.5 sm:justify-end text-stone-300 font-semibold">
                                            <User className="w-3.5 h-3.5 text-gold-400" /> {rec.characterName} ({rec.characterClass})
                                        </p>
                                        <p className="flex items-center gap-1.5 sm:justify-end text-stone-500">
                                            <Calendar className="w-3.5 h-3.5" /> {new Date(rec.date).toLocaleDateString()} · {rec.turnsTaken} Turns
                                        </p>
                                    </div>
                                </div>

                                <div className="prose prose-invert max-w-none text-stone-300 text-sm leading-relaxed font-serif space-y-3">
                                    {rec.summary.split('\n\n').map((p, idx) => (
                                        <p key={idx}>{p}</p>
                                    ))}
                                </div>

                                {rec.keyNpcsMet.length > 0 && (
                                    <div className="mt-6 pt-4 border-t border-stone-800/60 flex items-center gap-2 flex-wrap text-xs">
                                        <span className="text-stone-500 font-semibold uppercase tracking-wider text-[10px]">Notable Encounters:</span>
                                        {rec.keyNpcsMet.map(npc => (
                                            <span key={npc} className="px-2.5 py-1 bg-stone-950 border border-stone-800 text-stone-400 rounded-lg">
                                                {npc}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-stone-900/40 border border-stone-800 rounded-3xl p-12 text-center text-stone-500">
                        <Scroll className="w-16 h-16 mx-auto mb-4 opacity-30 text-gold-400" />
                        <h3 className="text-xl font-serif text-stone-300 mb-2">The Chronicle is Empty</h3>
                        <p className="text-sm max-w-md mx-auto">Complete or conclude an adventure campaign to record your heroic deeds in the permanent journal.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
