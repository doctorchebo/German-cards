import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  articleCaseExercises,
  conjugationExercises,
  prepositionExercises,
} from "../src/data/practice-drills";

export default function McqDrillScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const type =
    params.type === "conjugations" || params.type === "articles"
      ? params.type
      : "prepositions";
  const shuffle = <T,>(list: T[]) => {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const sourceDrills =
    type === "conjugations"
      ? conjugationExercises
      : type === "articles"
        ? articleCaseExercises
        : prepositionExercises;

  const [sessionKey, setSessionKey] = useState(0);
  const drills = useMemo(
    () => shuffle(sourceDrills),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionKey, type],
  );
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const limitedDrills = useMemo(
    () => {
      const seen = new Set<string>();
      const unique = drills.filter((drill) => {
        if (seen.has(drill.sentence)) return false;
        seen.add(drill.sentence);
        return true;
      });
      return unique.slice(0, selectedSize ?? 0);
    },
    [drills, selectedSize],
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [right, setRight] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [showReview, setShowReview] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setSessionKey((prev) => prev + 1);
      setSelectedSize(null);
      setIndex(0);
      setSelected(null);
      setRight(0);
      setShowReview(false);
      setAnswers([]);
    }, [type]),
  );

  useEffect(() => {
    if (answers.length === 0 && limitedDrills.length > 0) {
      setAnswers(limitedDrills.map(() => null));
    }
  }, [limitedDrills]);

  const current = limitedDrills[index];
  const finished = index >= limitedDrills.length;
  const title =
    type === "conjugations"
      ? "Verb Conjugation Drill"
      : type === "articles"
        ? "Article & Case Drill"
        : "Preposition Drill";

  if (!selectedSize) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.summary}>Choose how many exercises to take</Text>
          <Pressable style={styles.secondaryButton} onPress={() => setSelectedSize(10)}>
            <Text style={styles.secondaryButtonText}>10 Exercises</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => setSelectedSize(20)}>
            <Text style={styles.secondaryButtonText}>20 Exercises</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => setSelectedSize(30)}>
            <Text style={styles.secondaryButtonText}>30 Exercises</Text>
          </Pressable>
          <Text style={styles.progress}>Available in battery: {drills.length}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const onPick = (option: string) => {
    if (selected) return;
    setSelected(option);
    if (option === current.answer) {
      setRight((value) => value + 1);
    }
  };

  const onNext = () => {
    if (!selected) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = selected;
      return next;
    });
    setSelected(null);
    setIndex((value) => value + 1);
  };

  if (finished) {
    const score = Math.round((right / limitedDrills.length) * 100);
    return (
      <SafeAreaView style={styles.safeArea}>
        {showReview ? (
          <ScrollView
            contentContainerStyle={styles.reviewContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>{title} Review</Text>
            <Text style={styles.summary}>
              Right: {right} / {limitedDrills.length}
            </Text>
            {limitedDrills.map((drill, reviewIndex) => {
              const userAnswer = answers[reviewIndex];
              const isCorrect = userAnswer === drill.answer;
              return (
                <View key={`${drill.sentence}-${reviewIndex}`} style={styles.reviewCard}>
                  <Text style={styles.reviewQuestion}>
                    {reviewIndex + 1}. {drill.sentence}
                  </Text>
                  <Text
                    style={[
                      styles.reviewUserAnswer,
                      isCorrect ? styles.reviewRight : styles.reviewWrong,
                    ]}
                  >
                    Your answer: {userAnswer ?? "No answer"}
                  </Text>
                  <Text style={styles.reviewCorrectAnswer}>
                    Correct answer: {drill.answer}
                  </Text>
                </View>
              );
            })}
            <Pressable
              style={styles.secondaryButton}
              onPress={() => setShowReview(false)}
            >
              <Text style={styles.secondaryButtonText}>Back to Summary</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={() => router.back()}>
              <Text style={styles.primaryButtonText}>Back</Text>
            </Pressable>
          </ScrollView>
        ) : (
          <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.score}>{score}%</Text>
            <Text style={styles.summary}>
              Right: {right} / {limitedDrills.length}
            </Text>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => setShowReview(true)}
            >
              <Text style={styles.secondaryButtonText}>Check All Answers</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={() => router.back()}>
              <Text style={styles.primaryButtonText}>Back</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.progress}>
          Question {index + 1} / {limitedDrills.length}
        </Text>
        <View style={styles.questionCard}>
          <Text style={styles.question}>{current.sentence}</Text>
        </View>
        <View style={styles.optionsWrap}>
          {current.options.map((option) => {
            const isChosen = selected === option;
            const isCorrect = option === current.answer;
            return (
              <Pressable
                key={option}
                style={[
                  styles.optionButton,
                  selected && isCorrect && styles.optionCorrect,
                  isChosen && !isCorrect && styles.optionWrong,
                ]}
                onPress={() => onPick(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          style={[styles.primaryButton, !selected && styles.primaryButtonDisabled]}
          disabled={!selected}
          onPress={onNext}
        >
          <Text style={styles.primaryButtonText}>Next</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f9fb",
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
  },
  progress: {
    color: "#475569",
    fontWeight: "700",
  },
  questionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d7e1ea",
    backgroundColor: "#ffffff",
    padding: 16,
  },
  question: {
    fontSize: 21,
    color: "#0f172a",
    fontWeight: "700",
  },
  optionsWrap: {
    gap: 10,
  },
  optionButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  optionCorrect: {
    backgroundColor: "#d1fae5",
    borderColor: "#34d399",
  },
  optionWrong: {
    backgroundColor: "#ffe4e6",
    borderColor: "#f43f5e",
  },
  optionText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 10,
    backgroundColor: "#0f766e",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
  },
  score: {
    fontSize: 62,
    fontWeight: "900",
    color: "#0f766e",
    textAlign: "center",
    marginTop: 40,
  },
  summary: {
    fontSize: 18,
    color: "#334155",
    textAlign: "center",
  },
  reviewContainer: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 12,
  },
  reviewCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d7e1ea",
    backgroundColor: "#ffffff",
    padding: 14,
    gap: 6,
  },
  reviewQuestion: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  reviewUserAnswer: {
    fontSize: 15,
    fontWeight: "700",
  },
  reviewRight: {
    color: "#065f46",
  },
  reviewWrong: {
    color: "#b91c1c",
  },
  reviewCorrectAnswer: {
    fontSize: 15,
    color: "#334155",
  },
  secondaryButton: {
    marginTop: 6,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "700",
  },
});
