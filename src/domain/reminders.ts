import { addDays, toDateKey } from './dates';
import {
  computeInactiveDays,
  countOn,
  isDoneOn,
  periodGoal,
  periodOccurrences,
  tasksForDay,
} from './engine';
import { DEATH_AFTER_INACTIVE_DAYS, SAD_AFTER_INACTIVE_DAYS, SICK_AFTER_INACTIVE_DAYS } from './rules';
import type { CompletionLog, DateKey, Pet, Task } from './types';

export interface ReminderSettings {
  /** Lembretes das tarefas no horário escolhido em cada tarefa. */
  taskReminders: boolean;
  /** Avisos quando o pet fica triste, doente ou está para partir. */
  petAlerts: boolean;
  /** Hora (0-23) dos avisos do pet. */
  petAlertHour: number;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  taskReminders: true,
  petAlerts: true,
  petAlertHour: 19,
};

export interface PlannedNotification {
  id: string;
  title: string;
  body: string;
  date: Date;
}

/** Quantos dias à frente agendar. O app reagenda tudo sempre que algo muda. */
export const PLAN_DAYS = 3;
/** O iOS aceita no máximo 64 notificações agendadas por app. */
export const MAX_SCHEDULED = 60;

export function atTime(date: DateKey, hhmm: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}

function taskBody(task: Task, log: CompletionLog, date: DateKey, isToday: boolean): string {
  if (task.target > 1) {
    const left = task.target - (isToday ? countOn(log, task.id, date) : 0);
    return `Faltam ${left} ${task.unit ?? 'vezes'} hoje. Seu pet está contando com você!`;
  }
  return 'Hora de cumprir essa tarefa. Seu pet está contando com você!';
}

/**
 * Calcula todas as notificações locais que devem estar agendadas agora.
 * Leva em conta o que já foi feito: tarefa concluída hoje não gera lembrete,
 * e os avisos do pet são recalculados a cada atividade.
 */
export function planNotifications(args: {
  tasks: Task[];
  log: CompletionLog;
  pet: Pet | null;
  settings: ReminderSettings;
  now: Date;
}): PlannedNotification[] {
  const { tasks, log, pet, settings, now } = args;
  const today = toDateKey(now);
  const out: PlannedNotification[] = [];

  if (settings.taskReminders) {
    for (let i = 0; i < PLAN_DAYS; i++) {
      const day = addDays(today, i);
      for (const task of tasksForDay(tasks, day)) {
        if (!task.reminderTime) continue;
        const when = atTime(day, task.reminderTime);
        if (when <= now) continue;
        const isToday = i === 0;
        if (isToday && isDoneOn(task, log, day)) continue;
        const f = task.frequency.type;
        // Meta da semana/mês já batida: só volta a lembrar no próximo período.
        if ((f === 'weekly' || f === 'monthly') && periodOccurrences(task, log, day) >= periodGoal(task)) continue;
        out.push({
          id: `task:${task.id}:${day}`,
          title: `${task.icon} ${task.title}`,
          body: taskBody(task, log, day, isToday),
          date: when,
        });
      }
    }
  }

  if (settings.petAlerts && pet) {
    const hour = `${String(settings.petAlertHour).padStart(2, '0')}:00`;
    // Simula os próximos dias supondo que o usuário não faça mais nada.
    let previous = computeInactiveDays(tasks, log, addDays(today, -1), pet.bornAt);
    for (let i = 0; i <= DEATH_AFTER_INACTIVE_DAYS; i++) {
      const day = addDays(today, i);
      const inactive = computeInactiveDays(tasks, log, day, pet.bornAt);
      const when = atTime(day, hour);
      const changed = inactive !== previous;
      previous = inactive;
      if (!changed || when <= now) continue;
      const left = DEATH_AFTER_INACTIVE_DAYS - inactive;
      let body: string | null = null;
      if (inactive === DEATH_AFTER_INACTIVE_DAYS - 1) {
        body = `Último dia! Conclua uma tarefa hoje ou ${pet.name} vai partir.`;
      } else if (inactive === SICK_AFTER_INACTIVE_DAYS) {
        body = `${pet.name} ficou doente de saudade. Faltam ${left} dias para partir.`;
      } else if (inactive === SAD_AFTER_INACTIVE_DAYS) {
        body = `${pet.name} está triste e parou de evoluir. Que tal concluir uma tarefa?`;
      }
      if (body) out.push({ id: `pet:${pet.id}:${day}`, title: 'Seu pet precisa de você 🥺', body, date: when });
    }
  }

  return out.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, MAX_SCHEDULED);
}
