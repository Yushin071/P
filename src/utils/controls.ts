import { ControlConfig, GameSettings, CharacterSkin, HighScore } from '../types';

export function getKeyLabel(code: string, key: string): string {
  if (code.startsWith('Key')) {
    return code.substring(3).toUpperCase();
  }
  if (code.startsWith('Digit')) {
    return code.substring(5);
  }
  if (code.startsWith('Numpad')) {
    return 'NUM ' + code.substring(6);
  }

  switch (code) {
    case 'ArrowUp':
      return '▲';
    case 'ArrowDown':
      return '▼';
    case 'ArrowLeft':
      return '◀';
    case 'ArrowRight':
      return '▶';
    case 'Space':
      return 'SPACE';
    case 'Enter':
      return 'ENTER';
    case 'ShiftLeft':
    case 'ShiftRight':
      return 'SHIFT';
    case 'ControlLeft':
    case 'ControlRight':
      return 'CTRL';
    case 'AltLeft':
    case 'AltRight':
      return 'ALT';
    case 'Tab':
      return 'TAB';
    case 'CapsLock':
      return 'CAPS';
    case 'Backspace':
      return 'BACKSPACE';
    case 'Escape':
      return 'ESC';
    default:
      return key ? key.toUpperCase() : code;
  }
}

export const DEFAULT_CONTROLS: ControlConfig = {
  up: { code: 'KeyW', key: 'w', label: 'W' },
  down: { code: 'KeyS', key: 's', label: 'S' },
  left: { code: 'KeyA', key: 'a', label: 'A' },
  right: { code: 'KeyD', key: 'd', label: 'D' },
  shoot: { code: 'Space', key: ' ', label: 'SPACE' },
  jump: { code: 'KeyK', key: 'k', label: 'K' },
};

export const ALTERNATIVE_CONTROLS: ControlConfig = {
  up: { code: 'ArrowUp', key: 'ArrowUp', label: '▲' },
  down: { code: 'ArrowDown', key: 'ArrowDown', label: '▼' },
  left: { code: 'ArrowLeft', key: 'ArrowLeft', label: '◀' },
  right: { code: 'ArrowRight', key: 'ArrowRight', label: '▶' },
  shoot: { code: 'ControlLeft', key: 'Control', label: 'CTRL' },
  jump: { code: 'Space', key: ' ', label: 'SPACE' },
};

export const DEFAULT_SETTINGS: GameSettings = {
  controls: DEFAULT_CONTROLS,
  masterVolume: 80,
  sfxVolume: 75,
  musicVolume: 60,
  screenShake: true,
  scanlines: true,
  graphicsQuality: 'high',
};

export const CHARACTERS: CharacterSkin[] = [
  {
    id: 'phoenix',
    name: 'Vortex Phoenix',
    color: '#ef4444', // Red
    accentColor: '#f97316', // Orange
    description: 'High offensive output with slightly lower hull reinforcement. Specializes in plasma burst velocity.',
    speed: 8,
    health: 6,
    power: 10,
  },
  {
    id: 'aegis',
    name: 'Aegis Sentinel',
    color: '#3b82f6', // Blue
    accentColor: '#06b6d4', // Cyan
    description: 'Heavily armored defensive dreadnought. Resists impacts but moves at a balanced speed.',
    speed: 6,
    health: 10,
    power: 7,
  },
  {
    id: 'spectre',
    name: 'Ghost Spectre',
    color: '#10b981', // Emerald
    accentColor: '#a7f3d0', // Light Emerald
    description: 'Ultra-light experimental interceptor. Elite agility and acceleration with modular cannon systems.',
    speed: 10,
    health: 5,
    power: 8,
  },
];

export const INITIAL_HIGHSCORES: HighScore[] = [
  { name: 'X-WING_PRO', score: 98000, date: '2026-07-01', character: 'Ghost Spectre' },
  { name: 'CYBER_KID', score: 75200, date: '2026-07-04', character: 'Vortex Phoenix' },
  { name: 'CHRONO_1', score: 62000, date: '2026-07-08', character: 'Aegis Sentinel' },
  { name: 'RETRO_FAN', score: 45000, date: '2026-07-09', character: 'Vortex Phoenix' },
];
