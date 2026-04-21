import React, { useState } from 'react';
import { GameProps } from '../types';
import { pickRandom } from '../lib/utils';
import { playTick, playBoom } from '../lib/audio';

export default function BombGame({ students, onWinner }: GameProps) {
  const [timeLeft, setTimeLeft] = useState<number | string>(5);
  const [passingName, setPassingName] = useState('Ai cầm bom khi nổ...');
  const [isStarted, setIsStarted] = useState(false);
  const [icon, setIcon] = useState('💣');
  const [wrapperClass, setWrapperClass] = useState('');

  const handleStart = () => {
    if (isStarted || students.length === 0) return;
    setIsStarted(true);
    setWrapperClass('animate-[shake_0.1s_infinite]');
    setIcon('💣');
    
    const winner = pickRandom(students)!;
    let currentLeft = 5;
    setTimeLeft(currentLeft);
    
    const tickIv = setInterval(() => {
      setPassingName(pickRandom(students)!);
      playTick();
    }, 150);
    
    const cdIv = setInterval(() => {
      currentLeft--;
      setTimeLeft(currentLeft);
      // We could use membraneSynth here if we want more audio control.
      
      if (currentLeft <= 0) {
        clearInterval(tickIv);
        clearInterval(cdIv);
        setTimeLeft('💥 BOOM 💥');
        setPassingName(winner);
        setIcon('🔥');
        setWrapperClass('');
        playBoom();
        setIsStarted(false);
        onWinner(winner);
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center min-h-[300px]">
      <div className="text-center relative mb-8">
        <div className={`text-[120px] inline-block ${wrapperClass}`}>
          {icon}
        </div>
        <div className="text-7xl font-bold text-yellow-400 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)] mt-4">
          {timeLeft}
        </div>
        <div className="text-3xl mt-6 font-medium text-white/90 drop-shadow-md">
          {passingName}
        </div>
      </div>
      
      <button 
        onClick={handleStart}
        disabled={isStarted}
        className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-bold rounded-2xl text-xl shadow-[0_0_20px_rgba(255,0,0,0.5)] disabled:opacity-50 transition transform hover:-translate-y-1"
      >
        🔥 ĐỐT NGÒI
      </button>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translate(0,0) rotate(0); }
          25% { transform: translate(-3px,-2px) rotate(-2deg); }
          50% { transform: translate(3px,2px) rotate(2deg); }
          75% { transform: translate(-2px,3px) rotate(-1deg); }
        }
      `}</style>
    </div>
  );
}
