/* ==========================================================================
   RITUALS MANAGER — AWAKENING, REBINDING & SEALING STATE MACHINES
   ========================================================================== */

import { state } from './state.js';
import { audio } from './audio.js';
import { DIALOGUE_SCRIPT } from './dialogue.js';
import { renderSpellSymbols, renderDecoderGridHTML } from './dead-alphabet.js';
import { assetLoader } from './asset-loader.js';

export const RITUAL_FPS = 24.0;
export const SEALING_FPS = 30.0;

export const RITUAL_STAGES = [
  {
    phase: 0,
    phrase: 'DAMNORA',
    awaitingState: 'awaiting_damnora',
    playingState: 'playing_segment_1',
    startFrame: 43,
    stopFrame: 90,
    startTime: 43 / 24.0,   // 1.791667s
    stopTime: 90 / 24.0,    // 3.750000s
    inst: 'RECITE THE FIRST INCANTATION',
    hint: 'DAMNORA',
    rune: 'ᛞ ᚨ ᛗ ᚾ ᛟ ᚱ ᚨ'
  },
  {
    phase: 1,
    phrase: 'EXORIA',
    awaitingState: 'awaiting_exoria',
    playingState: 'playing_segment_2',
    startFrame: 90,
    stopFrame: 123,
    startTime: 90 / 24.0,   // 3.750000s
    stopTime: 123 / 24.0,   // 5.125000s
    inst: 'SPEAK THE WORDS OF RECOGNITION',
    hint: 'EXORIA',
    rune: 'ᛖ ᛪ ᛟ ᚱ ᛁ ᚨ'
  },
  {
    phase: 2,
    phrase: 'SURGE',
    awaitingState: 'awaiting_surge',
    playingState: 'playing_segment_3',
    startFrame: 123,
    stopFrame: 156,
    startTime: 123 / 24.0,  // 5.125000s
    stopTime: 156 / 24.0,   // 6.500000s
    inst: 'ESTABLISH THE BINDING',
    hint: 'SURGE',
    rune: 'ᛋ ᚢ ᚱ ᚷ ᛖ'
  },
  {
    phase: 3,
    phrase: 'NOCTARA',
    awaitingState: 'awaiting_noctara',
    playingState: 'playing_segment_4',
    startFrame: 156,
    stopFrame: 192,
    startTime: 156 / 24.0,  // 6.500000s
    stopTime: 192 / 24.0,   // 8.000000s
    inst: 'COMPLETE THE AWAKENING',
    hint: 'NOCTARA',
    rune: 'ᚾ ᛟ ᚲ ᛏ ᚨ ᚱ ᚨ'
  }
];

export class RitualManager {
  constructor(dialogueEngine) {
    this.dialogue = dialogueEngine;
    this.video = null;
    this.inputEl = null;
    this.submitBtn = null;
    this.feedbackEl = null;
    this.instructionEl = null;
    this.chipsContainer = null;
    this.bgEl = null;
    this.errorTimeout = null;
    this.isSegmentPlaying = false;
    this.rebindIntroPlayed = false;
    this.isRebindingProcessing = false;
    this.rebindSparksAnimId = null;
    this.isRebindListening = false;
    this.rebindRecognition = null;
    this.rebindStage = 0;
    this.currentRebindFrame = 1;
    this.rebindFrameCache = assetLoader.rebindFrameCache;
    this.rebindPendingLoads = assetLoader.inFlightLoads;
    this.rebindFailedFrames = assetLoader.failedAssets;
    this.lastDrawnRebindFrame = null;
    this.rebindAnimRafId = null;
    this.isRebindingProcessing = false;

    this.sealingStage = 0;
    this.currentSealingFrame = 1;
    this.sealingFrameCache = assetLoader.sealingFrameCache;
    this.sealingPendingLoads = assetLoader.inFlightLoads;
    this.sealingFailedFrames = assetLoader.failedAssets;
    this.lastDrawnSealingFrame = null;
    this.sealingAnimRafId = null;
    this.isSealingProcessing = false;

    // Eagerly preload Frame 1 for both rituals in the background after page load
    setTimeout(() => {
      this.loadRebindFrame(1).catch(() => {});
      this.loadSealingFrame(1).catch(() => {});
    }, 1200);
  }

  // ------------------------------------------------------------------------
  // 1. AWAKENING RITUAL (4 PHASES & PRECISE FRAME-BASED SEGMENT PLAYBACK)
  // ------------------------------------------------------------------------
  initAwakening() {
    this.video = document.getElementById('awakening-ritual-video');
    this.inputEl = document.getElementById('awakening-input');
    this.submitBtn = document.getElementById('awakening-submit-btn');
    this.feedbackEl = document.getElementById('awakening-feedback');
    this.instructionEl = document.getElementById('awakening-instruction');
    this.chipsContainer = document.getElementById('awakening-chips');
    this.bgEl = document.getElementById('awakening-bg');

    // Populate Dead Alphabet Decoder grid (26 letters with Latin character & occult glyph)
    const decoderGrid = document.getElementById('decoder-grid');
    if (decoderGrid && !decoderGrid.hasChildNodes()) {
      decoderGrid.innerHTML = renderDecoderGridHTML();
    }

    // Initial state: awaiting_damnora unless already progressed
    if (!state.awakeningState || state.awakeningState === 'awaiting_damnora') {
      state.awakeningPhase = 0;
      state.setAwakeningState('awaiting_damnora');
    }

    // Eagerly preload the initial background image so the scene is ready
    // before the screen becomes visible (prevents blank/black screen on entry)
    const bg = document.getElementById('awakening-bg');
    if (bg) {
      const initialBgUrl = 'assets/main%20ui/awakning%20ritual/0%25.png';
      const unencodedBgUrl = 'assets/main ui/awakning ritual/0%.png';
      const preloadImg = new Image();
      preloadImg.onload = () => {
        // Only set if still at phase 0 to avoid overwriting a later phase
        if (state.awakeningPhase === 0) {
          bg.style.backgroundImage = `url('${initialBgUrl}')`;
          bg.style.backgroundSize = 'cover';
          bg.style.backgroundPosition = 'center center';
          bg.style.backgroundRepeat = 'no-repeat';
        }
      };
      preloadImg.onerror = (err) => {
        console.error('Failed to load Awakening background image at ' + initialBgUrl, err);
        // Fallback to unencoded path if web server prefers unencoded spaces
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          if (state.awakeningPhase === 0) {
            bg.style.backgroundImage = `url('${unencodedBgUrl}')`;
          }
        };
        fallbackImg.onerror = (fallbackErr) => {
          console.error('Failed to load fallback Awakening background image at ' + unencodedBgUrl, fallbackErr);
        };
        fallbackImg.src = unencodedBgUrl;
      };
      preloadImg.src = initialBgUrl;

      // Also set immediately (image may already be cached from <link rel="preload">)
      if (state.awakeningPhase === 0) {
        bg.style.backgroundImage = `url('${initialBgUrl}')`;
        bg.style.backgroundSize = 'cover';
        bg.style.backgroundPosition = 'center center';
        bg.style.backgroundRepeat = 'no-repeat';
      }
    }

    if (this.video) {
      this.video.muted = true;
      this.video.playsInline = true;
      
      const prepareInitialFrame = () => {
        // Pre-position persistent video element at frame 43 (paused) for first segment
        if (state.awakeningPhase === 0 && state.awakeningState === 'awaiting_damnora') {
          const initialTime = RITUAL_STAGES[0].startTime;
          if (Math.abs(this.video.currentTime - initialTime) > 0.05) {
            this.video.currentTime = initialTime;
          }
          // The background image (0%.png) is shown initially; video starts playing when the first spell is submitted
          this.video.classList.remove('active-playback');
        }
      };

      this.video.onerror = (err) => {
        console.error('Failed to load Awakening ritual video asset:', this.video.currentSrc || this.video.src, err);
      };

      if (this.video.readyState >= 1) {
        prepareInitialFrame();
      } else {
        this.video.addEventListener('loadedmetadata', prepareInitialFrame, { once: true });
        this.video.addEventListener('canplay', prepareInitialFrame, { once: true });
        this.video.load();
      }
    }

    this.updateAwakeningUI();
  }

  submitAwakeningIncantation(text) {
    const currentState = state.awakeningState;
    const currentPhase = state.awakeningPhase;
    const currentStage = RITUAL_STAGES[currentPhase];

    // Prevent submission if already complete or transitioning
    if (!currentStage) {
      console.warn('Ritual is already complete or stage invalid');
      return;
    }

    // State machine check: Only accept phrase when the corresponding awaiting state is active
    if (currentState !== currentStage.awaitingState || this.isSegmentPlaying) {
      console.warn(`Submission rejected: state is ${currentState}, awaiting is ${currentStage.awaitingState}`);
      return;
    }

    // Validate phrase: case-insensitive, ignore leading and trailing whitespace
    const cleanInput = (text || '').trim().toUpperCase();

    if (cleanInput !== currentStage.phrase) {
      // An incorrect phrase must not advance the ritual or play the next video segment.
      this.showAwakeningError('The incantation wavers into silence. Utter the sacred word.');
      audio.playGlitch(0.3);
      return;
    }

    // Valid phrase! Enter playing state
    state.setAwakeningState(currentStage.playingState);

    // Disable input submission and prevent duplicate submissions
    this.setInputDisabled(true);

    // Audio chime feedback
    audio.playRitualChime(1.0 + currentPhase * 0.25);
    audio.playSubRumble(1.2);

    // Clear any previous error feedback
    this.clearAwakeningError();

    // Play video segment from current frame to target frame
    this.playSegment(currentPhase, () => {
      this.onSegmentFinished(currentPhase);
    });
  }

  playSegment(stageIndex, onComplete) {
    const stage = RITUAL_STAGES[stageIndex];
    if (!stage) {
      if (onComplete) onComplete();
      return;
    }

    const video = this.video || document.getElementById('awakening-ritual-video');
    if (!video) {
      console.warn('Awakening ritual video element not found, using timeout fallback');
      const fallbackDuration = (stage.stopTime - stage.startTime) * 1000;
      setTimeout(() => {
        if (onComplete) onComplete();
      }, Math.max(800, fallbackDuration));
      return;
    }

    this.isSegmentPlaying = true;
    video.classList.add('active-playback');

    let isSegmentActive = true;
    let rvfcId = null;
    let rafId = null;
    let fallbackTimeout = null;

    const stopPlayback = () => {
      if (!isSegmentActive) return;
      isSegmentActive = false;
      this.isSegmentPlaying = false;

      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
        fallbackTimeout = null;
      }
      if (rvfcId !== null && 'cancelVideoFrameCallback' in video) {
        video.cancelVideoFrameCallback(rvfcId);
        rvfcId = null;
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      video.removeEventListener('timeupdate', checkBoundary);
      video.removeEventListener('ended', stopPlayback);

      video.pause();

      // Pause automatically at each boundary and preserve the current frame
      // Frame numbers are inclusive start points and exclusive end points,
      // meaning playback stops immediately before the specified ending frame.
      const targetBoundary = stage.stopTime;
      const halfFrame = 0.5 / RITUAL_FPS;
      video.currentTime = Math.max(0, targetBoundary - halfFrame);

      if (onComplete) {
        onComplete();
      }
    };

    // Frame-aware boundary threshold check
    const checkBoundary = () => {
      if (!isSegmentActive) return;
      const threshold = stage.stopTime - (0.5 / RITUAL_FPS);
      if (video.currentTime >= threshold) {
        stopPlayback();
      }
    };

    // 1. Primary frame presentation monitor via requestVideoFrameCallback
    const onFramePresented = (now, metadata) => {
      if (!isSegmentActive) return;
      const mediaTime = typeof metadata?.mediaTime === 'number' ? metadata.mediaTime : video.currentTime;
      const threshold = stage.stopTime - (0.5 / RITUAL_FPS);
      if (mediaTime >= threshold) {
        stopPlayback();
        return;
      }
      if ('requestVideoFrameCallback' in video) {
        rvfcId = video.requestVideoFrameCallback(onFramePresented);
      }
    };

    // 2. High-frequency requestAnimationFrame concurrent monitor
    const rafTick = () => {
      if (!isSegmentActive) return;
      checkBoundary();
      if (isSegmentActive) {
        rafId = requestAnimationFrame(rafTick);
      }
    };

    const startPlayback = () => {
      if (!isSegmentActive) return;

      if ('requestVideoFrameCallback' in video) {
        rvfcId = video.requestVideoFrameCallback(onFramePresented);
      }
      rafId = requestAnimationFrame(rafTick);
      video.addEventListener('timeupdate', checkBoundary);
      video.addEventListener('ended', stopPlayback, { once: true });

      // Safety fallback timer so ritual never deadlocks if browser stalls
      const segmentDuration = stage.stopTime - stage.startTime;
      const maxSegmentDurationMs = (segmentDuration + 1.2) * 1000;
      fallbackTimeout = setTimeout(() => {
        if (isSegmentActive) {
          console.warn('Segment timeout safety boundary triggered');
          stopPlayback();
        }
      }, Math.max(1200, maxSegmentDurationMs));

      // Initiate playback
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Video playback restricted or interrupted, proceeding with timed progression:', err);
          const durationMs = (stage.stopTime - stage.startTime) * 1000;
          setTimeout(() => {
            stopPlayback();
          }, Math.max(600, durationMs));
        });
      }
    };

    const prepareAndStart = () => {
      // Seek to stage start position if needed
      if (stageIndex === 0 || Math.abs(video.currentTime - stage.startTime) > 0.15) {
        video.currentTime = stage.startTime;
        if (video.seeking) {
          video.addEventListener('seeked', () => startPlayback(), { once: true });
          // Safety timeout in case seeked doesn't fire
          setTimeout(() => {
            if (isSegmentActive && video.paused) startPlayback();
          }, 300);
        } else {
          startPlayback();
        }
      } else {
        startPlayback();
      }
    };

    if (video.readyState < 1) {
      video.addEventListener('loadedmetadata', () => prepareAndStart(), { once: true });
      video.load();
    } else {
      prepareAndStart();
    }
  }

  onSegmentFinished(phaseIndex) {
    if (phaseIndex < 3) {
      // Advance to next stage (Stages 1–3 completed)
      const nextPhase = phaseIndex + 1;
      state.awakeningPhase = nextPhase;
      const nextStage = RITUAL_STAGES[nextPhase];

      state.setAwakeningState(nextStage.awaitingState);

      this.updateAwakeningUI();
      this.setInputDisabled(false);

      if (this.inputEl) {
        this.inputEl.value = '';
        this.inputEl.focus();
      }
    } else {
      // Stage 4 (NOCTARA) completed at frame 192 -> Final transition sequence
      this.triggerFinalAwakenedTransition();
    }
  }

  triggerFinalAwakenedTransition() {
    // 1. Pause the video at the final frame (already paused at frame 192)
    if (this.video) {
      this.video.pause();
    }

    // State machine: transitioning_to_black
    state.setAwakeningState('transitioning_to_black');
    state.setLifecycle('transition');

    // 2. Fade to pure black
    const curtain = document.getElementById('opening-black-curtain');
    if (curtain) {
      curtain.classList.remove('fade-to-awakening');
      curtain.classList.add('active', 'fade-to-black');
    }

    const FADE_TO_BLACK_MS = 350; // 300–400 ms fade
    const BLACK_HOLD_MS = 800;    // 700–900 ms hold
    const FADE_TO_AWAKENED_MS = 600;

    // 3. Hold the black screen for approximately 700–900 ms
    setTimeout(() => {
      // 4. Transition into the existing main Awakened interface
      state.setAwakeningState('entering_awakened_interface');
      state.setFlag('awakened', true);
      state.setScreen('awakened');

      // Audio: Sub rumble & ambient drone
      audio.playSubRumble(2.5);
      audio.startAmbientDrone();

      // Smooth reveal from pure black
      if (curtain) {
        curtain.classList.remove('fade-to-black');
        curtain.classList.add('fade-to-awakening');
      }

      // 5. Reveal the awakened navigation and Converse interface only after transition completes
      setTimeout(() => {
        if (curtain) {
          curtain.classList.remove('active', 'fade-to-awakening');
        }

        // Fully enter awakened lifecycle and state
        state.setLifecycle('awakened');
        state.setAwakeningState('awakened');

        // Book speaks Awakening opening line
        setTimeout(() => {
          this.dialogue.speak(DIALOGUE_SCRIPT.AW_01);
        }, 1000);
      }, FADE_TO_AWAKENED_MS);

    }, FADE_TO_BLACK_MS + BLACK_HOLD_MS);
  }

  setInputDisabled(disabled) {
    if (this.inputEl) {
      this.inputEl.disabled = disabled;
      if (disabled) {
        this.inputEl.setAttribute('aria-disabled', 'true');
      } else {
        this.inputEl.removeAttribute('aria-disabled');
      }
    }
    if (this.submitBtn) {
      this.submitBtn.disabled = disabled;
      if (disabled) {
        this.submitBtn.setAttribute('aria-disabled', 'true');
      } else {
        this.submitBtn.removeAttribute('aria-disabled');
      }
    }
  }

  updateAwakeningUI() {
    const phase = state.awakeningPhase;
    const bg = document.getElementById('awakening-bg');
    if (bg) {
      const pcts = ['0%', '25%', '50%', '75%', '100%'];
      const pct = pcts[phase] || '0%';
      const encodedPct = pct.replace('%', '%25');
      const bgUrl = `assets/main%20ui/awakning%20ritual/${encodedPct}.png`;
      bg.style.backgroundImage = `url('${bgUrl}')`;
      bg.style.backgroundSize = 'cover';
      bg.style.backgroundPosition = 'center center';
      bg.style.backgroundRepeat = 'no-repeat';

      const verifyImg = new Image();
      verifyImg.onerror = () => {
        console.error(`Failed to load Awakening background for phase ${phase} (${pct}) at: ${bgUrl}`);
        const fallbackUrl = `assets/main ui/awakning ritual/${pct}.png`;
        bg.style.backgroundImage = `url('${fallbackUrl}')`;
      };
      verifyImg.src = bgUrl;
    }

    const rows = document.querySelectorAll('.ritual-phase-row');
    rows.forEach((row, i) => {
      row.classList.remove('active', 'completed');
      if (i < phase) {
        row.classList.add('completed');
      } else if (i === phase) {
        row.classList.add('active');
      }
    });

    const instructionEl = document.getElementById('awakening-instruction');
    const inputEl = document.getElementById('awakening-input');
    const chipsContainer = document.getElementById('awakening-chips');
    const symbolDisplay = document.getElementById('awakening-symbol-display');

    if (phase < RITUAL_STAGES.length) {
      const stage = RITUAL_STAGES[phase];
      if (instructionEl) instructionEl.textContent = stage.inst;
      if (symbolDisplay) {
        symbolDisplay.innerHTML = renderSpellSymbols(stage.phrase);
      }
      if (inputEl) {
        inputEl.placeholder = 'Type deciphered incantation…';
      }
      if (chipsContainer) {
        chipsContainer.innerHTML = '';
      }
    }
  }

  showAwakeningError(msg) {
    const feedback = document.getElementById('awakening-feedback');
    if (feedback) {
      feedback.textContent = msg;
      feedback.classList.add('visible');
      if (this.errorTimeout) clearTimeout(this.errorTimeout);
      this.errorTimeout = setTimeout(() => {
        feedback.classList.remove('visible');
      }, 3500);
    }
  }

  clearAwakeningError() {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = null;
    }
    const feedback = document.getElementById('awakening-feedback');
    if (feedback) {
      feedback.classList.remove('visible');
      feedback.textContent = '';
    }
  }

  // ------------------------------------------------------------------------
  // 2. REBINDING RITUAL (FRAME-BASED ANIMATION & 3-SPELL PROGRESSION)
  // ------------------------------------------------------------------------
  getRebindFrameUrl(num) {
    return assetLoader.getRebindFrameUrl(num);
  }

  async loadRebindFrame(num) {
    return assetLoader.loadRebindFrame(num);
  }

  drawRebindFrame(frameNum) {
    if (this.lastDrawnRebindFrame === frameNum) return;
    const canvas = document.getElementById('rebind-anim-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = this.rebindFrameCache.get(frameNum);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      this.lastDrawnRebindFrame = frameNum;
    }
  }

  async preloadRebindRange(start, end) {
    return assetLoader.preloadFrameRange('rebind', start, end);
  }

  async playRebindSequence(startFrame, endFrame, onComplete) {
    if (this.rebindAnimRafId) {
      cancelAnimationFrame(this.rebindAnimRafId);
      this.rebindAnimRafId = null;
    }

    this.isRebindingProcessing = true;

    // Check if initial frames of segment are ready
    const loader = document.getElementById('rebind-segment-loader');
    const loaderText = document.getElementById('rebind-loader-text');
    const neededInitial = [startFrame];
    if (startFrame + 1 <= endFrame) neededInitial.push(startFrame + 1);
    if (startFrame + 2 <= endFrame) neededInitial.push(startFrame + 2);

    const missingInitial = neededInitial.filter(f => !this.rebindFrameCache.has(f));
    if (missingInitial.length > 0) {
      if (loader) {
        if (loaderText) loaderText.textContent = 'CONVERGING SEALS…';
        loader.classList.add('active');
      }
      await Promise.all(missingInitial.map(f => this.loadRebindFrame(f)));
      if (loader) {
        loader.classList.remove('active');
      }
    }

    if (state.screen !== 'rebind') {
      this.isRebindingProcessing = false;
      return;
    }

    let current = startFrame;
    this.currentRebindFrame = current;
    this.drawRebindFrame(current);

    // Queue active segment frames in sequential order with top priority
    this.preloadRebindRange(startFrame, endFrame);

    const frameDuration = 1000 / RITUAL_FPS;
    let lastFrameTime = performance.now();

    const step = (now) => {
      if (state.screen !== 'rebind') {
        this.rebindAnimRafId = null;
        this.isRebindingProcessing = false;
        return;
      }

      if (current >= endFrame) {
        this.currentRebindFrame = endFrame;
        this.drawRebindFrame(endFrame);
        this.rebindAnimRafId = null;
        if (onComplete) onComplete();
        return;
      }

      // Proactively preload next segment when halfway through current segment
      if (current === Math.floor(startFrame + (endFrame - startFrame) * 0.5)) {
        if (endFrame === 43) this.preloadRebindRange(43, 108);
        else if (endFrame === 108) this.preloadRebindRange(108, 192);
      }

      const elapsed = now - lastFrameTime;
      if (elapsed >= frameDuration) {
        const nextFrame = current + 1;
        const nextImg = this.rebindFrameCache.get(nextFrame);
        const isFailed = assetLoader.failedAssets.has(this.getRebindFrameUrl(nextFrame));

        if (nextImg && nextImg.complete && nextImg.naturalWidth > 0) {
          current = nextFrame;
          this.currentRebindFrame = current;
          this.drawRebindFrame(current);
          lastFrameTime = now - (elapsed % frameDuration);

          // Free past frames to conserve memory
          assetLoader.prunePastFrames('rebind', startFrame, current);
        } else if (isFailed) {
          console.error(`Skipping failed rebind frame ${nextFrame} to prevent ritual deadlock`);
          current = nextFrame;
          lastFrameTime = now - (elapsed % frameDuration);
        } else {
          // Frame not yet ready, hold current frame without resetting lastFrameTime to prevent artificial double-waiting
        }
      }

      this.rebindAnimRafId = requestAnimationFrame(step);
    };

    this.rebindAnimRafId = requestAnimationFrame(step);
  }

  stopRebindAnimation() {
    if (this.rebindAnimRafId) {
      cancelAnimationFrame(this.rebindAnimRafId);
      this.rebindAnimRafId = null;
    }
    this.stopRebindSparks();
    this.isRebindingProcessing = false;
    this.lastDrawnRebindFrame = null;
  }

  cleanupRebind() {
    this.stopRebindAnimation();
    if (this.rebindRecognition && this.isRebindListening) {
      try { this.rebindRecognition.stop(); } catch (e) {}
      this.isRebindListening = false;
    }
    const mic = document.getElementById('rebind-mic');
    if (mic) mic.classList.remove('listening');
    assetLoader.clearRitualCache('rebind');
    this.lastDrawnRebindFrame = null;
    this.rebindIntroPlayed = false;
    this.rebindStage = 0;
  }

  async initRebind() {
    this.stopRebindAnimation();

    // Interrupt any background chatter / main screen speech
    if (window.NecronomiconModel && window.NecronomiconModel.interruptSpeech) {
      window.NecronomiconModel.interruptSpeech();
    }
    if (this.dialogue && this.dialogue.interruptSpeech) {
      this.dialogue.interruptSpeech();
    }

    const input = document.getElementById('rebind-input');
    const feedback = document.getElementById('rebind-feedback');
    const voice = document.getElementById('rebind-voice');
    const symbolDisplay = document.getElementById('rebind-symbol-display');

    this.rebindStage = 0;
    this.currentRebindFrame = 1;
    this.lastDrawnRebindFrame = null;
    this.isRebindingProcessing = false;

    if (symbolDisplay) {
      symbolDisplay.innerHTML = renderSpellSymbols('REVORA');
    }
    if (input) {
      input.value = '';
      input.disabled = false;
      input.placeholder = 'Type deciphered incantation…';
      setTimeout(() => input.focus(), 50);
    }
    if (feedback) {
      feedback.textContent = '';
      feedback.classList.remove('visible', 'error', 'success');
    }
    if (voice) {
      voice.textContent = '';
      voice.classList.remove('visible');
    }

    // Play ritual ambience and start canvas sparks
    audio.playSubRumble(2.0);
    audio.playRitualChime(0.6);
    this.startRebindSparks();

    // Load and display Frame 1 immediately
    const f1 = await this.loadRebindFrame(1);
    if (f1 && state.screen === 'rebind' && this.rebindStage === 0 && !this.isRebindingProcessing) {
      this.drawRebindFrame(1);
    }

    // Preload stage 1 frames (2 through 43) progressively in background
    this.preloadRebindRange(2, 43);

    // Play introductory character line once per entry
    if (!this.rebindIntroPlayed) {
      this.rebindIntroPlayed = true;
      this.speakRebindLine('RB1_01');
    }
  }

  async speakRebindLine(id) {
    if (window.NecronomiconModel && window.NecronomiconModel.speak) {
      await window.NecronomiconModel.speak(id);
    } else if (this.dialogue) {
      const script = DIALOGUE_SCRIPT[id] || { id, text: id };
      await this.dialogue.speak(script);
    }
  }

  async submitRebind(text) {
    if (this.isRebindingProcessing) return;
    const t = (text || '').trim().toLowerCase();
    if (!t) return;

    const input = document.getElementById('rebind-input');
    const feedback = document.getElementById('rebind-feedback');
    const form = document.getElementById('rebind-form');
    const screen = document.getElementById('screen-rebind');
    const symbolDisplay = document.getElementById('rebind-symbol-display');

    // Expected sequence:
    // Stage 0: REVORA   -> Frames 1 to 43
    // Stage 1: REDIYUS  -> Frames 43 to 108
    // Stage 2: REVENANT -> Frames 108 to 192
    const SPELLS = ['revora', 'rediyus', 'revenant'];
    const expected = SPELLS[this.rebindStage] || 'revora';

    if (t !== expected) {
      // INCORRECT SPELL
      audio.playGlitch(0.5);

      if (form) {
        form.classList.remove('rebind-shake');
        void form.offsetWidth; // force reflow
        form.classList.add('rebind-shake');
        setTimeout(() => form.classList.remove('rebind-shake'), 600);
      }

      if (feedback) {
        feedback.textContent = 'THE INCANTATION FALTERS. The entity resists!';
        feedback.classList.remove('success');
        feedback.classList.add('visible', 'error');
      }

      // In-character failure line
      this.speakRebindLine('RB1_04');

      if (input) {
        input.disabled = false;
        input.select();
      }
      return;
    }

    // CORRECT SPELL FOR CURRENT STAGE
    this.isRebindingProcessing = true;
    if (input) input.disabled = true;

    audio.playChainLock();
    audio.playRitualChime(1.0);

    if (this.rebindStage === 0) {
      // 1. REVORA: Frames 1 - 43
      if (feedback) {
        feedback.textContent = 'FIRST SEAL ENGAGING…';
        feedback.classList.remove('error');
        feedback.classList.add('visible');
      }

      this.playRebindSequence(1, 43, () => {
        this.rebindStage = 1;
        this.isRebindingProcessing = false;
        if (symbolDisplay) {
          symbolDisplay.innerHTML = renderSpellSymbols('REDIYUS');
        }
        if (feedback) {
          feedback.textContent = 'FIRST SEAL ENGAGED. RECITE THE SECOND INCANTATION.';
          feedback.classList.add('visible');
        }
        if (input) {
          input.value = '';
          input.placeholder = 'Type deciphered incantation…';
          input.disabled = false;
          input.focus();
        }
        // Preload next segment while user reads glyphs and types REDIYUS
        this.preloadRebindRange(44, 108);
      });

    } else if (this.rebindStage === 1) {
      // 2. REDIYUS: Frames 43 - 108
      if (feedback) {
        feedback.textContent = 'SECOND SEAL ENGAGING…';
        feedback.classList.remove('error');
        feedback.classList.add('visible');
      }

      this.playRebindSequence(43, 108, () => {
        this.rebindStage = 2;
        this.isRebindingProcessing = false;
        if (symbolDisplay) {
          symbolDisplay.innerHTML = renderSpellSymbols('REVENANT');
        }
        if (feedback) {
          feedback.textContent = 'SECOND SEAL ENGAGED. RECITE THE FINAL INCANTATION.';
          feedback.classList.add('visible');
        }
        if (input) {
          input.value = '';
          input.placeholder = 'Type deciphered incantation…';
          input.disabled = false;
          input.focus();
        }
        // Preload final segment while user reads glyphs and types REVENANT
        this.preloadRebindRange(109, 192);
      });

    } else if (this.rebindStage === 2) {
      // 3. REVENANT: Frames 108 - 192
      if (feedback) {
        feedback.textContent = 'FINAL SEAL ENGAGING…';
        feedback.classList.remove('error');
        feedback.classList.add('visible');
      }

      audio.playSubRumble(2.5);

      this.playRebindSequence(108, 192, async () => {
        // Complete Rebinding Ritual on frame 192
        if (screen) {
          screen.classList.remove('rebind-success-flare');
          void screen.offsetWidth;
          screen.classList.add('rebind-success-flare');
        }

        if (feedback) {
          feedback.textContent = 'THE CHAINS TAKE HOLD. THE BINDING IS RESTORED.';
          feedback.classList.remove('error');
          feedback.classList.add('visible', 'success');
        }

        state.flags.rebound_done = true;
        state.rebindPhase = 3;

        // Restore stable state
        state.resetInstability();
        if (window.NecronomiconModel) {
          if (window.NecronomiconModel.F) {
            window.NecronomiconModel.F.ins = 0;
            window.NecronomiconModel.F.st = 'refusal';
          }
          if (window.NecronomiconModel.Entity) {
            window.NecronomiconModel.Entity.soothe(1);
          }
        }

        // In-character reaction line: RB1_05 ("YOU INSOLENT LITTLE—")
        await this.speakRebindLine('RB1_05');

        setTimeout(() => {
          this.stopRebindSparks();
          this.stopRebindAnimation();
          this.rebindIntroPlayed = false;
          this.rebindStage = 0;
          this.isRebindingProcessing = false;
          if (screen) screen.classList.remove('rebind-success-flare');

          // Return to main talking UI
          state.setScreen('awakened');
          state.setActiveNav('converse');

          setTimeout(() => {
            this.speakRebindLine('RB1_06');
          }, 700);
        }, 1600);
      });
    }
  }

  setupRebindVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const micBtn = document.getElementById('rebind-mic');
    const input = document.getElementById('rebind-input');

    if (!SpeechRecognition) {
      const feedback = document.getElementById('rebind-feedback');
      if (feedback) {
        feedback.textContent = 'Voice input unavailable. Please type the incantation.';
        feedback.classList.add('visible');
        setTimeout(() => feedback.classList.remove('visible'), 3500);
      }
      if (input) input.focus();
      return;
    }

    if (this.rebindRecognition && this.isRebindListening) {
      this.rebindRecognition.stop();
      this.isRebindListening = false;
      if (micBtn) micBtn.classList.remove('live');
      return;
    }

    try {
      const r = new SpeechRecognition();
      this.rebindRecognition = r;
      r.continuous = false;
      r.interimResults = false;
      r.lang = 'en-US';

      r.onstart = () => {
        this.isRebindListening = true;
        if (micBtn) micBtn.classList.add('live');
      };

      r.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        if (input) input.value = transcript;
        this.isRebindListening = false;
        if (micBtn) micBtn.classList.remove('live');
        this.submitRebind(transcript);
      };

      r.onerror = (e) => {
        this.isRebindListening = false;
        if (micBtn) micBtn.classList.remove('live');
        console.warn('Rebind voice recognition error:', e.error);
        if (input) input.focus();
      };

      r.onend = () => {
        this.isRebindListening = false;
        if (micBtn) micBtn.classList.remove('live');
      };

      r.start();
    } catch (err) {
      this.isRebindListening = false;
      if (micBtn) micBtn.classList.remove('live');
      console.warn('Rebind voice start failed:', err);
      if (input) input.focus();
    }
  }

  startRebindSparks() {
    const canvas = document.getElementById('rebind-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.rebindSparksAnimId) {
      cancelAnimationFrame(this.rebindSparksAnimId);
      this.rebindSparksAnimId = null;
    }

    const resize = () => {
      canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
      canvas.height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
    };
    resize();

    const particles = [];
    const count = 40;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: canvas.width * 0.5 + (Math.random() - 0.5) * canvas.width * 0.5,
        y: canvas.height * 0.5 + (Math.random() - 0.5) * canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 0.7,
        vy: -0.5 - Math.random() * 1.3,
        size: 1.2 + Math.random() * 2.2,
        alpha: 0.2 + Math.random() * 0.7,
        hue: Math.random() > 0.4 ? 12 + Math.random() * 24 : 355 + Math.random() * 10
      });
    }

    const render = () => {
      if (state.screen !== 'rebind') {
        this.rebindSparksAnimId = null;
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'screen';

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.003;
        if (p.alpha <= 0 || p.y < 0) {
          p.x = canvas.width * 0.5 + (Math.random() - 0.5) * canvas.width * 0.45;
          p.y = canvas.height * 0.55 + Math.random() * (canvas.height * 0.25);
          p.vx = (Math.random() - 0.5) * 0.7;
          p.vy = -0.5 - Math.random() * 1.3;
          p.alpha = 0.4 + Math.random() * 0.6;
        }

        ctx.fillStyle = `hsla(${p.hue}, 95%, 55%, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      this.rebindSparksAnimId = requestAnimationFrame(render);
    };

    this.rebindSparksAnimId = requestAnimationFrame(render);
  }

  stopRebindSparks() {
    if (this.rebindSparksAnimId) {
      cancelAnimationFrame(this.rebindSparksAnimId);
      this.rebindSparksAnimId = null;
    }
    const canvas = document.getElementById('rebind-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  // ------------------------------------------------------------------------
  // 3. SEALING RITUAL (FRAME-BASED ANIMATION & 4-SPELL PROGRESSION)
  // ------------------------------------------------------------------------
  getSealingFrameUrl(num) {
    return assetLoader.getSealingFrameUrl(num);
  }

  async loadSealingFrame(num) {
    return assetLoader.loadSealingFrame(num);
  }

  drawSealingFrame(frameNum) {
    if (this.lastDrawnSealingFrame === frameNum) return;
    const canvas = document.getElementById('sealing-anim-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = this.sealingFrameCache.get(frameNum);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      this.lastDrawnSealingFrame = frameNum;
    }
  }

  async preloadSealingRange(start, end) {
    return assetLoader.preloadFrameRange('sealing', start, end);
  }

  async playSealingSequence(startFrame, endFrame, onComplete) {
    if (this.sealingAnimRafId) {
      cancelAnimationFrame(this.sealingAnimRafId);
      this.sealingAnimRafId = null;
    }

    this.isSealingProcessing = true;

    // Check if initial frames of segment are ready
    const loader = document.getElementById('sealing-segment-loader');
    const loaderText = document.getElementById('sealing-loader-text');
    const neededInitial = [startFrame];
    if (startFrame + 1 <= endFrame) neededInitial.push(startFrame + 1);
    if (startFrame + 2 <= endFrame) neededInitial.push(startFrame + 2);

    const missingInitial = neededInitial.filter(f => !this.sealingFrameCache.has(f));
    if (missingInitial.length > 0) {
      if (loader) {
        if (loaderText) loaderText.textContent = 'MANIFESTING SIGIL…';
        loader.classList.add('active');
      }
      await Promise.all(missingInitial.map(f => this.loadSealingFrame(f)));
      if (loader) {
        loader.classList.remove('active');
      }
    }

    if (state.screen !== 'sealing') {
      this.isSealingProcessing = false;
      return;
    }

    let current = startFrame;
    this.currentSealingFrame = current;
    this.drawSealingFrame(current);

    // Queue active segment frames in sequential order with top priority
    this.preloadSealingRange(startFrame, endFrame);

    const frameDuration = 1000 / SEALING_FPS;
    let lastFrameTime = performance.now();

    const step = (now) => {
      if (state.screen !== 'sealing') {
        this.sealingAnimRafId = null;
        this.isSealingProcessing = false;
        return;
      }

      if (current >= endFrame) {
        this.currentSealingFrame = endFrame;
        this.drawSealingFrame(endFrame);
        this.sealingAnimRafId = null;
        if (onComplete) onComplete();
        return;
      }

      // Proactively preload next segment when halfway through current segment
      if (current === Math.floor(startFrame + (endFrame - startFrame) * 0.5)) {
        if (endFrame === 55) this.preloadSealingRange(55, 113);
        else if (endFrame === 113) this.preloadSealingRange(113, 133);
        else if (endFrame === 133) this.preloadSealingRange(133, 192);
      }

      const elapsed = now - lastFrameTime;
      if (elapsed >= frameDuration) {
        const nextFrame = current + 1;
        const nextImg = this.sealingFrameCache.get(nextFrame);
        const isFailed = assetLoader.failedAssets.has(this.getSealingFrameUrl(nextFrame));

        if (nextImg && nextImg.complete && nextImg.naturalWidth > 0) {
          current = nextFrame;
          this.currentSealingFrame = current;
          this.drawSealingFrame(current);
          lastFrameTime = now - (elapsed % frameDuration);

          // Free past frames to conserve memory
          assetLoader.prunePastFrames('sealing', startFrame, current);
        } else if (isFailed) {
          console.error(`Skipping failed sealing frame ${nextFrame} to prevent ritual deadlock`);
          current = nextFrame;
          lastFrameTime = now - (elapsed % frameDuration);
        } else {
          // Frame not yet ready, hold current frame without resetting lastFrameTime to prevent artificial double-waiting
        }
      }

      this.sealingAnimRafId = requestAnimationFrame(step);
    };

    this.sealingAnimRafId = requestAnimationFrame(step);
  }

  stopSealingAnimation() {
    if (this.sealingAnimRafId) {
      cancelAnimationFrame(this.sealingAnimRafId);
      this.sealingAnimRafId = null;
    }
    this.isSealingProcessing = false;
  }

  cleanupSealing() {
    this.stopSealingAnimation();
    assetLoader.clearRitualCache('sealing');
    this.lastDrawnSealingFrame = null;
    this.sealingStage = 0;
  }

  updateSealingStepNodes() {
    const nodes = document.querySelectorAll('.sealing-step-node');
    nodes.forEach((n, idx) => {
      n.classList.remove('active', 'completed');
      if (idx < this.sealingStage) n.classList.add('completed');
      else if (idx === this.sealingStage) n.classList.add('active');
    });
  }

  async initSealing() {
    this.stopSealingAnimation();

    // Interrupt any background chatter / main screen speech
    if (window.NecronomiconModel && window.NecronomiconModel.interruptSpeech) {
      window.NecronomiconModel.interruptSpeech();
    }
    if (this.dialogue && this.dialogue.interruptSpeech) {
      this.dialogue.interruptSpeech();
    }

    const input = document.getElementById('sealing-input');
    const feedback = document.getElementById('sealing-feedback');
    const epilogue = document.getElementById('epilogue-card');
    const symbolDisplay = document.getElementById('sealing-symbol-display');

    this.sealingStage = 0;
    state.sealingPhase = 0;
    this.currentSealingFrame = 1;
    this.lastDrawnSealingFrame = null;
    this.isSealingProcessing = false;

    if (symbolDisplay) {
      symbolDisplay.innerHTML = renderSpellSymbols('OBSIGNUM');
    }
    if (input) {
      input.value = '';
      input.disabled = false;
      input.placeholder = 'Type deciphered incantation…';
      setTimeout(() => input.focus(), 50);
    }
    if (feedback) {
      feedback.textContent = '';
      feedback.classList.remove('visible', 'error', 'success');
    }
    if (epilogue) {
      epilogue.classList.remove('visible');
    }

    this.updateSealingStepNodes();

    audio.playSubRumble(2.0);
    audio.playRitualChime(0.6);

    // Load and display Frame 1 immediately
    const f1 = await this.loadSealingFrame(1);
    if (f1 && state.screen === 'sealing' && this.sealingStage === 0 && !this.isSealingProcessing) {
      this.drawSealingFrame(1);
    }

    // Preload stage 1 frames (2 through 55) progressively in background
    this.preloadSealingRange(2, 55);
  }

  async submitSealingIncantation(text) {
    if (this.isSealingProcessing) return;
    const t = (text || '').trim().toLowerCase();
    if (!t) return;

    const input = document.getElementById('sealing-input');
    const feedback = document.getElementById('sealing-feedback');
    const form = document.getElementById('sealing-form');
    const epilogue = document.getElementById('epilogue-card');
    const symbolDisplay = document.getElementById('sealing-symbol-display');

    // Expected sequence:
    // Stage 0: OBSIGNUM -> Frames 1 to 55
    // Stage 1: CLAUDE   -> Frames 55 to 113
    // Stage 2: VELSIGIL -> Frames 113 to 133
    // Stage 3: MORTIGIL -> Frames 133 to 192
    const SPELLS = ['obsignum', 'claude', 'velsigil', 'mortigil'];
    const expected = SPELLS[this.sealingStage] || 'obsignum';

    if (t !== expected) {
      // INCORRECT SPELL
      audio.playGlitch(0.5);

      if (form) {
        form.classList.remove('rebind-shake');
        void form.offsetWidth; // force reflow
        form.classList.add('rebind-shake');
        setTimeout(() => form.classList.remove('rebind-shake'), 600);
      }

      if (feedback) {
        feedback.textContent = 'THE SEAL RESISTS. Speak the ancient word of binding.';
        feedback.classList.remove('success');
        feedback.classList.add('visible', 'error');
      }

      if (input) {
        input.disabled = false;
        input.select();
      }
      return;
    }

    // CORRECT SPELL FOR CURRENT STAGE
    this.isSealingProcessing = true;
    if (input) input.disabled = true;

    audio.playChainLock();
    audio.playRitualChime(0.9);

    if (this.sealingStage === 0) {
      // 1. OBSIGNUM: Frames 1 - 55
      if (feedback) {
        feedback.textContent = 'FIRST SEAL CONFINING…';
        feedback.classList.remove('error');
        feedback.classList.add('visible');
      }

      this.playSealingSequence(1, 55, () => {
        this.sealingStage = 1;
        state.sealingPhase = 1;
        this.updateSealingStepNodes();
        this.isSealingProcessing = false;
        if (symbolDisplay) {
          symbolDisplay.innerHTML = renderSpellSymbols('CLAUDE');
        }
        if (feedback) {
          feedback.textContent = 'FIRST SEAL LOCKED. RECITE THE SECOND INCANTATION.';
          feedback.classList.add('visible');
        }
        if (input) {
          input.value = '';
          input.placeholder = 'Type deciphered incantation…';
          input.disabled = false;
          input.focus();
        }
        // Preload next range while user types CLAUDE
        this.preloadSealingRange(55, 113);
      });

    } else if (this.sealingStage === 1) {
      // 2. CLAUDE: Frames 55 - 113
      if (feedback) {
        feedback.textContent = 'SECOND SEAL CONFINING…';
        feedback.classList.remove('error');
        feedback.classList.add('visible');
      }

      this.playSealingSequence(55, 113, () => {
        this.sealingStage = 2;
        state.sealingPhase = 2;
        this.updateSealingStepNodes();
        this.isSealingProcessing = false;
        if (symbolDisplay) {
          symbolDisplay.innerHTML = renderSpellSymbols('VELSIGIL');
        }
        if (feedback) {
          feedback.textContent = 'SECOND SEAL LOCKED. RECITE THE THIRD INCANTATION.';
          feedback.classList.add('visible');
        }
        if (input) {
          input.value = '';
          input.placeholder = 'Type deciphered incantation…';
          input.disabled = false;
          input.focus();
        }
        // Preload next range while user types VELSIGIL
        this.preloadSealingRange(113, 133);
      });

    } else if (this.sealingStage === 2) {
      // 3. VELSIGIL: Frames 113 - 133
      if (feedback) {
        feedback.textContent = 'THIRD SEAL CONFINING…';
        feedback.classList.remove('error');
        feedback.classList.add('visible');
      }

      this.playSealingSequence(113, 133, () => {
        this.sealingStage = 3;
        state.sealingPhase = 3;
        this.updateSealingStepNodes();
        this.isSealingProcessing = false;
        if (symbolDisplay) {
          symbolDisplay.innerHTML = renderSpellSymbols('MORTIGIL');
        }
        if (feedback) {
          feedback.textContent = 'THIRD SEAL LOCKED. RECITE THE FINAL INCANTATION.';
          feedback.classList.add('visible');
        }
        if (input) {
          input.value = '';
          input.placeholder = 'Type deciphered incantation…';
          input.disabled = false;
          input.focus();
        }
        // Preload final range while user types MORTIGIL
        this.preloadSealingRange(133, 192);
      });

    } else if (this.sealingStage === 3) {
      // 4. MORTIGIL: Frames 133 - 192
      if (feedback) {
        feedback.textContent = 'FINAL SEAL CONFINING…';
        feedback.classList.remove('error');
        feedback.classList.add('visible');
      }

      this.playSealingSequence(133, 192, async () => {
        // Hold final frame 192
        this.sealingStage = 4;
        state.sealingPhase = 4;
        this.updateSealingStepNodes();

        if (feedback) {
          feedback.textContent = 'ALL SEALS LOCKED. THE NECRONOMICON FALLS SILENT.';
          feedback.classList.remove('error');
          feedback.classList.add('visible', 'success');
        }

        audio.playSubRumble(4.0);

        // Show epilogue card
        if (epilogue) {
          epilogue.classList.add('visible');
        }

        // Complete Sealing Ritual: stop all book dialogue and put book to sleep
        if (window.NecronomiconModel) {
          if (window.NecronomiconModel.interruptSpeech) {
            window.NecronomiconModel.interruptSpeech();
          }
          if (window.NecronomiconModel.F) {
            window.NecronomiconModel.F.st = 'dormant';
          }
          if (window.NecronomiconModel.Entity) {
            window.NecronomiconModel.Entity.setState('idle');
          }
        }
        if (this.dialogue && this.dialogue.interruptSpeech) {
          this.dialogue.interruptSpeech();
        }

        state.setFlag('book_sealed', true);
        state.setFlag('awakened', false);
        state.awakeningPhase = 0;
        state.awakeningState = 'awaiting_damnora';
        state.sealingPhase = 0;
        state.resetInstability();

        // After epilogue reading, transition book to dormant sleep
        setTimeout(() => {
          if (epilogue) epilogue.classList.remove('visible');
          this.stopSealingAnimation();
          this.sealingStage = 0;
          this.isSealingProcessing = false;

          state.setLifecycle('dormant');
          state.setScreen('dormant');
        }, 3600);
      });
    }
  }
}
