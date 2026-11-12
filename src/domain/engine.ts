import { addDays, diffDays, startOfMonth, startOfWeek, weekday } from './dates';
import {
  AURAS,
  DEATH_AFTER_INACTIVE_DAYS,
  SAD_AFTER_INACTIVE_DAYS,
  SICK_AFTER_INACTIVE_DAYS,
  STAGES,
  STREAK_MIN_RATIO,
  VARIANT_FROM_STAGE,
  VARIANT_MIN_SHARE,
  XP_BY_FREQUENCY,
} from './rules';
import type {
  Aura,
  Category,
  CompletionLog,
  DateKey,
  Mood,
  Pet,
  PetStatus,
  Stage,
  Task,
  Variant,
} from './types';

/** Limite de segurança para varreduras no histórico. */
const MAX_LOOKBACK_DAYS = 1000;

export function taskExistsOn(task: Task, date: DateKey): boolean {
  if (diffDays(task.createdAt, date) < 0) return false;
  if (task.archivedAt && diffDays(task.archivedAt, date) >= 0) return false;
  return true;
}

/** Tarefa com dia marcado (diária ou de dias da semana) que vale para esta data. */
export function isScheduledOn(task: Task, date: DateKey): boolean {
  if (!taskExistsOn(task, date)) return false;
  const f = task.frequency;
  if (f.type === 'daily') return true;
  if (f.type === 'weekdays') return f.days.includes(weekday(date));
  return false;
}

/** Tarefas que aparecem na lista do dia (inclui semanais e mensais). */
export function tasksForDay(tasks: Task[], date: DateKey): Task[] {
  return tasks.filter((t) => {
    if (!taskExistsOn(t, date)) return false;
    if (t.frequency.type === 'weekdays') return isScheduledOn(t, date);
    return true;
  });
}

export function countOn(log: CompletionLog, taskId: string, date: DateKey): number {
  return log[date]?.[taskId] ?? 0;
}

export function isDoneOn(task: Task, log: CompletionLog, date: DateKey): boolean {
  return countOn(log, task.id, date) >= task.target;
}

/** Para tarefas semanais e mensais: quantos dias do período ela foi concluída até `date`. */
export function periodOccurrences(task: Task, log: CompletionLog, date: DateKey): number {
  const f = task.frequency;
  if (f.type !== 'weekly' && f.type !== 'monthly') return isDoneOn(task, log, date) ? 1 : 0;
  const start = f.type === 'weekly' ? startOfWeek(date) : startOfMonth(date);
  let n = 0;
  for (let d = start; diffDays(d, date) >= 0; d = addDays(d, 1)) {
    if (isDoneOn(task, log, d)) n++;
  }
  return n;
}

export function periodGoal(task: Task): number {
  const f = task.frequency;
  if (f.type === 'weekly') return f.timesPerWeek;
  if (f.type === 'monthly') return f.timesPerMonth;
  return 1;
}

/** Algum progresso foi concluído no dia (pelo menos uma tarefa até a meta). */
export function hadActivityOn(tasks: Task[], log: CompletionLog, date: DateKey): boolean {
  return tasks.some((t) => isDoneOn(t, log, date));
}

/**
 * Fração das tarefas com dia marcado concluídas na data.
 * Retorna null quando não havia nenhuma tarefa marcada (dia neutro).
 */
export function dayRatio(tasks: Task[], log: CompletionLog, date: DateKey): number | null {
  const scheduled = tasks.filter((t) => isScheduledOn(t, date));
  if (scheduled.length === 0) return null;
  const done = scheduled.filter((t) => isDoneOn(t, log, date)).length;
  return done / scheduled.length;
}

function earliestDate(tasks: Task[], fallback: DateKey): DateKey {
  return tasks.reduce((min, t) => (diffDays(t.createdAt, min) > 0 ? t.createdAt : min), fallback);
}

/**
 * Dias seguidos em que o usuário concluiu ao menos STREAK_MIN_RATIO das tarefas do dia.
 * Dias sem tarefa marcada não quebram nem somam. Hoje só soma se já tiver sido cumprido,
 * e não quebra o streak enquanto o dia não acabou.
 */
export function computeStreak(tasks: Task[], log: CompletionLog, today: DateKey): number {
  const first = earliestDate(tasks, today);
  let streak = 0;
  const todayRatio = dayRatio(tasks, log, today);
  if (todayRatio !== null && todayRatio >= STREAK_MIN_RATIO) streak++;

  let d = addDays(today, -1);
  for (let i = 0; i < MAX_LOOKBACK_DAYS && diffDays(first, d) >= 0; i++, d = addDays(d, -1)) {
    const r = dayRatio(tasks, log, d);
    if (r === null) continue;
    if (r >= STREAK_MIN_RATIO) streak++;
    else break;
  }
  return streak;
}

/**
 * Dias completos (sem contar hoje) com tarefas marcadas e nenhuma tarefa concluída,
 * desde a última atividade ou desde o nascimento do pet.
 */
export function computeInactiveDays(
  tasks: Task[],
  log: CompletionLog,
  today: DateKey,
  bornAt: DateKey,
): number {
  if (hadActivityOn(tasks, log, today)) return 0;
  let inactive = 0;
  let d = addDays(today, -1);
  for (let i = 0; i < MAX_LOOKBACK_DAYS && diffDays(bornAt, d) > 0; i++, d = addDays(d, -1)) {
    if (hadActivityOn(tasks, log, d)) break;
    if (tasks.some((t) => isScheduledOn(t, d))) inactive++;
  }
  return inactive;
}

export function stageForXp(xp: number) {
  let index = 0;
  STAGES.forEach((s, i) => {
    if (xp >= s.minXp) index = i;
  });
  const next = STAGES[index + 1];
  const current = STAGES[index];
  const progress = next ? (xp - current.minXp) / (next.minXp - current.minXp) : 1;
  return { stage: current.stage, index, progress, nextStageXp: next?.minXp ?? null };
}

export function auraForStreak(streak: number): Aura {
  let aura: Aura = 'nenhuma';
  for (const a of AURAS) if (streak >= a.minStreak) aura = a.aura;
  return aura;
}

export function variantFor(stage: Stage, categoryXp: Pet['categoryXp']): Variant {
  const minIndex = STAGES.findIndex((s) => s.stage === VARIANT_FROM_STAGE);
  if (STAGES.findIndex((s) => s.stage === stage) < minIndex) return 'nenhuma';
  const entries = Object.entries(categoryXp) as [Category, number][];
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (total === 0) return 'equilibrado';
  const [topCat, topXp] = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  return topXp / total >= VARIANT_MIN_SHARE ? topCat : 'equilibrado';
}

export function moodFor(inactiveDays: number, todayRatio: number | null, activeToday: boolean, streak: number): Mood {
  if (inactiveDays >= DEATH_AFTER_INACTIVE_DAYS) return 'morto';
  if (inactiveDays >= SICK_AFTER_INACTIVE_DAYS) return 'doente';
  if (inactiveDays >= SAD_AFTER_INACTIVE_DAYS) return 'triste';
  if (todayRatio !== null && todayRatio >= STREAK_MIN_RATIO && streak >= 3) return 'radiante';
  if (activeToday) return 'feliz';
  return 'normal';
}

export function computePetStatus(pet: Pet, tasks: Task[], log: CompletionLog, today: DateKey): PetStatus {
  const s = stageForXp(pet.xp);
  const streak = computeStreak(tasks, log, today);
  const inactiveDays = computeInactiveDays(tasks, log, today, pet.bornAt);
  const mood = moodFor(inactiveDays, dayRatio(tasks, log, today), hadActivityOn(tasks, log, today), streak);
  return {
    stage: s.stage,
    stageIndex: s.index,
    stageProgress: s.progress,
    nextStageXp: s.nextStageXp,
    mood,
    streak,
    aura: auraForStreak(streak),
    variant: variantFor(s.stage, pet.categoryXp),
    inactiveDays,
    daysUntilDeath:
      inactiveDays >= SAD_AFTER_INACTIVE_DAYS && mood !== 'morto'
        ? DEATH_AFTER_INACTIVE_DAYS - inactiveDays
        : null,
  };
}

/**
 * XP que uma marcação gera. Só gera XP quando a tarefa atinge a meta do dia,
 * e tarefas semanais/mensais só rendem XP até a meta do período (evita "farmar").
 * Retorna valor negativo quando a marcação é desfeita.
 */
export function xpDelta(task: Task, log: CompletionLog, date: DateKey, newCount: number): number {
  const before = countOn(log, task.id, date) >= task.target;
  const after = newCount >= task.target;
  if (before === after) return 0;
  const xp = XP_BY_FREQUENCY[task.frequency.type];
  const f = task.frequency.type;
  if (f === 'weekly' || f === 'monthly') {
    const occ = periodOccurrences(task, log, date);
    // Ao concluir: occ ainda não inclui hoje. Ao desfazer: occ já inclui hoje.
    const position = after ? occ + 1 : occ;
    if (position > periodGoal(task)) return 0;
  }
  return after ? xp : -xp;
}

/** XP ganho desde segunda-feira (usado no ranking semanal entre amigos). */
export function weeklyXp(tasks: Task[], log: CompletionLog, today: DateKey): number {
  let total = 0;
  for (let d = startOfWeek(today); diffDays(d, today) >= 0; d = addDays(d, 1)) {
    for (const task of tasks) {
      if (!isDoneOn(task, log, d)) continue;
      const f = task.frequency.type;
      // Mesma regra do xpDelta: semanais/mensais só valem até a meta do período.
      if ((f === 'weekly' || f === 'monthly') && periodOccurrences(task, log, d) > periodGoal(task)) continue;
      total += XP_BY_FREQUENCY[f];
    }
  }
  return total;
}
