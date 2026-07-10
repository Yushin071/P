export interface KeyBinding {
  key: string;       // e.g. "ArrowUp" or "w"
  code: string;      // e.g. "ArrowUp" or "KeyW"
  label: string;     // e.g. "▲" or "W"
}

export interface ControlConfig {
  up: KeyBinding;
  down: KeyBinding;
  left: KeyBinding;
  right: KeyBinding;
  shoot: KeyBinding;
  jump: KeyBinding;
}

export interface GameSettings {
  controls: ControlConfig;
  masterVolume: number; // 0 - 100
  sfxVolume: number;    // 0 - 100
  musicVolume: number;  // 0 - 100
  screenShake: boolean;
  scanlines: boolean;
  graphicsQuality: 'low' | 'medium' | 'high';
}

export type ActiveScreen = 'MAIN_MENU' | 'CHARACTER_SELECT' | 'OPTIONS' | 'GAME' | 'ABOUT' | 'HIGHSCORES';

export interface CharacterSkin {
  id: string;
  name: string;
  color: string;
  accentColor: string;
  description: string;
  speed: number;
  health: number;
  power: number;
}

export interface HighScore {
  name: string;
  score: number;
  date: string;
  character: string;
}
