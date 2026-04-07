import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ensureDatabaseReady, getTotalStats } from '@/src/db/sqlite';

type Stats = {
  cardCount: number;
  drillsCompleted: number;
  rightAnswers: number;
  wrongAnswers: number;
};

const defaultStats: Stats = {
  cardCount: 0,
  drillsCompleted: 0,
  rightAnswers: 0,
  wrongAnswers: 0,
};

export default function HomeScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [selectedDrillSize, setSelectedDrillSize] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        await ensureDatabaseReady();
        const freshStats = await getTotalStats();
        if (active) setStats(freshStats);
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>German Cards</Text>
        <Text style={styles.subtitle}>Train your vocabulary with short drills.</Text>

        <View style={styles.languageCard}>
          <Text style={styles.languageLabel}>Language</Text>
          <Text style={styles.languageValue}>German (default)</Text>
          <Text style={styles.languageHint}>More languages can be added later.</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Cards</Text>
            <Text style={styles.statValue}>{stats.cardCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Drills</Text>
            <Text style={styles.statValue}>{stats.drillsCompleted}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Right</Text>
            <Text style={styles.statValue}>{stats.rightAnswers}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Wrong</Text>
            <Text style={styles.statValue}>{stats.wrongAnswers}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Choose Drill Size</Text>

        <View style={styles.sizeRow}>
          {[10, 25, 50].map((size) => {
            const active = selectedDrillSize === size;
            return (
              <Pressable
                key={size}
                style={[styles.sizeButton, active && styles.sizeButtonActive]}
                onPress={() => setSelectedDrillSize(size)}>
                <Text style={[styles.sizeButtonText, active && styles.sizeButtonTextActive]}>{size}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.primaryButton, !selectedDrillSize && styles.primaryButtonDisabled]}
          onPress={() => router.push(`/drill?size=${selectedDrillSize ?? 50}`)}
          disabled={!selectedDrillSize}>
          <Text style={styles.primaryButtonText}>
            {selectedDrillSize ? `Start ${selectedDrillSize}-Word Drill` : 'Select size to start'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f9fb',
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    gap: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
  },
  languageCard: {
    marginTop: 8,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8e4ef',
  },
  languageLabel: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  languageValue: {
    marginTop: 8,
    fontSize: 20,
    color: '#0f172a',
    fontWeight: '700',
  },
  languageHint: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8e4ef',
    borderRadius: 14,
    padding: 14,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  statValue: {
    marginTop: 6,
    fontSize: 24,
    color: '#0f172a',
    fontWeight: '800',
  },
  primaryButton: {
    marginTop: 6,
    backgroundColor: '#0f766e',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 16,
  },
  sectionTitle: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sizeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  sizeButtonActive: {
    borderColor: '#0f766e',
    backgroundColor: '#ccfbf1',
  },
  sizeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  sizeButtonTextActive: {
    color: '#115e59',
  },
});
