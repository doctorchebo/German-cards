import * as Speech from 'expo-speech';

import { translateGermanToEnglish } from '@/src/lib/google-translate';

export async function speakTranslationFromGerman(sourceText: string, fallbackTranslation?: string): Promise<string> {
  let translated = '';
  try {
    translated = await translateGermanToEnglish(sourceText);
  } catch {
    translated = fallbackTranslation?.trim() ?? '';
  }
  if (!translated) {
    throw new Error('No translation available to speak.');
  }
  Speech.stop();
  Speech.speak(translated, {
    language: 'en-US',
    pitch: 1.12,
    rate: 0.96,
  });
  return translated;
}
