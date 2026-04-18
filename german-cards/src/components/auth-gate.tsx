import { Redirect, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { getCurrentUser, subscribeAuthState } from '@/src/lib/firebase-auth';

export function AuthGate() {
  const segments = useSegments();
  const onSignInPage = segments[0] === 'sign-in';
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(Boolean(getCurrentUser()));

  useEffect(() => {
    const unsubscribe = subscribeAuthState((user) => {
      setSignedIn(Boolean(user));
      setReady(true);
    });

    return unsubscribe;
  }, []);

  if (!ready) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  if (!signedIn && !onSignInPage) {
    return <Redirect href="/sign-in" />;
  }

  if (signedIn && onSignInPage) {
    return <Redirect href="/(tabs)" />;
  }

  return null;
}

const styles = StyleSheet.create({
  loadingWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f9fb',
    zIndex: 20,
  },
});
