import React, { useEffect, useState } from 'react';
import { GameProps } from '../types';
import { shuffle } from '../lib/utils';
import { playTick, playSuspense, playCheer } from '../lib/audio';

const SEAL_COLORS = [
  'from-rose-400 to-red-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-green-500',
  'from-sky-400 to-blue-500',
  'from-violet-400 to-purple-500',
  'from-pink-400 to-fuchsia-500',
  'from-yellow-400 to-amber-500',
  'from-teal-400 to-cyan-500',
];

type Phase = 'idle' | 'scanning' | 'focused' | 'opening' | 'revealed';

export default function EnvelopeGame({ students, onWinner }: GameProps) {
  const [envelopes, setEnvelopes] = useState<{ name: string; color: string }[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [scanIdx, setScanIdx] = useState<number | null>(null);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);

  useEffect(() => {
    const N = Math.min(students.length, 12);
    const shuffled = shuffle([...students]).slice(0, N);
    setEnvelopes(shuffled.map((name, i) => ({ name, color: SEAL_COLORS[i % SEAL_COLORS.length] })));
    setPhase('idle');
    setScanIdx(null);
    setWinnerIdx(null);
  }, [students]);

  const handleStart = () => {
    if (phase !== 'idle' || envelopes.length === 0) return;
    const winIdx = Math.floor(Math.random() * envelopes.length);
    setWinnerIdx(winIdx);
    setPhase('scanning');
    playSuspense();

    const steps = envelopes.length * 2 + winIdx + Math.floor(Math.random() * envelopes.length);
    let current = 0;
    let delay = 80;

    const step = () => {
      if (current > steps) {
        setScanIdx(winIdx);
        setPhase('focused');
        setTimeout(() => {
          setPhase('opening');
          setTimeout(() => {
            setPhase('revealed');
            playCheer();
            onWinner(envelopes[winIdx].name);
          }, 1200);
        }, 700);
        return;
      }
      const idx = current % envelopes.length;
      setScanIdx(idx);
      playTick();
      current++;
      delay = current > steps * 0.7 ? delay + 25 : delay;
      setTimeout(step, delay);
    };
    step();
  };

  return (
    <div className="flex flex-col items-center w-full">
      <p className="text-sm md:text-base mb-4 text-brand-muted uppercase tracking-wider font-bold">💌 Một phong bì bí ẩn đang giấu tên của người may mắn...</p>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 p-6 md:p-8 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 rounded-3xl w-full max-w-3xl border-4 border-amber-400/30" style={{ boxShadow: 'inset 0 0 40px rgba(255,215,0,0.1), 0 20px 50px rgba(0,0,0,0.4)' }}>
        {envelopes.map((env, i) => {
          const scanning = scanIdx === i && phase === 'scanning';
          const focused = winnerIdx === i && (phase === 'focused' || phase === 'opening' || phase === 'revealed');
          const opened = winnerIdx === i && (phase === 'opening' || phase === 'revealed');
          const revealed = winnerIdx === i && phase === 'revealed';
          const dimmed = phase !== 'idle' && phase !== 'scanning' && winnerIdx !== i;

          return (
            <div
              key={i}
              className="relative aspect-[4/3] transition-all duration-300"
              style={{
                transform: focused ? 'scale(1.25)' : scanning ? 'scale(1.08) translateY(-4px)' : 'scale(1)',
                filter: dimmed ? 'brightness(0.4) blur(1px)' : scanning ? 'drop-shadow(0 0 16px #fde047)' : focused ? 'drop-shadow(0 0 24px gold)' : 'none',
                zIndex: focused ? 20 : scanning ? 10 : 1,
              }}
            >
              {/* Envelope body */}
              <div className={`absolute inset-0 bg-gradient-to-br ${env.color} rounded-lg shadow-xl border-2 border-white/30 overflow-hidden`}>
                {/* Flap */}
                <div
                  className="absolute top-0 left-0 right-0 h-1/2 transition-transform duration-1000 origin-top"
                  style={{
                    transform: opened ? 'rotateX(-180deg)' : 'rotateX(0deg)',
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <div
                    className={`w-full h-full bg-gradient-to-br ${env.color} border-b-2 border-white/40`}
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                    }}
                  />
                </div>

                {/* Letter peeking out */}
                {opened && (
                  <div className="absolute inset-2 bg-gradient-to-b from-amber-50 to-amber-100 rounded flex items-center justify-center p-2 border border-amber-200 shadow-inner animate-in zoom-in duration-500">
                    <p className={`text-slate-800 font-black text-center ${revealed ? 'animate-pulse' : ''}`} style={{ fontSize: 'clamp(10px, 2.2vw, 16px)' }}>
                      {env.name}
                    </p>
                  </div>
                )}

                {/* Wax seal */}
                {!opened && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-yellow-300 to-amber-600 rounded-full shadow-inner border-2 border-amber-700 flex items-center justify-center text-amber-900 font-black text-xs">
                    💌
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleStart}
        disabled={phase !== 'idle'}
        className="mt-6 px-10 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:brightness-110 text-white font-black rounded-2xl text-xl shadow-xl uppercase tracking-widest transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
      >
        {phase === 'idle' ? '💌 Chọn phong bì định mệnh' : phase === 'revealed' ? '✨ Định mệnh đã hé lộ' : '🔮 Đang chọn...'}
      </button>
    </div>
  );
}
