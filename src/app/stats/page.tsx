'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Dice5, Skull, Trophy, Coins, Hammer,
    Swords, Heart, Shield, Users, Clock, TrendingUp,
    Sparkles, BarChart3
} from 'lucide-react';
import { getPlayerStats, formatPlayTime, PlayerStats } from '@/lib/stats';
import { ACHIEVEMENTS, getUnlocked } from '@/lib/achievements';

function StatCard({ icon, label, value, color = 'text-stone-300' }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color?: string;
}) {
    return (
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-4 flex items-center gap-4 hover:border-stone-700 transition-colors">
            <div className={`p-2.5 rounded-lg bg-stone-800/80 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-stone-500 text-xs uppercase tracking-wider">{label}</p>
                <p className={`text-xl font-bold font-serif ${color}`}>{value}</p>
            </div>
        </div>
    );
}

function ProgressBar({ label, current, max, color = 'bg-amber-500' }: {
    label: string;
    current: number;
    max: number;
    color?: string;
}) {
    const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
    return (
        <div>
            <div className="flex justify-between text-xs text-stone-400 mb-1">
                <span>{label}</span>
                <span>{current} / {max}</span>
            </div>
            <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

export default function StatsPage() {
    const [stats, setStats] = useState<PlayerStats | null>(null);
    const [unlockedCount, setUnlockedCount] = useState(0);

    useEffect(() => {
        const s = getPlayerStats();
        setStats(s);
        // Count all unlocked achievements across any character
        // (global check using the history key)
        try {
            const historyRaw = localStorage.getItem('dnd_app_unlocked_history');
            const history: { id: string }[] = historyRaw ? JSON.parse(historyRaw) : [];
            const uniqueIds = new Set(history.map(h => h.id));
            setUnlockedCount(uniqueIds.size);
        } catch {
            setUnlockedCount(0);
        }
    }, []);

    if (!stats) {
        return (
            <main className="min-h-screen bg-stone-950 flex items-center justify-center">
                <div className="animate-pulse text-stone-500">Loading stats...</div>
            </main>
        );
    }

    const winRate = stats.totalVictories + stats.totalDeaths > 0
        ? Math.round((stats.totalVictories / (stats.totalVictories + stats.totalDeaths)) * 100)
        : 0;

    const nat20Rate = stats.totalDiceRolls > 0
        ? ((stats.nat20s / stats.totalDiceRolls) * 100).toFixed(1)
        : '0.0';

    return (
        <main className="min-h-screen bg-stone-950 p-6 relative overflow-hidden">
            {/* Background effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--color-gold-500)_0%,_transparent_50%)] opacity-10 pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="p-2 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800/50 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-stone-100 flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-gold-400" />
                            Player Statistics
                        </h1>
                        <p className="text-stone-500 text-sm mt-1">Your lifetime adventure record</p>
                    </div>
                </div>

                {/* Achievement Progress */}
                <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-5 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Trophy className="w-5 h-5 text-gold-400" />
                        <h2 className="text-lg font-serif text-stone-200">Achievement Progress</h2>
                    </div>
                    <ProgressBar
                        label="Achievements Unlocked"
                        current={unlockedCount}
                        max={ACHIEVEMENTS.length}
                        color="bg-gold-500"
                    />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {/* Campaign Stats */}
                    <StatCard
                        icon={<Sparkles className="w-5 h-5" />}
                        label="Campaigns Started"
                        value={stats.campaignsStarted}
                        color="text-blue-400"
                    />
                    <StatCard
                        icon={<Trophy className="w-5 h-5" />}
                        label="Victories"
                        value={stats.totalVictories}
                        color="text-gold-400"
                    />
                    <StatCard
                        icon={<Skull className="w-5 h-5" />}
                        label="Deaths"
                        value={stats.totalDeaths}
                        color="text-crimson-600"
                    />

                    {/* Dice Stats */}
                    <StatCard
                        icon={<Dice5 className="w-5 h-5" />}
                        label="Total Dice Rolls"
                        value={stats.totalDiceRolls}
                        color="text-purple-400"
                    />
                    <StatCard
                        icon={<span className="text-lg font-bold">20</span>}
                        label="Natural 20s"
                        value={stats.nat20s}
                        color="text-emerald-400"
                    />
                    <StatCard
                        icon={<span className="text-lg font-bold">1</span>}
                        label="Natural 1s"
                        value={stats.nat1s}
                        color="text-red-400"
                    />

                    {/* Combat Stats */}
                    <StatCard
                        icon={<Swords className="w-5 h-5" />}
                        label="Damage Dealt"
                        value={stats.totalDamageDealt}
                        color="text-orange-400"
                    />
                    <StatCard
                        icon={<Shield className="w-5 h-5" />}
                        label="Damage Taken"
                        value={stats.totalDamageTaken}
                        color="text-red-300"
                    />
                    <StatCard
                        icon={<Heart className="w-5 h-5" />}
                        label="Total Healing"
                        value={stats.totalHealing}
                        color="text-green-400"
                    />

                    {/* Economy */}
                    <StatCard
                        icon={<Coins className="w-5 h-5" />}
                        label="Gold Earned"
                        value={stats.totalGoldEarned.toLocaleString()}
                        color="text-yellow-400"
                    />
                    <StatCard
                        icon={<Hammer className="w-5 h-5" />}
                        label="Items Crafted"
                        value={stats.totalItemsCrafted}
                        color="text-amber-500"
                    />
                    <StatCard
                        icon={<Users className="w-5 h-5" />}
                        label="NPCs Met"
                        value={stats.totalNpcsMet}
                        color="text-sky-400"
                    />
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-5 text-center">
                        <TrendingUp className="w-8 h-8 text-gold-400 mx-auto mb-2" />
                        <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Highest Level</p>
                        <p className="text-3xl font-bold font-serif text-gold-400">{stats.highestLevelReached}</p>
                    </div>
                    <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-5 text-center">
                        <Trophy className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Win Rate</p>
                        <p className="text-3xl font-bold font-serif text-emerald-400">{winRate}%</p>
                    </div>
                    <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-5 text-center">
                        <Clock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                        <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Play Time</p>
                        <p className="text-3xl font-bold font-serif text-purple-400">{formatPlayTime(stats.totalPlayTimeMs)}</p>
                    </div>
                </div>

                {/* Nat 20 Rate & Classes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-5">
                        <h3 className="text-sm font-serif text-stone-400 uppercase tracking-wider mb-3">Nat 20 Rate</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold font-serif text-emerald-400">{nat20Rate}%</span>
                            <span className="text-stone-500 text-sm">({stats.nat20s} of {stats.totalDiceRolls} rolls)</span>
                        </div>
                    </div>
                    <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-5">
                        <h3 className="text-sm font-serif text-stone-400 uppercase tracking-wider mb-3">Classes Played</h3>
                        <div className="flex flex-wrap gap-2">
                            {stats.classesPlayed.length > 0 ? stats.classesPlayed.map(c => (
                                <span key={c} className="px-3 py-1 bg-stone-800 text-stone-300 rounded-full text-xs font-medium">
                                    {c}
                                </span>
                            )) : (
                                <span className="text-stone-600 text-sm italic">No adventures yet</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
