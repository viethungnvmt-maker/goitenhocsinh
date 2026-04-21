import React, { useState } from 'react';
import { GameProps } from '../types';
import { playSuspense } from '../lib/audio';

export default function DartGame({ students, onWinner }: GameProps) {
  const [throwing, setThrowing] = useState(false);
  const [arrowStyle, setArrowStyle] = useState({});

  const handleThrow = () => {
    if (throwing || students.length === 0) return;
    setThrowing(true);
    
    // Pick Winner
    const winnerIdx = Math.floor(Math.random() * students.length);
    const winner = students[winnerIdx];
    
    // Calculate angle
    const n = students.length;
    const angleDeg = (winnerIdx / n) * 360 - 90;
    const spins = 3;
    
    setArrowStyle({
      transition: 'transform 3s cubic-bezier(0.17,0.67,0.83,0.67)',
      transform: `translate(0,-50%) rotate(${spins * 360 + angleDeg}deg)`
    });
    
    playSuspense();
    
    setTimeout(() => {
      setThrowing(false);
      onWinner(winner);
    }, 3100);
  };

  const N = students.length;

  return (
    <div className="flex flex-col items-center">
      <div className="w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full bg-[repeating-radial-gradient(circle,#e74c3c_0_15%,#fff_15%_30%,#e74c3c_30%_45%,#fff_45%_60%,#e74c3c_60%_75%,#fff_75%_90%,#e74c3c_90%_100%)] relative shadow-[0_10px_30px_rgba(0,0,0,0.4)] mb-8 overflow-hidden border-8 border-slate-800">
        
        {students.map((student, i) => {
          const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
          const r = 43; // percent
          const x = 50 + r * Math.cos(angle);
          const y = 50 + r * Math.sin(angle);
          const label = student.length > 12 ? student.substring(0, 11) + '…' : student;
          
          return (
            <div 
              key={i}
              className="absolute text-[9px] md:text-xs bg-black/70 text-white px-2 py-1 rounded-full whitespace-nowrap transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {label}
            </div>
          );
        })}
        
        <div 
          className="absolute top-1/2 left-1/2 text-5xl md:text-6xl origin-[left_center] transform translate-y-[-50%] z-10 drop-shadow-lg"
          style={arrowStyle}
        >
          ➤
        </div>
      </div>
      
      <button 
        onClick={handleThrow}
        disabled={throwing}
        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-2xl text-xl shadow-lg disabled:opacity-50 transition transform hover:-translate-y-1"
      >
        🎯 PHÓNG PHI TIÊU
      </button>
    </div>
  );
}
