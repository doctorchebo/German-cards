import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { playCompletionFeedbackSound } from '@/src/lib/feedback-sound';
import { getCompletionFeedback } from '@/src/lib/results-feedback';

const CONFETTI_COLORS = ['#0f766e', '#2563eb', '#f59e0b', '#e11d48', '#7c3aed'];
const CONFETTI_PIECES = Array.from({ length: 44 }, (_, index) => ({
  id: index,
  color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
  leftRatio: ((index * 37) % 100) / 100,
  delay: (index % 11) * 90,
  duration: 2200 + (index % 5) * 180,
  size: 7 + (index % 4) * 2,
  rotate: index % 2 === 0 ? '360deg' : '-360deg',
}));

function ConfettiOverlay() {
  const { height, width } = useWindowDimensions();
  const animations = useRef(CONFETTI_PIECES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const runners = animations.map((animation, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(CONFETTI_PIECES[index].delay),
          Animated.timing(animation, {
            toValue: 1,
            duration: CONFETTI_PIECES[index].duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    runners.forEach((runner) => runner.start());
    return () => {
      runners.forEach((runner) => runner.stop());
    };
  }, [animations]);

  return (
    <View pointerEvents="none" style={styles.confettiOverlay}>
      {CONFETTI_PIECES.map((piece, index) => {
        const progress = animations[index];
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-40, height + 60],
        });
        const translateX = progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, index % 2 === 0 ? 28 : -28, index % 3 === 0 ? -18 : 18],
        });
        const rotate = progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', piece.rotate],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.12, 0.86, 1],
          outputRange: [0, 1, 1, 0],
        });

        return (
          <Animated.View
            key={piece.id}
            style={[
              styles.confettiPiece,
              {
                left: piece.leftRatio * width,
                width: piece.size,
                height: piece.size * 1.8,
                backgroundColor: piece.color,
                opacity,
                transform: [{ translateX }, { translateY }, { rotate }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ right?: string; wrong?: string; wrongIds?: string; size?: string; mode?: string }>();

  const right = Number(params.right ?? 0);
  const wrong = Number(params.wrong ?? 0);
  const wrongIds = (params.wrongIds ?? '').trim();
  const size = Number(params.size ?? 50);
  const safeSize = size === 10 || size === 25 || size === 50 ? size : 50;
  const mode = params.mode === 'en-de' ? 'en-de' : 'de-en';

  const total = right + wrong;
  const score = total > 0 ? Math.round((right / total) * 100) : 0;
  const completionFeedback = useMemo(() => getCompletionFeedback(score), [score]);

  useEffect(() => {
    if (completionFeedback) {
      playCompletionFeedbackSound(completionFeedback);
    }
  }, [completionFeedback]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {completionFeedback === 'excellent' ? <ConfettiOverlay /> : null}
      <View style={styles.container}>
        <Text style={styles.title}>Drill Complete</Text>
        <Text style={styles.score}>{score}%</Text>
        <Text style={styles.summary}>
          Right: {right} | Wrong: {wrong}
        </Text>

        <Pressable style={styles.primaryButton} onPress={() => router.replace(`/drill?size=${safeSize}&mode=${mode}`)}>
          <Text style={styles.primaryButtonText}>Start New Random Drill</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, !wrongIds && styles.disabled]}
          disabled={!wrongIds}
          onPress={() =>
            router.replace(`/drill?retryIds=${encodeURIComponent(wrongIds)}&size=${safeSize}&mode=${mode}`)
          }>
          <Text style={styles.secondaryButtonText}>Retry Wrong Cards</Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/(tabs)')} style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Back To Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 14,
    zIndex: 2,
  },
  confettiOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 10,
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0f172a',
  },
  score: {
    fontSize: 62,
    fontWeight: '900',
    color: '#0f766e',
  },
  summary: {
    fontSize: 18,
    color: '#334155',
    marginBottom: 10,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#0f766e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
  ghostButton: {
    marginTop: 8,
  },
  ghostButtonText: {
    color: '#334155',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
