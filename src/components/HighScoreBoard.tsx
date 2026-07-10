import React from 'react';
import { HighScore } from '../types';
import { Award, Trophy, Trash2, Calendar, ShieldCheck } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface HighScoreBoardProps {
  highscores: HighScore[];
  onClearHighscores: () => void;
  onBack: () => void;
}

export default function HighScoreBoard({
  highscores,
  onClearHighscores,
  onBack,
}: HighScoreBoardProps) {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-5 p-5 md:p-6 bg-[#0d0d11]/95 border border-[#1f1f25] rounded-md shadow-2xl backdrop-blur-md font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#1f1f25] pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="text-amber-500" size={18} />
          <h2 className="font-display font-medium tracking-[0.15em] text-md text-zinc-100">SIMULATOR LEADERBOARD</h2>
        </div>
        {highscores.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to wipe all records?')) {
                onClearHighscores();
                playClickSound();
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold bg-[#1a0e10] hover:bg-[#2c1317] text-rose-400 border border-rose-900/30 rounded-sm transition-colors cursor-pointer"
            id="clear-highscores"
          >
            <Trash2 size={10} />
            RESET BOARD
          </button>
        )}
      </div>

      <p className="text-xs text-zinc-400 font-sans leading-relaxed text-left">
        Review top scoring simulator pilots across previous flight cycles. Complete active game waves to climb higher.
      </p>

      {/* Scores Table */}
      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
        {highscores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 border border-dashed border-[#1f1f25] rounded-sm">
            <Award className="text-zinc-850 animate-pulse" size={30} />
            <span className="text-xs font-mono text-zinc-600">NO RECORDS STORED YET</span>
          </div>
        ) : (
          highscores
            .sort((a, b) => b.score - a.score)
            .map((record, index) => {
              const colors = ['text-amber-500', 'text-zinc-300', 'text-amber-700'];
              const isTop3 = index < 3;

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-sm bg-[#08080a]/40 border border-[#1f1f25]/40 hover:bg-[#08080a]/80 hover:border-[#1f1f25] transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    {/* Position */}
                    <div className={`w-8 text-center font-display font-bold text-sm ${isTop3 ? colors[index] : 'text-zinc-600'}`}>
                      #{index + 1}
                    </div>

                    {/* Pilot Name and Ship type */}
                    <div>
                      <div className="text-xs font-mono font-bold text-zinc-200 tracking-wider">
                        {record.name}
                      </div>
                      <div className="text-[10px] font-sans text-zinc-500 flex items-center gap-1.5">
                        <ShieldCheck size={10} className="text-amber-500/70" /> {record.character || 'Retro Ship'}
                      </div>
                    </div>
                  </div>

                  {/* Score & Date */}
                  <div className="text-right">
                    <div className="text-sm font-display font-bold text-amber-500 tracking-wide">
                      {record.score.toLocaleString()}
                    </div>
                    <div className="text-[9px] font-mono text-zinc-600 flex items-center gap-1 justify-end">
                      <Calendar size={9} /> {record.date}
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Back Button */}
      <div className="flex justify-end border-t border-[#1f1f25]/40 pt-4">
        <button
          onClick={() => {
            playClickSound();
            onBack();
          }}
          className="px-6 py-2.5 bg-[#14141a] hover:bg-[#1a1a24] text-zinc-300 hover:text-zinc-100 rounded-sm text-xs font-display font-medium tracking-[0.15em] border border-[#1f1f25] transition-all cursor-pointer"
          id="highscores-back-btn"
        >
          RETURN TO MENU
        </button>
      </div>
    </div>
  );
}
