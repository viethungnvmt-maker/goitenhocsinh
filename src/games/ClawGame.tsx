import React, { useEffect, useRef, useState } from 'react';
import { GameProps } from '../types';
import { shuffle } from '../lib/utils';
import { playTick, playSuspense, playCheer } from '../lib/audio';

const PLUSHIES = ['🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵', '🐰', '🦊', '🐶', '🐱', '🐮', '🦄', '🐷', '🐧', '🦉', '🐙', '🐢'];

type Phase = 'idle' | 'moving' | 'dropping' | 'grabbing' | 'lifting' | 'done';

export default function ClawGame({ students, onWinner }: GameProps) {
  const [items, setItems] = useState<{ name: string; icon: string }[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [clawX, setClawX] = useState(0);
  const [clawY, setClawY] = useState(0);
  const [clawOpen, setClawOpen] = useState(true);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const N = Math.min(students.length, 10);
    const shuffled = shuffle([...students]).slice(0, N);
    setItems(shuffled.map((name, i) => ({ name, icon: PLUSHIES[i % PLUSHIES.length] })));
    setWinnerIdx(null);
    setPhase('idle');
    setClawX(0);
    setClawY(0);
    setClawOpen(true);
  }, [students]);

  const handleStart = () => {
    if (phase !== 'idle' || items.length === 0) return;
    const winIdx = Math.floor(Math.random() * items.length);
    setWinnerIdx(winIdx);
    setPhase('moving');
    playSuspense();

    const row = rowRef.current;
    if (!row) return;
    const cellW = row.offsetWidth / items.length;
    const targetX = cellW * (winIdx + 0.5) - row.offsetWidth / 2;

    // Bluff: wobble to random positions before settling
    const wobbles = 4 + Math.floor(Math.random() * 3);
    let step = 0;

    const wobble = () => {
      if (step < wobbles) {
        const randIdx = Math.floor(Math.random() * items.length);
        const randX = cellW * (randIdx + 0.5) - row.offsetWidth / 2;
        setClawX(randX);
        playTick();
        step++;
        setTimeout(wobble, 500 + Math.random() * 250);
      } else {
        setClawX(targetX);
        playTick();
        setTimeout(() => {
          setPhase('dropping');
          setClawY(150);
          setTimeout(() => {
            setPhase('grabbing');
            setClawOpen(false);
            setTimeout(() => {
              setPhase('lifting');
              setClawY(0);
              setTimeout(() => {
                setPhase('done');
                playCheer();
                onWinner(items[winIdx].name);
              }, 900);
            }, 500);
          }, 700);
        }, 600);
      }
    };
    setTimeout(wobble, 400);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <p className="text-sm md:text-base mb-4 text-brand-muted uppercase tracking-wider font-bold">🪝 Cần cẩu sẽ gắp ngẫu nhiên một bạn!</p>

      <div className="relative w-full max-w-2xl h-[360px] bg-gradient-to-b from-pink-200 via-purple-200 to-blue-200 rounded-3xl overflow-hidden border-4 border-amber-400 shadow-2xl" style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.2), 0 15px 40px rgba(0,0,0,0.25)' }}>
        {/* Machine frame */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-amber-500 to-amber-400 border-b-2 border-amber-600" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-700 via-amber-500 to-amber-400 border-t-2 border-amber-600" />
        </div>

        {/* Rail */}
        <div className="absolute top-6 left-0 right-0 h-2 bg-slate-700/80 z-10" />

        {/* Claw assembly */}
        <div
          className="absolute top-8 left-1/2 z-20 transition-transform ease-out"
          style={{
            transform: `translateX(calc(-50% + ${clawX}px)) translateY(${clawY}px)`,
            transitionDuration: phase === 'moving' ? '480ms' : phase === 'dropping' ? '700ms' : phase === 'lifting' ? '900ms' : '300ms',
          }}
        >
          {/* Cable */}
          <div className="mx-auto w-1 bg-slate-800" style={{ height: 60 + clawY }} />
          {/* Claw body */}
          <div className="relative w-16 h-12 mx-auto -mt-1">
            <div className="absolute left-1/2 -translate-x-1/2 w-16 h-4 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-t-md border border-yellow-600" />
            <div
              className="absolute top-3 left-0 w-4 h-8 bg-gradient-to-b from-yellow-400 to-yellow-600 border border-yellow-700 origin-top-right transition-transform duration-300"
              style={{ transform: clawOpen ? 'rotate(-30deg)' : 'rotate(-5deg)', borderRadius: '2px 2px 6px 10px' }}
            />
            <div
              className="absolute top-3 right-0 w-4 h-8 bg-gradient-to-b from-yellow-400 to-yellow-600 border border-yellow-700 origin-top-left transition-transform duration-300"
              style={{ transform: clawOpen ? 'rotate(30deg)' : 'rotate(5deg)', borderRadius: '2px 2px 10px 6px' }}
            />
          </div>
        </div>

        {/* Items row */}
        <div ref={rowRef} className="absolute bottom-16 left-0 right-0 px-4 flex justify-around items-end">
          {items.map((item, i) => {
            const isWinner = i === winnerIdx;
            const lifted = isWinner && (phase === 'grabbing' || phase === 'lifting' || phase === 'done');
            return (
              <div
                key={i}
                className="flex flex-col items-center transition-all"
                style={{
                  transform: lifted ? `translateY(${phase === 'grabbing' ? 0 : -150}px) scale(1.15)` : 'none',
                  transitionDuration: phase === 'lifting' ? '900ms' : '300ms',
                  filter: isWinner && phase !== 'idle' ? 'drop-shadow(0 0 12px gold)' : 'none',
                  zIndex: isWinner ? 15 : 5,
                }}
              >
                <span className="text-4xl md:text-5xl drop-shadow-lg">{item.icon}</span>
                <span className="mt-1 text-[10px] md:text-xs bg-white/90 text-slate-800 px-2 py-0.5 rounded-full shadow max-w-[80px] truncate font-semibold">
                  {item.name.length > 8 ? item.name.substring(0, 7) + '…' : item.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Coin slot decoration */}
        <div className="absolute bottom-2 right-4 w-10 h-4 bg-slate-900 rounded-sm border border-amber-700" />
      </div>

      <button
        onClick={handleStart}
        disabled={phase !== 'idle'}
        className="mt-6 px-10 py-4 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:brightness-110 text-white font-black rounded-2xl text-xl shadow-xl uppercase tracking-widest transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
      >
        {phase === 'idle' ? '🪝 Nhấn để gắp!' : phase === 'done' ? '🎉 Đã gắp được!' : '⏳ Đang gắp...'}
      </button>
    </div>
  );
}
