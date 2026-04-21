import React, { useEffect, useRef, useState } from 'react';
import { GameProps } from '../types';
import { pickRandom } from '../lib/utils';
import { playTick } from '../lib/audio';

export default function WheelGame({ students, onWinner }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const rotationRef = useRef(0);

  const colors = ['#FF6B6B','#4ECDC4','#FFD93D','#95E1D3','#F38181','#AA96DA','#FCBAD3','#A8E6CF','#FF8B94','#6BCB77','#FFD460','#5B5F97'];

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 10;
    
    ctx.clearRect(0, 0, size, size);
    const n = students.length;
    const slice = (2 * Math.PI) / n;
    
    for (let i = 0; i < n; i++) {
      const a0 = rotationRef.current + i * slice;
      const a1 = a0 + slice;
      
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a0, a1);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a0 + slice / 2);
      ctx.fillStyle = '#222';
      ctx.font = 'bold ' + Math.max(10, Math.min(20, 400 / n)) + 'px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const label = students[i].length > 16 ? students[i].substring(0, 15) + '…' : students[i];
      ctx.fillText(label, r - 15, 0);
      ctx.restore();
    }
  };

  useEffect(() => {
    draw();
  }, [students]);

  const handleSpin = () => {
    if (spinning || students.length === 0) return;
    setSpinning(true);
    
    const winnerIdx = Math.floor(Math.random() * students.length);
    const slice = (2 * Math.PI) / students.length;
    const finalAngle = -Math.PI / 2 - (winnerIdx * slice + slice / 2);
    const spins = 6 + Math.random() * 4;
    const targetRotation = finalAngle + spins * 2 * Math.PI;
    const startRotation = rotationRef.current % (2 * Math.PI);
    const duration = 5000;
    const start = performance.now();
    
    const animate = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      rotationRef.current = startRotation + (targetRotation - startRotation) * ease;
      draw();
      
      if (p % 0.02 < 0.01) playTick();
      
      if (p < 1) {
        requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        onWinner(students[winnerIdx]);
      }
    };
    
    requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] mb-8">
        <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[35px] border-t-red-500 drop-shadow-md z-10"></div>
        <canvas ref={canvasRef} width="600" height="600" className="w-full h-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50px] h-[50px] bg-gradient-to-br from-white to-gray-300 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.4)] z-10 border-4 border-gray-100"></div>
      </div>
      <button 
        onClick={handleSpin} 
        disabled={spinning}
        className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-900 font-bold rounded-2xl text-xl shadow-lg transform transition disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1"
      >
        🎡 QUAY NGAY
      </button>
    </div>
  );
}
