import React, { useEffect, useRef, useState } from 'react';
import { GameProps } from '../types';
import { shuffle } from '../lib/utils';
import { playTick, playSuspense } from '../lib/audio';

export default function PlinkoGame({ students, onWinner }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dropping, setDropping] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    const binCount = Math.min(students.length, 10);
    setLabels(shuffle([...students]).slice(0, binCount));
  }, [students]);

  useEffect(() => {
    drawBoard();
  }, [labels]);

  const W = Math.min(700, window.innerWidth - 60);
  const H = 500;
  const rows = 8;
  const pegs: {x: number, y: number}[] = [];
  
  for (let r = 0; r < rows; r++) {
    const y = 50 + r * 45;
    const count = r + 3;
    const spacing = W / (count + 1);
    for (let i = 0; i < count; i++) {
      pegs.push({x: spacing * (i + 1), y});
    }
  }

  const binCount = labels.length || 1;
  const binW = W / binCount;

  const drawBoard = (ballX?: number, ballY?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, W, H);
    
    // Draw pegs
    ctx.fillStyle = '#ffd700';
    pegs.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw bins
    for (let i = 0; i < binCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(78,205,196,0.3)' : 'rgba(255,107,107,0.3)';
      ctx.fillRect(i * binW, H - 60, binW, 60);
      ctx.fillStyle = '#fff';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      const label = labels[i] ? (labels[i].length > 10 ? labels[i].substring(0, 9) + '…' : labels[i]) : '';
      ctx.fillText(label, i * binW + binW / 2, H - 30);
    }

    // Draw ball
    if (ballX !== undefined && ballY !== undefined) {
      ctx.beginPath();
      ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(ballX - 3, ballY - 3, 2, ballX, ballY, 10);
      grad.addColorStop(0, '#fff'); 
      grad.addColorStop(1, '#f093fb');
      ctx.fillStyle = grad; 
      ctx.fill();
    }
  };

  const handleDrop = () => {
    if (dropping || labels.length === 0) return;
    setDropping(true);
    
    const winnerBin = Math.floor(Math.random() * binCount);
    const winner = labels[winnerBin];
    const targetX = winnerBin * binW + binW / 2;
    let x = W / 2, y = 0, vy = 0;
    
    playSuspense();
    
    const animate = () => {
      vy += 0.4;
      y += vy;
      
      const progress = y / (H - 80);
      x += (targetX - x) * 0.015 + (Math.random() - 0.5) * 3;
      
      for (let p of pegs) {
        const dx = x - p.x;
        const dy = y - p.y;
        if (dx * dx + dy * dy < 180) {
          vy *= 0.7;
          x += Math.sign(dx) * 2 + (Math.random() - 0.5) * 2;
          playTick();
          break;
        }
      }
      
      drawBoard(x, y);
      
      if (y < H - 70) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          setDropping(false);
          onWinner(winner);
        }, 300);
      }
    };
    
    requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#16213e] p-2 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] mb-8 max-w-full overflow-x-auto border-4 border-indigo-900">
        <canvas ref={canvasRef} width={W} height={H} className="max-w-full rounded-xl"></canvas>
      </div>
      
      <button 
        onClick={handleDrop}
        disabled={dropping || labels.length === 0}
        className="px-8 py-4 bg-gradient-to-r from-blue-400 to-sky-500 hover:from-blue-500 hover:to-sky-600 text-white font-bold rounded-2xl text-xl shadow-lg disabled:opacity-50 transition transform hover:-translate-y-1"
      >
        ⚪ THẢ BÓNG
      </button>
    </div>
  );
}
