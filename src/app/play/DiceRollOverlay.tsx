'use client';
import { useState, useEffect, useCallback } from 'react';

interface DiceRollOverlayProps {
    roll: number;
    modifier?: number;
    total?: number;
    dc?: number;
    reason?: string;
    onComplete: () => void;
}

// Audio playback using downloaded mp3 files
function playRollingSound() {
    try {
        const audio = new Audio('/sounds/dice-roll.mp3');
        audio.loop = true;
        audio.volume = 0.5;
        audio.play().catch(e => console.warn('Audio play failed', e));
        return audio;
    } catch (e) {
        console.warn('Audio creation failed:', e);
        return null;
    }
}

function playResultSound(success: boolean, isCritical: boolean) {
    try {
        if (success) {
            const audio = new Audio('/sounds/success.mp3');
            audio.volume = 0.7;
            audio.play().catch(e => console.warn('Audio play failed', e));
        } else {
            const audio = new Audio('/sounds/failure.mp3');
            audio.volume = 0.7;
            audio.play().catch(e => console.warn('Audio play failed', e));
        }
    } catch (e) {
        console.warn('Audio playback failed:', e);
    }
}

export default function DiceRollOverlay({ roll, modifier = 0, total, dc, reason, onComplete }: DiceRollOverlayProps) {
    const [phase, setPhase] = useState<'rolling' | 'result' | 'done'>('rolling');
    const [displayNumber, setDisplayNumber] = useState(1);
    const [rollingAudio, setRollingAudio] = useState<HTMLAudioElement | null>(null);
    const finalTotal = total ?? roll + modifier;
    const isSuccess = dc ? finalTotal >= dc : roll >= 10;
    const isCritNat20 = roll === 20;
    const isCritNat1 = roll === 1;

    // Tumbling animation — cycle random numbers
    useEffect(() => {
        if (phase !== 'rolling') return;

        const audio = playRollingSound();
        if (audio) setRollingAudio(audio);

        const interval = setInterval(() => {
            setDisplayNumber(Math.floor(Math.random() * 20) + 1);
        }, 60);

        const timeout = setTimeout(() => {
            clearInterval(interval);
            setDisplayNumber(roll);
            setPhase('result');
            playResultSound(isSuccess, isCritNat20 || isCritNat1);
        }, 1200);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [phase, roll, isSuccess, isCritNat20, isCritNat1]);

    // Stop rolling audio when phase changes
    useEffect(() => {
        if (phase !== 'rolling' && rollingAudio) {
            rollingAudio.pause();
            rollingAudio.currentTime = 0;
            setRollingAudio(null);
        }
    }, [phase, rollingAudio]);

    // Auto-dismiss after showing result
    useEffect(() => {
        if (phase !== 'result') return;
        const timeout = setTimeout(() => {
            setPhase('done');
            onComplete();
        }, 2500);
        return () => clearTimeout(timeout);
    }, [phase, onComplete]);

    if (phase === 'done') return null;

    const resultColor = isCritNat20
        ? 'text-gold-400'
        : isCritNat1
            ? 'text-crimson-600'
            : isSuccess
                ? 'text-emerald-400'
                : 'text-red-400';

    const glowColor = isCritNat20
        ? 'shadow-[0_0_80px_rgba(251,191,36,0.6)]'
        : isCritNat1
            ? 'shadow-[0_0_80px_rgba(153,27,27,0.6)]'
            : isSuccess
                ? 'shadow-[0_0_60px_rgba(52,211,153,0.4)]'
                : 'shadow-[0_0_60px_rgba(239,68,68,0.4)]';

    const bgRing = isCritNat20
        ? 'border-gold-400'
        : isCritNat1
            ? 'border-crimson-600'
            : isSuccess
                ? 'border-emerald-400'
                : 'border-red-400';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-6">
                {/* Dice */}
                <div className={`
                    relative w-32 h-32 flex items-center justify-center rounded-2xl border-4 
                    ${phase === 'rolling' ? 'border-stone-600 bg-stone-900' : `${bgRing} bg-stone-900 ${glowColor}`}
                    transition-all duration-500
                    ${phase === 'rolling' ? 'animate-bounce' : 'scale-110'}
                `}>
                    {/* d20 shape hint */}
                    <div className="absolute inset-2 border border-stone-700/30 rounded-xl rotate-45 pointer-events-none" />

                    <span className={`
                        text-5xl font-serif font-bold tabular-nums
                        ${phase === 'rolling' ? 'text-stone-400' : resultColor}
                        transition-all duration-300
                        ${phase === 'result' ? 'scale-125' : ''}
                    `}>
                        {displayNumber}
                    </span>
                </div>

                {/* Result info */}
                {phase === 'result' && (
                    <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Modifier & Total */}
                        {modifier !== 0 && (
                            <div className="flex items-center gap-2 text-sm text-stone-400">
                                <span>d20: {roll}</span>
                                <span>{modifier >= 0 ? '+' : ''}{modifier}</span>
                                <span>=</span>
                                <span className={`font-bold text-lg ${resultColor}`}>{finalTotal}</span>
                            </div>
                        )}

                        {/* DC check */}
                        {dc && (
                            <div className="text-xs text-stone-500">
                                DC {dc} — <span className={isSuccess ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                    {isSuccess ? 'SUCCESS' : 'FAILURE'}
                                </span>
                            </div>
                        )}

                        {/* Critical labels */}
                        {isCritNat20 && (
                            <div className="text-lg font-serif font-bold text-gold-400 tracking-widest uppercase animate-pulse">
                                ✦ NATURAL 20 ✦
                            </div>
                        )}
                        {isCritNat1 && (
                            <div className="text-lg font-serif font-bold text-crimson-600 tracking-widest uppercase animate-pulse">
                                ✗ CRITICAL FAIL ✗
                            </div>
                        )}
                        {!isCritNat20 && !isCritNat1 && (
                            <div className={`text-sm font-bold uppercase tracking-wider ${resultColor}`}>
                                {isSuccess ? '✓ Success' : '✗ Failed'}
                            </div>
                        )}

                        {/* Reason */}
                        {reason && (
                            <div className="text-xs text-stone-500 italic mt-1 max-w-xs text-center">
                                {reason}
                            </div>
                        )}
                    </div>
                )}

                {/* Label */}
                <span className="text-xs text-stone-600 uppercase tracking-widest">
                    {phase === 'rolling' ? 'Rolling...' : 'd20'}
                </span>
            </div>
        </div>
    );
}
