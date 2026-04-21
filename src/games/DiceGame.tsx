import React, { useState } from 'react';
import { GameProps } from '../types';
import { pickRandom, cn } from '../lib/utils';
import { playTick, playSuspense } from '../lib/audio';

export default function DiceGame({ students, onWinner }: GameProps) {
  const [d1, setD1] = useState<string | number>('?');
  const [d2, setD2] = useState<string | number>('?');
  const [sum, setSum] = useState<string | number>('?');
  const [mapName, setMapName] = useState('?');
  const [rolling, setRolling] = useState(false);

  const handleRoll = () => {
    if (rolling || students.length === 0) return;
    setRolling(true);
    playSuspense();

    const winner = pickRandom(students)!;
    const winnerIdx = students.indexOf(winner);
    // targetSum 2..12
    const targetSum = (winnerIdx % 11) + 2;
    let d1val = 1 + Math.floor(Math.random() * (Math.min(6, targetSum - 1)));
    let d2val = targetSum - d1val;
    
    if (d2val < 1) { d2val = 1; d1val = targetSum - 1; }
    if (d2val > 6) { d2val = 6; d1val = targetSum - 6; }

    const iv = setInterval(() => {
      setD1(1 + Math.floor(Math.random() * 6));
      setD2(1 + Math.floor(Math.random() * 6));
      setSum('?');
      setMapName(pickRandom(students)!);
      playTick();
    }, 80);

    setTimeout(() => {
      clearInterval(iv);
      setRolling(false);
      setD1(d1val);
      setD2(d2val);
      setSum(targetSum);
      setMapName(winner);
      onWinner(winner);
    }, 2500);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-6 justify-center mb-8 perspective-[600px]">
        <div className={cn(
          "w-24 h-24 md:w-32 md:h-32 bg-white text-slate-900 rounded-2xl flex items-center justify-center text-6xl md:text-7xl font-bold shadow-[0_10px_25px_rgba(0,0,0,0.4)] transition-transform",
          rolling && "animate-[diceRoll_0.1s_infinite]"
        )}>
          {d1}
        </div>
        <div className={cn(
          "w-24 h-24 md:w-32 md:h-32 bg-white text-slate-900 rounded-2xl flex items-center justify-center text-6xl md:text-7xl font-bold shadow-[0_10px_25px_rgba(0,0,0,0.4)] transition-transform",
          rolling && "animate-[diceRoll_0.1s_infinite]"
        )}>
          {d2}
        </div>
      </div>
      
      <div className="text-2xl md:text-3xl mb-8 font-medium">
        Tổng: <span className="text-yellow-400 font-bold">{sum}</span> → <span className="text-emerald-400 font-bold drop-shadow-md">{mapName}</span>
      </div>
      
      <button 
        onClick={handleRoll}
        disabled={rolling}
        className="px-8 py-4 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-white font-bold rounded-2xl text-xl shadow-lg disabled:opacity-50 transition transform hover:-translate-y-1"
      >
        🎲 GIEO XÚC XẮC
      </button>

      <style>{`
        @keyframes diceRoll { 
          0% { transform: rotateX(0) rotateY(0); } 
          50% { transform: rotateX(180deg) rotateY(180deg); } 
          100% { transform: rotateX(360deg) rotateY(360deg); } 
        }
      `}</style>
    </div>
  );
}
