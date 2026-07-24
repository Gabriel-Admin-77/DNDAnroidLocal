import Link from 'next/link';
import { Sword, Map, Settings } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-stone-950 p-6 relative overflow-hidden">
      {/* Decorative background overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-crimson-800)_0%,_transparent_70%)] opacity-20 pointer-events-none" />

      <div className="z-10 text-center max-w-4xl w-full flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-wider text-stone-100 mb-6 drop-shadow-lg">
          D&D AI Game Master
        </h1>
        <p className="text-stone-400 text-lg md:text-xl max-w-2xl text-center mb-12">
          An endless journey awaits. Forge your destiny, choose your champion, and let the omniscient algorithmic Dungeon Master weave your epic tale.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-3xl">
          <Link href="/champions" className="group p-1 rounded-xl bg-gradient-to-r from-stone-800 to-stone-900 border border-stone-800 hover:border-gold-500/50 transition-all duration-300">
            <div className="bg-stone-950/80 p-6 rounded-lg h-full flex flex-col items-center text-center justify-center gap-4 transition-colors group-hover:bg-stone-900/50">
              <Sword className="w-12 h-12 text-crimson-600 group-hover:text-gold-400 transition-colors" />
              <h2 className="text-2xl font-serif text-stone-200">Select Champion</h2>
              <p className="text-stone-400 text-sm">Create or select your hero for the upcoming adventure.</p>
            </div>
          </Link>

          <Link href="/adventures" className="group p-1 rounded-xl bg-gradient-to-r from-stone-800 to-stone-900 border border-stone-800 hover:border-gold-500/50 transition-all duration-300">
            <div className="bg-stone-950/80 p-6 rounded-lg h-full flex flex-col items-center text-center justify-center gap-4 transition-colors group-hover:bg-stone-900/50">
              <Map className="w-12 h-12 text-crimson-600 group-hover:text-gold-400 transition-colors" />
              <h2 className="text-2xl font-serif text-stone-200">Adventures</h2>
              <p className="text-stone-400 text-sm">Pick a campaign module, ranging from beginner quests to legendary mythos.</p>
            </div>
          </Link>

          <Link href="/play" className="group p-1 rounded-xl bg-gradient-to-r from-stone-800 to-stone-900 border border-stone-800 hover:border-gold-500/50 transition-all duration-300">
            <div className="bg-stone-950/80 p-6 rounded-lg h-full flex flex-col items-center text-center justify-center gap-4 transition-colors group-hover:bg-stone-900/50">
              <Settings className="w-12 h-12 text-crimson-600 group-hover:text-gold-400 transition-colors" />
              <h2 className="text-2xl font-serif text-stone-200">Dashboard</h2>
              <p className="text-stone-400 text-sm">Jump straight back into your active tabletop campaign.</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
