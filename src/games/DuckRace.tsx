import React, { useState, useEffect, useRef } from 'react';
import { GameProps } from '../types';
import { shuffle } from '../lib/utils';
import { playTick } from '../lib/audio';

const EMOJIS = ['🦆', '🐣', '🐥', '🐔', '🐧', '🦢', '🦩', '🐓'];

export default function DuckRace({ students, onWinner }: GameProps) {
  const [racers, setRacers] = useState<string[]>([]);
  const [positions, setPositions] = useState<number[]>([]);
  const [isRacing, setIsRacing] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  
  const N = Math.min(students.length, 8);
  const winnerIdxRef = useRef(0);

  useEffect(() => {
    const selected = shuffle([...students]).slice(0, N);
    setRacers(selected);
    setPositions(new Array(N).fill(0));
    winnerIdxRef.current = Math.floor(Math.random() * N);
  }, [students]);

  const handleStart = () => {
    if (isRacing || racers.length === 0) return;
    setIsRacing(true);
    
    let currentPositions = new Array(N).fill(0);
    const maxLeft = (trackRef.current?.clientWidth || 500) - 130;
    
    let tickCount = 0;
    
    const iv = setInterval(() => {
      tickCount++;
      if (tickCount % 3 === 0) playTick();
      
      let finished = false;
      for (let i = 0; i < N; i++) {
        const speed = i === winnerIdxRef.current ? 2 + Math.random() * 2.5 : 1 + Math.random() * 2.3;
        currentPositions[i] += speed;
        if (currentPositions[winnerIdxRef.current] >= maxLeft - 90) {
           finished = true;
        }
      }
      
      setPositions([...currentPositions]);
      
      if (finished) {
        clearInterval(iv);
        setIsRacing(false);
        onWinner(racers[winnerIdxRef.current]);
      }
    }, 50);

    return () => clearInterval(iv);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div 
        ref={trackRef} 
        className="w-full max-w-3xl bg-gradient-to-b from-sky-400 to-blue-500 rounded-2xl p-4 overflow-hidden relative shadow-inner mb-8"
      >
        {racers.map((racer, i) => {
          const maxLeft = (trackRef.current?.clientWidth || 500) - 130;
          const left = 90 + Math.min(positions[i] || 0, maxLeft - 90);
          return (
            <div key={i} className="h-12 flex items-center border-b-2 border-dashed border-white/30 relative">
              <div className="w-[80px] text-xs px-2 bg-black/40 text-white rounded-lg whitespace-nowrap overflow-hidden text-ellipsis shadow-sm">
                {racer}
              </div>
              <div className="absolute right-[10px] top-0 bottom-0 w-1 bg-[repeating-linear-gradient(0deg,#000_0,#000_10px,#fff_10px,#fff_20px)] z-0"></div>
              <div 
                className="absolute text-4xl drop-shadow-md z-10 transition-all duration-100 ease-linear"
                style={{ left: `${left}px` }}
              >
                {EMOJIS[i % EMOJIS.length]}
              </div>
            </div>
          );
        })}
      </div>
      
      <button 
        onClick={handleStart}
        disabled={isRacing}
        className="px-8 py-4 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white font-bold rounded-2xl text-xl shadow-lg disabled:opacity-50 transition transform hover:-translate-y-1"
      >
        🏁 XUẤT PHÁT!
      </button>
    </div>
  );
}
