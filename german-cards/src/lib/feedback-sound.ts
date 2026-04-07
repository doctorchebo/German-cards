import { Audio } from 'expo-av';

type FeedbackType = 'right' | 'wrong';

let configured = false;
let correctSound: Audio.Sound | null = null;
let wrongSound: Audio.Sound | null = null;

const CORRECT_SOUND_URI =
  'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg';
const WRONG_SOUND_URI = 'https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg';

async function configureAudio() {
  if (configured) return;
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
  });
  configured = true;
}

async function ensureLoaded() {
  await configureAudio();

  if (!correctSound) {
    correctSound = new Audio.Sound();
    await correctSound.loadAsync({ uri: CORRECT_SOUND_URI });
  }

  if (!wrongSound) {
    wrongSound = new Audio.Sound();
    await wrongSound.loadAsync({ uri: WRONG_SOUND_URI });
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
    await sound.replayAsync();
  } catch {
    // Silent fallback.
  }
}

export async function unloadFeedbackSounds() {
  if (correctSound) {
    await correctSound.unloadAsync();
    correctSound = null;
  }
  if (wrongSound) {
    await wrongSound.unloadAsync();
    wrongSound = null;
  }
}

