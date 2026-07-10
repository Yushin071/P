import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ControlConfig, CharacterSkin, GameSettings } from '../types';
import { 
  Shield, Zap, Swords, Play, RefreshCw, ChevronRight, 
  Volume2, Award, Heart, ShieldAlert, Sparkles, AlertCircle
} from 'lucide-react';

interface GameCanvasProps {
  controls: ControlConfig;
  character: CharacterSkin;
  settings: GameSettings;
  onGameOver: (score: number) => void;
  onBackToMenu: () => void;
}

// Inline Synthesizer for Retro Game Sound Effects
const playSynthSound = (type: 'walk' | 'attack' | 'skill' | 'hit' | 'hurt' | 'defeat', settings: GameSettings) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    const masterVol = settings.masterVolume / 100;
    const sfxVol = settings.sfxVolume / 100;
    const volume = masterVol * sfxVol * 0.15; // capped safety volume
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'walk') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'attack') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(250, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(volume * 0.7, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } else if (type === 'skill') {
      // Cosmic blast sweep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(70, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(volume * 1.5, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.38);
    } else if (type === 'hit') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.setValueAtTime(60, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(volume * 1.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'hurt') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(volume * 1.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.24);
    } else if (type === 'defeat') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.75);
      gain.gain.setValueAtTime(volume * 1.4, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.75);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    }
  } catch (e) {
    console.warn('Web Audio Playback Error:', e);
  }
};

// Types for internal 3D entities
interface Particle {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  life: number; // 1.0 to 0.0
  maxLife: number;
}

interface EnemyEntity {
  id: number;
  x: number;
  z: number;
  y: number;
  speed: number;
  health: number;
  maxHealth: number;
  scale: number;
  type: 'crawler' | 'ranger' | 'charger';
  damageCooldown: number;
  flashTimer: number;
  jumpOffset: number;
}

interface CombatText {
  id: number;
  x: number;
  y: number;
  z: number;
  text: string;
  color: string;
  life: number;
}

interface HitboxEffect {
  x: number;
  z: number;
  active: boolean;
  scale: number;
  direction: 'left' | 'right';
  life: number;
}

interface EnergyRingEffect {
  active: boolean;
  radius: number;
  maxRadius: number;
  opacity: number;
}

export default function GameCanvas({
  controls,
  character,
  settings,
  onGameOver,
  onBackToMenu,
}: GameCanvasProps) {
  // Game UI States
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [skillCharge, setSkillCharge] = useState(100); // O-skill charge percent
  const [combo, setCombo] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showGameOverScreen, setShowGameOverScreen] = useState(false);

  // Sync references to bypass state latency in R3F useFrame
  const isPausedRef = useRef(isPaused);
  const activeKeys = useRef<{ [key: string]: boolean }>({});
  const lastWalkSoundTime = useRef(0);

  // Core Game State Container (Mutated directly in useFrame for ultra-high performance)
  const game = useRef({
    player: {
      x: 0,
      z: 0,
      y: 0,
      facingLeft: false,
      action: 'IDLE' as 'IDLE' | 'WALK' | 'ATTACK' | 'DANCE',
      frame: 0,
      frameTimer: 0,
      speed: character.speed * 0.4 + 4.5, // dynamically calculated speed based on character
      attackCooldown: 0,
    },
    enemies: [] as EnemyEntity[],
    particles: [] as Particle[],
    combatTexts: [] as CombatText[],
    hitbox: {
      x: 0,
      z: 0,
      active: false,
      scale: 0,
      direction: 'right' as 'left' | 'right',
      life: 0,
    } as HitboxEffect,
    energyRing: {
      active: false,
      radius: 0,
      maxRadius: 6.5,
      opacity: 0,
    } as EnergyRingEffect,
    score: 0,
    health: 100,
    skillCharge: 100,
    combo: 0,
    comboTimer: 0,
    spawnTimer: 0,
    cameraShake: 0,
    enemyIdCounter: 0,
    particleIdCounter: 0,
    combatTextIdCounter: 0,
  });

  // Setup Keyboard Event Listeners
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key.toLowerCase();

      // Check pause
      if (code === 'Escape') {
        setIsPaused(prev => !prev);
        return;
      }

      // Check remapped controls or fallbacks
      const checkBind = (binding: any) => binding.code === code || binding.key.toLowerCase() === key;

      if (checkBind(controls.up) || code === 'KeyW' || code === 'ArrowUp') activeKeys.current['UP'] = true;
      if (checkBind(controls.down) || code === 'KeyS' || code === 'ArrowDown') activeKeys.current['DOWN'] = true;
      if (checkBind(controls.left) || code === 'KeyA' || code === 'ArrowLeft') activeKeys.current['LEFT'] = true;
      if (checkBind(controls.right) || code === 'KeyD' || code === 'ArrowRight') activeKeys.current['RIGHT'] = true;
      if (checkBind(controls.shoot) || code === 'KeyP' || key === 'p') activeKeys.current['ATTACK_P'] = true;
      if (checkBind(controls.jump) || code === 'KeyO' || key === 'o') activeKeys.current['SKILL_O'] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key.toLowerCase();
      const checkBind = (binding: any) => binding.code === code || binding.key.toLowerCase() === key;

      if (checkBind(controls.up) || code === 'KeyW' || code === 'ArrowUp') activeKeys.current['UP'] = false;
      if (checkBind(controls.down) || code === 'KeyS' || code === 'ArrowDown') activeKeys.current['DOWN'] = false;
      if (checkBind(controls.left) || code === 'KeyA' || code === 'ArrowLeft') activeKeys.current['LEFT'] = false;
      if (checkBind(controls.right) || code === 'KeyD' || code === 'ArrowRight') activeKeys.current['RIGHT'] = false;
      if (checkBind(controls.shoot) || code === 'KeyP' || key === 'p') activeKeys.current['ATTACK_P'] = false;
      if (checkBind(controls.jump) || code === 'KeyO' || key === 'o') activeKeys.current['SKILL_O'] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [controls]);

  // Restart Simulation Helper
  const handleRestart = () => {
    const g = game.current;
    g.player.x = 0;
    g.player.z = 0;
    g.player.action = 'IDLE';
    g.player.frame = 0;
    g.enemies = [];
    g.particles = [];
    g.combatTexts = [];
    g.hitbox.active = false;
    g.energyRing.active = false;
    g.score = 0;
    g.health = 100;
    g.skillCharge = 100;
    g.combo = 0;
    g.comboTimer = 0;
    g.spawnTimer = 0;
    g.cameraShake = 0;

    setScore(0);
    setHealth(100);
    setSkillCharge(100);
    setCombo(0);
    setShowGameOverScreen(false);
    setIsPaused(false);
  };

  // Three.js Game Core Subcomponent (Handles update loop & rendering)
  function GameScene() {
    // Load requested floor and player textures
    const groundTexture = useLoader(THREE.TextureLoader, "https://res.cloudinary.com/dsucg33fv/image/upload/v1782439980/ground_d1kjrx.png");
    const playerTexture = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/banyapon/banyapon.github.io/refs/heads/main/studio/images/player.png");

    // Configure tiling floor texture ("tiling เล็กหน่อย" = wrap & repeat highly)
    const tiledGround = useMemo(() => {
      const tex = groundTexture.clone();
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(16, 16);
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.needsUpdate = true;
      return tex;
    }, [groundTexture]);

    // Unique player texture instance to avoid global offset interference
    const playerTex = useMemo(() => {
      const tex = playerTexture.clone();
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.minFilter = THREE.NearestFilter;
      tex.magFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.repeat.set(0.25, 0.25); // 4x4 Grid
      tex.needsUpdate = true;
      return tex;
    }, [playerTexture]);

    // Dynamic state trackers for reactive scene re-renders (used only for moving visual elements)
    const [renderEnemies, setRenderEnemies] = useState<EnemyEntity[]>([]);
    const [renderParticles, setRenderParticles] = useState<Particle[]>([]);
    const [renderTexts, setRenderTexts] = useState<CombatText[]>([]);
    const [playerPos, setPlayerPos] = useState({ x: 0, z: 0, y: 1.1 });
    const [facingLeft, setFacingLeft] = useState(false);
    const [ringState, setRingState] = useState<EnergyRingEffect>({ active: false, radius: 0, maxRadius: 6.5, opacity: 0 });
    const [hitboxState, setHitboxState] = useState<HitboxEffect>({ x: 0, z: 0, active: false, scale: 0, direction: 'right', life: 0 });

    // References to Three.js scene meshes
    const playerMesh = useRef<THREE.Mesh>(null);

    useFrame((state, delta) => {
      if (isPausedRef.current || showGameOverScreen) return;

      const g = game.current;
      const p = g.player;

      // Handle custom camera shake decay
      if (g.cameraShake > 0) {
        g.cameraShake -= delta * 15;
        if (g.cameraShake < 0) g.cameraShake = 0;
      }

      // Handle Combo Timer decay
      if (g.combo > 0) {
        g.comboTimer -= delta;
        if (g.comboTimer <= 0) {
          g.combo = 0;
          setCombo(0);
        }
      }

      // Handle Skill Charge gradual charge
      if (g.skillCharge < 100) {
        g.skillCharge = Math.min(100, g.skillCharge + delta * 12); // charges to full in ~8 seconds
        setSkillCharge(Math.floor(g.skillCharge));
      }

      // 1. INPUT PARSING & PLAYER MOVEMENT (8-way movement)
      let moveX = 0;
      let moveZ = 0;

      if (activeKeys.current['UP']) moveZ -= 1;
      if (activeKeys.current['DOWN']) moveZ += 1;
      if (activeKeys.current['LEFT']) moveX -= 1;
      if (activeKeys.current['RIGHT']) moveX += 1;

      // Normalization for smooth diagonal movement
      if (moveX !== 0 || moveZ !== 0) {
        const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
        moveX /= len;
        moveZ /= len;

        // Apply movement vector
        p.x += moveX * p.speed * delta;
        p.z += moveZ * p.speed * delta;

        // Clamp boundary to ground size 50 (-24.5 to +24.5)
        p.x = THREE.MathUtils.clamp(p.x, -24.5, 24.5);
        p.z = THREE.MathUtils.clamp(p.z, -24.5, 24.5);

        // Adjust face direction based on horizontal movement
        if (moveX < 0) {
          p.facingLeft = true;
          setFacingLeft(true);
        } else if (moveX > 0) {
          p.facingLeft = false;
          setFacingLeft(false);
        }

        // Set action to WALK if not attacking
        if (p.action !== 'ATTACK' && p.action !== 'DANCE') {
          p.action = 'WALK';
        }

        // Play periodic rhythmic walking sound
        const now = state.clock.getElapsedTime();
        if (now - lastWalkSoundTime.current > 0.28) {
          playSynthSound('walk', settings);
          lastWalkSoundTime.current = now;

          // Emit dust particles behind player feet
          g.particleIdCounter++;
          g.particles.push({
            id: g.particleIdCounter,
            x: p.x - (p.facingLeft ? -0.5 : 0.5) * (Math.random() * 0.4 + 0.1),
            y: 0.1,
            z: p.z + (Math.random() * 0.4 - 0.2),
            vx: -moveX * 0.8 + (Math.random() * 0.4 - 0.2),
            vy: Math.random() * 0.8 + 0.3,
            vz: -moveZ * 0.8 + (Math.random() * 0.4 - 0.2),
            color: '#71717a',
            size: Math.random() * 0.22 + 0.1,
            life: 1.0,
            maxLife: 0.45,
          });
        }
      } else {
        // Return to IDLE state if no movement and not attacking/dancing
        if (p.action !== 'ATTACK' && p.action !== 'DANCE') {
          p.action = 'IDLE';
        }
      }

      // 2. TRIGGER ACTIONS & SPECIAL SKILLS (P & O key handling)
      
      // Decrease action specific counters
      if (p.attackCooldown > 0) {
        p.attackCooldown -= delta;
      }

      // TRIGGER P: Attack / Punch (Plays row 3 "Attack" quickly, emits front Hit Box)
      if (activeKeys.current['ATTACK_P'] && p.action !== 'ATTACK' && p.attackCooldown <= 0) {
        p.action = 'ATTACK';
        p.frame = 0;
        p.frameTimer = 0;
        p.attackCooldown = 0.35; // lock attack sequence

        playSynthSound('attack', settings);

        // Spawn Front hitbox in 3D (offset slightly in face direction)
        const hitOffset = p.facingLeft ? -1.8 : 1.8;
        g.hitbox = {
          x: p.x + hitOffset,
          z: p.z,
          active: true,
          scale: 0.5,
          direction: p.facingLeft ? 'left' : 'right',
          life: 1.0,
        };

        // Screen shake on punch swing
        g.cameraShake = Math.max(g.cameraShake, 0.4);

        // Damage calculation in active Hitbox circle
        const hitboxRad = 2.4;
        g.enemies.forEach((enemy) => {
          const dx = enemy.x - g.hitbox.x;
          const dz = enemy.z - g.hitbox.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist <= hitboxRad) {
            // Apply knockback & take damage
            enemy.health -= character.power * 2 + 10;
            enemy.flashTimer = 0.25;
            
            // Spawn gorgeous spark particles
            for (let i = 0; i < 6; i++) {
              g.particleIdCounter++;
              g.particles.push({
                id: g.particleIdCounter,
                x: enemy.x + (Math.random() * 0.4 - 0.2),
                y: 0.8 + (Math.random() * 0.4 - 0.2),
                z: enemy.z + (Math.random() * 0.4 - 0.2),
                vx: (p.facingLeft ? -1 : 1) * (Math.random() * 3 + 2),
                vy: Math.random() * 3 + 1,
                vz: Math.random() * 2 - 1,
                color: '#f59e0b',
                size: Math.random() * 0.15 + 0.1,
                life: 1.0,
                maxLife: 0.35,
              });
            }

            // Create floating hit damage text
            g.combatTextIdCounter++;
            g.combatTexts.push({
              id: g.combatTextIdCounter,
              x: enemy.x,
              y: 1.5,
              z: enemy.z,
              text: `HIT! -${character.power * 2 + 10}`,
              color: '#f59e0b',
              life: 1.0,
            });

            // Combo multiplier increment
            g.combo++;
            g.comboTimer = 3.5; // combo lasts 3.5s
            setCombo(g.combo);

            playSynthSound('hit', settings);
          }
        });
      }

      // TRIGGER O: Energy Blast Skill (Emits expanding golden ring, consumes charge)
      if (activeKeys.current['SKILL_O'] && g.skillCharge >= 40 && !g.energyRing.active) {
        g.skillCharge -= 40;
        setSkillCharge(Math.floor(g.skillCharge));

        playSynthSound('skill', settings);

        g.energyRing = {
          active: true,
          radius: 0.2,
          maxRadius: 7.0,
          opacity: 1.0,
        };

        p.action = 'DANCE'; // triggers cool pose sequence
        p.frame = 0;
        p.frameTimer = 0;

        g.cameraShake = Math.max(g.cameraShake, 1.2); // deep heavy shake
        
        // Spawn concentric ring particles
        for (let r = 0; r < 24; r++) {
          const angle = (r / 24) * Math.PI * 2;
          g.particleIdCounter++;
          g.particles.push({
            id: g.particleIdCounter,
            x: p.x,
            y: 0.1,
            z: p.z,
            vx: Math.cos(angle) * 7,
            vy: Math.random() * 1.5 + 0.5,
            vz: Math.sin(angle) * 7,
            color: '#f59e0b',
            size: Math.random() * 0.2 + 0.15,
            life: 1.0,
            maxLife: 0.6,
          });
        }
      }

      // 3. SPRITESHEET ANIMATION ENGINE
      p.frameTimer += delta;
      let frameDuration = 0.25; // default 4 FPS (Idle)
      let rowOffset = 0.75;    // default top row (Idle)

      if (p.action === 'WALK') {
        frameDuration = 0.125; // 8 FPS (Walk)
        rowOffset = 0.50;      // second row
      } else if (p.action === 'ATTACK') {
        frameDuration = 0.05;  // 20 FPS (Attack - "เล่น Animation ไวขึ้น")
        rowOffset = 0.25;      // third row
      } else if (p.action === 'DANCE') {
        frameDuration = 0.15;  // 6 FPS (Dance)
        rowOffset = 0.00;      // bottom row
      }

      // Advance frames
      if (p.frameTimer >= frameDuration) {
        p.frameTimer = 0;
        p.frame = (p.frame + 1) % 4;

        // If attack finish, restore previous action state
        if (p.action === 'ATTACK' && p.frame === 3) {
          p.action = 'IDLE';
        }
        // If dance finish and O key released, restore idle
        if (p.action === 'DANCE' && p.frame === 3 && !activeKeys.current['SKILL_O']) {
          p.action = 'IDLE';
        }
      }

      // Apply coordinates shift directly to clone texture offset
      playerTex.offset.x = p.frame * 0.25;
      playerTex.offset.y = rowOffset;

      // Update local hook reference for 3D player mesh placement
      setPlayerPos({ x: p.x, z: p.z, y: 1.1 });

      // 4. ANIMATE HITBOX VISUAL EFFECT
      if (g.hitbox.active) {
        g.hitbox.life -= delta * 4;
        g.hitbox.scale = (1 - g.hitbox.life) * 2.5;
        if (g.hitbox.life <= 0) {
          g.hitbox.active = false;
        }
        setHitboxState({ ...g.hitbox });
      } else {
        if (hitboxState.active) setHitboxState({ ...g.hitbox });
      }

      // 5. ANIMATE ENERGY RING VISUAL EFFECT (O-skill)
      if (g.energyRing.active) {
        g.energyRing.radius += delta * 12; // expands outward quickly
        g.energyRing.opacity = 1.0 - (g.energyRing.radius / g.energyRing.maxRadius);
        
        // Check collisions iteratively as ring expands
        g.enemies.forEach((enemy) => {
          const dx = enemy.x - p.x;
          const dz = enemy.z - p.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          
          // If caught close to ring radius, blast back and deal damage
          if (Math.abs(dist - g.energyRing.radius) < 0.6 && enemy.flashTimer <= 0) {
            enemy.health -= character.power * 4 + 30; // heavy damage
            enemy.flashTimer = 0.3;
            
            // Blast back
            const bX = dist > 0 ? dx / dist : 1;
            const bZ = dist > 0 ? dz / dist : 0;
            enemy.x += bX * 2.8;
            enemy.z += bZ * 2.8;

            g.combatTextIdCounter++;
            g.combatTexts.push({
              id: g.combatTextIdCounter,
              x: enemy.x,
              y: 1.6,
              z: enemy.z,
              text: `BLAST! -${character.power * 4 + 30}`,
              color: '#d97706',
              life: 1.0,
            });

            g.combo += 2;
            g.comboTimer = 3.5;
            setCombo(g.combo);

            playSynthSound('hit', settings);
          }
        });

        if (g.energyRing.radius >= g.energyRing.maxRadius) {
          g.energyRing.active = false;
        }
        setRingState({ ...g.energyRing });
      } else {
        if (ringState.active) setRingState({ ...g.energyRing });
      }

      // 6. ENEMY SPAWNER & DYNAMICS
      g.spawnTimer += delta;
      const baseSpawnInterval = Math.max(0.6, 2.5 - (g.score / 6000)); // spawns faster as score increases
      if (g.spawnTimer >= baseSpawnInterval && g.enemies.length < 18) {
        g.spawnTimer = 0;
        g.enemyIdCounter++;

        // Spawn outside a safe circle centered around player
        let sAngle = Math.random() * Math.PI * 2;
        let sDist = Math.random() * 10 + 12; // 12 to 22 units out
        let sX = p.x + Math.cos(sAngle) * sDist;
        let sZ = p.z + Math.sin(sAngle) * sDist;

        // Bound spawned enemy to the arena
        sX = THREE.MathUtils.clamp(sX, -23, 23);
        sZ = THREE.MathUtils.clamp(sZ, -23, 23);

        const types: ('crawler' | 'ranger' | 'charger')[] = ['crawler', 'ranger', 'charger'];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        let eHp = 25 + (g.score / 250); // scales stronger
        let eSpeed = Math.random() * 1.2 + 2.0;

        if (chosenType === 'charger') {
          eHp = 15;
          eSpeed = Math.random() * 1.5 + 4.2; // very fast!
        } else if (chosenType === 'ranger') {
          eHp = 45;
          eSpeed = Math.random() * 0.8 + 1.2; // heavy, slow tank
        }

        g.enemies.push({
          id: g.enemyIdCounter,
          x: sX,
          z: sZ,
          y: 0.5,
          speed: eSpeed,
          health: eHp,
          maxHealth: eHp,
          scale: chosenType === 'ranger' ? 1.4 : chosenType === 'charger' ? 0.8 : 1.0,
          type: chosenType,
          damageCooldown: 0,
          flashTimer: 0,
          jumpOffset: Math.random() * Math.PI, // offsets jump animation
        });
      }

      // 7. UPDATE ACTIVE ENEMIES LIST
      const updatedEnemies: EnemyEntity[] = [];
      g.enemies.forEach((enemy) => {
        // Decrease internal timers
        if (enemy.damageCooldown > 0) enemy.damageCooldown -= delta;
        if (enemy.flashTimer > 0) enemy.flashTimer -= delta;

        // Pathfind towards player's current XZ coordinates
        const dx = p.x - enemy.x;
        const dz = p.z - enemy.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0.4) {
          enemy.x += (dx / dist) * enemy.speed * delta;
          enemy.z += (dz / dist) * enemy.speed * delta;
        }

        // Apply bouncing movement height Y for squishy slime visual
        const bounceSpeed = enemy.type === 'charger' ? 12 : 6;
        enemy.y = 0.5 + Math.abs(Math.sin(state.clock.getElapsedTime() * bounceSpeed + enemy.jumpOffset)) * 0.4;

        // Collision with player: deals damage & applies screen shake
        if (dist <= 1.2 && enemy.damageCooldown <= 0) {
          enemy.damageCooldown = 1.0; // hit lock
          
          g.health = Math.max(0, g.health - 12);
          setHealth(g.health);

          g.cameraShake = Math.max(g.cameraShake, 1.4); // hard impact shake
          playSynthSound('hurt', settings);

          // Generate damage text at player position
          g.combatTextIdCounter++;
          g.combatTexts.push({
            id: g.combatTextIdCounter,
            x: p.x,
            y: 1.5,
            z: p.z,
            text: `-12 HP`,
            color: '#ef4444',
            life: 1.0,
          });

          // Break active multiplier chain
          g.combo = 0;
          setCombo(0);

          // Check defeat/gameover state
          if (g.health <= 0) {
            playSynthSound('defeat', settings);
            setShowGameOverScreen(true);
          }
        }

        // Keep enemy if alive, else emit explosion particles
        if (enemy.health > 0) {
          updatedEnemies.push(enemy);
        } else {
          // Defeated! Spawn explosion effects
          g.score += enemy.type === 'ranger' ? 250 : enemy.type === 'charger' ? 180 : 100;
          
          // Apply multiplier points if combo is active
          const comboMult = g.combo >= 10 ? 2.0 : g.combo >= 5 ? 1.5 : 1.0;
          g.score = Math.floor(g.score * comboMult);
          setScore(g.score);

          for (let i = 0; i < 12; i++) {
            g.particleIdCounter++;
            g.particles.push({
              id: g.particleIdCounter,
              x: enemy.x,
              y: enemy.y,
              z: enemy.z,
              vx: (Math.random() * 2 - 1) * 3,
              vy: Math.random() * 4 + 1.5,
              vz: (Math.random() * 2 - 1) * 3,
              color: enemy.type === 'ranger' ? '#ef4444' : enemy.type === 'charger' ? '#a855f7' : '#10b981',
              size: Math.random() * 0.2 + 0.1,
              life: 1.0,
              maxLife: 0.5,
            });
          }
        }
      });
      g.enemies = updatedEnemies;
      setRenderEnemies(updatedEnemies);

      // 8. UPDATE ACTIVE PARTICLES LIST
      const updatedParticles: Particle[] = [];
      g.particles.forEach((part) => {
        part.life -= delta / part.maxLife;

        // Apply velocities & friction
        part.x += part.vx * delta;
        part.y += part.vy * delta;
        part.z += part.vz * delta;

        // Gravity pull
        part.vy -= 9.81 * delta;

        // Bounce off floor ground plane Y = 0
        if (part.y < 0.05) {
          part.y = 0.05;
          part.vy = -part.vy * 0.4; // damp bounce
          part.vx *= 0.8;
          part.vz *= 0.8;
        }

        if (part.life > 0) {
          updatedParticles.push(part);
        }
      });
      g.particles = updatedParticles;
      setRenderParticles(updatedParticles);

      // 9. UPDATE FLOATING TEXT LABELS
      const updatedTexts: CombatText[] = [];
      g.combatTexts.forEach((txt) => {
        txt.life -= delta * 1.5;
        txt.y += delta * 1.5; // floats up steadily
        if (txt.life > 0) {
          updatedTexts.push(txt);
        }
      });
      g.combatTexts = updatedTexts;
      setRenderTexts(updatedTexts);

      // 10. SMOOTH DAMP CAMERA INTERPOLATION
      // Apply random viewport noise offsets if camera shake is active
      const shakeOffset = (Math.random() * 2 - 1) * g.cameraShake * 0.18;

      state.camera.position.x += ((p.x) - state.camera.position.x) * 0.08 + shakeOffset;
      state.camera.position.y += ((p.y + 11) - state.camera.position.y) * 0.08 + shakeOffset;
      state.camera.position.z += ((p.z + 13.5) - state.camera.position.z) * 0.08 + shakeOffset;

      // Restrict camera height bounds to keep gorgeous top-down angle
      state.camera.position.y = Math.max(6, state.camera.position.y);

      state.camera.lookAt(p.x, p.y + 0.5, p.z);
    });

    return (
      <>
        {/* Sky Color and Cyber Space Lights */}
        <color attach="background" args={['#040406']} />
        <ambientLight intensity={1.1} />
        
        {/* Soft Cyber Lighting Colors */}
        <pointLight position={[-15, 10, -15]} color="#a855f7" intensity={1.2} />
        <pointLight position={[15, 12, 15]} color="#f59e0b" intensity={1.5} />
        
        {/* Main Directional light casting gorgeous shadows */}
        <directionalLight 
          position={[12, 22, 12]} 
          intensity={1.4} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-25}
          shadow-camera-right={25}
          shadow-camera-top={25}
          shadow-camera-bottom={-25}
          shadow-camera-far={60}
        />

        {/* 1. TILING EARTH GROUND FLOOR (Ground Plane 50) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial map={tiledGround} roughness={0.85} metalness={0.1} />
        </mesh>

        {/* Outer Grid boundary lines */}
        <gridHelper args={[50, 50, '#d97706', '#1f1f29']} position={[0, 0.02, 0]} />

        {/* Arena boundary fence markers */}
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[50, 0.2, 50]} />
          <meshBasicMaterial color="#d97706" wireframe opacity={0.2} transparent />
        </mesh>

        {/* Outer glowing decor beacons to style the workspace floor beautifully */}
        <mesh position={[-24, 2, -24]}>
          <boxGeometry args={[0.8, 4, 0.8]} />
          <meshStandardMaterial color="#f59e0b" emissive="#d97706" roughness={0.2} />
        </mesh>
        <mesh position={[24, 2, -24]}>
          <boxGeometry args={[0.8, 4, 0.8]} />
          <meshStandardMaterial color="#f59e0b" emissive="#d97706" roughness={0.2} />
        </mesh>
        <mesh position={[-24, 2, 24]}>
          <boxGeometry args={[0.8, 4, 0.8]} />
          <meshStandardMaterial color="#f59e0b" emissive="#d97706" roughness={0.2} />
        </mesh>
        <mesh position={[24, 2, 24]}>
          <boxGeometry args={[0.8, 4, 0.8]} />
          <meshStandardMaterial color="#f59e0b" emissive="#d97706" roughness={0.2} />
        </mesh>

        {/* 2. PLAYER SHADOW (Perfect soft circular shadow at player feet) */}
        <mesh position={[playerPos.x, 0.03, playerPos.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, 0.65, 32]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.52} />
        </mesh>

        {/* 3. PLAYER CHARACTER BILLBOARD (2D facing camera player mesh) */}
        <Billboard
          position={[playerPos.x, playerPos.y, playerPos.z]}
        >
          <mesh ref={playerMesh} castShadow>
            <planeGeometry args={[2.2, 2.2]} />
            <meshBasicMaterial 
              map={playerTex} 
              transparent 
              alphaTest={0.08}
              side={THREE.DoubleSide}
            />
          </mesh>
        </Billboard>

        {/* Interactive glowing ring expanding at the player's feet (O-Skill Aura) */}
        {ringState.active && (
          <mesh position={[playerPos.x, 0.04, playerPos.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[ringState.radius - 0.28, ringState.radius, 64]} />
            <meshBasicMaterial 
              color="#f59e0b" 
              transparent 
              opacity={ringState.opacity} 
              side={THREE.DoubleSide} 
            />
          </mesh>
        )}

        {/* Active slash hitbox mesh visualizer (P-punch wave) */}
        {hitboxState.active && (
          <Billboard
            position={[hitboxState.x, 1.0, hitboxState.z]}
          >
            <mesh>
              <planeGeometry args={[1.8 * hitboxState.scale, 1.2 * hitboxState.scale]} />
              <meshBasicMaterial 
                color="#f59e0b" 
                transparent 
                opacity={hitboxState.life * 0.7} 
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </Billboard>
        )}

        {/* 4. RENDER SPAWNED 3D BOUNCY ENEMIES (Crystals & Slimes) */}
        {renderEnemies.map((enemy) => (
          <group key={enemy.id} position={[enemy.x, enemy.y, enemy.z]}>
            {/* Soft Shadow indicator circle */}
            <mesh position={[0, -enemy.y + 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0, 0.45 * enemy.scale, 32]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.4} />
            </mesh>

            {/* Glowing crystal mesh */}
            <mesh castShadow>
              <octahedronGeometry args={[0.55 * enemy.scale, 0]} />
              <meshStandardMaterial 
                color={enemy.flashTimer > 0 ? '#ffffff' : enemy.type === 'charger' ? '#a855f7' : enemy.type === 'ranger' ? '#ef4444' : '#10b981'} 
                emissive={enemy.type === 'charger' ? '#581c87' : enemy.type === 'ranger' ? '#7f1d1d' : '#064e3b'}
                roughness={0.15} 
                metalness={0.4}
              />
            </mesh>

            {/* Float Energy cores inside crystals */}
            <mesh position={[0, 0.1, 0]}>
              <sphereGeometry args={[0.2 * enemy.scale, 8, 8]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
            </mesh>

            {/* Simple Floating Health Bar above strong enemies */}
            {enemy.health < enemy.maxHealth && (
              <Html position={[0, 1.2 * enemy.scale, 0]} center distanceFactor={8}>
                <div className="w-12 bg-[#0d0d11] h-1 border border-[#1f1f25] overflow-hidden p-[0.5px]">
                  <div 
                    className="bg-red-500 h-full transition-all" 
                    style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
                  />
                </div>
              </Html>
            )}
          </group>
        ))}

        {/* 5. RENDER PARTICLE SYSTEMS (Explosions and walk dust) */}
        {renderParticles.map((part) => (
          <mesh key={part.id} position={[part.x, part.y, part.z]}>
            <boxGeometry args={[part.size * part.life, part.size * part.life, part.size * part.life]} />
            <meshBasicMaterial 
              color={part.color} 
              transparent 
              opacity={part.life} 
            />
          </mesh>
        ))}

        {/* 6. RENDER FLOATING COMBAT LABELS */}
        {renderTexts.map((txt) => (
          <Html key={txt.id} position={[txt.x, txt.y, txt.z]} center distanceFactor={9}>
            <span 
              style={{ color: txt.color, opacity: txt.life }} 
              className="font-display font-black text-[10px] md:text-xs tracking-wider whitespace-nowrap filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] select-none uppercase animate-pulse"
            >
              {txt.text}
            </span>
          </Html>
        ))}
      </>
    );
  }

  return (
    <div className="w-screen h-screen absolute inset-0 z-0 select-none overflow-hidden font-sans text-white bg-[#040406]">
      {/* FULL SCREEN CANVAS */}
      <Canvas
        shadows
        camera={{ position: [0, 9, 13], fov: 42 }}
        className="w-full h-full pointer-events-auto"
      >
        <GameScene />
      </Canvas>

      {/* TOP FLOATING OVERLAY HUD */}
      <div className="absolute top-0 left-0 right-0 p-5 z-10 pointer-events-none flex justify-between items-start">
        {/* Player Vitalities */}
        <div className="flex flex-col gap-3 pointer-events-auto">
          {/* Core Hull Integrity */}
          <div className="flex flex-col gap-1 w-44 md:w-56 bg-[#0a0a0e]/60 backdrop-blur-sm p-2 border border-[#1f1f2a]/60 rounded-md">
            <div className="flex justify-between items-center text-[10px] font-mono tracking-wider">
              <span className="text-red-400 font-bold flex items-center gap-1">
                <Heart size={11} className="fill-red-500 stroke-none animate-pulse" />
                HULL INTEGRITY
              </span>
              <span className="font-bold text-red-400">{health}%</span>
            </div>
            <div className="w-full bg-[#14141d] h-2.5 rounded-sm overflow-hidden p-[1px] border border-[#1f1f2a]">
              <div 
                className="bg-gradient-to-r from-red-600 to-rose-400 h-full rounded-sm transition-all duration-200"
                style={{ width: `${health}%` }}
              />
            </div>
          </div>

          {/* Special Skill Energy (O-Skill) */}
          <div className="flex flex-col gap-1 w-44 md:w-56 bg-[#0a0a0e]/60 backdrop-blur-sm p-2 border border-[#1f1f2a]/60 rounded-md">
            <div className="flex justify-between items-center text-[10px] font-mono tracking-wider">
              <span className="text-amber-500 font-bold flex items-center gap-1">
                <Zap size={11} className="fill-amber-500 stroke-none" />
                RING BLAST (O)
              </span>
              <span className="font-bold text-amber-500">{skillCharge}%</span>
            </div>
            <div className="w-full bg-[#14141d] h-2.5 rounded-sm overflow-hidden p-[1px] border border-[#1f1f2a]">
              <div 
                className={`h-full rounded-sm transition-all duration-200 ${skillCharge >= 40 ? 'bg-amber-500 animate-pulse' : 'bg-amber-700/50'}`}
                style={{ width: `${skillCharge}%` }}
              />
            </div>
            <div className="text-[9px] font-mono text-zinc-500 text-right">
              {skillCharge >= 40 ? 'READY TO BLAST [O]' : 'CHARGING ENERGY...'}
            </div>
          </div>
        </div>

        {/* Score & Combos */}
        <div className="flex flex-col items-end gap-2.5">
          <div className="bg-[#0a0a0e]/60 backdrop-blur-sm p-3 border border-[#1f1f2a]/60 rounded-md text-right pointer-events-auto min-w-[120px]">
            <span className="block text-[8px] font-mono text-zinc-500 tracking-[0.2em]">CURRENT SCORE</span>
            <span className="font-display font-semibold text-lg md:text-xl text-amber-500 tracking-wider">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Combos display */}
          {combo >= 3 && (
            <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-mono text-[10px] font-bold py-1 px-3.5 rounded-full shadow-[0_4px_12px_rgba(217,119,6,0.22)] animate-bounce">
              COMBO x{combo} ({combo >= 10 ? '2.0X SCORE' : combo >= 5 ? '1.5X SCORE' : '1.0X'})
            </div>
          )}
        </div>
      </div>

      {/* PAUSE BUTTON (Upper Right margin) */}
      <div className="absolute top-5 right-5 z-20 flex gap-2">
        <button
          onClick={() => setIsPaused(p => !p)}
          className="p-2.5 bg-[#0d0d11]/90 hover:bg-[#14141a] border border-[#1f1f25] hover:border-amber-500/25 text-amber-500 hover:text-amber-400 rounded transition-all cursor-pointer flex items-center justify-center shadow-lg"
          title="Pause Simulator"
        >
          <span className="text-xs font-mono font-bold px-1">II</span>
        </button>
      </div>

      {/* ACTIVE CONTROL REMAPPING PANEL (Bottom Right Overlay Guide) */}
      <div className="absolute bottom-5 right-5 z-10 bg-[#0d0d11]/95 backdrop-blur-sm p-4 rounded-md border border-[#1f1f2a]/80 pointer-events-none max-w-xs text-[11px] font-mono text-zinc-400 flex flex-col gap-2 shadow-2xl">
        <div className="text-zinc-200 font-semibold text-[9px] uppercase tracking-widest border-b border-[#1f1f2a] pb-1.5 mb-1 flex items-center gap-1">
          <Sparkles size={11} className="text-amber-500" />
          ACTIVE COMMAND BINDINGS
        </div>
        <div className="flex justify-between gap-4">
          <span>8-Way Walk</span>
          <span className="text-amber-500 font-bold">[{controls.up.label}/{controls.down.label}/{controls.left.label}/{controls.right.label}]</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>PUNCH ATTACK</span>
          <span className="text-amber-500 font-bold">[{controls.shoot.label}] or [P]</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>RING ENERGY BLAST</span>
          <span className="text-amber-500 font-bold">[{controls.jump.label}] or [O]</span>
        </div>
        <div className="text-[9px] text-zinc-500 leading-relaxed border-t border-[#1f1f2a]/60 pt-1.5 mt-1">
          Destroy invading cyber crystals to trigger score combos! Avoid collision contacts.
        </div>
      </div>

      {/* RETRO CORNER INFO OVERLAYS (Visual details requested) */}
      <div className="absolute bottom-5 left-5 z-10 pointer-events-none font-mono text-[9px] text-zinc-500 flex flex-col gap-0.5">
        <span>SECTOR: 3D CYBER NET</span>
        <span>PILOT: {character.name.toUpperCase()} (SPD: {character.speed}/10, POW: {character.power}/10)</span>
      </div>

      {/* SCREEN FLASH ON DAMAGE EVENT */}
      {health < 100 && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
          style={{ 
            boxShadow: `inset 0 0 ${100 - health}px rgba(239, 68, 68, ${0.12 + (1.0 - health/100) * 0.28})`
          }}
        />
      )}

      {/* POPUP MODAL: GAME OVER SCREEN */}
      {showGameOverScreen && (
        <div className="absolute inset-0 bg-[#08080a]/92 backdrop-blur-md z-30 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0d0d11] border border-[#1f1f25] p-7 rounded-md text-center shadow-2xl flex flex-col items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <ShieldAlert size={22} className="animate-bounce" />
            </div>

            <div>
              <h3 className="font-display font-medium tracking-[0.2em] text-red-500 uppercase text-lg">
                SIMULATION FAILED
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">
                Your starfighter hull integrity was fully depleted in Sector-88. Enter your name on the scoreboard to record this session.
              </p>
            </div>

            <div className="w-full bg-[#08080a] py-3 rounded-sm border border-[#1f1f25]">
              <span className="block text-[8px] font-mono text-zinc-500 tracking-wider uppercase mb-1">SCORE SECURED</span>
              <span className="font-display font-bold tracking-widest text-lg text-amber-500">
                {score.toLocaleString()}
              </span>
            </div>

            <div className="w-full flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-display font-semibold tracking-[0.15em] text-[11px] rounded-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={12} />
                RETRY SIMULATION
              </button>
              <button
                onClick={() => onGameOver(score)}
                className="px-4 py-2.5 bg-[#14141a] hover:bg-[#1a1a24] text-zinc-300 hover:text-zinc-100 font-display font-semibold tracking-[0.15em] text-[11px] rounded-sm border border-[#1f1f25] transition-all cursor-pointer"
              >
                RECORD SCORE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: GAME PAUSED SCREEN */}
      {isPaused && !showGameOverScreen && (
        <div className="absolute inset-0 bg-[#08080a]/92 backdrop-blur-md z-30 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0d0d11] border border-[#1f1f25] p-7 rounded-md text-center shadow-2xl flex flex-col items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <AlertCircle size={22} />
            </div>

            <div>
              <h3 className="font-display font-medium tracking-[0.2em] text-amber-500 uppercase text-lg">
                SIMULATOR PAUSED
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">
                Tactical training freeze active. Resume active flight combat once ready.
              </p>
            </div>

            <div className="w-full flex gap-3 mt-1">
              <button
                onClick={() => setIsPaused(false)}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-display font-semibold tracking-[0.15em] text-[11px] rounded-sm transition-all cursor-pointer"
              >
                RESUME FLIGHT
              </button>
              <button
                onClick={onBackToMenu}
                className="px-4 py-2.5 bg-[#14141a] hover:bg-[#1a1a24] text-zinc-300 hover:text-zinc-100 font-display font-semibold tracking-[0.15em] text-[11px] rounded-sm border border-[#1f1f25] transition-all cursor-pointer"
              >
                ABORT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
