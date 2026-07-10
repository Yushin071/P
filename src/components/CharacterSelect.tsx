import React from 'react';
import { CharacterSkin } from '../types';
import { CHARACTERS } from '../utils/controls';
import { playClickSound, playShieldSound } from '../utils/audio';
import { Sparkles, Gauge, Heart, Crosshair, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface CharacterSelectProps {
  selectedId: string;
  onSelectCharacter: (character: CharacterSkin) => void;
  onBack: () => void;
}

export default function CharacterSelect({
  selectedId,
  onSelectCharacter,
  onBack,
}: CharacterSelectProps) {
  const selectedChar = CHARACTERS.find((c) => c.id === selectedId) || CHARACTERS[0];

  const handleCharClick = (char: CharacterSkin) => {
    onSelectCharacter(char);
    playShieldSound(); // cool shield swoosh on select!
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 p-4 md:p-6 bg-[#0d0d11]/95 border border-[#1f1f25] rounded-md shadow-2xl backdrop-blur-md font-sans">
      
      {/* Title block */}
      <div className="flex justify-between items-center border-b border-[#1f1f25] pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-amber-500" size={18} />
          <h2 className="font-display font-medium tracking-[0.15em] text-md text-zinc-100">CHOOSE YOUR SPACECRAFT</h2>
        </div>
      </div>

      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
        Select a ship below to pilot during the simulator expedition. Each hull layout carries custom speed parameters, laser impact forces, and defense multipliers.
      </p>

      {/* Grid of Choices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CHARACTERS.map((char) => {
          const isSelected = char.id === selectedId;

          return (
            <div
              key={char.id}
              onClick={() => handleCharClick(char)}
              className={`relative flex flex-col p-5 rounded-md border cursor-pointer transition-all duration-300 ${
                isSelected
                  ? 'bg-[#08080a]/60 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                  : 'bg-[#08080a]/20 border-[#1f1f25] hover:bg-[#08080a]/40 hover:border-zinc-700'
              }`}
              style={{
                borderColor: isSelected ? char.color : undefined,
                boxShadow: isSelected ? `0 0 20px ${char.color}15` : undefined
              }}
              id={`char-select-card-${char.id}`}
            >
              {/* Check indicator */}
              {isSelected && (
                <div 
                  className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-slate-900 text-xs font-bold"
                  style={{ backgroundColor: char.color }}
                >
                  <Check size={11} />
                </div>
              )}

              {/* Spacecraft Visual Miniature Representation */}
              <div className="h-28 w-full bg-[#08080a] rounded-sm flex items-center justify-center border border-[#1f1f25] relative overflow-hidden mb-4">
                {/* Simulated Grid backdrop */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.03),transparent_70%)]" />
                
                {/* Ship Vector silhouette drawing */}
                <svg width="60" height="40" viewBox="0 0 60 40" className="relative z-10 animate-pulse">
                  <path
                    d="M 50 20 L 15 5 L 20 15 L 5 15 L 5 25 L 20 25 L 15 35 Z"
                    fill={char.color}
                    stroke={char.accentColor}
                    strokeWidth="1.5"
                  />
                  {/* Glowing core thruster */}
                  <circle cx="5" cy="20" r="3" fill="#ffffff" />
                  <line x1="2" y1="20" x2="-8" y2="20" stroke={char.accentColor} strokeWidth="2.5" strokeDasharray="3,1" />
                </svg>
              </div>

              {/* Title & Description */}
              <div className="flex flex-col gap-1 mb-4 flex-grow text-left">
                <span className="font-display font-bold tracking-wider text-sm" style={{ color: char.color }}>
                  {char.name}
                </span>
                <span className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  {char.description}
                </span>
              </div>

              {/* Stat bars */}
              <div className="flex flex-col gap-2 border-t border-[#1f1f25] pt-3 text-left">
                {/* Speed Stat */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span className="flex items-center gap-1"><Gauge size={10} /> VELOCITY SPEED</span>
                    <span className="font-bold text-zinc-300">{char.speed}/10</span>
                  </div>
                  <div className="w-full bg-[#14141a] h-1 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${char.speed * 10}%`, 
                        backgroundColor: char.color 
                      }} 
                    />
                  </div>
                </div>

                {/* Defense Stat */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span className="flex items-center gap-1"><Heart size={10} /> HULL SHIELD</span>
                    <span className="font-bold text-zinc-300">{char.health}/10</span>
                  </div>
                  <div className="w-full bg-[#14141a] h-1 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${char.health * 10}%`, 
                        backgroundColor: char.color 
                      }} 
                    />
                  </div>
                </div>

                {/* Power Stat */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span className="flex items-center gap-1"><Crosshair size={10} /> IMPACT FORCE</span>
                    <span className="font-bold text-zinc-300">{char.power}/10</span>
                  </div>
                  <div className="w-full bg-[#14141a] h-1 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${char.power * 10}%`, 
                        backgroundColor: char.color 
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Back Button */}
      <div className="flex justify-end border-t border-[#1f1f25]/40 pt-4">
        <button
          onClick={() => {
            playClickSound();
            onBack();
          }}
          className="px-6 py-2.5 bg-[#14141a] hover:bg-[#1a1a24] text-zinc-300 hover:text-zinc-100 rounded-sm text-xs font-display font-medium tracking-[0.15em] border border-[#1f1f25] transition-all cursor-pointer"
          id="char-select-back"
        >
          SAVE AND RETURN
        </button>
      </div>
    </div>
  );
}
