import React, { useState, useEffect, useRef } from 'react';
import { GameProps } from '../types';
import { pickRandom } from '../lib/utils';
import { playSuspense } from '../lib/audio';

export default function RainGame({ students, onWinner }: GameProps) {
  const [running, setRunning] = useState(false);
  const [caught, setCaught] = useState(false);
  const [winnerStr, setWinnerStr] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = () => {
    if (running || students.length === 0) return;
    setRunning(true);
    setCaught(false);
    setWinnerStr(null);
    playSuspense();

    const winner = pickRandom(students)!;

    const iv = setInterval(() => {
      if (!containerRef.current) return;
      const span = document.createElement('div');
      span.className = 'absolute text-cyan-400 font-mono font-bold whitespace-nowrap animate-[rainFall_linear] text-shadow-[0_0_8px_#0ff]';
      span.textContent = pickRandom(students)!;
      span.style.left = Math.random() * 90 + '%';
      const dur = 2 + Math.random() * 2;
      span.style.animationDuration = dur + 's';
      span.style.fontSize = Math.floor(12 + Math.random() * 10) + 'px';
      
      containerRef.current.appendChild(span);
      
      setTimeout(() => {
        if (containerRef.current?.contains(span)) {
           containerRef.current.removeChild(span);
        }
      }, dur * 1000);
    }, 100);

    setTimeout(() => {
      clearInterval(iv);
      setCaught(true);
      setWinnerStr(winner);
      
      // Pause existing rain
      if (containerRef.current) {
        const remaining = containerRef.current.querySelectorAll('div');
        remaining.forEach((el: any) => {
          el.style.animationPlayState = 'paused';
          el.style.opacity = '0.3';
        });
      }
      
      setTimeout(() => {
        setRunning(false);
        onWinner(winner);
      }, 1000);
    }, 4500);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div 
        ref={containerRef}
        className="w-full max-w-3xl h-[400px] bg-gradient-to-b from-[#000428] to-[#004e92] rounded-2xl relative overflow-hidden mb-8 border-4 border-indigo-900 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]"
      >
        {caught && winnerStr && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl md:text-6xl text-yellow-400 font-bold drop-shadow-[0_0_20px_#ffd700] z-10 animate-in zoom-in duration-500 text-center w-full">
            {winnerStr}
          </div>
        )}
      </div>
      
      <button 
        onClick={handleStart}
        disabled={running}
        className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-2xl text-xl shadow-lg disabled:opacity-50 transition transform hover:-translate-y-1"
      >
        🌧️ BẮT ĐẦU MƯA
      </button>

      <style>{`
        @keyframes rainFall {
          from { top: -30px; }
          to { top: 420px; }
        }
      `}</style>
    </div>
  );
}
