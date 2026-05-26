import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ensureDatabaseReady, getFlaggedCards, setCardFlag } from "@/src/db/firebase-db";
import type { Card } from "@/src/types/card";

export default function FlaggedCardsScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      await ensureDatabaseReady();
      const next = await getFlaggedCards();
      setCards(next);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load flagged cards.";
      setError(message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const onUnflag = async (card: Card) => {
    if (!card.key) return;
    await setCardFlag(card.key, card.prompt, card.answer, false);
    await refresh();
  };

  const renderHeader = () => (
    <View style={styles.headerWrap}>
      <Text style={styles.title}>Flagged Cards</Text>
      <Text style={styles.subtitle}>Review and manage marked cards.</Text>
      <Pressable
        style={[
          styles.startDrillButton,
          cards.length === 0 && styles.startDrillButtonDisabled,
        ]}
        disabled={cards.length === 0}
        onPress={() => {
          const retryIds = cards.map((card) => card.id).join(",");
          router.push(
            `/drill?retryIds=${encodeURIComponent(retryIds)}&size=50&mode=de-en`,
          );
        }}
      >
        <Text style={styles.startDrillButtonText}>
          Start Drill from Flagged Cards
        </Text>
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  const renderItem = ({ item }: { item: Card }) => (
    <View style={styles.card}>
      <Text style={styles.prompt}>{item.prompt}</Text>
      <Text style={styles.answer}>{item.answer}</Text>
      <Pressable style={styles.unflagButton} onPress={() => onUnflag(item)}>
        <Text style={styles.unflagText}>Unflag</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={cards}
        keyExtractor={(card) => card.key ?? `${card.id}-${card.prompt}`}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No flagged cards yet. Flag cards during drills to see them here.
            </Text>
          </View>
        }
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f9fb",
  },
  container: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 20,
    gap: 12,
  },
  headerWrap: {
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    color: "#475569",
    fontSize: 16,
    marginBottom: 4,
  },
  startDrillButton: {
    borderRadius: 12,
    backgroundColor: "#0f766e",
    paddingVertical: 12,
    alignItems: "center",
  },
  startDrillButtonDisabled: {
    opacity: 0.5,
  },
  startDrillButtonText: {
    color: "#f8fafc",
    fontWeight: "700",
    fontSize: 15,
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d7e1ea",
    backgroundColor: "#ffffff",
    padding: 16,
  },
  emptyText: {
    color: "#475569",
    fontSize: 15,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 14,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d7e1ea",
    backgroundColor: "#ffffff",
    padding: 14,
    gap: 8,
  },
  prompt: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "700",
  },
  answer: {
    color: "#334155",
    fontSize: 16,
  },
  unflagButton: {
    alignSelf: "flex-start",
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fca5a5",
    backgroundColor: "#fff1f2",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  unflagText: {
    color: "#be123c",
    fontWeight: "700",
  },
});
