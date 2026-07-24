'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Map, Compass, Lock, CheckCircle2, Play } from 'lucide-react';
import { MAP_NODES, MapNode, getUnlockedNodeIds } from '@/lib/world-map';

export default function MapPage() {
    const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
    const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);

    useEffect(() => {
        const unlocked = getUnlockedNodeIds();
        setUnlockedIds(unlocked);
        setSelectedNode(MAP_NODES[0]);
    }, []);

    return (
        <main className="min-h-screen bg-stone-950 p-6 relative overflow-hidden">
            {/* Ambient background effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-crimson-800)_0%,_transparent_70%)] opacity-20 pointer-events-none" />

            <div className="relative z-10 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/" className="p-2 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800/50 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-stone-100 flex items-center gap-3">
                            <Compass className="w-8 h-8 text-gold-400" />
                            Realm World Map
                        </h1>
                        <p className="text-stone-500 text-sm mt-1">Interactive map of realm provinces and quest nodes</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Interactive Canvas/Map View */}
                    <div className="lg:col-span-8 bg-stone-900/60 border border-stone-800 rounded-3xl p-6 relative min-h-[500px] shadow-2xl backdrop-blur-md overflow-hidden flex flex-col justify-between">
                        {/* Map Grid SVG Layer */}
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#44403c_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                        {/* Interactive Pins */}
                        <div className="relative w-full h-[440px]">
                            {MAP_NODES.map(node => {
                                const isUnlocked = unlockedIds.includes(node.id);
                                const isSelected = selectedNode?.id === node.id;

                                return (
                                    <button
                                        key={node.id}
                                        onClick={() => setSelectedNode(node)}
                                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                                        className={`absolute -translate-x-1/2 -translate-y-1/2 p-3 rounded-full border-2 transition-all flex items-center justify-center ${
                                            isSelected 
                                                ? 'bg-gold-500 border-white text-stone-950 scale-125 z-20 shadow-[0_0_25px_rgba(245,158,11,0.6)]' 
                                                : isUnlocked 
                                                ? 'bg-stone-900 border-gold-500/80 text-gold-400 hover:scale-110 z-10' 
                                                : 'bg-stone-950/80 border-stone-800 text-stone-700 hover:scale-105'
                                        }`}
                                    >
                                        {isUnlocked ? (
                                            <Map className="w-5 h-5" />
                                        ) : (
                                            <Lock className="w-4 h-4" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Node Detail Side Card */}
                    <div className="lg:col-span-4">
                        {selectedNode ? (
                            <div className="bg-stone-900/60 border border-stone-800 rounded-3xl p-6 backdrop-blur-md">
                                <div className="relative aspect-video rounded-2xl overflow-hidden border border-stone-800 mb-5">
                                    <img src={selectedNode.image} alt={selectedNode.adventureTitle} className="w-full h-full object-cover" />
                                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-stone-950/80 rounded-md border border-stone-800 text-[10px] uppercase font-bold text-gold-400">
                                        {selectedNode.region}
                                    </div>
                                </div>

                                <h2 className="text-xl font-serif text-white mb-2">{selectedNode.adventureTitle}</h2>
                                <p className="text-xs text-stone-400 mb-6 font-serif">Difficulty: <span className="text-amber-400 font-bold">{selectedNode.difficulty}</span></p>

                                <Link
                                    href={`/adventures`}
                                    className="w-full py-3.5 rounded-2xl bg-gold-500 hover:bg-gold-400 text-stone-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <Play className="w-4 h-4 fill-stone-950" /> Embark Adventure Node
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-64 text-stone-600">Select a map pin</div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
