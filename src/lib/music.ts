// src/lib/music.ts

//Instrument samples: FluidR3_GM (MIT License)
//Source: https://github.com/gleitz/midi-js-soundfonts

import Soundfont from 'soundfont-player';

export const NOTE_NAMES: Record<string, string> = {
  'c/4': 'Dó',
  'd/4': 'Ré',
  'e/4': 'Mi',
  'f/4': 'Fá',
  'g/4': 'Sol',
  'a/4': 'Lá',
  'b/4': 'Si',
  'c/5': 'Dó agudo',
  'd/5': 'Ré agudo',
  'e/5': 'Mi agudo',
  'f/5': 'Fá agudo',
  'g/5': 'Sol agudo',
  'a/5': 'Lá agudo',
  'b/5': 'Si agudo',
  'b/3': 'Si grave',
  'a/3': 'Lá grave',
  'g/3': 'Sol grave',
};

export const NOTE_FREQS: Record<string, number> = {
  'c/4': 261.63,
  'd/4': 293.66,
  'e/4': 329.63,
  'f/4': 349.23,
  'g/4': 392.00,
  'a/4': 440.00,
  'b/4': 493.88,
  'c/5': 523.25,
  'd/5': 587.33,
  'e/5': 659.25,
  'f/5': 698.46,
  'g/5': 783.99,
  'a/5': 880.00,
  'b/5': 987.77,
  'b/3': 246.94,
  'a/3': 220.00,
  'g/3': 196.00,
};

export const KEY_MAP: Record<string, string> = {
  'a': 'Dó',
  's': 'Ré',
  'd': 'Mi',
  'f': 'Fá',
  'j': 'Sol',
  'k': 'Lá',
  'l': 'Si',
};

export const NOTES = Object.keys(NOTE_NAMES);

// Mapeamento interno -> General MIDI
const INSTRUMENT_MAP: Record<string, string> = {
  piano: 'acoustic_grand_piano',
  flauta: 'flute',
  violino: 'violin',
};

// Cache de instrumentos carregados
const instrumentCache: Record<string, any> = {};
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Carrega (ou usa cache) o instrumento
async function loadInstrument(instrument: string): Promise<any> {
  const gmName = INSTRUMENT_MAP[instrument] || 'acoustic_grand_piano';
  if (instrumentCache[gmName]) {
    return instrumentCache[gmName];
  }

  const ctx = getAudioContext();
  // Por padrão, o Soundfont buscará os samples no CDN do FluidR3_GM
  const player = await Soundfont.instrument(ctx, gmName);
  instrumentCache[gmName] = player;
  return player;
}

// Toca a nota usando samples reais
export async function playNote(noteKey: string, instrument: string = 'piano', volume: number = 0.7) {
  if (!NOTE_FREQS[noteKey]) return;

  try {
    const player = await loadInstrument(instrument);
    // Converte o formato VexFlow (ex: 'c/4') para o formato aceito pelo soundfont-player (ex: 'C4')
    const parts = noteKey.split('/');
    const noteName = parts[0].toUpperCase(); // ex: C, D, E
    const octave = parts[1];                 // ex: 4, 5
    const midiNote = `${noteName}${octave}`;

    player.play(midiNote, undefined, {
      duration: 0.8,
      gain: volume * 3.0,
    });
  } catch (error) {
    console.warn('Falha ao carregar instrumento, usando fallback silencioso.', error);
  }
}

// Extrai o nome base (ex: "Dó agudo" -> "Dó")
export function getBaseNoteName(fullName: string): string {
  return fullName.split(' ')[0];
}

// Gera uma nota aleatória dentro das disponíveis
export function getRandomNote(unlockedNotes: number, previousNote: string): string {
  const available = NOTES.slice(0, unlockedNotes);
  let next: string;
  do {
    next = available[Math.floor(Math.random() * available.length)];
  } while (next === previousNote && available.length > 1);
  return next;
}

// Pré-carrega o instrumento para reduzir latência na primeira nota
export async function preloadInstrument(instrument: string) {
  try {
    await loadInstrument(instrument);
    console.log(`Instrumento ${instrument} carregado.`);
  } catch (error) {
    console.warn(`Falha ao pré-carregar instrumento ${instrument}:`, error);
  }
}

export function playClickSound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';           // som suave
  osc.frequency.value = 800;   // frequência agradável
  gain.gain.setValueAtTime(0.04, ctx.currentTime);  // volume baixo
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.03);
}

export function playWrongSound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';                  // ou 'triangle' para um timbre mais suave
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.25);

  gain.gain.setValueAtTime(0.08, ctx.currentTime); // volume baixo
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.25);
}

export function playGameOverSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Tom descendente suave, como um "game over" amigável
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.8);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.8);
}