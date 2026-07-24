'use client';
import { useState } from 'react';
import { Sparkles, Check, Lock, X, Award } from 'lucide-react';
import { getSkillTreeForClass, SkillNode } from '@/lib/skill-trees';

interface SkillTreeModalProps {
    isOpen: boolean;
    onClose: () => void;
    characterClass: string;
    level: number;
}

export default function SkillTreeModal({ isOpen, onClose, characterClass, level }: SkillTreeModalProps) {
    const [nodes, setNodes] = useState<SkillNode[]>(() => getSkillTreeForClass(characterClass));
    const [skillPoints, setSkillPoints] = useState(Math.max(1, level - 1));

    if (!isOpen) return null;

    const handleUnlock = (node: SkillNode) => {
        if (skillPoints < node.cost || node.unlocked) return;
        setNodes(prev => prev.map(n => n.id === node.id ? { ...n, unlocked: true } : n));
        setSkillPoints(prev => prev - node.cost);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-xl p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-stone-500 hover:text-stone-300 rounded-full hover:bg-stone-800/50 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Award className="w-7 h-7 text-gold-400" />
                        <div>
                            <h2 className="text-2xl font-serif text-white">{characterClass} Skill Mastery</h2>
                            <p className="text-stone-400 text-xs uppercase tracking-wider">Feat & Mastery Trees</p>
                        </div>
                    </div>

                    <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-gold-400 text-xs font-bold">
                        {skillPoints} Skill Points Available
                    </div>
                </div>

                {/* Nodes Tree */}
                <div className="space-y-4 mb-8">
                    {nodes.map(node => (
                        <div 
                            key={node.id}
                            className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                                node.unlocked 
                                    ? 'bg-amber-950/20 border-gold-500/60' 
                                    : 'bg-stone-950 border-stone-800'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl p-2 bg-stone-900 rounded-xl border border-stone-800">{node.icon}</span>
                                <div>
                                    <h4 className={`font-serif text-base ${node.unlocked ? 'text-gold-300 font-bold' : 'text-stone-300'}`}>
                                        {node.name} <span className="text-xs font-sans text-stone-500">(Tier {node.tier})</span>
                                    </h4>
                                    <p className="text-stone-400 text-xs mt-0.5">{node.description}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleUnlock(node)}
                                disabled={node.unlocked || skillPoints < node.cost}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                    node.unlocked
                                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60 cursor-default'
                                        : skillPoints >= node.cost
                                        ? 'bg-gold-500 hover:bg-gold-400 text-stone-950'
                                        : 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
                                }`}
                            >
                                {node.unlocked ? (
                                    <><Check className="w-3.5 h-3.5" /> Unlocked</>
                                ) : skillPoints >= node.cost ? (
                                    <><Sparkles className="w-3.5 h-3.5" /> Learn ({node.cost} PT)</>
                                ) : (
                                    <><Lock className="w-3.5 h-3.5" /> Locked</>
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-sm font-medium transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
