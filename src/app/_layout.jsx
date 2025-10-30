
import { useAuth } from '@/utils/auth/useAuth';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { StatusBar } from 'expo-status-bar';
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { initiate, isReady } = useAuth();
  const [langReady, setLangReady] = useState(false);
  const [hasLanguage, setHasLanguage] = useState(true);

  useEffect(() => {
    initiate();
  }, [initiate]);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('app_language');
        setHasLanguage(!!stored);
        if (stored) {
          await i18n.changeLanguage(stored);
        }
      } catch {
        setHasLanguage(true);
      } finally {
        setLangReady(true);
      }
    })();
  }, []);

  if (!isReady || !langReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" backgroundColor="#000" translucent={false} />
        <Stack screenOptions={{ headerShown: false }} initialRouteName={hasLanguage ? 'index' : 'language'}>
          <Stack.Screen name="index" />
          <Stack.Screen name="language" />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
