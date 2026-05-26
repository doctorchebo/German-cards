import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCurrentUser, signInWithEmail } from "@/src/lib/firebase-auth";

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getCurrentUser()) {
      router.replace("/(tabs)");
    }
  }, [router]);

  const onSignIn = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      router.replace("/(tabs)");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-in failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>German Cards</Text>
          <Text style={styles.subtitle}>
            Sign in to access your card database.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
              textContentType="password"
              autoCorrect={false}
              autoCapitalize="none"
              autoComplete="current-password"
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              onSubmitEditing={onSignIn}
              returnKeyType="go"
            />
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              disabled={loading}
              style={styles.togglePasswordButton}
            >
              <MaterialIcons
                name={showPassword ? "visibility-off" : "visibility"}
                size={22}
                color="#0f766e"
              />
            </Pressable>
          </View>

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            disabled={loading}
            onPress={onSignIn}
          >
            {loading ? (
              <ActivityIndicator color="#f8fafc" />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </Pressable>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f9fb",
  },
  kav: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: "center",
    gap: 18,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 22,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0f172a",
  },
  passwordRow: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 10,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0f172a",
  },
  togglePasswordButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  button: {
    marginTop: 6,
    backgroundColor: "#0f766e",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 14,
  },
});
