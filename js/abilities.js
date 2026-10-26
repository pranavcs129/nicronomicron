/* ==========================================================================
   SUPERNATURAL ABILITIES FRAMEWORK & THREAT RESOLUTION
   Implements Dead Sight, Binding Word, and Casting-Out
   Configurable prerequisites, instability costs, and portal expulsion.
   ========================================================================== */

import { state } from './state.js';
import { audio } from './audio.js';
import { DIALOGUE_SCRIPT } from './dialogue.js';

export class AbilityManager {
  constructor(dialogueEngine) {
    this.dialogue = dialogueEngine;
  }

  // 1. DEAD SIGHT (+15 Instability)
  async executeDeadSight() {
    if (window.NecronomiconModel && window.NecronomiconModel.ability) {
      await window.NecronomiconModel.ability('ds');
      const marker = document.getElementById('demon-anchor-marker');
      if (marker && window.NecronomiconModel.F.anchor) marker.classList.add('visible');
      return;
    }

    if (state.instability >= 75) {
      this.dialogue.speak({ id: 'ERR', emotion: 'harsh', text: 'The binding is too weak! Rebind the entity before reaching into my power.' });
      return;
    }

    state.addInstability(15);
    state.memory.last_power = 'Dead Sight';
    audio.playWhisper(1.5);
    audio.playRitualChime(1.2);

    if (state.flags.threat_event_seen && state.flags.clue_found >= 1) {
      state.setFlag('anchor_found', true);
      state.setFlag('clue_found', Math.max(state.flags.clue_found, 2));

      // Reveal anchor marker on vision screen if open
      const marker = document.getElementById('demon-anchor-marker');
      if (marker) marker.classList.add('visible');

      this.dialogue.speak(DIALOGUE_SCRIPT.PT_S1);
    } else {
      this.dialogue.speak({ id: 'PW_DS_F1', emotion: 'bored', text: 'Nothing here yet. You spent my patience on empty air. First observe the anomaly through the Vision lens.' });
    }
  }

  // 2. BINDING WORD (+20 Instability)
  async executeBindingWord() {
    if (window.NecronomiconModel && window.NecronomiconModel.ability) {
      await window.NecronomiconModel.ability('bw');
      return;
    }

    if (state.instability >= 75) {
      this.dialogue.speak({ id: 'ERR', emotion: 'harsh', text: 'The binding is too weak! Rebind the entity before invoking the clasp.' });
      return;
    }

    if (!state.flags.anchor_found) {
      this.dialogue.speak({ id: 'PW_BW_F1', emotion: 'sharp', text: 'There is nothing here to hold. Choose a target with Dead Sight, or choose silence.' });
      return;
    }

    state.addInstability(20);
    state.memory.last_power = 'Binding Word';
    audio.playChainLock();
    audio.playSubRumble(2.5);

    state.setFlag('breach_stable', true);
    state.setFlag('manifestation_weakened', true);
    state.setFlag('clue_found', Math.max(state.flags.clue_found, 3));

    this.dialogue.speak(DIALOGUE_SCRIPT.PT_S2);
  }

  // 3. CASTING-OUT (+30 Instability)
  async executeCastingOut() {
    if (window.NecronomiconModel && window.NecronomiconModel.ability) {
      await window.NecronomiconModel.ability('co');
      return;
    }

    if (state.instability >= 75) {
      this.dialogue.speak({ id: 'ERR', emotion: 'harsh', text: 'The binding is too weak! Rebind the entity before casting out the demon.' });
      return;
    }

    if (!state.flags.breach_stable || !state.flags.manifestation_weakened) {
      this.dialogue.speak({ id: 'PW_CO_LOCK', emotion: 'cold', text: 'Not yet. A thing must be weak and a door must be held before anything can be thrown.' });
      return;
    }

    state.addInstability(30);
    state.memory.last_power = 'Casting-Out';
    
    // Violent breach visual tremor
    document.body.classList.add('instability-critical');
    audio.playGlitch(2.5);
    audio.playSubRumble(4.0);
    audio.playRitualChime(2.0);

    // Speak expulsion lines
    await this.dialogue.speak(DIALOGUE_SCRIPT.PT_S3a);
    
    document.body.classList.remove('instability-critical');
    
    // Set victory flag!
    state.setFlag('demon_cast_out', true);
    
    // Hide anchor marker
    const marker = document.getElementById('demon-anchor-marker');
    if (marker) marker.classList.remove('visible');

    await this.dialogue.speak(DIALOGUE_SCRIPT.PT_S3b);

    // Prompt user that Seal Rite is now ready on navigation!
    const sealNav = document.getElementById('nav-seal');
    if (sealNav) {
      sealNav.classList.add('unlocked');
      sealNav.style.animation = 'pulseGlow 1.2s infinite';
    }
  }
}
