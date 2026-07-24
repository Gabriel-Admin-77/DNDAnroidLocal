'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Clock, ScrollText, PlayCircle, Star, Sparkles, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ADVENTURE_DEFINITIONS } from '@/lib/adventures';
import { AdventureDefinition } from '@/lib/types';

function DifficultyBadge({ difficulty }: { difficulty: AdventureDefinition['difficulty'] }) {
    const colorMap = {
        Beginner: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
        Intermediate: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
        Legendary: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    };
    return (
        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded border backdrop-blur-md ${colorMap[difficulty]}`}>
            {difficulty}
        </span>
    );
}

function AdventureCard({ camp, onEmbark, isEmbarking }: { camp: AdventureDefinition; onEmbark: (camp: AdventureDefinition) => void; isEmbarking: boolean }) {
    return (
        <div className="group relative rounded-2xl overflow-hidden border border-stone-800 bg-stone-900/40 hover:border-gold-500/50 transition-all duration-500 flex flex-col h-full hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]">
            <div className="relative h-48 sm:h-56 overflow-hidden">
                <div className="absolute inset-0 bg-stone-900/20 group-hover:bg-transparent transition-colors z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent z-10" />
                <img src={camp.image} alt={camp.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-4 right-4 z-20">
                    <DifficultyBadge difficulty={camp.difficulty} />
                </div>
            </div>
            <div className="p-6 flex flex-col flex-1 relative z-20 -mt-6">
                <h2 className="text-2xl font-serif text-stone-100 mb-3 group-hover:text-gold-400 transition-colors drop-shadow-md">{camp.title}</h2>
                <div className="flex items-center gap-4 text-sm text-stone-400 mb-4 pb-4 border-b border-stone-800/60">
                    <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /><span>{camp.estimatedTurns} Turns</span></div>
                    <div className="flex items-center gap-1.5"><ScrollText className="w-4 h-4" /><span>Level {camp.difficulty === 'Beginner' ? '1-3' : camp.difficulty === 'Intermediate' ? '4-7' : '8+'}</span></div>
                </div>
                <p className="text-stone-300 text-sm leading-relaxed mb-6 flex-1 italic">"{camp.lore}"</p>
                <div className="flex flex-wrap gap-2 mb-6">
                    {camp.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-1 rounded bg-stone-950 border border-stone-800 text-xs text-stone-400">{tag}</span>
                    ))}
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-stone-800/60 mt-auto">
                    <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-gold-500" />
                        <span className="text-sm font-medium text-gold-500/90">{camp.reward}</span>
                    </div>
                    <button
                        onClick={() => onEmbark(camp)}
                        disabled={isEmbarking}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 px-5 py-2.5 rounded-lg font-medium transition-colors border border-stone-700 hover:border-gold-500/50 group/btn"
                    >
                        {isEmbarking ? 'Loading...' : 'Embark'}
                        {isEmbarking ? <Loader2 className="w-4 h-4 text-stone-400 animate-spin" /> : <PlayCircle className="w-4 h-4 text-stone-400 group-hover/btn:text-gold-400" />}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AdventuresContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const characterId = searchParams.get('characterId') || 
        (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('characterId') : null);
    const [embarkingId, setEmbarkingId] = useState<string | null>(null);
    const supabase = createClient();

    const handleEmbark = async (adventure: AdventureDefinition) => {
        if (!characterId) {
            alert("Please select a champion first.");
            router.push('/champions');
            return;
        }

        setEmbarkingId(adventure.id);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const newCampaign = {
                    user_id: user.id,
                    character_id: characterId,
                    adventure_title: adventure.title,
                    current_turn: 0,
                    time_of_day: 'Dawn',
                    weather: 'Clear',
                    is_active: true
                };

                const { data, error } = await supabase.from('campaigns').insert([newCampaign]).select();
                if (!error && data && data.length > 0) {
                    router.push(`/play?campaignId=${data[0].id}`);
                } else {
                    alert("Failed to start campaign: " + (error?.message || "Unknown error"));
                    setEmbarkingId(null);
                }
            } else {
                alert("Failed to start campaign: User session not found.");
                setEmbarkingId(null);
            }
        } catch (err: unknown) {
            console.error('Embark error:', err);
            alert("An error occurred while embarking.");
            setEmbarkingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-stone-950 text-stone-200">
            <header className="p-4 md:p-6 border-b border-stone-800 bg-stone-900/50 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link href="/champions" className="p-2 hover:bg-stone-800 rounded-full transition-colors text-stone-400 hover:text-stone-200">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex flex-col">
                        <h1 className="text-2xl md:text-3xl font-serif text-gold-500">Choose Your Adventure</h1>
                        <span className="text-xs text-stone-400 tracking-wider hidden md:block">SELECT A MODULE TO BEGIN</span>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-stone-800/80 border border-stone-700">
                    <Sparkles className="w-4 h-4 text-gold-400" />
                    <span className="text-sm">{characterId ? "Champion Selected" : "No Champion"}</span>
                </div>
            </header>

            <main className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {ADVENTURE_DEFINITIONS.map(camp => (
                        <AdventureCard key={camp.id} camp={camp} onEmbark={handleEmbark} isEmbarking={embarkingId === camp.id} />
                    ))}
                </div>
            </main>
        </div>
    );
}

export default function AdventuresPage() {
    return (
        <Suspense fallback={<div className="h-screen bg-stone-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-gold-500 animate-spin" /></div>}>
            <AdventuresContent />
        </Suspense>
    );
}
