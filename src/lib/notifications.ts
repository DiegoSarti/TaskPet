import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import type { PlannedNotification } from '@/domain/reminders';

const CHANNEL_ID = 'lembretes';
export const notificationsSupported = Platform.OS !== 'web';

let configured = false;

/** Configura como as notificações aparecem com o app aberto e o canal do Android. */
export async function configureNotifications() {
  if (!notificationsSupported || configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Lembretes e avisos do pet',
      importance: AndroidImportance.HIGH,
    });
  }
}

export async function hasPermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

/** Pede permissão ao usuário (só mostra o pedido do sistema se ainda não foi respondido). */
export async function ensurePermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  if (await hasPermission()) return true;
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}

/** Substitui todas as notificações agendadas pelo plano atual. */
export async function applyPlan(plan: PlannedNotification[]) {
  if (!notificationsSupported || !(await hasPermission())) return;
  await configureNotifications();
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const n of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: n.id,
      content: { title: n.title, body: n.body, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.date, channelId: CHANNEL_ID },
    });
  }
}
