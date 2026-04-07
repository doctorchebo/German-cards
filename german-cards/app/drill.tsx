import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedFlashcard } from '@/src/components/animated-flashcard';
import { createDrillSession, recordAttempt } from '@/src/db/sqlite';
import { playFeedbackSound, preloadFeedbackSounds, unloadFeedbackSounds } from '@/src/lib/feedback-sound';
import { isAnswerCorrect } from '@/src/lib/text';
import type { DrillSession } from '@/src/types/card';

type Feedback = {
  type: 'right' | 'wrong' | null;
  message: string;
};

export default function DrillScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ retryIds?: string; size?: string }>();
  const retryIdsParam = typeof params.retryIds === 'string' ? params.retryIds : '';
  const sizeParam = typeof params.size === 'string' ? Number(params.size) : NaN;
  const drillSize = sizeParam === 10 || sizeParam === 25 || sizeParam === 50 ? sizeParam : 50;

  const [session, setSession] = useState<DrillSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [inputAnswer, setInputAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback>({ type: null, message: '' });
  const [answeredCurrent, setAnsweredCurrent] = useState(false);
  const [right, setRight] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [wrongCardIds, setWrongCardIds] = useState<number[]>([]);

  const retryIds = useMemo(
    () =>
      (retryIdsParam ?? '')
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0),
    [retryIdsParam]
  );

  useEffect(() => {
    preloadFeedbackSounds();
    return () => {
      unloadFeedbackSounds();
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const drill = await createDrillSession(retryIds, drillSize);
      if (active) {
        setSession(drill);
      }
    })();

    return () => {
      active = false;
    };
  }, [drillSize, retryIds, retryIdsParam]);

  const currentCard = session?.cards[currentIndex];

  const moveNext = () => {
    if (!session) return;
    if (currentIndex >= session.cards.length - 1) {
      const query = new URLSearchParams({
        right: String(right),
        wrong: String(wrong),
        wrongIds: wrongCardIds.join(','),
      }).toString();
      router.replace(`/results?${query}`);
      return;
    }
    setCurrentIndex((value) => value + 1);
    setRevealed(false);
    setInputAnswer('');
    setFeedback({ type: null, message: '' });
    setAnsweredCurrent(false);
  };

  const submitResult = async (isRight: boolean, method: 'input' | 'swipe-left-know' | 'swipe-right-dont-know') => {
    if (!session || !currentCard || answeredCurrent) return;

    await recordAttempt(session.drillId, currentCard.id, isRight, method, method === 'input' ? inputAnswer : null);
    setAnsweredCurrent(true);

    if (isRight) {
      await playFeedbackSound('right');
      setRight((count) => count + 1);
      setFeedback({ type: 'right', message: 'Correct. Nice work.' });
    } else {
      await playFeedbackSound('wrong');
      setWrong((count) => count + 1);
      setWrongCardIds((ids) => [...ids, currentCard.id]);
      setFeedback({ type: 'wrong', message: `Not quite. Answer: ${currentCard.answer}` });
    }

    setTimeout(() => {
      moveNext();
    }, 650);
  };

  const checkInput = async () => {
    if (!currentCard || answeredCurrent) return;
    const correct = isAnswerCorrect(currentCard.answer, inputAnswer);
    await submitResult(correct, 'input');
  };

  if (!session || !currentCard) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Preparing your drill...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.progress}>
          Card {currentIndex + 1} / {session.cards.length}
        </Text>

        <AnimatedFlashcard
          frontText={currentCard.prompt}
          backText={currentCard.answer}
          revealed={revealed}
          onToggleReveal={() => setRevealed((value) => !value)}
          onSwipeLeft={() => submitResult(true, 'swipe-left-know')}
          onSwipeRight={() => submitResult(false, 'swipe-right-dont-know')}
        />

        <View style={styles.answerBox}>
          <Text style={styles.inputLabel}>Type translation (optional)</Text>
          <TextInput
            value={inputAnswer}
            onChangeText={setInputAnswer}
            style={styles.input}
            placeholder="Type your English translation"
            placeholderTextColor="#94a3b8"
            autoCorrect={false}
          />
          <Pressable onPress={checkInput} disabled={answeredCurrent} style={styles.checkButton}>
            <Text style={styles.checkButtonText}>Check Answer</Text>
          </Pressable>
        </View>

        {feedback.type ? (
          <View style={[styles.feedback, feedback.type === 'right' ? styles.feedbackRight : styles.feedbackWrong]}>
            <Text style={styles.feedbackText}>{feedback.message}</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ecf7f5',
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 14,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '600',
  },
  progress: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '700',
    textAlign: 'center',
  },
  answerBox: {
    marginTop: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d2e8e4',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  inputLabel: {
    color: '#334155',
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cad8e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0f172a',
    fontSize: 16,
    backgroundColor: '#f8fbfd',
  },
  checkButton: {
    marginTop: 4,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkButtonText: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  feedback: {
    borderRadius: 12,
    padding: 12,
  },
  feedbackRight: {
    backgroundColor: '#d1fae5',
  },
  feedbackWrong: {
    backgroundColor: '#ffe4e6',
  },
  feedbackText: {
    fontWeight: '700',
    color: '#1e293b',
  },
});
