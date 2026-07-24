'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Coins, Shield, Swords, Sparkles, Check, Lock, AlertCircle } from 'lucide-react';
import { SHOP_CATALOGUE, ShopItem, getPlayerGold, updatePlayerGold } from '@/lib/shop';
import { bumpStat } from '@/lib/stats';

type ShopTab = 'all' | 'weapon' | 'armor' | 'potion' | 'scroll' | 'material';

export default function ShopPage() {
    const [gold, setGold] = useState(100);
    const [activeTab, setActiveTab] = useState<ShopTab>('all');
    const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        setGold(getPlayerGold());
    }, []);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleBuy = (item: ShopItem) => {
        if (gold < item.price) {
            showToast(`Not enough gold! You need ${item.price} GP.`);
            return;
        }
        const newGold = updatePlayerGold(-item.price);
        setGold(newGold);
        setPurchasedIds(prev => [...prev, item.id]);
        bumpStat('totalGoldSpent', item.price);
        showToast(`Purchased ${item.name}! Added to your armory.`);
    };

    const filtered = activeTab === 'all' 
        ? SHOP_CATALOGUE 
        : SHOP_CATALOGUE.filter(i => i.category === activeTab);

    return (
        <main className="min-h-screen bg-stone-950 p-6 relative overflow-hidden">
            {/* Background ambient effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--color-gold-500)_0%,_transparent_60%)] opacity-10 pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800/50 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-stone-100 flex items-center gap-3">
                                <ShoppingBag className="w-8 h-8 text-gold-400" />
                                Merchant Bazaar
                            </h1>
                            <p className="text-stone-500 text-sm mt-1">Acquire weapons, armor, and potions before your expedition</p>
                        </div>
                    </div>

                    {/* Gold Balance Display */}
                    <div className="flex items-center gap-3 bg-stone-900/90 border border-gold-500/40 px-5 py-2.5 rounded-2xl shadow-lg">
                        <Coins className="w-6 h-6 text-gold-400 animate-pulse" />
                        <div>
                            <p className="text-[10px] uppercase text-stone-400 font-bold tracking-wider">Treasury Balance</p>
                            <p className="text-xl font-serif text-gold-300 font-bold">{gold.toLocaleString()} GP</p>
                        </div>
                    </div>
                </div>

                {/* Notification Toast */}
                {toast && (
                    <div className="fixed bottom-6 right-6 z-50 bg-stone-900 border border-gold-500/50 text-gold-200 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
                        <Sparkles className="w-5 h-5 text-gold-400" />
                        <span className="text-sm font-medium">{toast}</span>
                    </div>
                )}

                {/* Category Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-stone-800">
                    {(['all', 'weapon', 'armor', 'potion', 'scroll', 'material'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                                activeTab === tab
                                    ? 'bg-gold-500 text-stone-950 shadow-md'
                                    : 'bg-stone-900/60 text-stone-400 hover:bg-stone-800 hover:text-stone-200 border border-stone-800'
                            }`}
                        >
                            {tab}s
                        </button>
                    ))}
                </div>

                {/* Catalogue Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(item => {
                        const isPurchased = purchasedIds.includes(item.id);
                        const canAfford = gold >= item.price;

                        return (
                            <div
                                key={item.id}
                                className={`bg-stone-900/60 border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                                    isPurchased
                                        ? 'border-emerald-800/60 bg-emerald-950/10 opacity-75'
                                        : 'border-stone-800 hover:border-stone-700'
                                }`}
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl p-2 bg-stone-950 rounded-xl border border-stone-800">{item.icon}</span>
                                            <div>
                                                <h3 className="font-serif text-lg text-stone-200">{item.name}</h3>
                                                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">{item.category}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-serif font-bold text-gold-400">{item.price} GP</span>
                                        </div>
                                    </div>
                                    <p className="text-stone-400 text-xs leading-relaxed mb-6 font-sans">{item.description}</p>
                                </div>

                                <button
                                    onClick={() => handleBuy(item)}
                                    disabled={isPurchased || !canAfford}
                                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                        isPurchased
                                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60 cursor-default'
                                            : canAfford
                                            ? 'bg-gold-500 hover:bg-gold-400 text-stone-950 shadow-lg'
                                            : 'bg-stone-950 text-stone-600 border border-stone-800 cursor-not-allowed'
                                    }`}
                                >
                                    {isPurchased ? (
                                        <><Check className="w-4 h-4" /> Acquired</>
                                    ) : canAfford ? (
                                        <><Coins className="w-4 h-4" /> Purchase</>
                                    ) : (
                                        <><AlertCircle className="w-4 h-4" /> Insufficient GP</>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
