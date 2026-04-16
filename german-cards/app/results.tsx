import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  return (
    <SafeAreaView style={styles.safeArea}>
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
