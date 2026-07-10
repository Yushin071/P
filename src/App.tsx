/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ActiveScreen, GameSettings, CharacterSkin, HighScore } from './types';
import { DEFAULT_SETTINGS, CHARACTERS, INITIAL_HIGHSCORES } from './utils/controls';
import { playClickSound, playGameOverSound, playPowerupSound, setMasterVolume, initAudio } from './utils/audio';
import GameCanvas from './components/GameCanvas';
import ControlConfigurator from './components/ControlConfigurator';
import CharacterSelect from './components/CharacterSelect';
import HighScoreBoard from './components/HighScoreBoard';
import AboutPanel from './components/AboutPanel';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Settings, UserCheck, Trophy, HelpCircle, 
  Volume2, VolumeX, ShieldAlert, Award, ArrowLeft,
  ChevronRight
} from 'lucide-react';

export default function App() {
  // Navigation & Game State
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('MAIN_MENU');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [character, setCharacter] = useState<CharacterSkin>(CHARACTERS[0]);
  const [highscores, setHighscores] = useState<HighScore[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  // High score tracking modal
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [pendingScore, setPendingScore] = useState(0);
  const [pilotName, setPilotName] = useState('PILOT_1');

  const lobbyCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load persistence states on mount
  useEffect(() => {
    // 1. Controls & Settings
    const storedSettings = localStorage.getItem('arcade_simulator_settings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        setSettings(parsed);
        // Sync master volume
        setMasterVolume(parsed.masterVolume);
      } catch (e) {
        console.warn('Failed parsing settings from storage', e);
      }
    } else {
      setMasterVolume(DEFAULT_SETTINGS.masterVolume);
    }

    // 2. Character Skin
    const storedChar = localStorage.getItem('arcade_simulator_character');
    if (storedChar) {
      try {
        const parsed = JSON.parse(storedChar);
        const matched = CHARACTERS.find((c) => c.id === parsed.id);
        if (matched) setCharacter(matched);
      } catch (e) {
        console.warn('Failed parsing character skin', e);
      }
    }

    // 3. High Scores
    const storedScores = localStorage.getItem('arcade_simulator_highscores');
    if (storedScores) {
      try {
        setHighscores(JSON.parse(storedScores));
      } catch (e) {
        setHighscores(INITIAL_HIGHSCORES);
      }
    } else {
      setHighscores(INITIAL_HIGHSCORES);
      localStorage.setItem('arcade_simulator_highscores', JSON.stringify(INITIAL_HIGHSCORES));
    }

    // Initialize audio system
    initAudio();
  }, []);

  // Ambient Backdrop for Lobby Menu
  useEffect(() => {
    if (currentScreen === 'GAME') return; // Pause lobby canvas when in active game

    const canvas = lobbyCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    
    // Resize handler
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Star model
    interface LobbyStar {
      x: number;
      y: number;
      size: number;
      speed: number;
      angle: number;
      color: string;
    }

    const stars: LobbyStar[] = [];
    const colors = ['rgba(245, 158, 11, 0.25)', 'rgba(217, 119, 6, 0.18)', 'rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.12)'];

    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 0.5,
        speed: Math.random() * 0.8 + 0.1,
        angle: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Canvas Draw Frame
    const drawFrame = () => {
      if (!ctx || !canvas) return;

      ctx.fillStyle = '#08080a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cyber Matrix Grid Backdrop
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.015)';
      ctx.lineWidth = 1;
      const step = 50;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw drifting dust/stars
      stars.forEach((star) => {
        // Drifting slow horizontal vector
        star.x -= star.speed;
        if (star.x < 0) {
          star.x = canvas.width;
          star.y = Math.random() * canvas.height;
        }

        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ambient scanline overlay
      if (settings.scanlines) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        for (let y = 0; y < canvas.height; y += 4) {
          ctx.fillRect(0, y, canvas.width, 1.5);
        }
      }

      animId = requestAnimationFrame(drawFrame);
    };

    animId = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [currentScreen, settings.scanlines]);

  // Audio mute helper
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      setMasterVolume(0);
    } else {
      setMasterVolume(settings.masterVolume);
    }
    playClickSound();
  };

  // Nav actions
  const navigateTo = (screen: ActiveScreen) => {
    playClickSound();
    setCurrentScreen(screen);
  };

  // Handle saving customized settings
  const handleSaveSettings = (updatedSettings: GameSettings) => {
    setSettings(updatedSettings);
    localStorage.setItem('arcade_simulator_settings', JSON.stringify(updatedSettings));
    if (!isMuted) {
      setMasterVolume(updatedSettings.masterVolume);
    }
  };

  // Handle character selection
  const handleSelectCharacter = (selectedChar: CharacterSkin) => {
    setCharacter(selectedChar);
    localStorage.setItem('arcade_simulator_character', JSON.stringify(selectedChar));
  };

  // Handle Game Over
  const handleGameOver = (finalScore: number) => {
    playGameOverSound();
    setPendingScore(finalScore);
    
    // Check if score is a high score (higher than lowest of top 8)
    const sortedScores = [...highscores].sort((a, b) => b.score - a.score);
    const lowestHighScore = sortedScores[7]?.score || 0;

    if (finalScore > 0 && (highscores.length < 8 || finalScore > lowestHighScore)) {
      setIsSavingScore(true); // Open pilot save modal
    } else {
      setCurrentScreen('MAIN_MENU');
    }
  };

  // Save score record
  const handleSaveScoreRecord = () => {
    const formattedDate = new Date().toISOString().split('T')[0];
    const newRecord: HighScore = {
      name: pilotName.toUpperCase().slice(0, 10) || 'PILOT_1',
      score: pendingScore,
      date: formattedDate,
      character: character.name,
    };

    const updated = [...highscores, newRecord]
      .sort((a, b) => b.score - a.score)
      .slice(0, 12); // hold top 12

    setHighscores(updated);
    localStorage.setItem('arcade_simulator_highscores', JSON.stringify(updated));
    playPowerupSound();
    setIsSavingScore(false);
    setCurrentScreen('HIGHSCORES');
  };

  // Clear leaderboard
  const handleClearLeaderboard = () => {
    setHighscores([]);
    localStorage.removeItem('arcade_simulator_highscores');
  };

  return (
    <div className="relative w-screen h-screen flex flex-col justify-center items-center overflow-hidden font-sans bg-[#08080a] text-[#f4f4f5] select-none">
      
      {/* Background Ambient Canvas for non-game viewports */}
      {currentScreen !== 'GAME' && (
        <canvas
          ref={lobbyCanvasRef}
          className="absolute inset-0 w-full h-full object-cover z-0"
          id="lobby-backdrop-canvas"
        />
      )}

      {/* Floating Header Audio Control Toggle (Only visible in Menus) */}
      {currentScreen !== 'GAME' && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
          <button
            onClick={handleToggleMute}
            className="p-2.5 bg-[#0d0d11]/90 hover:bg-[#14141a] border border-[#1f1f25] hover:border-amber-500/25 text-amber-500 hover:text-amber-400 rounded transition-all cursor-pointer flex items-center justify-center shadow-lg"
            id="global-audio-toggle"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>
      )}

      {/* Primary Screens Router utilizing frame transitions */}
      <div className="relative z-10 w-full h-full flex flex-col justify-center items-center px-4">
        <AnimatePresence mode="wait">
          
          {/* 1. SCREEN: MAIN MENU LOBBY */}
          {currentScreen === 'MAIN_MENU' && (
            <motion.div
              key="main_menu"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center gap-9 max-w-sm w-full"
            >
              {/* Central Logo Container as requested */}
              <div className="flex flex-col items-center gap-5">
                <div className="relative p-1 flex items-center justify-center max-w-[260px] md:max-w-[310px]">
                  {/* Elegant gold backdrop glow */}
                  <div className="absolute inset-0 bg-amber-500/5 blur-2xl rounded-full" />
                  
                  <img
                    src="https://res.cloudinary.com/dsucg33fv/image/upload/v1782709347/logo_i8827v.png"
                    alt="Arcade Simulator"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-contain select-none pointer-events-none filter drop-shadow-[0_0_15px_rgba(245,158,11,0.12)]"
                    id="lobby-main-logo"
                  />
                </div>
                {/* Secondary elegant subtitle */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] md:text-xs font-display font-medium tracking-[0.3em] text-amber-500/90 uppercase">
                    Flight Tactical Simulator
                  </span>
                </div>
              </div>

              {/* Lobby Interactive Buttons List */}
              <div className="flex flex-col gap-2.5 w-full">
                
                {/* Start Expedition */}
                <button
                  onClick={() => navigateTo('GAME')}
                  className="group relative flex items-center justify-between px-5 py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-display font-semibold tracking-[0.2em] text-xs rounded transition-all shadow-[0_4px_20px_rgba(217,119,6,0.12)] hover:shadow-[0_4px_30px_rgba(217,119,6,0.25)] cursor-pointer border border-amber-400/30"
                  id="btn-start-game"
                >
                  <span className="flex items-center gap-2.5">
                    <Play size={13} className="fill-slate-950 stroke-none" />
                    START SIMULATOR
                  </span>
                  <ChevronRight size={13} className="opacity-80 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Character Select */}
                <button
                  onClick={() => navigateTo('CHARACTER_SELECT')}
                  className="group relative flex items-center justify-between px-5 py-3.5 bg-[#0d0d11]/95 hover:bg-[#14141a] border border-[#1f1f25] hover:border-amber-500/20 text-[#a1a1aa] hover:text-[#f4f4f5] font-display font-medium tracking-[0.15em] text-xs rounded transition-all duration-300 cursor-pointer"
                  id="btn-select-ship"
                >
                  <span className="flex items-center gap-2.5">
                    <UserCheck size={14} className="text-amber-500/80 group-hover:text-amber-500 transition-colors" />
                    PILOT SPACE SHIPS
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1 group-hover:text-amber-500 transition-colors">
                    [{character.name.split(' ')[0]}] <ChevronRight size={12} />
                  </span>
                </button>

                {/* Options Menu to adjust controls */}
                <button
                  onClick={() => navigateTo('OPTIONS')}
                  className="group relative flex items-center justify-between px-5 py-3.5 bg-[#0d0d11]/95 hover:bg-[#14141a] border border-[#1f1f25] hover:border-amber-500/20 text-[#a1a1aa] hover:text-[#f4f4f5] font-display font-medium tracking-[0.15em] text-xs rounded transition-all duration-300 cursor-pointer"
                  id="btn-options"
                >
                  <span className="flex items-center gap-2.5">
                    <Settings size={14} className="text-amber-500/80 group-hover:text-amber-500 transition-colors" />
                    CONTROL SETTINGS
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1 group-hover:text-amber-500 transition-colors">
                    [REMAP] <ChevronRight size={12} />
                  </span>
                </button>

                {/* Leaderboards */}
                <button
                  onClick={() => navigateTo('HIGHSCORES')}
                  className="group relative flex items-center justify-between px-5 py-3.5 bg-[#0d0d11]/95 hover:bg-[#14141a] border border-[#1f1f25] hover:border-amber-500/20 text-[#a1a1aa] hover:text-[#f4f4f5] font-display font-medium tracking-[0.15em] text-xs rounded transition-all duration-300 cursor-pointer"
                  id="btn-leaderboard"
                >
                  <span className="flex items-center gap-2.5">
                    <Trophy size={14} className="text-amber-500/80 group-hover:text-amber-500 transition-colors" />
                    LEADERBOARD
                  </span>
                  <ChevronRight size={14} className="text-zinc-600 group-hover:text-amber-500 opacity-60 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Databank instructions */}
                <button
                  onClick={() => navigateTo('ABOUT')}
                  className="group relative flex items-center justify-between px-5 py-3.5 bg-[#0d0d11]/95 hover:bg-[#14141a] border border-[#1f1f25] hover:border-amber-500/20 text-[#a1a1aa] hover:text-[#f4f4f5] font-display font-medium tracking-[0.15em] text-xs rounded transition-all duration-300 cursor-pointer"
                  id="btn-databank"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle size={14} className="text-amber-500/80 group-hover:text-amber-500 transition-colors" />
                    FLIGHT INSTRUCTIONS
                  </span>
                  <ChevronRight size={14} className="text-zinc-600 group-hover:text-amber-500 opacity-60 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Clean Footer note */}
              <div className="text-[10px] font-mono text-zinc-600 mt-4 text-center tracking-wider uppercase">
                Use Assigned Keyboard Commands to Pilot
              </div>
            </motion.div>
          )}

          {/* 2. SCREEN: OPTIONS / CONTROL CONFIGURATOR */}
          {currentScreen === 'OPTIONS' && (
            <motion.div
              key="options_remap"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
            >
              <ControlConfigurator
                settings={settings}
                onSaveSettings={handleSaveSettings}
                onBack={() => setCurrentScreen('MAIN_MENU')}
              />
            </motion.div>
          )}

          {/* 3. SCREEN: CHARACTER SELECT */}
          {currentScreen === 'CHARACTER_SELECT' && (
            <motion.div
              key="char_select"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
            >
              <CharacterSelect
                selectedId={character.id}
                onSelectCharacter={handleSelectCharacter}
                onBack={() => setCurrentScreen('MAIN_MENU')}
              />
            </motion.div>
          )}

          {/* 4. SCREEN: HIGHSCORES */}
          {currentScreen === 'HIGHSCORES' && (
            <motion.div
              key="leaderboards_screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
            >
              <HighScoreBoard
                highscores={highscores}
                onClearHighscores={handleClearLeaderboard}
                onBack={() => setCurrentScreen('MAIN_MENU')}
              />
            </motion.div>
          )}

          {/* 5. SCREEN: INSTRUCTIONS / ABOUT */}
          {currentScreen === 'ABOUT' && (
            <motion.div
              key="databank_screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
            >
              <AboutPanel onBack={() => setCurrentScreen('MAIN_MENU')} />
            </motion.div>
          )}

          {/* 6. SCREEN: PLAY GAME WORKSPACE */}
          {currentScreen === 'GAME' && (
            <motion.div
              key="active_game_canvas"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full z-10 bg-[#0b0f19]"
            >
              <GameCanvas
                controls={settings.controls}
                character={character}
                settings={settings}
                onGameOver={handleGameOver}
                onBackToMenu={() => setCurrentScreen('MAIN_MENU')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* POPUP MODAL: Save Pilot Score upon defeat */}
      <AnimatePresence>
        {isSavingScore && (
          <div className="fixed inset-0 bg-[#08080a]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#0d0d11] border border-[#1f1f25] p-6 rounded-md text-center shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col items-center gap-5 font-sans"
            >
              {/* Header Icon */}
              <div className="w-12 h-12 rounded-full bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-amber-500">
                <Award size={22} />
              </div>

              {/* Title info */}
              <div className="flex flex-col gap-1.5">
                <h3 className="font-display font-semibold tracking-[0.2em] text-amber-500 uppercase text-md">
                  NEW RECORD REACHED!
                </h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Excellent simulation results! Enter your callsign below to claim your spot on the cyber leaderboard.
                </p>
              </div>

              {/* Final Score presentation */}
              <div className="w-full bg-[#08080a] py-3.5 rounded-sm border border-[#1f1f25]">
                <span className="block text-[9px] font-mono text-zinc-500 tracking-widest uppercase mb-1">ACQUIRED SCORE</span>
                <span className="font-display font-bold tracking-widest text-lg text-amber-500">
                  {pendingScore.toLocaleString()}
                </span>
              </div>

              {/* Name Input field */}
              <div className="w-full flex flex-col gap-1.5 text-left">
                <label className="text-[9px] font-mono text-zinc-400 tracking-wider uppercase">
                  PILOT CALLSIGN
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={pilotName}
                  onChange={(e) => setPilotName(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  className="w-full px-3 py-2 bg-[#08080a] border border-[#1f1f25] text-zinc-200 rounded-sm font-mono text-xs uppercase focus:outline-none focus:border-amber-500/40 font-bold tracking-wider"
                  placeholder="PILOT_1"
                  id="pilot-name-input"
                />
              </div>

              {/* Action trigger buttons */}
              <div className="w-full flex gap-3 mt-1">
                <button
                  onClick={handleSaveScoreRecord}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-display font-semibold tracking-[0.15em] text-[11px] rounded-sm transition-all cursor-pointer"
                  id="btn-save-score"
                >
                  RECORD CALLSIGN
                </button>
                <button
                  onClick={() => {
                    playClickSound();
                    setIsSavingScore(false);
                    setCurrentScreen('MAIN_MENU');
                  }}
                  className="px-4 py-2.5 bg-[#14141a] hover:bg-[#1a1a24] text-zinc-400 hover:text-zinc-200 font-display font-semibold tracking-[0.15em] text-[11px] rounded-sm border border-[#1f1f25] transition-all cursor-pointer"
                  id="btn-cancel-score"
                >
                  DISCARD
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
