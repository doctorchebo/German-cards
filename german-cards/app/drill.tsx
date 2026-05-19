import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedFlashcard } from "@/src/components/animated-flashcard";
import { createDrillSession, recordAttempt } from "@/src/db/firebase-db";
import {
  playFeedbackSound,
  preloadFeedbackSounds,
  unloadFeedbackSounds,
} from "@/src/lib/feedback-sound";
import { isAnswerCorrect } from "@/src/lib/text";
import type { DrillSession } from "@/src/types/card";

type Feedback = {
  type: "right" | "wrong" | null;
  message: string;
};

export default function DrillScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    retryIds?: string;
    size?: string;
    mode?: string;
  }>();
  const retryIdsParam =
    typeof params.retryIds === "string" ? params.retryIds : "";
  const sizeParam = typeof params.size === "string" ? Number(params.size) : NaN;
  const drillSize =
    sizeParam === 10 || sizeParam === 25 || sizeParam === 50 ? sizeParam : 50;
  const mode = params.mode === "en-de" ? "en-de" : "de-en";

  const [session, setSession] = useState<DrillSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [inputAnswer, setInputAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback>({
    type: null,
    message: "",
  });
  const [answeredCurrent, setAnsweredCurrent] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [swipeDx, setSwipeDx] = useState(0);
  const resultRef = useRef<{
    right: number;
    wrong: number;
    wrongCardIds: number[];
  }>({
    right: 0,
    wrong: 0,
    wrongCardIds: [],
  });

  const retryIds = useMemo(
    () =>
      (retryIdsParam ?? "")
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0),
    [retryIdsParam],
  );

  useEffect(() => {
    preloadFeedbackSounds();
    return () => {
      Speech.stop();
      unloadFeedbackSounds();
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setCurrentIndex(0);
      setRevealed(false);
      setInputAnswer("");
      setFeedback({ type: null, message: "" });
      setAnsweredCurrent(false);
      resultRef.current = { right: 0, wrong: 0, wrongCardIds: [] };

      const drill = await createDrillSession(retryIds, drillSize);
      if (active) {
        setSession(drill);
      }
    })();

    return () => {
      active = false;
    };
  }, [drillSize, retryIds, retryIdsParam, mode]);

  const currentCard = session?.cards[currentIndex];
  const frontText =
    mode === "de-en"
      ? (currentCard?.prompt ?? "")
      : (currentCard?.answer ?? "");
  const backText =
    mode === "de-en"
      ? (currentCard?.answer ?? "")
      : (currentCard?.prompt ?? "");
  const expectedInput = backText;
  const swipeIndicatorOpacity = Math.min(Math.abs(swipeDx) / 120, 1);

  const moveNext = () => {
    if (!session) return;
    if (currentIndex >= session.cards.length - 1) {
      const wrongIds = Array.from(new Set(resultRef.current.wrongCardIds));
      const query = new URLSearchParams({
        right: String(resultRef.current.right),
        wrong: String(resultRef.current.wrong),
        wrongIds: wrongIds.join(","),
        size: String(drillSize),
        mode,
      }).toString();
      router.replace(`/results?${query}`);
      return;
    }
    setRevealed(false);
    setInputAnswer("");
    setFeedback({ type: null, message: "" });
    setAnsweredCurrent(false);
    setSwipeDx(0);
    setCurrentIndex((value) => value + 1);
  };

  const submitResult = async (
    isRight: boolean,
    method: "input" | "swipe-left-know" | "swipe-right-dont-know",
  ) => {
    if (!session || !currentCard || answeredCurrent) return;
    const isSwipe = method !== "input";

    await recordAttempt(
      session.drillId,
      currentCard.id,
      isRight,
      method,
      method === "input" ? inputAnswer : null,
    );
    setAnsweredCurrent(true);

    if (isRight) {
      resultRef.current.right += 1;
      if (!isSwipe) {
        await playFeedbackSound("right");
        setFeedback({ type: "right", message: "Correct. Nice work." });
      }
    } else {
      resultRef.current.wrong += 1;
      resultRef.current.wrongCardIds.push(currentCard.id);
      if (!isSwipe) {
        await playFeedbackSound("wrong");
        setFeedback({
          type: "wrong",
          message: `Not quite. Answer: ${expectedInput}`,
        });
      }
    }

    if (isSwipe) {
      moveNext();
      return;
    }

    setTimeout(() => {
      moveNext();
    }, 650);
  };

  const checkInput = async () => {
    if (!currentCard || answeredCurrent) return;
    Keyboard.dismiss();
    const correct = isAnswerCorrect(expectedInput, inputAnswer);
    await submitResult(correct, "input");
  };

  const onPressSpeaker = () => {
    if (!currentCard || speaking) return;
    const visibleText = revealed ? backText : frontText;
    const frontLanguage = mode === "de-en" ? "de-DE" : "en-US";
    const backLanguage = mode === "de-en" ? "en-US" : "de-DE";
    const language = revealed ? backLanguage : frontLanguage;

    Speech.stop();
    setSpeaking(true);
    Speech.speak(visibleText, {
      language,
      rate: 0.95,
      pitch: 1.0,
      onStopped: () => setSpeaking(false),
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
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
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={70}
        extraHeight={90}
        keyboardOpeningTime={0}
        enableResetScrollToCoords
      >
        <View style={styles.progressRow}>
          <Text style={styles.progress}>
            Card {currentIndex + 1} / {session.cards.length}
          </Text>
          <Pressable
            onPress={onPressSpeaker}
            disabled={speaking}
            style={[
              styles.speakerButton,
              speaking && styles.speakerButtonDisabled,
            ]}
          >
            <MaterialIcons name="volume-up" size={24} color="#0f172a" />
          </Pressable>
        </View>

        <View style={styles.cardStage}>
          <View
            pointerEvents="none"
            style={[
              styles.swipeScreenOverlay,
              styles.swipeScreenOverlayLeft,
              { opacity: swipeDx < 0 ? swipeIndicatorOpacity : 0 },
            ]}
          >
            <Text style={styles.swipeScreenOverlayText}>✓</Text>
          </View>
          <View
            pointerEvents="none"
            style={[
              styles.swipeScreenOverlay,
              styles.swipeScreenOverlayRight,
              { opacity: swipeDx > 0 ? swipeIndicatorOpacity : 0 },
            ]}
          >
            <Text style={styles.swipeScreenOverlayText}>✕</Text>
          </View>
          <AnimatedFlashcard
            key={currentCard.id}
            frontText={frontText}
            backText={backText}
            revealed={revealed}
            onToggleReveal={() => setRevealed((value) => !value)}
            onSwipeLeft={() => submitResult(true, "swipe-left-know")}
            onSwipeRight={() => submitResult(false, "swipe-right-dont-know")}
            onSwipeProgress={setSwipeDx}
          />
        </View>

        <View style={styles.answerBox}>
          <Text style={styles.inputLabel}>Type translation (optional)</Text>
          <TextInput
            value={inputAnswer}
            onChangeText={setInputAnswer}
            style={styles.input}
            placeholder={
              mode === "de-en"
                ? "Type your English translation"
                : "Type your German translation"
            }
            placeholderTextColor="#94a3b8"
            autoCorrect={false}
          />
          <Pressable
            onPress={checkInput}
            disabled={answeredCurrent}
            style={styles.checkButton}
          >
            <Text style={styles.checkButtonText}>Check Answer</Text>
          </Pressable>
        </View>

        {feedback.type ? (
          <View
            style={[
              styles.feedback,
              feedback.type === "right"
                ? styles.feedbackRight
                : styles.feedbackWrong,
            ]}
          >
            <Text style={styles.feedbackText}>{feedback.message}</Text>
          </View>
        ) : null}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ecf7f5",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 14,
    paddingBottom: 24,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "600",
  },
  progress: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "700",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardStage: {
    position: "relative",
    minHeight: 274,
    justifyContent: "center",
  },
  swipeScreenOverlay: {
    position: "absolute",
    top: 18,
    bottom: 18,
    width: "42%",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  swipeScreenOverlayLeft: {
    left: 0,
    backgroundColor: "rgba(15, 118, 110, 0.22)",
  },
  swipeScreenOverlayRight: {
    right: 0,
    backgroundColor: "rgba(190, 18, 60, 0.22)",
  },
  swipeScreenOverlayText: {
    fontSize: 82,
    fontWeight: "900",
    color: "#ffffff",
  },
  speakerButton: {
    borderRadius: 999,
    backgroundColor: "#ccfbf1",
    borderWidth: 1,
    borderColor: "#99f6e4",
    padding: 8,
  },
  speakerButtonDisabled: {
    opacity: 0.5,
  },
  answerBox: {
    marginTop: 4,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d2e8e4",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  inputLabel: {
    color: "#334155",
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cad8e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#0f172a",
    fontSize: 16,
    backgroundColor: "#f8fbfd",
  },
  checkButton: {
    marginTop: 4,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  checkButtonText: {
    color: "#f8fafc",
    fontWeight: "700",
  },
  feedback: {
    borderRadius: 12,
    padding: 12,
  },
  feedbackRight: {
    backgroundColor: "#d1fae5",
  },
  feedbackWrong: {
    backgroundColor: "#ffe4e6",
  },
  feedbackText: {
    fontWeight: "700",
    color: "#1e293b",
  },
});
