import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useSyncExternalStore } from 'react';

import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

SplashScreen.preventAutoHideAsync();

const subscribeHydration = (cb: () => void) => useAppStore.persist.onFinishHydration(cb);
const getHydrated = () => useAppStore.persist.hasHydrated();

/** Espera os dados salvos no aparelho serem carregados antes de mostrar o app. */
function useHydrated() {
  return useSyncExternalStore(subscribeHydration, getHydrated);
}

export default function RootLayout() {
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  if (!hydrated) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="hatch" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="new-task" options={{ presentation: 'modal', title: 'Nova tarefa' }} />
        <Stack.Screen name="auth" options={{ presentation: 'modal', title: 'Entrar' }} />
      </Stack>
    </>
  );
}
