/* ==========================================================================
   OCCULT AUDIO ENGINE — PROCEDURAL SYNTHESIS & ATMOSPHERIC SOUNDS
   Web Audio API Procedural Synthesizers + Audio Sample Fallback
   ========================================================================== */

class OccultAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.ambientGain = null;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneFilter = null;
    this.isDroneActive = false;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);
      
      console.log('Occult Audio Context initialized.');
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // 1. Occult Ambient Drone (Deep resonant pad)
  startAmbientDrone() {
    if (this.isDroneActive || !this.ctx) return;
    this.ensureContext();
    
    try {
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc2 = this.ctx.createOscillator();
      this.droneFilter = this.ctx.createBiquadFilter();
      
      this.droneOsc1.type = 'sawtooth';
      this.droneOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note
      
      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(54.4, this.ctx.currentTime); // Slight detune for beat frequency
      
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(120, this.ctx.currentTime);
      this.droneFilter.Q.setValueAtTime(4, this.ctx.currentTime);
      
      this.droneOsc1.connect(this.droneFilter);
      this.droneOsc2.connect(this.droneFilter);
      this.droneFilter.connect(this.ambientGain);
      
      this.droneOsc1.start();
      this.droneOsc2.start();
      this.isDroneActive = true;
    } catch (e) {
      console.warn('Drone error:', e);
    }
  }

  // 2. Demonic Sub-Bass Rumble
  playSubRumble(duration = 2.5) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(42, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(26, this.ctx.currentTime + duration);
      
      gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Rumble error:', e);
    }
  }

  // 3. Ritual Bell / Chime (FM Metallic synthesis for phase progression)
  playRitualChime(pitchMultiplier = 1.0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    
    try {
      const now = this.ctx.currentTime;
      const carrier = this.ctx.createOscillator();
      const modulator = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const masterEnv = this.ctx.createGain();
      
      const baseFreq = 220 * pitchMultiplier;
      carrier.frequency.setValueAtTime(baseFreq, now);
      modulator.frequency.setValueAtTime(baseFreq * 2.76, now);
      
      modGain.gain.setValueAtTime(baseFreq * 1.5, now);
      modGain.gain.exponentialRampToValueAtTime(0.1, now + 2.8);
      
      masterEnv.gain.setValueAtTime(0.5, now);
      masterEnv.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
      
      modulator.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(masterEnv);
      masterEnv.connect(this.masterGain);
      
      carrier.start(now);
      modulator.start(now);
      carrier.stop(now + 3.0);
      modulator.stop(now + 3.0);
    } catch (e) {
      console.warn('Chime error:', e);
    }
  }

  // 4. Arcane Whisper / Supernatural Breeze (Filtered White Noise Burst)
  playWhisper(duration = 1.2) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    
    try {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + duration);
      filter.Q.setValueAtTime(6, this.ctx.currentTime);
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      
      noise.start();
    } catch (e) {
      console.warn('Whisper error:', e);
    }
  }

  // 5. Instability Glitch & Anomaly Static
  playGlitch(intensity = 0.5) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    
    try {
      const duration = 0.18 * intensity;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (i % 20 < 4 ? 0.8 : 0.1);
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35 * intensity, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + duration);
      
      noise.connect(gain);
      gain.connect(this.masterGain);
      noise.start();
    } catch (e) {
      console.warn('Glitch error:', e);
    }
  }

  // 6. Chain Lock / Heavy Metallic Clank
  playChainLock() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.4);
      
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      console.warn('Chain lock error:', e);
    }
  }

  // 7. Text Click / Subtle Bone Tap
  playTypeClick() {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 + Math.random() * 300, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {}
  }

  // 8. Sample Audio Playback (e.g. voice sample)
  playAudioClip(src) {
    if (this.isMuted) return;
    const audio = new Audio(src);
    audio.volume = 0.8;
    audio.play().catch(e => console.log('Audio playback postponed until user interaction'));
  }

  // 9. Synchronized Opening Sequence Sound Effects (scaled to playback speed)
  playOpeningCinematicSequence(speed = 1.25) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    this.stopOpeningCinematicSequence();
    this.openingCinematicTimers = [];

    const s = speed > 0 ? speed : 1.25;

    // 0.0s: Low distant supernatural rumble
    this.playSubRumble(3.0 / s);

    // 1.5s: Heavy leather binding creak as cover lifts
    this.openingCinematicTimers.push(setTimeout(() => {
      if (this.isMuted || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(65, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + (1.2 / s));
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (1.2 / s));
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + (1.2 / s));
      } catch (e) {}
    }, 1500 / s));

    // 3.0s: Dry page movement / parchment flutter
    this.openingCinematicTimers.push(setTimeout(() => {
      this.playWhisper(1.5 / s);
    }, 3000 / s));

    // 4.5s: Faint reversed whisper as pages open
    this.openingCinematicTimers.push(setTimeout(() => {
      this.playWhisper(1.8 / s);
      this.playGlitch(0.4 / s);
    }, 4500 / s));

    // 5.8s: Restrained low-frequency pulse when crimson glow appears
    this.openingCinematicTimers.push(setTimeout(() => {
      this.playSubRumble(2.0 / s);
    }, 5800 / s));

    // 7.2s: Final deep resonant impact as the book settles open
    this.openingCinematicTimers.push(setTimeout(() => {
      this.playRitualChime(0.85);
      this.playSubRumble(3.0 / s);
    }, 7200 / s));
  }

  stopOpeningCinematicSequence() {
    if (this.openingCinematicTimers && this.openingCinematicTimers.length) {
      this.openingCinematicTimers.forEach(id => clearTimeout(id));
      this.openingCinematicTimers = [];
    }
  }
}

export const audio = new OccultAudioEngine();

