import { useState } from "react";
import {
  Alert,
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

import { addCard, ensureDatabaseReady } from "@/src/db/firebase-db";

export default function AddCardScreen() {
  const [german, setGerman] = useState("");
  const [english, setEnglish] = useState("");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const cleanGerman = german.trim();
    const cleanEnglish = english.trim();
    if (!cleanGerman || !cleanEnglish) {
      Alert.alert("Missing fields", "Please add both German and English text.");
      return;
    }

    setSaving(true);
    try {
      await ensureDatabaseReady();
      await addCard(cleanGerman, cleanEnglish);
      setGerman("");
      setEnglish("");
      Alert.alert("Saved", "Your new card is ready for the next drill.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Add Card</Text>
          <Text style={styles.subtitle}>
            Create custom German vocabulary cards.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>German</Text>
            <TextInput
              value={german}
              onChangeText={setGerman}
              style={styles.input}
              placeholder="z.B. der Apfel"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>English</Text>
            <TextInput
              value={english}
              onChangeText={setEnglish}
              style={styles.input}
              placeholder="e.g. the apple"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <Pressable
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={onSave}
            disabled={saving}
          >
            <Text style={styles.buttonText}>
              {saving ? "Saving..." : "Save Card"}
            </Text>
          </Pressable>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: "#475569",
  },
  form: {
    marginTop: 22,
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d7e1ea",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    color: "#0f172a",
  },
  button: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: "#0f766e",
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
  },
});
