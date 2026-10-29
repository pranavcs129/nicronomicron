/* ==========================================================================
   CENTRAL REACTIVE STATE SYSTEM — NECRONOMICON EX-MORTIS
   Authoritative State Machine for Story, Instability, Rituals, & Abilities
   ========================================================================== */

class AppState {
  constructor() {
    // Application Lifecycle Stages: 'dormant' | 'opening-video' | 'transition' | 'awakening' | 'awakened'
    this.lifecycle = 'dormant';
    this.screen = 'dormant'; // 'dormant', 'awakening', 'awakened', 'vision', 'rebind', 'sealing'
    this.activeNav = 'converse'; // 'converse', 'archives', 'vision', 'relics', 'seal'
    
    // Instability Meter (0 - 100)
    this.instability = 0;
    this.instabilityState = 'stable'; // 'stable', 'warning', 'critical', 'breach'
    this.isUncontrolled = false; // true when instability >= 75, requires Rebinding
    this.isBreachLockout = false;
    this.lastAbilityTime = Date.now();
    
    // Awakening Ritual (4 phases & controlled state machine)
    this.awakeningPhase = 0; // 0=0%, 1=25%, 2=50%, 3=75%, 4=100%
    this.awakeningState = 'awaiting_damnora'; // 'awaiting_damnora' | 'playing_segment_1' | 'awaiting_exoria' | 'playing_segment_2' | 'awaiting_surge' | 'playing_segment_3' | 'awaiting_noctara' | 'playing_segment_4' | 'transitioning_to_black' | 'entering_awakened_interface' | 'awakened'
    
    // Rebinding Ritual (3 seals)
    this.rebindPhase = 0; // 0, 1, 2, 3
    
    // Sealing Ritual (4 incantations)
    this.sealingPhase = 0; // 0, 1, 2, 3, 4
    
    // Vision System
    this.visionMode = 'normal'; // 'normal', 'supernatural'
    this.isCameraActive = false;
    this.isWatcherMode = false;
    
    // Story Progression Flags (From Script Spec Section 18)
    this.flags = {
      awakened: false,
      laptop_discovered: false,
      escape_attempted: false,
      rebound_done: false,
      threat_event_seen: false,
      clue_found: 0, // 0, 1, 2, 3
      anchor_found: false,
      breach_stable: false,
      manifestation_weakened: false,
      demon_cast_out: false,
      book_sealed: false,
      asked_about_ash: false,
      trust_asked: false,
      message_count: 0
    };
    
    // User Chat Counter for Rebinding Trigger (Fix 2)
    this.userChatCount = 0;
    this.rebindPending = false;

    // Session Memory (Conversation & Actions)
    this.memory = {
      last_power: null,
      history: [],
      discoveredClues: []
    };
    
    this.subscribers = [];
    this.startInstabilityDecayLoop();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    callback(this);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(cb => {
      try { cb(this); } catch (e) { console.error('State subscriber error:', e); }
    });
  }

  setLifecycle(newLifecycle) {
    if (this.lifecycle === newLifecycle) return;
    this.lifecycle = newLifecycle;
    this.notify();
  }

  setAwakeningState(newState) {
    if (this.awakeningState === newState) return;
    this.awakeningState = newState;
    this.notify();
  }

  setScreen(newScreen) {
    if (this.screen === newScreen) return;
    const awakenedScreens = ['awakened', 'rebind', 'sealing'];
    // Prevent premature navigation into awakened screens if the ritual is not yet finished
    if (awakenedScreens.includes(newScreen) && !this.flags.awakened) {
      console.warn(`Blocked transition to ${newScreen}: application is not yet awakened.`);
      return;
    }
    this.screen = newScreen;
    if (newScreen === 'awakened') this.activeNav = 'converse';
    this.notify();
  }

  setActiveNav(nav) {
    // Only allow awakened sidebar interaction when book is actually awakened
    if (!this.flags.awakened) {
      console.warn(`Blocked active nav to ${nav}: application is not yet awakened.`);
      return;
    }
    this.activeNav = nav;
    if (nav === 'converse') this.setScreen('awakened');
    else if (nav === 'seal') this.setScreen('sealing');
    this.notify();
  }

  // Instability Management
  addInstability(cost) {
    const prev = this.instability;
    this.instability = Math.min(100, Math.max(0, this.instability + cost));
    this.lastAbilityTime = Date.now();
    this.updateInstabilityState();
    if (typeof window !== 'undefined' && window.NecronomiconModel) {
      if (window.NecronomiconModel.F && window.NecronomiconModel.F.ins !== this.instability) {
        window.NecronomiconModel.F.ins = this.instability;
      }
      if (window.NecronomiconModel.Entity) {
        window.NecronomiconModel.Entity.provoke(cost / 150);
        if (this.isUncontrolled) {
          window.NecronomiconModel.Entity.setMood('frenzy');
        }
      }
      if (prev < 75 && this.instability >= 75 && !this.rebindPending && window.NecronomiconModel.speak) {
        window.NecronomiconModel.speak('CRIT_01b');
      }
    }
    this.notify();
  }

  reduceInstability(amount) {
    this.instability = Math.max(0, this.instability - amount);
    this.updateInstabilityState();
    if (typeof window !== 'undefined' && window.NecronomiconModel && window.NecronomiconModel.F) {
      window.NecronomiconModel.F.ins = this.instability;
    }
    this.notify();
  }

  resetInstability() {
    this.instability = 0;
    this.isUncontrolled = false;
    this.isBreachLockout = false;
    this.userChatCount = 0;
    this.rebindPending = false;
    this.updateInstabilityState();
    if (typeof window !== 'undefined' && window.NecronomiconModel) {
      if (window.NecronomiconModel.F) {
        window.NecronomiconModel.F.ins = 0;
        window.NecronomiconModel.F.lock = false;
        window.NecronomiconModel.F.busy = false;
      }
      if (window.NecronomiconModel.Entity) {
        window.NecronomiconModel.Entity.soothe(1);
      }
    }
    this.notify();
  }

  updateInstabilityState() {
    if (this.instability >= 100) {
      this.instabilityState = 'breach';
      this.isUncontrolled = true;
      if (!this.isBreachLockout) {
        this.triggerBreachLockout();
      }
    } else if (this.instability >= 75) {
      this.instabilityState = 'critical';
      this.isUncontrolled = true;
    } else if (this.instability >= 40) {
      this.instabilityState = 'warning';
      this.isUncontrolled = false;
    } else {
      this.instabilityState = 'stable';
      this.isUncontrolled = false;
    }
  }

  triggerBreachLockout() {
    this.isBreachLockout = true;
    // Section 1.1: Abilities lock for 15s and meter drops to 60
    setTimeout(() => {
      this.instability = 60;
      this.isBreachLockout = false;
      this.updateInstabilityState();
      this.notify();
    }, 15000);
  }

  startInstabilityDecayLoop() {
    setInterval(() => {
      // Settling: with no ability used for 3 seconds, meter falls by 1 every 3 seconds (when not uncontrolled)
      if (Date.now() - this.lastAbilityTime >= 3000 && this.instability > 0 && !this.isBreachLockout && !this.isUncontrolled) {
        this.instability = Math.max(0, this.instability - 1);
        this.updateInstabilityState();
        this.notify();
      }
    }, 3000);
  }

  setFlag(flagName, value) {
    this.flags[flagName] = value;
    this.notify();
  }

  addMessage(speaker, text) {
    this.memory.history.push({ speaker, text, timestamp: Date.now() });
    if (speaker === 'user') {
      this.flags.message_count++;
    }
    this.notify();
  }
}

export const state = new AppState();
