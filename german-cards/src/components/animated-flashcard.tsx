import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
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
  onSwipeProgress?: (dx: number) => void;
};

const SWIPE_THRESHOLD = 120;

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
  const gestureStart = useRef({ x: 0, y: 0 });

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
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (_evt, state) => {
          gestureStart.current = { x: state.x0, y: state.y0 };
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_evt, state) => {
          panX.setValue(state.dx);
          onSwipeProgress?.(state.dx);
        },
        onPanResponderRelease: (event, state) => {
          const moveX = Math.abs(state.moveX - gestureStart.current.x);
          const moveY = Math.abs(state.moveY - gestureStart.current.y);
          const isTap = moveX < 8 && moveY < 8 && Math.abs(state.dx) < 8 && Math.abs(state.dy) < 8;
          if (isTap) {
            resetCardPosition();
            onToggleReveal();
            return;
          }
          onRelease(event, state);
        },
        onPanResponderTerminate: onRelease,
      }),
    [onRelease, onSwipeProgress, onToggleReveal, panX, resetCardPosition]
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
      <Animated.View style={styles.cardButton} {...responder.panHandlers}>
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
      </Animated.View>
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
});
