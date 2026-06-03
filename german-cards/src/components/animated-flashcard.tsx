import { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { getSwipeDirection } from '@/src/lib/swipe';

type Props = {
  frontText: string;
  backText: string;
  revealed: boolean;
  onToggleReveal: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeProgress?: (dx: number) => void;
};

function getFontSize(length: number, base: number): number {
  if (length < 30) return base;
  if (length < 60) return base - 6;
  if (length < 100) return base - 12;
  if (length < 150) return base - 16;
  return base - 20;
}

export function AnimatedFlashcard({
  frontText,
  backText,
  revealed,
  onToggleReveal,
  onSwipeLeft,
  onSwipeRight,
  onSwipeProgress,
}: Props) {
  const panX = useRef(new Animated.Value(0)).current;
  const cardEntrance = useRef(new Animated.Value(0)).current;
  const flip = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(cardEntrance, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
    }).start();
  }, [cardEntrance, frontText]);

  useEffect(() => {
    Animated.timing(flip, {
      toValue: revealed ? 1 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [flip, revealed]);

  const resetCardPosition = useCallback(() => {
    onSwipeProgress?.(0);
    Animated.spring(panX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 8,
    }).start();
  }, [onSwipeProgress, panX]);

  const completeSwipe = useCallback((direction: 'left' | 'right') => {
    Animated.timing(panX, {
      toValue: direction === 'left' ? -460 : 460,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      panX.setValue(0);
      onSwipeProgress?.(0);
      if (direction === 'left') {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    });
  }, [onSwipeLeft, onSwipeProgress, onSwipeRight, panX]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-24, 24])
    .runOnJS(true)
    .onUpdate((event) => {
      panX.setValue(event.translationX);
      onSwipeProgress?.(event.translationX);
    })
    .onEnd((event) => {
      const direction = getSwipeDirection(event.translationX);
      if (direction) {
        completeSwipe(direction);
        return;
      }
      resetCardPosition();
    });

  const tapGesture = Gesture.Tap()
    .maxDistance(8)
    .runOnJS(true)
    .onEnd(() => {
      resetCardPosition();
      onToggleReveal();
    });

  const cardGesture = Gesture.Exclusive(panGesture, tapGesture);

  const tilt = panX.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const frontRotation = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotation = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });
  const frontOpacity = flip.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });
  const backOpacity = flip.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const frontFontSize = getFontSize(frontText.length, 34);
  const backFontSize = getFontSize(backText.length, 30);

  return (
    <Animated.View
      style={[
        styles.animatedContainer,
        {
          transform: [
            { translateY: cardEntrance.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) },
            { scale: cardEntrance.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
            { translateX: panX },
            { rotate: tilt },
          ],
          opacity: cardEntrance,
        },
      ]}>
      <GestureDetector gesture={cardGesture}>
        <Animated.View style={styles.cardButton}>
          <Animated.View
            style={[
              styles.cardFace,
              styles.frontFace,
              { opacity: frontOpacity, transform: [{ rotateY: frontRotation }] },
            ]}>
            <Text style={styles.topLabel}>German</Text>
            <View style={styles.cardTextWrap}>
              <Text style={[styles.cardPrompt, { fontSize: frontFontSize }]} numberOfLines={0} adjustsFontSizeToFit>
                {frontText}
              </Text>
            </View>
            <Text style={styles.tapHint}>Tap to reveal translation</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.cardFace,
              styles.backFace,
              { opacity: backOpacity, transform: [{ rotateY: backRotation }] },
            ]}>
            <Text style={[styles.topLabel, { color: '#94a3b8' }]}>English</Text>
            <View style={styles.cardTextWrap}>
              <Text style={[styles.cardAnswer, { fontSize: backFontSize }]} numberOfLines={0} adjustsFontSizeToFit>
                {backText}
              </Text>
            </View>
            <Text style={styles.tapHint}>Tap to hide</Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    width: '100%',
    alignItems: 'center',
  },
  cardButton: {
    width: '100%',
    maxWidth: 420,
    height: 260,
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 22,
    padding: 22,
    backfaceVisibility: 'hidden',
    shadowColor: '#111827',
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
    justifyContent: 'space-between',
  },
  cardTextWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  frontFace: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe2ef',
  },
  backFace: {
    backgroundColor: '#0f172a',
  },
  topLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#64748b',
  },
  cardPrompt: {
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: undefined,
  },
  cardAnswer: {
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    lineHeight: undefined,
  },
  tapHint: {
    fontSize: 14,
    textAlign: 'center',
    color: '#64748b',
  },
});
