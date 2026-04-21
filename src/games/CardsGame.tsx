import React, { useState, useEffect } from 'react';
import { GameProps } from '../types';
import { shuffle, cn } from '../lib/utils';
import { playSuspense, playTick } from '../lib/audio';

export default function CardsGame({ students, onWinner }: GameProps) {
  const [cards, setCards] = useState<{name: string, flipped: boolean, id: number}[]>([]);
  const [picked, setPicked] = useState(false);

  useEffect(() => {
    const N = Math.min(students.length, 24);
    const selected = shuffle([...students]).slice(0, N).map((name, idx) => ({
      name,
      flipped: false,
      id: idx
    }));
    setCards(selected);
  }, [students]);

  const handleCardClick = (idx: number) => {
    if (picked || cards.length === 0) return;
    setPicked(true);
    playSuspense();
    playTick();
    
    // Flip picked card
    const newCards = [...cards];
    newCards[idx].flipped = true;
    setCards(newCards);
    
    const winner = cards[idx].name;
    
    // Auto flip others after delay
    setTimeout(() => {
      onWinner(winner);
      let t = 0;
      setCards(prevCards => {
        const c = [...prevCards];
        c.forEach((card, i) => {
          if (i !== idx) {
            setTimeout(() => {
              setCards(cc => {
                const updated = [...cc];
                updated[i].flipped = true;
                return updated;
              });
            }, t * 50);
            t++;
          }
        });
        return c;
      });
    }, 800);
  };

  return (
    <div className="flex flex-col items-center">
      <p className="text-xl mb-6 text-fuchsia-200">🔮 Chọn một lá bài định mệnh</p>
      
      <div className="flex flex-wrap justify-center gap-3 perspective-[1000px] max-w-4xl">
        {cards.map((card, idx) => (
          <div 
            key={card.id}
            onClick={() => handleCardClick(idx)}
            className={cn(
               "w-[70px] h-[100px] md:w-[90px] md:h-[130px] rounded-xl cursor-pointer transition-transform duration-500 transform-style-3d shadow-lg relative",
               !picked && "hover:-translate-y-2",
               card.flipped && "rotate-y-180"
             )}
          >
            {/* Front (Hidden state) */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl backface-hidden border-2 border-indigo-300/30">
              ?
            </div>
            
            {/* Back (Revealed state) */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-300 to-yellow-500 rounded-xl flex items-center justify-center p-2 text-center text-slate-900 font-bold text-xs md:text-sm backface-hidden rotate-y-180 border-2 border-amber-200">
              {card.name}
            </div>
          </div>
        ))}
      </div>
      
      <style>{`
        .perspective-\\\\[1000px\\\\] { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
