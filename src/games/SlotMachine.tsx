import React, { useState, useEffect } from 'react';
import { GameProps } from '../types';
import { pickRandom, shuffle } from '../lib/utils';
import { playTick, playSuspense } from '../lib/audio';

// Helper to short part
function shortPart(n: string) {
  return n.length > 10 ? n.substring(0, 9) + '…' : n;
}

function splitName(name: string) {
  const parts = name.split(/\s+/);
  if (parts.length >= 3) return [parts[0], parts.slice(1, -1).join(' '), parts.slice(-1)[0]];
  if (parts.length === 2) return [parts[0], '—', parts[1]];
  return [name, '⭐', name];
}

export default function SlotMachine({ students, onWinner }: GameProps) {
  const [reels, setReels] = useState<string[][]>([[], [], []]);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    if (students.length === 0) return;
    const w = pickRandom(students)!;
    setWinner(w);
    const parts = splitName(w);

    const newReels = [0, 1, 2].map((i) => {
      let names = shuffle([...students]);
      if (names.length < 20) {
        while (names.length < 20) names = names.concat(shuffle([...students]));
      }
      names.push(parts[i]); 
      return names;
    });
    setReels(newReels);
  }, [students]);

  const handlePull = () => {
    if (spinning || !winner) return;
    setSpinning(true);
    playSuspense();
    
    const reelStrips = document.querySelectorAll('.reel-strip');
    
    reelStrips.forEach((strip: any, i) => {
      const total = reels[i].length;
      const targetY = -(total - 1) * 80;
      strip.style.transition = 'none';
      strip.style.transform = 'translateY(0)';
      
      setTimeout(() => {
        strip.style.transition = `transform ${2 + i * 0.7}s cubic-bezier(0.17, 0.67, 0.4, 1)`;
        strip.style.transform = `translateY(${targetY}px)`;
      }, 50);
    });

    const tickIv = setInterval(playTick, 150);
    
    setTimeout(() => {
      clearInterval(tickIv);
      setSpinning(false);
      onWinner(winner);
    }, 4500);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="bg-gradient-to-br from-red-500 to-yellow-500 p-8 rounded-3xl border-8 border-red-900 shadow-[inset_0_0_20px_rgba(0,0,0,0.3),_0_10px_30px_rgba(0,0,0,0.4)] mb-8">
        <div className="flex gap-4 bg-gray-900 p-4 rounded-xl">
          {reels.map((reel, i) => (
            <div key={i} className="w-[100px] h-[80px] md:w-[140px] md:h-[100px] bg-white rounded-lg overflow-hidden shadow-[inset_0_3px_10px_rgba(0,0,0,0.3)] relative">
              <div className="reel-strip flex flex-col items-center text-center text-slate-800 font-bold w-full transition-transform" id={`r${i}`}>
                {reel.map((name, idx) => (
                  <div key={idx} className="h-[80px] md:h-[100px] w-full flex items-center justify-center text-lg md:text-xl px-2">
                    {shortPart(name)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <button 
        onClick={handlePull}
        disabled={spinning}
        className="px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-900 font-bold rounded-2xl text-xl shadow-lg disabled:opacity-50 transition transform hover:-translate-y-1"
      >
        🎰 KÉO CẦN
      </button>
    </div>
  );
}
