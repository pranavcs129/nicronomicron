/* ==========================================================================
   APP MASTER CONTROLLER — NECRONOMICON EX-MORTIS
   Initializes systems, links UI events, and orchestrates user interaction.
   ========================================================================== */

import { state } from './state.js';
import { audio } from './audio.js';
import { NecronomiconModel } from './necronomicon-model.js';
import { DialogueEngine, DIALOGUE_SCRIPT } from './dialogue.js';
import { VisionManager } from './vision.js';
import { AbilityManager } from './abilities.js';
import { RitualManager } from './rituals.js';

class NecronomiconApp {
  constructor() {
    this.model = null;
    this.entity = null;
    this.dialogue = null;
    this.vision = null;
    this.abilities = null;
    this.rituals = null;
  }

  init() {
    console.log('Awakening Necronomicon Ex-Mortis...');
    window.app = this;
    window.state = state;

    // 1. Initialize core managers
    this.model = NecronomiconModel;
    this.entity = NecronomiconModel.Entity;
    this.dialogue = new DialogueEngine(this.entity);
    this.vision = new VisionManager(this.dialogue);
    this.abilities = new AbilityManager(this.dialogue);
    this.rituals = new RitualManager(this.dialogue);

    // 2. Initialize subsystems
    this.rituals.initAwakening();

    // 3. Attach UI listeners
    this.bindNavigationEvents();
    this.bindDormantEvents();
    this.bindAwakeningEvents();
    this.bindConverseEvents();
    this.bindRebindEvents();
    this.bindSealingEvents();
    this.bindModalEvents();
    this.bindSpeechRecognition();

    // 4. Subscribe to state changes
    state.subscribe((s) => this.renderState(s));

    // Support screen preview via URL query (e.g. ?screen=awakening)
    const urlParams = new URLSearchParams(window.location.search);
    const targetScreen = urlParams.get('screen');
    if (targetScreen === 'awakening') {
      state.setLifecycle('awakening');
      state.setScreen('awakening');
      this.rituals.initAwakening();
    } else if (targetScreen === 'awakened' || targetScreen === 'converse') {
      state.flags.awakened = true;
      state.setLifecycle('awakened');
      state.setScreen('awakened');
      state.setActiveNav('converse');
      this.renderState(state);
    } else if (targetScreen === 'rebind') {
      state.flags.awakened = true;
      state.setLifecycle('rebind');
      state.setScreen('rebind');
      this.rituals.initRebind();
    } else if (targetScreen === 'sealing') {
      state.flags.awakened = true;
      state.setLifecycle('sealing');
      state.setScreen('sealing');
      this.rituals.initSealing();
    } else {
      this.renderState(state);
    }

    // First user gesture initializes audio context
    const unlockAudio = () => {
      audio.ensureContext();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
  }

  // ------------------------------------------------------------------------
  // STATE RENDERER
  // ------------------------------------------------------------------------
  renderState(s) {
    // 0. Lifecycle State & Conditional Awakened UI Rendering
    const isAwakened = s.lifecycle === 'awakened' && s.flags.awakened;

    // Synchronize body lifecycle classes and dataset
    document.body.dataset.lifecycle = s.lifecycle;
    document.body.classList.toggle('lifecycle-dormant', s.lifecycle === 'dormant');
    document.body.classList.toggle('lifecycle-opening-video', s.lifecycle === 'opening-video');
    document.body.classList.toggle('lifecycle-transition', s.lifecycle === 'transition');
    document.body.classList.toggle('lifecycle-awakening', s.lifecycle === 'awakening');
    document.body.classList.toggle('lifecycle-awakened', isAwakened);
    document.body.classList.toggle('screen-rebind', s.screen === 'rebind');
    document.body.classList.toggle('screen-sealing', s.screen === 'sealing');
    document.body.dataset.screen = s.screen;

    // Conditional rendering: awakened sidebar & top controls must NEVER render in dormant, opening, transition, or dedicated rituals (rebind / sealing)
    const isAwakenedView = isAwakened && s.screen !== 'rebind' && s.screen !== 'sealing';
    const verticalNav = document.getElementById('vertical-nav');
    const sharedTopNav = document.getElementById('shared-top-nav');

    if (verticalNav) {
      verticalNav.style.display = isAwakenedView ? 'flex' : 'none';
      verticalNav.setAttribute('aria-hidden', String(!isAwakenedView));
    }
    if (sharedTopNav) {
      sharedTopNav.style.display = isAwakenedView ? 'flex' : 'none';
      sharedTopNav.setAttribute('aria-hidden', String(!isAwakenedView));
    }

    // 1. Screen visibility
    const prevScreen = this.currentActiveScreen;
    this.currentActiveScreen = s.screen;

    const screens = ['dormant', 'awakening', 'awakened', 'rebind', 'sealing'];
    screens.forEach(sc => {
      const el = document.getElementById(`screen-${sc}`);
      if (el) el.classList.toggle('active', s.screen === sc);
    });

    // Ensure Awakening UI is up-to-date when the screen becomes visible
    if (s.screen === 'awakening' && prevScreen !== 'awakening') {
      this.rituals.initAwakening();
      this.rituals.updateAwakeningUI();
    }

    if (s.screen === 'rebind' && prevScreen !== 'rebind') {
      this.rituals.initRebind();
    } else if (prevScreen === 'rebind' && s.screen !== 'rebind') {
      this.rituals.stopRebindAnimation();
    }

    if (s.screen === 'sealing' && prevScreen !== 'sealing') {
      this.rituals.initSealing();
    } else if (prevScreen === 'sealing' && s.screen !== 'sealing') {
      this.rituals.stopSealingAnimation();
    }

    if (s.screen === 'awakened' && this.model && this.model.resize) {
      this.model.resize();
    }

    // 2. Navigation items
    const navItems = document.querySelectorAll('.vnav-item');
    navItems.forEach(n => {
      const target = n.dataset.nav;
      n.classList.toggle('active', s.activeNav === target);
    });

    // 3. Instability Meter update
    const instVal = document.getElementById('instability-val');
    const instDot = document.getElementById('instability-dot');
    if (instVal) instVal.textContent = `${s.instability}%`;
    if (instDot) {
      if (s.instabilityState === 'stable') instDot.style.backgroundColor = '#38b000';
      else if (s.instabilityState === 'warning') instDot.style.backgroundColor = '#ffaa00';
      else instDot.style.backgroundColor = '#ff2200';
    }

    // Body classes for instability visual effects
    document.body.classList.toggle('instability-warning', s.instabilityState === 'warning');
    document.body.classList.toggle('instability-critical', s.instabilityState === 'critical');
    document.body.classList.toggle('instability-breach', s.instabilityState === 'breach');

    // Prominent Rebind Alert Banner on Converse screen when uncontrolled or rebind pending
    const rebindAlertBanner = document.getElementById('rebind-alert-banner');
    if (rebindAlertBanner) {
      rebindAlertBanner.classList.toggle('hidden', !(s.isUncontrolled || s.rebindPending));
    }

    // In input field: disabled when uncontrolled or rebind pending
    const inInput = document.getElementById('in');
    if (inInput) {
      if (s.isUncontrolled || s.rebindPending) {
        inInput.disabled = true;
        inInput.placeholder = 'ENTITY UNCONTROLLED — REBIND REQUIRED';
      } else {
        inInput.disabled = false;
        inInput.placeholder = 'Speak or type…';
      }
    }

    // Quick Rebind Button on Converse Bar
    const rebindBtn = document.getElementById('converse-rebind-btn');
    if (rebindBtn) {
      rebindBtn.classList.toggle('visible', s.instability >= 40 || s.rebindPending);
    }

    // Seal Navigation Button (Always unlocked)
    const sealNav = document.getElementById('nav-seal');
    if (sealNav) {
      sealNav.classList.add('unlocked');
      sealNav.title = 'Begin Final Sealing Ritual';
    }
  }

  // ------------------------------------------------------------------------
  // EVENT BINDINGS
  // ------------------------------------------------------------------------
  bindNavigationEvents() {
    // Left vertical navigation
    document.querySelectorAll('.vnav-item').forEach(item => {
      item.addEventListener('click', () => {
        // Prevent sidebar interactions from prematurely triggering awakened states
        if (!state.flags.awakened || state.lifecycle !== 'awakened') return;

        const target = item.dataset.nav;
        audio.playTypeClick();
        
        if (target === 'archives') {
          this.openModal('modal-archives');
        } else if (target === 'seal') {
          state.setActiveNav('seal');
        } else {
          state.setActiveNav(target);
        }
      });
    });

    // Top nav controls
    const volumeBtn = document.getElementById('btn-toggle-sound');
    if (volumeBtn) {
      volumeBtn.addEventListener('click', () => {
        const muted = audio.toggleMute();
        volumeBtn.classList.toggle('muted', muted);
        volumeBtn.style.opacity = muted ? '0.4' : '1';
        if (this.model && this.model.setMuted) {
          this.model.setMuted(muted);
        }
      });
    }

    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openModal('modal-settings'));
    }

    const brandLink = document.getElementById('brand-link');
    if (brandLink) {
      brandLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.openModal('modal-about');
      });
    }
  }

  bindDormantEvents() {
    const openBtn = document.getElementById('btn-open-book');
    const videoOverlay = document.getElementById('cinematic-video-overlay');
    const openingVideo = document.getElementById('opening-cinematic-video');
    const skipBtn = document.getElementById('btn-skip-opening');
    const blackCurtain = document.getElementById('opening-black-curtain');

    const PLAYBACK_SPEED = 1.25; // 1.2x–1.3x speedup for smooth cinematic opening
    const FADE_TO_BLACK_MS = 350; // 300–400ms fade to pure black
    const BLACK_HOLD_MS = 800; // 700–900ms pure black hold
    const FADE_TO_AWAKENING_MS = 600; // 500–700ms smooth reveal of Awakening UI

    let isOpeningTransitioning = false;
    let transitionTimeouts = [];

    const clearTimeouts = () => {
      transitionTimeouts.forEach(t => clearTimeout(t));
      transitionTimeouts = [];
    };

    if (openingVideo) {
      openingVideo.defaultPlaybackRate = PLAYBACK_SPEED;
      openingVideo.playbackRate = PLAYBACK_SPEED;
      openingVideo.addEventListener('play', () => {
        openingVideo.playbackRate = PLAYBACK_SPEED;
      });
    }

    const resetOpeningUIState = () => {
      clearTimeouts();
      audio.stopOpeningCinematicSequence();
      isOpeningTransitioning = false;

      if (state.screen === 'dormant' && !state.flags.awakened) {
        state.setLifecycle('dormant');
      }

      if (openBtn) {
        openBtn.disabled = false;
        openBtn.removeAttribute('aria-disabled');
      }

      if (videoOverlay) {
        videoOverlay.classList.remove('playing');
      }

      if (openingVideo) {
        openingVideo.pause();
        openingVideo.currentTime = 0;
      }

      if (blackCurtain) {
        blackCurtain.classList.remove('active', 'fade-to-black', 'fade-to-awakening');
        blackCurtain.style.opacity = '';
      }

      if (skipBtn) {
        skipBtn.classList.remove('hidden');
        skipBtn.style.opacity = '';
        skipBtn.style.pointerEvents = '';
      }
    };

    // Black screen transition sequence immediately after video completes
    const startBlackScreenTransition = () => {
      if (!isOpeningTransitioning) return;

      // Enter transition lifecycle stage
      state.setLifecycle('transition');

      // 1. Freeze on final frame cleanly (do not restart or loop)
      if (openingVideo) {
        openingVideo.pause();
      }

      // Immediately hide skip button & halt audio sequence timers
      if (skipBtn) {
        skipBtn.classList.add('hidden');
      }
      audio.stopOpeningCinematicSequence();

      // 2. Fade entire screen smoothly to pure black over ~350ms (300–400ms)
      if (blackCurtain) {
        blackCurtain.classList.remove('fade-to-awakening');
        blackCurtain.classList.add('active');
        // Force reflow
        void blackCurtain.offsetWidth;
        blackCurtain.classList.add('fade-to-black');
      }

      // 3. Hold pure black for ~800ms (700–900ms).
      // During hold, switch to Awakening UI behind pure black so nothing leaks prematurely
      transitionTimeouts.push(setTimeout(() => {
        state.setLifecycle('awakening');
        state.setScreen('awakening');
        this.rituals.initAwakening();

        if (videoOverlay) {
          videoOverlay.classList.remove('playing');
        }
        if (openingVideo) {
          openingVideo.pause();
          openingVideo.currentTime = 0;
        }
      }, FADE_TO_BLACK_MS + 100));

      // 4. After full black hold finishes (350ms + 800ms = 1150ms),
      // smoothly transition from black into Awakening Ritual interface over ~600ms (500–700ms)
      transitionTimeouts.push(setTimeout(() => {
        if (blackCurtain) {
          blackCurtain.classList.remove('fade-to-black');
          blackCurtain.classList.add('fade-to-awakening');
        }

        // 5. Cleanup when fade-to-awakening completes (1150ms + 600ms = 1750ms)
        transitionTimeouts.push(setTimeout(() => {
          resetOpeningUIState();
        }, FADE_TO_AWAKENING_MS));
      }, FADE_TO_BLACK_MS + BLACK_HOLD_MS));
    };

    const startOpeningSequence = () => {
      // Ensure animation plays only once per opening action
      if (isOpeningTransitioning) return;
      isOpeningTransitioning = true;
      clearTimeouts();

      // Enter opening-video lifecycle stage
      state.setLifecycle('opening-video');

      if (openBtn) {
        openBtn.disabled = true;
        openBtn.setAttribute('aria-disabled', 'true');
      }

      audio.ensureContext();
      audio.playOpeningCinematicSequence(PLAYBACK_SPEED);

      if (videoOverlay && openingVideo) {
        if (skipBtn) {
          skipBtn.classList.remove('hidden');
          skipBtn.style.opacity = '';
          skipBtn.style.pointerEvents = '';
        }

        videoOverlay.classList.add('playing');
        openingVideo.currentTime = 0;
        openingVideo.playbackRate = PLAYBACK_SPEED;

        // Reliable completion handling via the video's actual 'ended' event
        const onEnded = () => {
          openingVideo.removeEventListener('ended', onEnded);
          startBlackScreenTransition();
        };

        openingVideo.addEventListener('ended', onEnded, { once: true });

        openingVideo.play().catch(e => {
          console.warn('Video playback interrupted or restricted, proceeding with transition:', e);
          openingVideo.removeEventListener('ended', onEnded);
          startBlackScreenTransition();
        });
      } else {
        startBlackScreenTransition();
      }
    };

    const skipOpening = () => {
      if (!isOpeningTransitioning) return;
      clearTimeouts();
      audio.stopOpeningCinematicSequence();
      state.setLifecycle('awakening');
      state.setScreen('awakening');
      this.rituals.initAwakening();
      resetOpeningUIState();
    };

    if (openBtn) {
      openBtn.addEventListener('click', () => startOpeningSequence());
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', () => skipOpening());
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpeningTransitioning) {
        skipOpening();
      }
    });

    state.subscribe((s) => {
      if (s.screen === 'dormant' && !isOpeningTransitioning) {
        resetOpeningUIState();
      }
    });

    const navArchive = document.getElementById('dormant-nav-archive');
    if (navArchive) {
      navArchive.addEventListener('click', (e) => {
        e.preventDefault();
        this.openModal('modal-archives');
      });
    }

    const navAbout = document.getElementById('dormant-nav-about');
    if (navAbout) {
      navAbout.addEventListener('click', (e) => {
        e.preventDefault();
        this.openModal('modal-about');
      });
    }
  }


  bindAwakeningEvents() {
    const form = document.getElementById('awakening-form');
    const input = document.getElementById('awakening-input');
    const instruction = document.getElementById('awakening-instruction');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = input ? input.value : '';
        this.rituals.submitAwakeningIncantation(val);
      });
    }

    if (input) {
      input.addEventListener('input', () => {
        this.rituals.clearAwakeningError();
      });
    }

    // Dead Alphabet Decoder Modal Controls (Awakening Only)
    const bookHead = document.getElementById('awakening-book-head');
    const decoderModal = document.getElementById('awakening-decoder-modal');
    const decoderCloseBtn = document.getElementById('decoder-close-btn');
    const decoderBackdrop = document.getElementById('decoder-backdrop');

    const openDecoder = () => {
      if (!decoderModal) return;
      decoderModal.classList.add('open');
      decoderModal.setAttribute('aria-hidden', 'false');
      audio.playTypeClick();
    };

    const closeDecoder = () => {
      if (!decoderModal) return;
      decoderModal.classList.remove('open');
      decoderModal.setAttribute('aria-hidden', 'true');
      audio.playTypeClick();
    };

    if (bookHead) {
      bookHead.addEventListener('click', (e) => {
        e.stopPropagation();
        if (decoderModal && decoderModal.classList.contains('open')) {
          closeDecoder();
        } else {
          openDecoder();
        }
      });
    }

    if (decoderCloseBtn) {
      decoderCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeDecoder();
      });
    }

    if (decoderBackdrop) {
      decoderBackdrop.addEventListener('click', (e) => {
        e.stopPropagation();
        closeDecoder();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && decoderModal && decoderModal.classList.contains('open')) {
        closeDecoder();
      }
    });

    if (instruction && input) {
      instruction.addEventListener('click', () => {
        if (!input.disabled) input.focus();
      });
    }

    document.querySelectorAll('.ritual-phase-row').forEach((row) => {
      row.addEventListener('click', () => {
        if (input && !input.disabled) input.focus();
      });
    });
  }

  bindConverseEvents() {
    const form = document.getElementById('f') || document.getElementById('converse-form');
    const input = document.getElementById('in') || document.getElementById('converse-input');

    const handleUserSubmit = async (rawText) => {
      const text = (rawText || '').trim();
      if (!text) return;
      if (state.rebindPending || state.isUncontrolled || state.screen === 'rebind' || state.screen === 'sealing') {
        return;
      }
      if (input) input.value = '';

      // Count each submitted user message exactly once
      state.userChatCount = (state.userChatCount || 0) + 1;
      const shouldTriggerRebind = state.userChatCount >= 3;

      // Let response finish normally
      if (this.model && this.model.send) {
        if (this.entity) this.entity._handlingAppSubmit = true;
        try {
          await this.model.send(text);
        } finally {
          if (this.entity) this.entity._handlingAppSubmit = false;
        }
      } else {
        await this.dialogue.processUserQuery(text);
      }

      // After third user message finishes, trigger Rebind
      if (shouldTriggerRebind && !state.rebindPending) {
        state.rebindPending = true;
        state.isUncontrolled = true;
        state.instability = 75;
        state.instabilityState = 'critical';

        if (window.NecronomiconModel) {
          if (window.NecronomiconModel.F) {
            window.NecronomiconModel.F.ins = 75;
            window.NecronomiconModel.F.lock = true;
          }
          if (window.NecronomiconModel.Entity) {
            window.NecronomiconModel.Entity.setMood('frenzy');
            window.NecronomiconModel.Entity.provoke(0.5);
          }
          if (window.NecronomiconModel.speak) {
            await window.NecronomiconModel.speak('CRIT_01b');
          }
        }

        if (input) {
          input.disabled = true;
          input.placeholder = 'ENTITY UNCONTROLLED — REBIND REQUIRED';
        }
        const rebindBanner = document.getElementById('rebind-alert-banner');
        if (rebindBanner) rebindBanner.classList.remove('hidden');

        state.notify();
      }
    };

    this.handleUserSubmit = handleUserSubmit;

    if (form && !form.dataset.boundApp) {
      form.dataset.boundApp = 'true';
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input ? input.value : '';
        handleUserSubmit(text);
      });
    }

    // Suggested prompt chips
    document.querySelectorAll('.inquiry-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.dataset.query;
        handleUserSubmit(query);
      });
    });

    // Rebind button on converse bar
    const rebindBarBtn = document.getElementById('converse-rebind-btn');
    if (rebindBarBtn) {
      rebindBarBtn.addEventListener('click', () => {
        state.setScreen('rebind');
      });
    }

    // Dialogue history toggle
    const toggleHistory = document.getElementById('btn-dialogue-history');
    const drawer = document.getElementById('dialogue-history-drawer');
    const closeDrawer = document.getElementById('btn-close-drawer');
    if (toggleHistory && drawer) {
      toggleHistory.addEventListener('click', () => drawer.classList.add('open'));
    }
    if (closeDrawer && drawer) {
      closeDrawer.addEventListener('click', () => drawer.classList.remove('open'));
    }
  }

  bindRebindEvents() {
    const form = document.getElementById('rebind-form');
    const input = document.getElementById('rebind-input');
    const mic = document.getElementById('rebind-mic');
    const btnTrigger = document.getElementById('btn-trigger-rebind');

    if (btnTrigger) {
      btnTrigger.addEventListener('click', () => {
        state.setScreen('rebind');
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = input ? input.value : '';
        this.rituals.submitRebind(val);
      });
    }

    if (mic) {
      mic.addEventListener('click', () => {
        this.rituals.setupRebindVoiceInput();
      });
    }
  }

  bindSealingEvents() {
    const form = document.getElementById('sealing-form');
    const input = document.getElementById('sealing-input');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = input ? input.value : '';
        this.rituals.submitSealingIncantation(val);
      });
    }
  }

  bindModalEvents() {
    // Modal close buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.occult-modal');
        if (modal) modal.classList.remove('active');
      });
    });

    // Close on clicking backdrop
    document.querySelectorAll('.occult-modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    });



    // Codex tabs inside Archives
    document.querySelectorAll('.codex-tab-btn').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.codex-tab-btn').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const entryId = tab.dataset.entry;
        document.querySelectorAll('.codex-entry-pane').forEach(p => {
          p.style.display = p.id === `codex-${entryId}` ? 'block' : 'none';
        });
      });
    });
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
    audio.playTypeClick();
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  bindSpeechRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const micConverse = document.getElementById('converse-mic-btn');
    const inputConverse = document.getElementById('converse-input');

    if (!SR || !micConverse) return;

    let recognizer = null;
    try {
      recognizer = new SR();
      recognizer.lang = 'en-US';
      recognizer.interimResults = true;

      micConverse.addEventListener('click', () => {
        if (micConverse.classList.contains('listening')) {
          recognizer.stop();
        } else {
          recognizer.start();
        }
      });

      recognizer.onstart = () => {
        micConverse.classList.add('listening');
        if (this.entity) this.entity.setState('listening');
        audio.playWhisper(0.5);
      };

      recognizer.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
        if (inputConverse) inputConverse.value = transcript;
        if (this.entity) this.entity.pulse(0.4);
        if (e.results[e.results.length - 1].isFinal) {
          this.dialogue.processUserQuery(transcript);
        }
      };

      recognizer.onend = () => {
        micConverse.classList.remove('listening');
        if (this.entity) this.entity.setState('idle');
      };
    } catch (e) {
      console.warn('Speech Recognition init skipped:', e);
    }
  }
}

// Instantiate and start on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  const app = new NecronomiconApp();
  app.init();
  window.Necronomicon = app; // Expose for browser debugging
});
