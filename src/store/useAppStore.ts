import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { todayKey } from '@/domain/dates';
import { computePetStatus, countOn, stageForXp, xpDelta } from '@/domain/engine';
import { DEFAULT_REMINDER_SETTINGS, type ReminderSettings } from '@/domain/reminders';
import type { CompletionLog, DateKey, MemorialEntry, Pet, Task } from '@/domain/types';

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

interface AppState {
  tasks: Task[];
  log: CompletionLog;
  pet: Pet | null;
  memorial: MemorialEntry[];
  reminderSettings: ReminderSettings;

  hatchPet: (name: string, species: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  archiveTask: (id: string) => void;
  setReminderSettings: (patch: Partial<ReminderSettings>) => void;
  /** Soma (+1) ou remove (-1) uma marcação da tarefa no dia. */
  mark: (taskId: string, delta: 1 | -1, date?: DateKey) => void;
  /** Se o pet morreu, envia para o memorial e retorna true. */
  checkDeath: () => boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      log: {},
      pet: null,
      memorial: [],
      reminderSettings: DEFAULT_REMINDER_SETTINGS,

      hatchPet: (name, species) =>
        set({ pet: { id: uid(), name: name.trim(), species, xp: 0, categoryXp: {}, bornAt: todayKey() } }),

      addTask: (task) =>
        set((s) => ({ tasks: [...s.tasks, { ...task, id: uid(), createdAt: todayKey() }] })),

      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      setReminderSettings: (patch) => set((s) => ({ reminderSettings: { ...s.reminderSettings, ...patch } })),

      archiveTask: (id) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, archivedAt: todayKey() } : t)) })),

      mark: (taskId, delta, date = todayKey()) => {
        const { tasks, log, pet } = get();
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;
        const current = countOn(log, taskId, date);
        const next = Math.max(0, Math.min(task.target, current + delta));
        if (next === current) return;

        const gained = pet ? xpDelta(task, log, date, next) : 0;
        const nextLog = { ...log, [date]: { ...log[date], [taskId]: next } };
        const nextPet = pet && gained !== 0
          ? {
              ...pet,
              xp: Math.max(0, pet.xp + gained),
              categoryXp: {
                ...pet.categoryXp,
                [task.category]: Math.max(0, (pet.categoryXp[task.category] ?? 0) + gained),
              },
            }
          : pet;
        set({ log: nextLog, pet: nextPet });
      },

      checkDeath: () => {
        const { pet, tasks, log, memorial } = get();
        if (!pet) return false;
        const today = todayKey();
        const status = computePetStatus(pet, tasks, log, today);
        if (status.mood !== 'morto') return false;
        const entry: MemorialEntry = {
          id: pet.id,
          name: pet.name,
          species: pet.species,
          xp: pet.xp,
          stage: stageForXp(pet.xp).stage,
          bornAt: pet.bornAt,
          diedAt: today,
        };
        set({ pet: null, memorial: [entry, ...memorial] });
        return true;
      },
    }),
    {
      name: 'taskpet-store',
      version: 2,
      // v1 -> v2: adiciona configurações de lembretes.
      migrate: (persisted, version) => {
        const state = persisted as Partial<AppState>;
        if (version < 2) state.reminderSettings = DEFAULT_REMINDER_SETTINGS;
        return state as AppState;
      },
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function usePetStatus() {
  const pet = useAppStore((s) => s.pet);
  const tasks = useAppStore((s) => s.tasks);
  const log = useAppStore((s) => s.log);
  return pet ? computePetStatus(pet, tasks, log, todayKey()) : null;
}
