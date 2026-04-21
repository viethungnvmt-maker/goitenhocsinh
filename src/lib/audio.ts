import * as Tone from 'tone';

type ThemeName = 'dark' | 'light' | 'cute';

// Dev-only debug hook so you can inspect audio state from devtools: `window.__audioDebug.state`
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).__audioDebug = {
    Tone,
    get state() {
      return {
        ctx: Tone.getContext().state,
        transport: Tone.getTransport().state,
        bpm: Tone.getTransport().bpm.value,
        initialized,
        ambientEnabled,
        soundEnabled,
        hasPadSynth: !!padSynth,
        hasAmbientLoop: !!ambientLoop,
      };
    },
  };
}

// ===== Instrument handles =====
let polySynth: Tone.PolySynth | null = null;
let noiseSynth: Tone.NoiseSynth | null = null;
let membraneSynth: Tone.MembraneSynth | null = null;
let metalSynth: Tone.MetalSynth | null = null;
let plinkSynth: Tone.PolySynth | null = null;
let padSynth: Tone.PolySynth | null = null;
let reverb: Tone.Reverb | null = null;
let chorus: Tone.Chorus | null = null;
let filter: Tone.Filter | null = null;

// ===== Ambient state =====
let ambientLoop: Tone.Loop | null = null;
let melodyLoop: Tone.Loop | null = null;

// ===== Flags =====
let soundEnabled = true;
let ambientEnabled = false;
let initialized = false;
let initPromise: Promise<void> | null = null;

export const isSoundEnabled = () => soundEnabled;
export const isAmbientOn = () => ambientEnabled;

export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
  if (!enabled) stopAmbient();
};

export const setAmbientEnabled = (enabled: boolean) => {
  ambientEnabled = enabled;
};

/**
 * Initializes Tone.js and all instruments. Must be called from a user-gesture
 * context the first time (e.g. a click handler) so the AudioContext unlocks.
 */
export const initSound = async (): Promise<void> => {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await Tone.start();

      reverb = new Tone.Reverb({ decay: 2.5, wet: 0.22 }).toDestination();
      await reverb.generate();

      chorus = new Tone.Chorus({ frequency: 1.8, delayTime: 3, depth: 0.6, wet: 0.25 }).connect(reverb);
      chorus.start();

      filter = new Tone.Filter({ frequency: 5000, type: 'lowpass' }).connect(chorus);

      polySynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.4 },
      }).connect(filter);
      polySynth.volume.value = -8;

      noiseSynth = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.002, decay: 0.08, sustain: 0 },
      }).toDestination();
      noiseSynth.volume.value = -14;

      membraneSynth = new Tone.MembraneSynth({
        pitchDecay: 0.08,
        octaves: 6,
        envelope: { attack: 0.001, decay: 0.5, sustain: 0 },
      }).toDestination();
      membraneSynth.volume.value = -6;

      metalSynth = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.3, release: 0.1 },
        harmonicity: 3.1,
        modulationIndex: 16,
        resonance: 2000,
        octaves: 1.2,
      }).connect(reverb);
      metalSynth.volume.value = -24;

      // Polyphonic plink so rapid triggers (ticks / coins) don't collide.
      plinkSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.002, decay: 0.15, sustain: 0, release: 0.15 },
      }).connect(reverb);
      plinkSynth.volume.value = -10;

      padSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine4' },
        envelope: { attack: 1.2, decay: 0.3, sustain: 0.6, release: 2.5 },
      }).connect(reverb);
      padSynth.volume.value = -18;

      initialized = true;
    } catch (err) {
      console.error('[audio] init failed', err);
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
};

// Small helper: guarantee init + safely run block
const withAudio = (fn: () => void) => {
  if (!soundEnabled) return;
  initSound()
    .then(() => {
      try { fn(); } catch (e) { console.warn('[audio] sfx error', e); }
    })
    .catch(() => {});
};

/* ---------- SFX ---------- */

export const playTick = () => withAudio(() => {
  plinkSynth?.triggerAttackRelease('C6', '32n');
});

export const playClick = () => withAudio(() => {
  noiseSynth?.triggerAttackRelease('32n');
});

export const playWin = () => withAudio(() => {
  const now = Tone.now();
  const notes = ['C5', 'E5', 'G5', 'B5', 'C6', 'E6', 'G6'];
  notes.forEach((n, i) => polySynth?.triggerAttackRelease(n, '16n', now + i * 0.08));
  polySynth?.triggerAttackRelease(['C4', 'E4', 'G4'], '2n', now + 0.6);
  metalSynth?.triggerAttackRelease('16n', now + 0.55, 0.5);
});

export const playBoom = () => withAudio(() => {
  const now = Tone.now();
  membraneSynth?.triggerAttackRelease('C1', '2n', now);
  membraneSynth?.triggerAttackRelease('F0', '2n', now + 0.04);
  noiseSynth?.triggerAttackRelease('4n', now);
  noiseSynth?.triggerAttackRelease('8n', now + 0.1);
});

export const playSuspense = () => withAudio(() => {
  const now = Tone.now();
  const notes = ['C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3'];
  notes.forEach((n, i) => polySynth?.triggerAttackRelease(n, '8n', now + i * 0.08, 0.7));
  metalSynth?.triggerAttackRelease('4n', now + 0.6, 0.4);
});

export const playCheer = () => withAudio(() => {
  const now = Tone.now();
  const scale = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5', 'C6'];
  scale.forEach((n, i) => polySynth?.triggerAttackRelease(n, '32n', now + i * 0.04));
  polySynth?.triggerAttackRelease(['C5', 'E5', 'G5', 'C6'], '4n', now + 0.5);
});

export const playDrumroll = () => withAudio(() => {
  const now = Tone.now();
  for (let i = 0; i < 20; i++) {
    membraneSynth?.triggerAttackRelease('C2', '32n', now + i * 0.05, 0.5);
  }
  membraneSynth?.triggerAttackRelease('C1', '4n', now + 1.0);
  metalSynth?.triggerAttackRelease('4n', now + 1.0, 0.5);
});

export const playWhoosh = () => withAudio(() => {
  if (!filter) return;
  const now = Tone.now();
  filter.frequency.cancelScheduledValues(now);
  filter.frequency.setValueAtTime(200, now);
  filter.frequency.exponentialRampToValueAtTime(8000, now + 0.3);
  noiseSynth?.triggerAttackRelease('8n', now);
  setTimeout(() => filter?.frequency.rampTo(5000, 0.1), 400);
});

export const playCoin = () => withAudio(() => {
  const now = Tone.now();
  plinkSynth?.triggerAttackRelease('E6', '16n', now);
  plinkSynth?.triggerAttackRelease('B6', '16n', now + 0.08);
  plinkSynth?.triggerAttackRelease('E7', '8n', now + 0.16);
});

/* ---------- AMBIENT BACKGROUND MUSIC ---------- */

const AMBIENT_PATTERNS: Record<ThemeName, { chords: string[][]; bpm: number; melody: string[] }> = {
  dark: {
    chords: [
      ['A2', 'E3', 'A3', 'C4'],
      ['G2', 'D3', 'G3', 'B3'],
      ['F2', 'C3', 'F3', 'A3'],
      ['E2', 'B2', 'E3', 'G3'],
    ],
    bpm: 60,
    melody: ['A4', 'C5', 'E5', 'G4', 'A4', 'C5', 'D5', 'E5'],
  },
  light: {
    chords: [
      ['C3', 'E3', 'G3', 'C4'],
      ['A2', 'E3', 'A3', 'C4'],
      ['F2', 'A2', 'C3', 'F3'],
      ['G2', 'D3', 'G3', 'B3'],
    ],
    bpm: 72,
    melody: ['E5', 'G5', 'A5', 'C6', 'G5', 'E5', 'D5', 'C5'],
  },
  cute: {
    chords: [
      ['C4', 'E4', 'G4', 'C5'],
      ['A3', 'C4', 'E4', 'A4'],
      ['F3', 'A3', 'C4', 'F4'],
      ['G3', 'B3', 'D4', 'G4'],
    ],
    bpm: 96,
    melody: ['C5', 'E5', 'G5', 'A5', 'C6', 'A5', 'G5', 'E5'],
  },
};

export const startAmbient = async (theme: ThemeName) => {
  if (!soundEnabled) return;

  try {
    await initSound();
  } catch {
    return;
  }
  if (!padSynth || !plinkSynth) return;

  // Stop any existing ambient cleanly before starting a new one.
  // (stopAmbient also flips ambientEnabled to false — we re-enable below.)
  stopAmbient();
  ambientEnabled = true;

  const pattern = AMBIENT_PATTERNS[theme];
  Tone.Transport.bpm.value = pattern.bpm;

  let chordIdx = 0;
  let melodyIdx = 0;

  ambientLoop = new Tone.Loop((time) => {
    if (!ambientEnabled || !padSynth) return;
    try {
      const chord = pattern.chords[chordIdx % pattern.chords.length];
      padSynth.triggerAttackRelease(chord, '2n', time, 0.3);
      chordIdx++;
    } catch (e) {
      console.warn('[audio] ambient chord error', e);
    }
  }, '2n').start(0);

  melodyLoop = new Tone.Loop((time) => {
    if (!ambientEnabled || !plinkSynth) return;
    try {
      if (Math.random() < 0.55) {
        const n = pattern.melody[melodyIdx % pattern.melody.length];
        plinkSynth.triggerAttackRelease(n, '16n', time, 0.35);
        melodyIdx++;
      }
    } catch (e) {
      console.warn('[audio] ambient melody error', e);
    }
  }, '4n').start('8n');

  // Reset transport to 0 so the loop's scheduled start fires immediately.
  Tone.Transport.position = 0;
  if (Tone.Transport.state !== 'started') {
    Tone.Transport.start('+0.05');
  }
};

export const stopAmbient = () => {
  ambientEnabled = false;
  try {
    if (ambientLoop) { ambientLoop.stop(0); ambientLoop.dispose(); ambientLoop = null; }
    if (melodyLoop) { melodyLoop.stop(0); melodyLoop.dispose(); melodyLoop = null; }
    if (initialized) {
      Tone.Transport.stop();
      Tone.Transport.cancel(0);
    }
  } catch (e) {
    console.warn('[audio] stopAmbient error', e);
  }
};
