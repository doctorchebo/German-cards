import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';

type Props = {
  frontText: string;
  backText: string;
  revealed: boolean;
  onToggleReveal: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

const SWIPE_THRESHOLD = 120;

export function AnimatedFlashcard({
  frontText,
  backText,
  revealed,
  onToggleReveal,
  onSwipeLeft,
  onSwipeRight,
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
    Animated.spring(panX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 8,
    }).start();
  }, [panX]);

  const completeSwipe = useCallback((direction: 'left' | 'right') => {
    Animated.timing(panX, {
      toValue: direction === 'left' ? -460 : 460,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      panX.setValue(0);
      if (direction === 'left') {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    });
  }, [onSwipeLeft, onSwipeRight, panX]);

  const onRelease = useCallback(
    (_event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      if (gestureState.dx <= -SWIPE_THRESHOLD) {
        completeSwipe('left');
        return;
      }
      if (gestureState.dx >= SWIPE_THRESHOLD) {
        completeSwipe('right');
        return;
      }
      resetCardPosition();
    },
    [completeSwipe, resetCardPosition]
  );

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, state) => Math.abs(state.dx) > 10,
        onPanResponderMove: (_evt, state) => {
          panX.setValue(state.dx);
        },
        onPanResponderRelease: onRelease,
        onPanResponderTerminate: onRelease,
      }),
    [onRelease, panX]
  );

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
      <Pressable style={styles.cardButton} onPress={onToggleReveal} {...responder.panHandlers}>
        <Animated.View
          style={[
            styles.cardFace,
            styles.frontFace,
            { opacity: frontOpacity, transform: [{ rotateY: frontRotation }] },
          ]}>
          <Text style={styles.topLabel}>German</Text>
          <Text style={styles.cardPrompt}>{frontText}</Text>
          <Text style={styles.tapHint}>Tap to reveal translation</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.cardFace,
            styles.backFace,
            { opacity: backOpacity, transform: [{ rotateY: backRotation }] },
          ]}>
          <Text style={styles.topLabel}>English</Text>
          <Text style={styles.cardAnswer}>{backText}</Text>
          <Text style={styles.tapHint}>Tap to hide</Text>
        </Animated.View>
      </Pressable>
      <View style={styles.swipeHints}>
        <Text style={styles.know}>Swipe left: I know it</Text>
        <Text style={styles.dontKnow}>Swipe right: I do not know it</Text>
      </View>
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
    fontSize: 34,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  cardAnswer: {
    fontSize: 30,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  tapHint: {
    fontSize: 14,
    textAlign: 'center',
    color: '#64748b',
  },
  swipeHints: {
    width: '100%',
    marginTop: 14,
    gap: 3,
    alignItems: 'center',
  },
  know: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '600',
  },
  dontKnow: {
    color: '#9f1239',
    fontSize: 12,
    fontWeight: '600',
  },
});
