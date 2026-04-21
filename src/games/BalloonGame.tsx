import React, { useState, useEffect } from 'react';
import { GameProps } from '../types';
import { shuffle, cn } from '../lib/utils';
import { playTick, playBoom } from '../lib/audio';

interface BalloonItem {
  name: string;
  id: number;
  popped: boolean;
  isWinner: boolean;
}

export default function BalloonGame({ students, onWinner }: GameProps) {
  const [balloons, setBalloons] = useState<BalloonItem[]>([]);
  const [playing, setPlaying] = useState(false);
  const [winnerName, setWinnerName] = useState<string>('');

  useEffect(() => {
    const N = Math.min(students.length, 20);
    const shuffled = shuffle([...students]).slice(0, N);
    const winnerIdx = Math.floor(Math.random() * N);
    
    setWinnerName(shuffled[winnerIdx]);
    
    const items = shuffled.map((name, idx) => ({
      name,
      id: idx,
      popped: false,
      isWinner: idx === winnerIdx
    }));
    
    setBalloons(items);
  }, [students]);

  const handleBalloonClick = (targetId: number) => {
    if (playing || balloons.length === 0) return;
    setPlaying(true);
    
    let count = 0;
    const maxPops = Math.min(12, balloons.length - 1);
    
    const iv = setInterval(() => {
      setBalloons(prev => {
        const remaining = prev.filter(b => !b.popped && !b.isWinner);
        if (remaining.length === 0 || count >= maxPops) {
          clearInterval(iv);
          
          setTimeout(() => {
            playBoom();
            onWinner(winnerName);
          }, 300);
          
          return prev;
        }
        
        const r = remaining[Math.floor(Math.random() * remaining.length)];
        const next = [...prev];
        next[r.id].popped = true;
        playTick();
        count++;
        return next;
      });
    }, 200);
  };

  return (
    <div className="flex flex-col items-center">
      <p className="text-xl mb-6 text-sky-800 dark:text-sky-200">🎈 Bấm vào bong bóng bạn muốn! (Ngẫu nhiên sẽ chọn 1 quả)</p>
      
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 p-6 bg-gradient-to-b from-sky-300 to-blue-200 rounded-3xl w-full max-w-4xl shadow-inner border-4 border-white/40">
        {balloons.map((b) => (
           <div 
             key={b.id}
             onClick={() => handleBalloonClick(b.id)}
             className={cn(
               "flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
               b.popped ? "animate-pop scale-0 opacity-0" : "animate-float hover:scale-110",
               b.id % 2 !== 0 && "animation-delay-500",
               playing && b.isWinner && !b.popped && balloons.filter(x => x.popped).length >= Math.min(12, balloons.length - 1) && "scale-150 drop-shadow-[0_0_20px_#ffd700] z-10"
             )}
             style={{ animationPlayState: b.popped ? 'running' : 'running' }}
           >
             <span className="text-6xl drop-shadow-md mb-2">🎈</span>
             <span className="text-xs bg-white/90 text-slate-800 px-2 py-1 rounded-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap shadow-sm font-medium">
               {b.name.length > 10 ? b.name.substring(0, 9) + '…' : b.name}
             </span>
           </div>
        ))}
      </div>
      
      <style>{`
        @keyframes float { 
          0%, 100% { transform: translateY(0); } 
          50% { transform: translateY(-10px); } 
        }
        @keyframes pop { 
          to { transform: scale(0); opacity: 0; } 
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-pop { animation: pop 0.3s forwards; }
        .animation-delay-500 { animation-delay: 0.5s; }
      `}</style>
    </div>
  );
}
