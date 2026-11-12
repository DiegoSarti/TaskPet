import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { todayKey } from '@/domain/dates';
import { planNotifications } from '@/domain/reminders';
import { applyPlan, configureNotifications } from '@/lib/notifications';
import { useAppStore } from '@/store/useAppStore';

/**
 * Mantém as notificações locais em dia: reagenda sempre que tarefas, progresso,
 * pet ou configurações mudam, e quando o app volta para a frente num novo dia.
 */
export function useReminderSync() {
  const tasks = useAppStore((s) => s.tasks);
  const log = useAppStore((s) => s.log);
  const pet = useAppStore((s) => s.pet);
  const settings = useAppStore((s) => s.reminderSettings);
  const [day, setDay] = useState(todayKey());

  useEffect(() => {
    configureNotifications();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') setDay(todayKey());
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const plan = planNotifications({ tasks, log, pet, settings, now: new Date() });
      applyPlan(plan).catch((e) => console.warn('Falha ao agendar lembretes', e));
    }, 800);
    return () => clearTimeout(t);
  }, [tasks, log, pet, settings, day]);
}
