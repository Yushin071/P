// Retro Synthesizer Engine using Web Audio API

let audioCtx: AudioContext | null = null;
let masterVolumeNode: GainNode | null = null;

// Initialize Audio Context on user interaction
export function initAudio() {
  if (audioCtx) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
    masterVolumeNode = audioCtx.createGain();
    masterVolumeNode.connect(audioCtx.destination);
    masterVolumeNode.gain.value = 0.5; // Default master volume
  } catch (e) {
    console.warn('Web Audio API not supported', e);
  }
}

export function setMasterVolume(volumePercentage: number) {
  initAudio();
  if (masterVolumeNode && audioCtx) {
    // Volume: 0.0 to 1.0
    const val = Math.max(0, Math.min(100, volumePercentage)) / 100;
    masterVolumeNode.gain.setValueAtTime(val, audioCtx.currentTime);
  }
}

// 1. Play Laser Sound
export function playLaserSound() {
  if (!audioCtx) initAudio();
  if (!audioCtx || audioCtx.state === 'suspended') return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(masterVolumeNode || audioCtx.destination);

  // Retro sci-fi sweep: start high, sweep down fast
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.15);

  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.16);
}

// 2. Play Explosion Sound
export function playExplosionSound() {
  if (!audioCtx) initAudio();
  if (!audioCtx || audioCtx.state === 'suspended') return;

  // Synthesize explosion noise or square wave low-frequency pitch sweep
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(masterVolumeNode || audioCtx.destination);

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.linearRampToValueAtTime(20, audioCtx.currentTime + 0.4);

  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.4);
}

// 3. Play Powerup Sound
export function playPowerupSound() {
  if (!audioCtx) initAudio();
  if (!audioCtx || audioCtx.state === 'suspended') return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(masterVolumeNode || audioCtx.destination);

  osc.type = 'sine';
  // Standard ascending major triad
  const now = audioCtx.currentTime;
  osc.frequency.setValueAtTime(261.63, now); // C4
  osc.frequency.setValueAtTime(329.63, now + 0.08); // E4
  osc.frequency.setValueAtTime(392.00, now + 0.16); // G4
  osc.frequency.setValueAtTime(523.25, now + 0.24); // C5

  gain.gain.setValueAtTime(0.1, now);
  gain.gain.setValueAtTime(0.1, now + 0.24);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

  osc.start(now);
  osc.stop(now + 0.36);
}

// 4. Play Shield Activate Sound
export function playShieldSound() {
  if (!audioCtx) initAudio();
  if (!audioCtx || audioCtx.state === 'suspended') return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(masterVolumeNode || audioCtx.destination);

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.25);

  gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.26);
}

// 5. Play Hit / Hurt Sound
export function playHurtSound() {
  if (!audioCtx) initAudio();
  if (!audioCtx || audioCtx.state === 'suspended') return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(masterVolumeNode || audioCtx.destination);

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(180, audioCtx.currentTime);
  osc.frequency.linearRampToValueAtTime(60, audioCtx.currentTime + 0.15);

  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.16);
}

// 6. Play Game Over Sound
export function playGameOverSound() {
  if (!audioCtx) initAudio();
  if (!audioCtx || audioCtx.state === 'suspended') return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(masterVolumeNode || audioCtx.destination);

  osc.type = 'sawtooth';
  const now = audioCtx.currentTime;
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.setValueAtTime(250, now + 0.15);
  osc.frequency.setValueAtTime(200, now + 0.3);
  osc.frequency.setValueAtTime(150, now + 0.45);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.setValueAtTime(0.15, now + 0.45);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

  osc.start(now);
  osc.stop(now + 0.75);
}

// 7. Menu Click Sound
export function playClickSound() {
  if (!audioCtx) initAudio();
  if (!audioCtx || audioCtx.state === 'suspended') return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(masterVolumeNode || audioCtx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, audioCtx.currentTime);
  osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.04);

  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.08);
}
