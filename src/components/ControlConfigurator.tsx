import React, { useState, useEffect } from 'react';
import { ControlConfig, GameSettings } from '../types';
import { getKeyLabel, DEFAULT_CONTROLS, ALTERNATIVE_CONTROLS } from '../utils/controls';
import { playClickSound, setMasterVolume, playLaserSound, playShieldSound } from '../utils/audio';
import { 
  Keyboard, Eye, RotateCcw, Volume2, 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  Zap, Disc, AlertTriangle, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ControlConfiguratorProps {
  settings: GameSettings;
  onSaveSettings: (settings: GameSettings) => void;
  onBack: () => void;
}

export default function ControlConfigurator({
  settings,
  onSaveSettings,
  onBack,
}: ControlConfiguratorProps) {
  const [activeBinding, setActiveBinding] = useState<keyof ControlConfig | null>(null);
  const [localSettings, setLocalSettings] = useState<GameSettings>({ ...settings });

  // Handle outside keypress capture for binding
  useEffect(() => {
    if (!activeBinding) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Escape cancels the binding mode
      if (e.key === 'Escape') {
        setActiveBinding(null);
        playClickSound();
        return;
      }

      // Construct the new key binding
      const updatedControls = { ...localSettings.controls };
      const formattedLabel = getKeyLabel(e.code, e.key);

      updatedControls[activeBinding] = {
        code: e.code,
        key: e.key,
        label: formattedLabel,
      };

      const updatedSettings = {
        ...localSettings,
        controls: updatedControls,
      };

      setLocalSettings(updatedSettings);
      onSaveSettings(updatedSettings);
      setActiveBinding(null);
      
      // Play indicator sound
      if (activeBinding === 'shoot') playLaserSound();
      else if (activeBinding === 'jump') playShieldSound();
      else playClickSound();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [activeBinding, localSettings, onSaveSettings]);

  const handleSliderChange = (field: 'masterVolume' | 'sfxVolume' | 'musicVolume', value: number) => {
    const updated = {
      ...localSettings,
      [field]: value,
    };
    setLocalSettings(updated);
    onSaveSettings(updated);

    // Live update the master audio context node
    if (field === 'masterVolume') {
      setMasterVolume(value);
    }
  };

  const handleToggle = (field: 'screenShake' | 'scanlines') => {
    const updated = {
      ...localSettings,
      [field]: !localSettings[field],
    };
    setLocalSettings(updated);
    onSaveSettings(updated);
    playClickSound();
  };

  const handleQualityChange = (quality: 'low' | 'medium' | 'high') => {
    const updated = {
      ...localSettings,
      graphicsQuality: quality,
    };
    setLocalSettings(updated);
    onSaveSettings(updated);
    playClickSound();
  };

  const applyPreset = (type: 'WASD' | 'ARROWS') => {
    const preset = type === 'WASD' ? DEFAULT_CONTROLS : ALTERNATIVE_CONTROLS;
    const updated = {
      ...localSettings,
      controls: preset,
    };
    setLocalSettings(updated);
    onSaveSettings(updated);
    playClickSound();
  };

  const controlRows: { key: keyof ControlConfig; label: string; description: string; icon: any }[] = [
    { key: 'up', label: 'MOVE UP', description: 'Nose thruster upward flight', icon: ArrowUp },
    { key: 'down', label: 'MOVE DOWN', description: 'Ventral thruster descent', icon: ArrowDown },
    { key: 'left', label: 'MOVE LEFT', description: 'Lateral backward stabilizers', icon: ArrowLeft },
    { key: 'right', label: 'MOVE RIGHT', description: 'Forward impulse acceleration', icon: ArrowRight },
    { key: 'shoot', label: 'FIRE CANNON', description: 'Discharge plasma projectile cannon', icon: Disc },
    { key: 'jump', label: 'SHIELD BOOST', description: 'Deploy barrier shield (Cooldown)', icon: Zap },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-6 p-4 md:p-6 bg-[#0d0d11]/95 border border-[#1f1f25] rounded-md shadow-2xl backdrop-blur-md overflow-y-auto max-h-[85vh] font-sans">
      
      {/* Left Panel: Keybindings Remapper */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-[#1f1f25] pb-3">
          <div className="flex items-center gap-2">
            <Keyboard className="text-amber-500" size={18} />
            <h2 className="font-display font-medium tracking-[0.15em] text-md text-zinc-100">CHARACTER CONTROLS</h2>
          </div>
          {/* Preset Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => applyPreset('WASD')}
              className="px-2.5 py-1 text-[10px] font-mono font-bold bg-[#14141a] hover:bg-[#1a1a24] text-zinc-300 border border-[#1f1f25] rounded-sm transition-all cursor-pointer"
              id="preset-wasd"
            >
              PRESET WASD
            </button>
            <button
              onClick={() => applyPreset('ARROWS')}
              className="px-2.5 py-1 text-[10px] font-mono font-bold bg-[#14141a] hover:bg-[#1a1a24] text-zinc-300 border border-[#1f1f25] rounded-sm transition-all cursor-pointer"
              id="preset-arrows"
            >
              PRESET ARROWS
            </button>
          </div>
        </div>

        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
          Click on any control button to remap the keyboard action. Custom keys will persist on this browser.
        </p>

        {/* Bindings Grid */}
        <div className="flex flex-col gap-2">
          {controlRows.map((row) => {
            const binding = localSettings.controls[row.key];
            const RowIcon = row.icon;
            const isEditing = activeBinding === row.key;

            return (
              <div 
                key={row.key} 
                className="flex items-center justify-between p-3 rounded-sm bg-[#08080a]/50 border border-[#1f1f25]/40 hover:border-[#1f1f25] hover:bg-[#08080a]/80 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-sm bg-[#14141a] text-amber-500 border border-[#1f1f25]">
                    <RowIcon size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold tracking-wide text-zinc-200">{row.label}</div>
                    <div className="text-[10px] text-zinc-500">{row.description}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveBinding(row.key);
                    playClickSound();
                  }}
                  className={`w-28 py-2 text-center font-mono text-xs font-bold rounded-sm border transition-all cursor-pointer ${
                    isEditing 
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.15)] animate-pulse' 
                      : 'bg-[#14141a] text-amber-500/90 border-[#1f1f25] hover:bg-[#1c1c26] hover:border-amber-500/20 hover:text-amber-400'
                  }`}
                  id={`remap-btn-${row.key}`}
                >
                  {isEditing ? 'BINDING...' : `[ ${binding.label} ]`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel: Additional Audio / Video configurations */}
      <div className="w-full md:w-80 flex flex-col gap-5 border-t md:border-t-0 md:border-l border-[#1f1f25] pt-5 md:pt-0 md:pl-6">
        <div className="flex items-center gap-2 border-b border-[#1f1f25] pb-3">
          <Volume2 className="text-amber-500" size={16} />
          <h2 className="font-display font-medium tracking-[0.15em] text-xs text-zinc-100">AUDIO & VIDEO</h2>
        </div>

        {/* Volume Sliders */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>MASTER VOLUME</span>
              <span className="text-amber-500 font-bold">{localSettings.masterVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={localSettings.masterVolume}
              onChange={(e) => handleSliderChange('masterVolume', parseInt(e.target.value))}
              className="w-full h-1 bg-[#08080a] rounded-lg appearance-none cursor-pointer accent-amber-500"
              id="slider-master"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>SOUND EFFECTS (SFX)</span>
              <span className="text-amber-500 font-bold">{localSettings.sfxVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={localSettings.sfxVolume}
              onChange={(e) => handleSliderChange('sfxVolume', parseInt(e.target.value))}
              className="w-full h-1 bg-[#08080a] rounded-lg appearance-none cursor-pointer accent-amber-500"
              id="slider-sfx"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>SYNTH MUSIC</span>
              <span className="text-amber-500 font-bold">{localSettings.musicVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={localSettings.musicVolume}
              onChange={(e) => handleSliderChange('musicVolume', parseInt(e.target.value))}
              className="w-full h-1 bg-[#08080a] rounded-lg appearance-none cursor-pointer accent-amber-500"
              id="slider-music"
            />
          </div>
        </div>

        {/* Video & Aesthetic Toggles */}
        <div className="flex flex-col gap-2.5 border-t border-[#1f1f25]/60 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-mono text-zinc-300">SCREEN SHAKE</span>
              <span className="text-[10px] text-zinc-500">Enable kinetic impact rumble</span>
            </div>
            <button
              onClick={() => handleToggle('screenShake')}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                localSettings.screenShake ? 'bg-amber-600' : 'bg-[#14141a]'
              }`}
              id="toggle-screenshake"
            >
              <div 
                className={`w-5 h-5 bg-white rounded-full transition-all ${
                  localSettings.screenShake ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-mono text-zinc-300">RETRO SCANLINES</span>
              <span className="text-[10px] text-zinc-500">Enable simulated CRT grid overlay</span>
            </div>
            <button
              onClick={() => handleToggle('scanlines')}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                localSettings.scanlines ? 'bg-amber-600' : 'bg-[#14141a]'
              }`}
              id="toggle-scanlines"
            >
              <div 
                className={`w-5 h-5 bg-white rounded-full transition-all ${
                  localSettings.scanlines ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Quality preset select */}
        <div className="flex flex-col gap-2 border-t border-[#1f1f25]/60 pt-4">
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
            <Cpu size={14} />
            <span>RENDER DETAILS</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 bg-[#08080a] p-1 rounded-sm border border-[#1f1f25]">
            {(['low', 'medium', 'high'] as const).map((q) => (
              <button
                key={q}
                onClick={() => handleQualityChange(q)}
                className={`py-1 text-[10px] font-mono font-bold rounded-sm uppercase transition-all cursor-pointer ${
                  localSettings.graphicsQuality === q
                    ? 'bg-amber-600 text-slate-950 font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                id={`detail-${q}`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => {
            playClickSound();
            onBack();
          }}
          className="w-full py-3 mt-auto bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-display font-semibold tracking-[0.15em] rounded-sm transition-all text-xs cursor-pointer"
          id="controls-back-button"
        >
          CONFIRM AND CLOSE
        </button>
      </div>

      {/* Overlay Modal for capturing dynamic keypress */}
      <AnimatePresence>
        {activeBinding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#08080a]/90 z-50 flex flex-col justify-center items-center gap-6 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0d0d11] border border-[#1f1f25] p-8 rounded-md max-w-sm text-center shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col items-center gap-4"
            >
              <div className="w-14 h-14 rounded-full bg-amber-500/5 flex items-center justify-center text-amber-500 animate-pulse border border-amber-500/10">
                <Keyboard size={24} />
              </div>
              <div>
                <h3 className="font-display font-semibold tracking-[0.15em] text-amber-400 text-md mb-1">
                  MAPPING CONTROL
                </h3>
                <p className="text-xs text-zinc-300 font-mono">
                  PRESS ANY KEY TO BIND TO
                </p>
                <div className="my-3 py-2 px-4 rounded-sm bg-[#08080a] text-zinc-100 font-mono font-bold border border-[#1f1f25] uppercase tracking-widest text-sm">
                  {activeBinding}
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">
                  Press <strong className="text-zinc-300">ESC</strong> to abort remapping
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
