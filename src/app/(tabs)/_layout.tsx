import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect } from 'react';
import { AppState, Text } from 'react-native';

import { colors } from '@/constants/theme';
import { useReminderSync } from '@/hooks/useReminderSync';
import { useSnapshotSync } from '@/hooks/useSnapshotSync';
import { useAppStore } from '@/store/useAppStore';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}
const icon = (emoji: string) => function Icon({ focused }: { focused: boolean }) {
  return <TabIcon emoji={emoji} focused={focused} />;
};

export default function TabsLayout() {
  const pet = useAppStore((s) => s.pet);
  const checkDeath = useAppStore((s) => s.checkDeath);
  useSnapshotSync();
  useReminderSync();

  // Confere se o pet morreu ao abrir o app e sempre que ele volta para a frente.
  useEffect(() => {
    checkDeath();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && checkDeath());
    return () => sub.remove();
  }, [checkDeath]);

  if (!pet) return <Redirect href="/hatch" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Hoje', tabBarIcon: icon('🏠') }} />
      <Tabs.Screen name="friends" options={{ title: 'Amigos', tabBarIcon: icon('🏆') }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: icon('👤') }} />
    </Tabs>
  );
}
