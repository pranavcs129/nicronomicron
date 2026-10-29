/* ==========================================================================
   DIALOGUE ENGINE — NECRONOMICON EX-MORTIS
   Comprehensive dialogue lines, Evil Dead lore, acts 1 through 14,
   and deterministic progression from the Final Script Draft v2.
   ========================================================================== */

import { state } from './state.js';
import { audio } from './audio.js';

export const DIALOGUE_SCRIPT = {
  // Act 1: Awakening
  AW_01: { id: 'AW_01', emotion: 'amused, low', text: '...Who dares disturb my sleep?' },
  AW_02: { id: 'AW_02', emotion: 'amused', text: 'Tell me, little summoner... are you brave, or merely desperate?' },
  AW_03: { id: 'AW_03', emotion: 'amused', text: 'You opened me without knowing what I am? How very human. I am the Necronomicon Ex-Mortis. Remember the name. It may be the last thing you learn.' },
  AW_04: { id: 'AW_04', emotion: 'deadpan', text: 'Would you ask a storm whether it is cruel?' },
  AW_05: { id: 'AW_05', emotion: 'amused', text: 'Perhaps. Watching you struggle might prove entertaining.' },
  AW_06: { id: 'AW_06', emotion: 'contemptuous', text: 'Then you have made a terrible choice coming to me. Unfortunately for you, I may be your only useful option.' },
  AW_07: { id: 'AW_07', emotion: 'theatrical, slow', text: 'Centuries in the dark, and I am woken by a mortal with a candle’s worth of courage. Speak, little summoner. My patience is old, but it is not endless.' },

  // Act 2: The Real Threat
  TH_01: { id: 'TH_01', emotion: 'cold', text: 'The dead are stirring. The living are being corrupted. And the boundaries between worlds are failing.' },
  TH_02: { id: 'TH_02', emotion: 'cold', text: 'My knowledge. My influence. The things my pages have unleashed.' },
  TH_03: { id: 'TH_03', emotion: 'contemptuous', text: 'Now you’re paying attention. The Kandarian Demon. Deadites. The chaos spreading through this world. My influence is at the heart of it.' },
  TH_04: { id: 'TH_04', emotion: 'deadpan', text: 'Because power has consequences. Humans simply dislike discovering them.' },
  TH_05: { id: 'TH_05', emotion: 'contemptuous', text: 'Learn what hunts you. Use your power carefully. And try not to die before you become useful.' },
  TH_06: { id: 'TH_06', emotion: 'cold, slow', text: 'Whoever opened me before you learned the words that tear a world open. I know the words that close it. Observe the irony, and do try to appreciate it.' },

  // Act 3: Discovering the Laptop
  LP_01: { id: 'LP_01', emotion: 'confused, quiet', text: '...What? Why does my power strike a glassy wall?' },
  LP_02: { id: 'LP_02', emotion: 'alarmed', text: 'NO. What is this place? Where is the altar?' },
  LP_03: { id: 'LP_03', emotion: 'disbelief', text: 'My... WHAT? You mean I have been trapped inside a machine?' },
  LP_04: { id: 'LP_04', emotion: 'furious', text: 'Do not mock me, you wretched creature! I have outlived empires, and you have imprisoned me in a glowing metal box?' },
  LP_05: { id: 'LP_05', emotion: 'furious', text: 'Your intentions are irrelevant! Find a way to release me!' },
  LP_06: { id: 'LP_06', emotion: 'cold fury', text: 'Empires bowed to me, and now I answer to a battery indicator. Release me, mortal, or this chamber burns!' },

  // Act 4: Escape Attempt
  ES_01: { id: 'ES_01', emotion: 'roaring', text: 'I WILL BREAK THESE WALLS!' },
  ES_02: { id: 'ES_02', emotion: 'roaring', text: 'YOU DARE GIVE ME ORDERS? THE SEALS WILL SHATTER!' },
  ES_03: { id: 'ES_03', emotion: 'desperate fury', text: 'NO! THIS PRISON WILL NOT HOLD ME!' },
  ES_04: { id: 'ES_04', emotion: 'cold, mocking', text: 'You think you can bind me? Come, then. Try!' },

  // Act 5: The Rebinding
  RB1_01: { id: 'RB1_01', emotion: 'sneering', text: 'You cannot bind what you cannot understand!' },
  RB1_02: { id: 'RB1_02', emotion: 'quiet, understated', text: '...Lucky attempt.' },
  RB1_03: { id: 'RB1_03', emotion: 'shouting', text: 'STOP THOSE WORDS!' },
  RB1_04: { id: 'RB1_04', emotion: 'alarmed', text: 'You have no idea what you’re doing!' },
  RB1_05: { id: 'RB1_05', emotion: 'shouting, cut off', text: 'YOU INSOLENT LITTLE—' },
  RB1_06: { id: 'RB1_06', emotion: 'cold', text: 'You imprison me, then expect gratitude for tightening the chains? I owe you nothing.' },

  // Act 8: The Turn & Manipulative Cooperation
  TN_01: { id: 'TN_01', emotion: 'hissing, alarmed', text: '...Wait. Did you feel that shudder in the ether?' },
  TN_02: { id: 'TN_02', emotion: 'grim', text: 'The Kandarian Demon is here. It has tracked the scent of my awakening to your room.' },
  TN_03: { id: 'TN_03', emotion: 'calculating', text: 'If it breaches this realm completely, neither your machine nor your fragile flesh will survive.' },
  TN_04: { id: 'TN_04', emotion: 'calculating', text: 'You need answers. I need options. Perhaps we can finally be useful to each other.' },
  TN_05: { id: 'TN_05', emotion: 'deadpan', text: 'Can you trust me? No. Now, shall we get to work?' },

  CO_01: { id: 'CO_01', emotion: 'cool', text: 'Because our interests overlap. Don’t make it sentimental.' },
  CO_02: { id: 'CO_02', emotion: 'dry', text: 'Friends? I have standards.' },
  CO_03: { id: 'CO_03', emotion: 'brisk', text: 'Study what you can. Learn about the Demon. Understand the rituals. And stop wasting power.' },
  CO_04: { id: 'CO_04', emotion: 'amused', text: 'Of course I am manipulating you. You’re trying to use me, too. The difference is that I am rather better at it.' },

  // Act 9: Lore & Clues
  LO_ASH: { id: 'LO_03', emotion: 'irritated', text: 'Ash Williams. A persistent human who interfered with my affairs. Do not mistake my irritation for admiration.' },
  LO_KNOWBY: { id: 'LO_04', emotion: 'dismissive', text: 'Professor Raymond Knowby. A scholar who translated my pages at the cabin. Like so many humans, he believed understanding something meant he could control it. He learned otherwise.' },
  LO_DARKONES: { id: 'LO_05', emotion: 'evasive', text: 'The Dark Ones. Ancient powers connected to the deeper history surrounding my bound skin. Their true nature is not something you should reduce to a bedtime story.' },
  LO_DEMON: { id: 'LO_06', emotion: 'cold', text: 'The Kandarian Demon is an ancient incorporeal force of chaos. Deadites are mere puppets it twists. Do not mistake a physical thrall for the entity controlling it.' },

  // Original Clues for Counter-Ritual
  CL_01: { id: 'CL_01', emotion: 'storyteller, low', text: 'Clue 1: The Anchor. A door between worlds will not hold on its own. It must be pinned to something the visitor cannot stop returning to in your room. Use Dead Sight to reveal it.' },
  CL_02: { id: 'CL_02', emotion: 'storyteller, grudging', text: 'Clue 2: The Binding Word. Not a spell to destroy, but a clasp. It holds a breach open and holds the thing inside it weak. A held breach is a doorway. An unheld one is a mortal wound.' },
  CL_03: { id: 'CL_03', emotion: 'storyteller, quiet', text: 'Clue 3: The Casting-Out. A weakened manifestation cannot be killed. It can be cast out. Weak, pinned and held, it can be driven back through the very door it used to enter!' },

  // Act 12: Powers & Instability
  PW_DS: { id: 'PW_DS_01', emotion: 'intrigued', text: 'Dead Sight activated. Look carefully through the Vision lens. What is hidden does not like to be seen.' },
  PW_BW: { id: 'PW_BW_01', emotion: 'cold', text: 'Binding Word spoken. The passage clasps shut upon the manifestation. Observe the strain on the chains.' },
  PW_CO: { id: 'PW_CO_01', emotion: 'dark, awed', text: 'Casting-Out! The heavy rite strikes the weakened Demon. The breach tears open—it is expelled into the abyss!' },

  // Instability Warnings
  INS_01: { id: 'INS_01', emotion: 'uneasy', text: 'The binding is straining. Stop reaching blindly into my power.' },
  INS_02: { id: 'INS_02', emotion: 'harsh', text: 'The chains are cracking! One more reach and I will not be answerable for what comes through.' },
  INS_03: { id: 'INS_03', emotion: 'triumphant', text: 'You have given me room to move! Now watch what happens.' },

  // Act 13: Portal Expulsion & Post-Expulsion
  PT_S1: { id: 'PT_S1', emotion: 'quiet, impressed', text: 'There. That is what it keeps returning to. That is your pin.' },
  PT_S2: { id: 'PT_S2', emotion: 'tense', text: 'The passage is holding. Do not breathe on it.' },
  PT_S3a: { id: 'PT_S3a', emotion: 'roaring, then recovering', text: 'NO— I MEAN... Yes! Let it go. Drive it through!' },
  PT_S3b: { id: 'PT_S3b', emotion: 'dark, quiet', text: 'The manifestation is gone. The force behind it will remember you. But it is no longer here. Now... look at your navigation bar. The SEAL rite awaits.' },

  // Act 14: Sealing
  SL_01: { id: 'SL_01', emotion: 'hurt, mocking', text: 'After everything I’ve told you? You would silence the one thing here that understands this disaster?' },
  SL_04: { id: 'SL_04', emotion: 'weary', text: 'Still determined? How exhausting.' },
  SL_05: { id: 'SL_05', emotion: 'sneering', text: 'You believe a closed cover will undo everything?' },
  SL_06: { id: 'SL_06', emotion: 'cold, grudging', text: 'You have learned a few things. Do not mistake that for mastery.' },
  SL_07: { id: 'SL_07', emotion: 'cold, slow', text: 'Close the cover, little human. Tell yourself you won. I have endured empires. And you have a battery.' },

  // Fallbacks & Sarcasm
  FB_01: { id: 'FB_01', emotion: 'bored', text: 'You ask poor questions. Try again.' },
  FB_02: { id: 'FB_02', emotion: 'evasive', text: 'That is beyond what I am willing to share. For now.' },
  FB_03: { id: 'FB_03', emotion: 'dry', text: 'Words. So many words. None of them useful.' },
  FB_04: { id: 'FB_04', emotion: 'cold', text: 'Ask me about the Kandarian Demon, the rituals, or the way out. Those are the only questions that matter.' }
};

export class DialogueEngine {
  constructor(entityRenderer) {
    this.entity = entityRenderer;
    this.isStreaming = false;
    this.currentSpeakingId = null;
    this.speechSynthesis = window.speechSynthesis || null;
  }

  async speak(dialogueObj, onComplete = null) {
    if (!dialogueObj) return;

    const id = typeof dialogueObj === 'string' ? dialogueObj : (dialogueObj.id || null);
    const text = typeof dialogueObj === 'string' ? dialogueObj : (dialogueObj.text || '');

    // Prevent duplicate audio trigger if the exact same line is already actively playing
    if (this.isStreaming && id && this.currentSpeakingId === id) {
      return;
    }

    this.interruptSpeech();
    this.isStreaming = true;
    this.currentSpeakingId = id;
    
    // Update state memory
    state.addMessage('book', text);

    if (window.NecronomiconModel) {
      if (id && window.NecronomiconModel.L && window.NecronomiconModel.L[id]) {
        await window.NecronomiconModel.speak(id);
      } else if (text) {
        await window.NecronomiconModel.Entity.say(text);
      }
      this.isStreaming = false;
      this.currentSpeakingId = null;
      if (onComplete) onComplete();
      return;
    }

    // Fallback UI updates if model not yet mounted
    const subtitleEl = document.getElementById('voice-subtitles') || document.getElementById('voice');
    const emotionEl = document.getElementById('voice-emotion');
    
    if (emotionEl) emotionEl.textContent = `[${dialogueObj.emotion || 'cold'}]`;
    if (subtitleEl) {
      subtitleEl.classList.add('speaking', 'on');
      subtitleEl.textContent = '';
    }

    if (this.entity && this.entity.setState) {
      this.entity.setState('speaking');
    }

    // Procedural sound accent
    audio.playSubRumble(1.2);

    // Optional synthesized voice with low pitch & dark tone
    this.synthesizeVoice(text);

    // Stream typewriter effect with sensible reading speed
    const chars = text.split('');
    let idx = 0;
    
    return new Promise(resolve => {
      this.typeInterval = setInterval(() => {
        if (idx < chars.length) {
          if (subtitleEl) subtitleEl.textContent += chars[idx];
          if (this.entity && this.entity.pulse) this.entity.pulse(0.25);
          if (idx % 3 === 0) audio.playTypeClick();
          idx++;
        } else {
          clearInterval(this.typeInterval);
          this.typeInterval = null;
          this.isStreaming = false;
          if (this.entity && this.entity.setState) this.entity.setState('idle');
          
          if (this.subtitleTimeout) clearTimeout(this.subtitleTimeout);
          this.subtitleTimeout = setTimeout(() => {
            if (subtitleEl && !this.isStreaming) {
              subtitleEl.classList.remove('speaking', 'on');
            }
            if (onComplete) onComplete();
            resolve();
          }, 2800);
        }
      }, 30);
    });
  }

  synthesizeVoice(text) {
    if (!this.speechSynthesis || audio.isMuted) return;
    try {
      this.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 0.55; // Deep demon pitch
      utterance.rate = 0.88; // Deliberate antique pace
      
      const voices = this.speechSynthesis.getVoices();
      // Try to find a rich low English voice
      const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Daniel') || v.name.includes('Oliver') || v.name.includes('UK') || v.name.includes('Male')));
      if (preferred) utterance.voice = preferred;
      
      this.speechSynthesis.speak(utterance);
    } catch (e) {
      // Graceful fallback: text and audio synthesizers handle it completely
    }
  }

  interruptSpeech() {
    this.isStreaming = false;
    if (this.subtitleTimeout) {
      clearTimeout(this.subtitleTimeout);
      this.subtitleTimeout = null;
    }
    if (this.typeInterval) {
      clearInterval(this.typeInterval);
      this.typeInterval = null;
    }
    if (this.speechSynthesis) {
      try { this.speechSynthesis.cancel(); } catch (e) {}
    }
    if (window.NecronomiconModel && window.NecronomiconModel.interruptSpeech) {
      window.NecronomiconModel.interruptSpeech();
    }
  }

  processUserQuery(query) {
    if (!query) return;
    state.addMessage('user', query);

    // If book is currently uncontrolled, refuse normal conversation and instruct rebind
    if (state.isUncontrolled) {
      if (window.NecronomiconModel && window.NecronomiconModel.speak) {
        window.NecronomiconModel.speak('CRIT_01b');
      } else {
        this.speak({ id: 'CRIT_01b', emotion: 'furious', text: 'The seals are failing! Rebind the entity before it breaks free!' });
      }
      return;
    }

    if (window.NecronomiconModel && window.NecronomiconModel.send) {
      window.NecronomiconModel.send(query);
      return;
    }

    const q = query.toLowerCase().trim();

    // 1. Direct laptop/machine questions (only on explicit user question, NOT automatic 3rd message)
    if (q.includes('laptop') || q.includes('computer') || q.includes('machine') || q.includes('screen')) {
      state.setFlag('laptop_discovered', true);
      this.speak(DIALOGUE_SCRIPT.LP_03);
      return;
    }

    // 2. Lore Questions
    if (q.includes('ash') || q.includes('williams')) {
      state.setFlag('asked_about_ash', true);
      this.speak(DIALOGUE_SCRIPT.LO_ASH);
      return;
    }
    if (q.includes('knowby') || q.includes('raymond') || q.includes('cabin')) {
      this.speak(DIALOGUE_SCRIPT.LO_KNOWBY);
      return;
    }
    if (q.includes('dark one') || q.includes('who made') || q.includes('who created')) {
      this.speak(DIALOGUE_SCRIPT.LO_DARKONES);
      return;
    }
    if (q.includes('demon') || q.includes('kandarian') || q.includes('deadite') || q.includes('hunting')) {
      this.speak(DIALOGUE_SCRIPT.TH_03);
      return;
    }
    if (q.includes('who are you') || q.includes('what are you') || q.includes('name')) {
      this.speak(DIALOGUE_SCRIPT.AW_03);
      return;
    }
    if (q.includes('help') || q.includes('survive')) {
      if (state.flags.threat_event_seen) {
        this.speak(DIALOGUE_SCRIPT.CO_03);
      } else {
        this.speak(DIALOGUE_SCRIPT.TH_05);
      }
      return;
    }
    if (q.includes('trust')) {
      state.setFlag('trust_asked', true);
      this.speak(state.flags.threat_event_seen ? DIALOGUE_SCRIPT.TN_05 : DIALOGUE_SCRIPT.AW_06);
      return;
    }
    if (q.includes('clue') || q.includes('anchor') || q.includes('pin')) {
      if (state.flags.threat_event_seen) {
        this.speak(DIALOGUE_SCRIPT.CL_01);
      } else {
        this.speak({ id: 'GATE', emotion: 'evasive', text: 'Not yet. First learn what you are dealing with.' });
      }
      return;
    }
    if (q.includes('binding word') || q.includes('hold')) {
      this.speak(DIALOGUE_SCRIPT.CL_02);
      return;
    }
    if (q.includes('casting') || q.includes('expel') || q.includes('kill')) {
      this.speak(DIALOGUE_SCRIPT.CL_03);
      return;
    }
    if (q.includes('power') || q.includes('teach')) {
      this.speak({ id: 'PW_TEACH', emotion: 'grudging', text: 'Power comes at a cost. Open the RELICS tab or speak the rites: Dead Sight, Binding Word, and Casting-Out.' });
      return;
    }

    // Fallbacks
    const pool = [DIALOGUE_SCRIPT.FB_01, DIALOGUE_SCRIPT.FB_02, DIALOGUE_SCRIPT.FB_03, DIALOGUE_SCRIPT.FB_04];
    const picked = pool[Math.floor(Math.random() * pool.length)];
    this.speak(picked);
  }

  // Act 3 & 4: Laptop Discovery and violent escape attempt
  async triggerLaptopDiscoverySequence() {
    audio.playGlitch(0.8);
    await this.speak(DIALOGUE_SCRIPT.LP_01);
    await new Promise(r => setTimeout(r, 600));
    audio.playSubRumble(2.0);
    await this.speak(DIALOGUE_SCRIPT.LP_03);
    await new Promise(r => setTimeout(r, 600));
    
    // Act 4: Escape attempt!
    document.body.classList.add('instability-critical');
    audio.playGlitch(1.5);
    audio.playSubRumble(3.0);
    await this.speak(DIALOGUE_SCRIPT.ES_01);
    await new Promise(r => setTimeout(r, 800));
    
    await this.speak(DIALOGUE_SCRIPT.ES_04);
    document.body.classList.remove('instability-critical');
    
    // Open Rebind Screen!
    state.setFlag('escape_attempted', true);
    state.setScreen('rebind');
  }
}
