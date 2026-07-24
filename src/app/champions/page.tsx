'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft, Check, X, Loader2, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getChampionImage } from '@/lib/utils';
import { DND_ARCHETYPES } from '@/lib/archetypes';
import { Character, DndArchetype } from '@/lib/types';

function ArchetypeCard({ arch, isSelected, onClick }: { arch: DndArchetype; isSelected: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${isSelected ? 'bg-gold-500/10 border-gold-500 shadow-lg' : 'bg-stone-900 border-stone-800 hover:border-stone-700'}`}
        >
            <div className="w-12 h-12 rounded-lg bg-stone-800 overflow-hidden shrink-0 border border-stone-700">
                <img src={arch.image} alt={arch.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className={`font-serif text-lg ${isSelected ? 'text-gold-400' : 'text-stone-300'}`}>{arch.name}</h3>
                <p className="text-xs text-stone-500 uppercase tracking-widest">{arch.class} · {arch.race}</p>
            </div>
        </button>
    );
}

function ArchetypeDetail({ arch, onCreate, loading }: { arch: DndArchetype; onCreate: (arch: DndArchetype) => void; loading: boolean }) {
    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center gap-6 mb-8">
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-stone-700 shadow-2xl">
                    <img src={arch.image} alt={arch.name} className="w-full h-full object-cover" />
                </div>
                <div>
                    <h2 className="text-3xl font-serif text-white mb-1">{arch.name}</h2>
                    <p className="text-gold-400 font-bold uppercase tracking-widest text-sm">{arch.race} {arch.class}</p>
                </div>
            </div>

            <p className="text-stone-300 leading-relaxed mb-8 italic">"{arch.description}"</p>

            <div className="grid grid-cols-3 gap-4 mb-10">
                {Object.entries(arch.stats).map(([stat, val]) => {
                    const mod = Math.floor((val - 10) / 2);
                    return (
                        <div key={stat} className="bg-stone-950 border border-stone-800 rounded-2xl p-4 text-center">
                            <p className="text-[10px] uppercase text-stone-500 font-bold mb-1">{stat}</p>
                            <p className="text-2xl font-serif text-stone-100">{val}</p>
                            <p className="text-xs text-stone-400">({mod >= 0 ? `+${mod}` : mod})</p>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-between p-4 bg-stone-950 rounded-2xl border border-stone-800 mb-8">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-crimson-600" />
                    <span className="text-stone-400 text-sm font-bold">Standard Starting HP</span>
                </div>
                <span className="text-2xl font-serif text-stone-100 font-bold">{arch.hp}</span>
            </div>

            <button
                onClick={() => onCreate(arch)}
                disabled={loading}
                className="w-full bg-gold-600 hover:bg-gold-500 disabled:opacity-50 text-stone-950 py-5 rounded-2xl font-bold text-xl transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(234,179,8,0.2)]"
            >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Check className="w-6 h-6" /> Forge This Champion</>}
            </button>
        </div>
    );
}

function ChampionListItem({ champion, isSelected, onClick }: { champion: Character; isSelected: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 border-stone-800 ${isSelected ? 'bg-stone-800/80 border-gold-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'bg-stone-900/40 hover:border-stone-600 hover:bg-stone-800/40'}`}
        >
            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-stone-700">
                <img src={getChampionImage(champion)} alt={champion.name} className="object-cover w-full h-full" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-serif truncate text-stone-200">{champion.name}</h3>
                <p className="text-xs text-stone-500 uppercase">Lvl {champion.level} {champion.class}</p>
            </div>
        </button>
    );
}

function ChampionDetail({ champion, onDelete }: { champion: Character; onDelete: (id: string) => void }) {
    const archetype = DND_ARCHETYPES.find(a => a.name === champion.name);
    return (
        <div className="max-w-4xl mx-auto w-full grid grid-cols-2 gap-12">
            <div className="flex flex-col gap-6">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-stone-800 shadow-2xl">
                    <img src={getChampionImage(champion)} alt={champion.name} className="object-cover w-full h-full" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-stone-950 to-transparent">
                        <h2 className="text-3xl font-serif text-white">{champion.name}</h2>
                        <p className="text-gold-400">Level {champion.level} {champion.class} · {champion.xp || 0} XP</p>
                    </div>
                </div>
                <p className="text-stone-400 italic border-l-2 border-stone-800 pl-4 py-1">"{archetype?.description || 'A brave soul seeking destiny.'}"</p>
            </div>
            <div className="flex flex-col gap-8">
                <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-6">
                    <h3 className="font-serif text-xl border-b border-stone-800 pb-3 mb-4 text-stone-200 font-bold">Combat Vitality</h3>
                    <div className="flex items-end gap-2"><span className="text-4xl font-bold text-crimson-600">{champion.hp_current}</span><span className="text-stone-400 mb-1">/ {champion.hp_max} HP</span></div>
                </div>
                <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-6">
                    <h3 className="font-serif text-xl border-b border-stone-800 pb-3 mb-4 text-stone-200 font-bold">Ability Scores</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map(stat => {
                            const val = champion[stat] || 10;
                            const mod = Math.floor((val - 10) / 2);
                            return (
                                <div key={stat} className="flex flex-col items-center p-2 bg-stone-950 rounded-lg border border-stone-800">
                                    <span className="text-[10px] uppercase text-stone-500 font-bold">{stat.slice(0, 3)}</span>
                                    <span className="text-xl font-serif text-stone-200">{val}</span>
                                    <span className="text-xs text-stone-400">({mod >= 0 ? `+${mod}` : mod})</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="mt-auto flex flex-col gap-3">
                    <Link href={`/adventures?characterId=${champion.id}`} className="w-full flex items-center justify-center gap-3 bg-crimson-700 hover:bg-crimson-600 text-white p-4 rounded-xl font-bold transition-all"><Check className="w-5 h-5" /> Embark Adventure</Link>
                    <button onClick={() => onDelete(champion.id)} className="w-full flex items-center justify-center gap-3 bg-stone-900 hover:bg-red-950 border border-stone-800 text-stone-500 p-3 rounded-xl font-medium transition-all"><Trash2 className="w-4 h-4" /> Delete</button>
                </div>
            </div>
        </div>
    );
}

function MobileChampionModal({ champion, onClose, onDelete }: { champion: Character; onClose: () => void; onDelete: (id: string) => void }) {
    const archetype = DND_ARCHETYPES.find(a => a.name === champion.name);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-sm lg:hidden">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-sm max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-stone-950/50 hover:bg-stone-800 rounded-full text-stone-400 hover:text-white transition-colors backdrop-blur-md">
                    <X className="w-5 h-5" />
                </button>
                <div className="relative aspect-square w-full">
                    <img src={getChampionImage(champion)} alt={champion.name} className="w-full h-full object-cover rounded-t-3xl" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-stone-900 to-transparent">
                        <h2 className="text-2xl font-serif text-white">{champion.name}</h2>
                        <p className="text-gold-400 text-sm font-bold tracking-wider uppercase">Lvl {champion.level} {champion.class} · {champion.xp || 0} XP</p>
                    </div>
                </div>
                <div className="p-6 flex flex-col gap-6">
                    <p className="text-sm text-stone-400 italic">"{archetype?.description || 'A brave soul seeking destiny.'}"</p>
                    <div className="flex gap-4 items-center justify-between border-y border-stone-800 py-4">
                        <div>
                            <p className="text-xs text-stone-500 uppercase font-bold mb-1">HP</p>
                            <p className="text-xl font-serif text-crimson-500"><span className="text-white font-bold">{champion.hp_current}</span> / {champion.hp_max}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-stone-500 uppercase font-bold mb-1">STR / DEX / CON</p>
                            <p className="text-sm text-stone-300 font-mono">{champion.strength} / {champion.dexterity} / {champion.constitution}</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 mt-2">
                        <Link href={`/adventures?characterId=${champion.id}`} className="w-full flex items-center justify-center gap-2 bg-gold-600 hover:bg-gold-500 text-stone-950 p-4 rounded-xl font-bold transition-all">
                            <Check className="w-5 h-5" /> Embark Adventure
                        </Link>
                        <button onClick={() => { onDelete(champion.id); onClose(); }} className="w-full flex items-center justify-center gap-2 bg-stone-950 hover:bg-red-950/50 border border-stone-800 text-stone-500 p-3 rounded-xl font-medium transition-all text-sm">
                            <Trash2 className="w-4 h-4" /> Delete Champion
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ChampionsPage() {
    const [champions, setChampions] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ id: string } | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedArchetype, setSelectedArchetype] = useState<DndArchetype>(DND_ARCHETYPES[0]);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        async function fetchInitialData() {
            setLoading(true);
            const { data: { user: authUser } } = await supabase.auth.getUser();
            setUser(authUser);
            const { data, error } = await supabase.from('characters').select('*');
            if (!error && data) {
                setChampions(data as Character[]);
                if (data.length > 0) setSelectedId(data[0].id);
            }
            setLoading(false);
        }
        fetchInitialData();
    }, [supabase]);

    const handleCreateChampion = async (archetype: DndArchetype) => {
        if (!user) {
            router.push('/login');
            return;
        }
        setLoading(true);

        const newChar = {
            user_id: user.id,
            name: archetype.name,
            class: archetype.class,
            level: 1,
            xp: 0,
            hp_current: archetype.hp,
            hp_max: archetype.hp,
            strength: archetype.stats.str,
            dexterity: archetype.stats.dex,
            constitution: archetype.stats.con,
            intelligence: archetype.stats.int,
            wisdom: archetype.stats.wis,
            charisma: archetype.stats.cha,
            image_url: archetype.image
        };

        const { data, error } = await supabase.from('characters').insert([newChar]).select();
        if (error) {
            alert("Failed to create champion: " + error.message);
            // Keep alert here because the champions page has no toast system yet.
        } else if (data && data.length > 0) {
            setChampions(prev => [...prev, data[0] as Character]);
            setSelectedId(data[0].id);
            setIsCreating(false);
        }
        setLoading(false);
    };

    const handleDeleteChampion = async (championId: string) => {
        if (!confirm('Are you sure you want to delete this champion? This will also delete all associated campaigns. This action cannot be undone.')) return;
        setLoading(true);

        const { data: campaigns } = await supabase.from('campaigns').select('id').eq('character_id', championId);
        if (campaigns && campaigns.length > 0) {
            const campaignIds = (campaigns as { id: string }[]).map(c => c.id);
            await supabase.from('chat_logs').delete().in('campaign_id', campaignIds);
            await supabase.from('campaigns').delete().eq('character_id', championId);
        }
        const { error } = await supabase.from('characters').delete().eq('id', championId);
        if (error) {
            alert('Failed to delete champion: ' + error.message);
        } else {
            setChampions(prev => prev.filter(c => c.id !== championId));
            if (selectedId === championId) {
                const remaining = champions.filter(c => c.id !== championId);
                setSelectedId(remaining.length > 0 ? remaining[0].id : null);
            }
        }
        setLoading(false);
    };

    const selectedChampion = champions.find(c => c.id === selectedId) || null;

    return (
        <div className="min-h-screen bg-stone-950 text-stone-200 flex flex-col">
            <header className="p-4 md:p-6 border-b border-stone-800 bg-stone-900/50 flex items-center justify-between sticky top-0 z-30 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => isCreating ? setIsCreating(false) : router.push('/')} className="p-2 hover:bg-stone-800 rounded-full transition-colors text-stone-400 hover:text-stone-200">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl md:text-3xl font-serif text-gold-500">
                        {isCreating ? "Choose Your Archetype" : "Your Champions"}
                    </h1>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {!isCreating ? (
                    <div className="flex-1 flex flex-col lg:flex-row w-full h-full">
                        <section className="w-full lg:w-1/3 xl:w-1/4 lg:border-r border-stone-800 p-4 overflow-y-auto space-y-4">
                            {loading ? (
                                <div className="flex justify-center items-center h-full text-stone-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
                            ) : champions.length === 0 ? (
                                <div className="text-center text-stone-500 py-12">
                                    <p>No champions found.</p>
                                    <p className="text-sm mt-2">Create one to begin your adventure.</p>
                                </div>
                            ) : champions.map(champion => (
                                <ChampionListItem
                                    key={champion.id}
                                    champion={champion}
                                    isSelected={champion.id === selectedId}
                                    onClick={() => { setSelectedId(champion.id); setIsMobileModalOpen(true); }}
                                />
                            ))}
                            <button onClick={() => setIsCreating(true)} className="w-full p-4 rounded-xl border border-stone-800 border-dashed text-stone-500 hover:text-stone-300 hover:border-stone-600 hover:bg-stone-900/40 transition-all flex flex-col items-center justify-center gap-2 h-24">
                                <span className="text-xl">+ Create New</span>
                            </button>
                        </section>

                        <section className="hidden lg:flex flex-1 p-10 bg-stone-950/50 overflow-y-auto">
                            {selectedChampion ? (
                                <ChampionDetail champion={selectedChampion} onDelete={handleDeleteChampion} />
                            ) : (
                                <div className="m-auto text-stone-600 text-center">
                                    <Shield className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p className="italic">Select a champion or create a new one.</p>
                                </div>
                            )}
                        </section>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-stone-950">
                        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
                            <div className="lg:col-span-5 grid grid-cols-1 gap-3 content-start h-fit">
                                {DND_ARCHETYPES.map(arch => (
                                    <ArchetypeCard key={arch.name} arch={arch} isSelected={selectedArchetype.name === arch.name} onClick={() => setSelectedArchetype(arch)} />
                                ))}
                            </div>
                            <div className="lg:col-span-7 bg-stone-900/50 border border-stone-800 rounded-3xl p-8 sticky top-0 h-fit">
                                {selectedArchetype && (
                                    <ArchetypeDetail arch={selectedArchetype} onCreate={handleCreateChampion} loading={loading} />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {isMobileModalOpen && selectedChampion && (
                <MobileChampionModal champion={selectedChampion} onClose={() => setIsMobileModalOpen(false)} onDelete={handleDeleteChampion} />
            )}
        </div>
    );
}
