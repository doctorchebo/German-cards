import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

type FeedbackType = 'right' | 'wrong';
type CompletionFeedbackType = 'excellent' | 'bad';

let configured = false;
let correctSound: AudioPlayer | null = null;
let wrongSound: AudioPlayer | null = null;
let excellentSound: AudioPlayer | null = null;
let badSound: AudioPlayer | null = null;

const WRONG_SOUND_URI = 'https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg';
const CORRECT_SOUND_ASSET = require('../../assets/sounds/ding.mp3');
const EXCELLENT_SOUND_ASSET = require('../../assets/sounds/excelent.mp3');
const BAD_SOUND_ASSET = require('../../assets/sounds/bad.mp3');

async function configureAudio() {
  if (configured) return;
  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'duckOthers',
  });
  configured = true;
}

async function ensureLoaded() {
  await configureAudio();

  if (!correctSound) {
    correctSound = createAudioPlayer(CORRECT_SOUND_ASSET, { downloadFirst: true });
  }

  if (!wrongSound) {
    wrongSound = createAudioPlayer(WRONG_SOUND_URI, { downloadFirst: true });
  }
}

async function ensureCompletionSoundLoaded(type: CompletionFeedbackType) {
  await configureAudio();

  if (type === 'excellent' && !excellentSound) {
    excellentSound = createAudioPlayer(EXCELLENT_SOUND_ASSET, { downloadFirst: true });
  }

  if (type === 'bad' && !badSound) {
    badSound = createAudioPlayer(BAD_SOUND_ASSET, { downloadFirst: true });
  }
}

export async function preloadFeedbackSounds() {
  try {
    await ensureLoaded();
  } catch {
    // Keep app flow resilient if remote sound cannot load.
  }
}

export async function playFeedbackSound(type: FeedbackType) {
  try {
    await ensureLoaded();
    const sound = type === 'right' ? correctSound : wrongSound;
    if (!sound) return;
    await sound.seekTo(0);
    sound.play();
  } catch {
    // Silent fallback.
  }
}

export async function playCompletionFeedbackSound(type: CompletionFeedbackType) {
  try {
    await ensureCompletionSoundLoaded(type);
    const sound = type === 'excellent' ? excellentSound : badSound;
    if (!sound) return;
    await sound.seekTo(0);
    sound.play();
  } catch {
    // Silent fallback.
  }
}

export async function unloadFeedbackSounds() {
  if (correctSound) {
    correctSound.remove();
    correctSound = null;
  }
  if (wrongSound) {
    wrongSound.remove();
    wrongSound = null;
  }
  if (excellentSound) {
    excellentSound.remove();
    excellentSound = null;
  }
  if (badSound) {
    badSound.remove();
    badSound = null;
  }
}
