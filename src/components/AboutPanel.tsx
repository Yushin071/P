import React from 'react';
import { HelpCircle, Star, Target, Shield, ArrowRight } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface AboutPanelProps {
  onBack: () => void;
}

export default function AboutPanel({ onBack }: AboutPanelProps) {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-5 p-5 md:p-6 bg-[#0d0d11]/95 border border-[#1f1f25] rounded-md shadow-2xl backdrop-blur-md font-sans text-left">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#1f1f25] pb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="text-amber-500" size={18} />
          <h2 className="font-display font-medium tracking-[0.15em] text-md text-zinc-100">SIMULATOR LORE & INSTRUCTIONS</h2>
        </div>
      </div>

      <div className="flex flex-col gap-4 text-xs text-zinc-300 leading-relaxed max-h-96 overflow-y-auto pr-1">
        
        {/* Story Description */}
        <div className="p-3 bg-[#08080a]/40 border border-[#1f1f25]/40 rounded-sm">
          <p className="font-sans italic text-zinc-400 text-center">
            "Deep in Sector-88, alien robotic fleets threaten the outer colony gateways. As a master starfighter, you are loaded into the tactical flight training capsule. Configure your control panel, select your ship hull, and clear the waves of debris, scouts, heavy bombers, and dreadnought boss cruisers."
          </p>
        </div>

        {/* Game Rules section */}
        <div className="flex flex-col gap-2.5">
          <span className="font-display font-semibold tracking-[0.15em] text-amber-500">FLIGHT GUIDANCE MECHANICS</span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-[#08080a]/20 border border-[#1f1f25]/40 rounded-sm flex gap-2.5">
              <div className="text-amber-500 text-sm font-bold font-mono">01</div>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-zinc-200">SHOOT DOWN DRONES</span>
                <span>Destroy enemy fighters and obstacles to increase score. Each consecutive kill increases combo multipliers up to 2.0X score points.</span>
              </div>
            </div>

            <div className="p-3 bg-[#08080a]/20 border border-[#1f1f25]/40 rounded-sm flex gap-2.5">
              <div className="text-amber-500 text-sm font-bold font-mono">02</div>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-zinc-200">SHIELD DYNAMICS</span>
                <span>Use your custom bound JUMP key to trigger SHIELD BOOST. It sweeps you invulnerable for 2 seconds, destroying standard colliders on contact! (5s Cooldown)</span>
              </div>
            </div>

            <div className="p-3 bg-[#08080a]/20 border border-[#1f1f25]/40 rounded-sm flex gap-2.5">
              <div className="text-amber-500 text-sm font-bold font-mono">03</div>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-zinc-200">FLOAT POWER-UPS</span>
                <span>Collect floating tokens: SHIELD restores 35% hull health, WEAPON level raises projectile output, and COMBO boosts shield charge and gives 1000 pts instantly.</span>
              </div>
            </div>

            <div className="p-3 bg-[#08080a]/20 border border-[#1f1f25]/40 rounded-sm flex gap-2.5">
              <div className="text-amber-500 text-sm font-bold font-mono">04</div>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-zinc-200">BOSS ENCOUNTERS</span>
                <span>At every 5000 score milestones, a massive cruiser enters the battlefield. Destroy its core to reap massive score boosts and guarantee item drops!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customization Note */}
        <div className="flex flex-col gap-2.5 border-t border-[#1f1f25] pt-4">
          <span className="font-display font-semibold tracking-[0.15em] text-amber-500">DYNAMIC PANEL CUSTOMIZATION</span>
          <p className="font-sans text-[11px] text-zinc-400">
            Remap any button key within the <strong className="text-zinc-300">Options screen</strong>. Whether you prefer classic keyboard shooters (WASD keys + Space) or retro arcade cabinet grids (Arrow keys + Left Ctrl), the simulator parses keyboard events directly so your tailored controls are immediately loaded into active flight combat.
          </p>
        </div>
      </div>

      {/* Back Button */}
      <div className="flex justify-end border-t border-[#1f1f25]/40 pt-4">
        <button
          onClick={() => {
            playClickSound();
            onBack();
          }}
          className="px-6 py-2.5 bg-[#14141a] hover:bg-[#1a1a24] text-zinc-300 hover:text-zinc-100 rounded-sm text-xs font-display font-medium tracking-[0.15em] border border-[#1f1f25] transition-all cursor-pointer"
          id="about-back-btn"
        >
          DISMISS DATABANK
        </button>
      </div>
    </div>
  );
}
