/* ==========================================================================
   VISION SYSTEM & SUPERNATURAL ANOMALY MANAGER
   Supports genuine webcam streaming, atmospheric fallback canvas chamber,
   frame inspection, watcher mode periodic remarks, and deterministic anomaly.
   ========================================================================== */

import { state } from './state.js';
import { audio } from './audio.js';
import { DIALOGUE_SCRIPT } from './dialogue.js';

export class VisionManager {
  constructor(dialogueEngine) {
    this.dialogue = dialogueEngine;
    this.videoEl = null;
    this.canvasEl = null;
    this.stream = null;
    this.isSupernatural = false;
    this.watcherTimer = null;
    this.canvasInterval = null;
  }

  init() {
    this.videoEl = document.getElementById('vision-video');
    this.canvasEl = document.getElementById('vision-canvas');
    
    // Auto-attempt webcam or start atmospheric fallback
    this.requestCameraAccess();
  }

  async requestCameraAccess() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        if (this.videoEl) {
          this.videoEl.srcObject = this.stream;
          this.videoEl.play();
          this.videoEl.style.display = 'block';
        }
        if (this.canvasEl) this.canvasEl.style.display = 'none';
        
        state.isCameraActive = true;
        this.updateCameraStatusBadge(true, 'CAMERA ACTIVE');
      } else {
        throw new Error('MediaDevices unavailable');
      }
    } catch (e) {
      console.log('Camera access denied or unavailable, activating atmospheric fallback chamber preview.');
      this.activateChamberFallback();
    }
  }

  activateChamberFallback() {
    state.isCameraActive = false;
    if (this.videoEl) this.videoEl.style.display = 'none';
    if (!this.canvasEl) return;
    
    this.canvasEl.style.display = 'block';
    const ctx = this.canvasEl.getContext('2d');
    this.canvasEl.width = 640;
    this.canvasEl.height = 360;
    
    // Draw atmospheric ritual chamber preview with desk, chair, candle, and monitor
    let frame = 0;
    clearInterval(this.canvasInterval);
    this.canvasInterval = setInterval(() => {
      frame++;
      // Dark room gradient
      const grad = ctx.createRadialGradient(280, 160, 20, 320, 180, 340);
      grad.addColorStop(0, '#1e110c');
      grad.addColorStop(0.5, '#0a0403');
      grad.addColorStop(1, '#020000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 360);
      
      // Desk & monitor glow
      ctx.fillStyle = '#060202';
      ctx.fillRect(180, 190, 280, 170); // Desk
      
      // Laptop monitor screen
      const screenGrad = ctx.createLinearGradient(240, 140, 360, 220);
      screenGrad.addColorStop(0, '#1a0d0a');
      screenGrad.addColorStop(1, '#0c0403');
      ctx.fillStyle = screenGrad;
      ctx.fillRect(230, 140, 160, 100);
      
      // Desk items: books, candle glow
      ctx.fillStyle = 'rgba(255, 120, 30, ' + (0.5 + Math.sin(frame * 0.1) * 0.15) + ')';
      ctx.beginPath();
      ctx.arc(430, 185, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Chair silhouette
      ctx.fillStyle = '#040101';
      ctx.beginPath();
      ctx.roundRect(140, 170, 90, 190, [30, 30, 0, 0]);
      ctx.fill();
    }, 60);

    this.updateCameraStatusBadge(true, 'DEMO CHAMBER');
  }

  updateCameraStatusBadge(active, label) {
    const dot = document.querySelector('.cam-indicator-dot');
    const txt = document.querySelector('.cam-status-label');
    const liveTxt = document.querySelector('.frame-live-badge span:last-child');
    if (dot) dot.style.backgroundColor = active ? '#38b000' : '#73130c';
    if (txt) txt.textContent = label;
    if (liveTxt) liveTxt.textContent = active ? 'LIVE' : 'OFFLINE';
  }

  // INSPECT action
  inspect() {
    audio.playRitualChime(1.4);
    audio.playSubRumble(1.0);
    
    // Shutter flash effect
    const frame = document.querySelector('.vision-camera-frame');
    if (frame) {
      frame.style.filter = 'brightness(2.0)';
      setTimeout(() => frame.style.filter = '', 180);
    }

    const primaryText = document.querySelector('.watcher-primary-text');
    const secondaryText = document.querySelector('.watcher-secondary-text');

    if (this.isSupernatural) {
      if (primaryText) primaryText.textContent = 'SOMETHING IS BEHIND YOU.';
      if (secondaryText) secondaryText.textContent = 'The shadows aren’t falling the right way. It found the anchor in this realm.';
      this.dialogue.speak({
        id: 'VIS_S1',
        emotion: 'grim, urgent',
        text: 'The shadows are twisting behind you. The Kandarian Demon is watching through your own lens!'
      });
    } else {
      if (primaryText) primaryText.textContent = 'Ah. Your room. Predictable. Same glowing screen, same unfinished work, same distractions.';
      if (secondaryText) secondaryText.textContent = 'You really haven’t changed, have you?';
      this.dialogue.speak({
        id: 'VIS_N1',
        emotion: 'amused, cynical',
        text: 'Ah. Your room. Predictable. Same glowing screen, same unfinished work. You really haven’t changed, have you?'
      });
    }
  }

  toggleWatcherMode() {
    state.isWatcherMode = !state.isWatcherMode;
    const pill = document.querySelector('.watcher-mode-pill');
    if (pill) pill.classList.toggle('active', state.isWatcherMode);
    
    clearInterval(this.watcherTimer);
    if (state.isWatcherMode) {
      audio.playWhisper(1.0);
      this.watcherTimer = setInterval(() => {
        if (state.screen === 'vision') {
          this.triggerWatcherRemark();
        }
      }, 16000);
    }
  }

  triggerWatcherRemark() {
    const remarks = [
      { p: 'The ambient light flickered.', s: 'Did you cause that, or did something pass through?' },
      { p: 'Cold air pooling near the door.', s: 'Incorporeal visitors leave such traces.' },
      { p: 'Your posture stiffens.', s: 'Fear is a very noisy frequency.' }
    ];
    const pick = remarks[Math.floor(Math.random() * remarks.length)];
    const primaryText = document.querySelector('.watcher-primary-text');
    const secondaryText = document.querySelector('.watcher-secondary-text');
    if (primaryText) primaryText.textContent = pick.p;
    if (secondaryText) secondaryText.textContent = pick.s;
    audio.playWhisper(0.8);
  }

  // SCREEN 5: SUPERNATURAL ANOMALY TRIGGER
  triggerSupernaturalAnomaly() {
    this.isSupernatural = true;
    state.visionMode = 'supernatural';
    
    // Apply anomaly styles
    const visionScreen = document.getElementById('screen-vision');
    if (visionScreen) visionScreen.classList.add('supernatural-anomaly');
    
    const liveTxt = document.querySelector('.frame-live-badge span:last-child');
    if (liveTxt) liveTxt.textContent = 'ANOMALY DETECTED';
    
    audio.playGlitch(1.8);
    audio.playSubRumble(3.0);
    
    const primaryText = document.querySelector('.watcher-primary-text');
    const secondaryText = document.querySelector('.watcher-secondary-text');
    if (primaryText) primaryText.textContent = 'SOMETHING IS BEHIND YOU.';
    if (secondaryText) secondaryText.textContent = 'The shadows aren’t falling the right way. It found the anchor in this realm.';

    // Show Demon Anchor Marker on frame!
    const anchor = document.getElementById('demon-anchor-marker');
    if (anchor) anchor.classList.add('visible');

    // Trigger the threat_event hook from script section 8!
    state.setFlag('threat_event_seen', true);
    state.setFlag('clue_found', Math.max(state.flags.clue_found, 1));
    
    // Speak Act 8 Turn lines
    this.dialogue.speak(DIALOGUE_SCRIPT.TN_01);
  }

  resetAnomaly() {
    this.isSupernatural = false;
    state.visionMode = 'normal';
    const visionScreen = document.getElementById('screen-vision');
    if (visionScreen) visionScreen.classList.remove('supernatural-anomaly');
    const liveTxt = document.querySelector('.frame-live-badge span:last-child');
    if (liveTxt) liveTxt.textContent = 'LIVE';
  }
}
