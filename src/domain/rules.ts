import type { Aura, Stage } from './types';

/**
 * Todas as regras de balanceamento do jogo ficam aqui,
 * para que seja fácil ajustar sem mexer na lógica.
 */

/** XP ganho ao concluir uma tarefa, conforme a frequência. */
export const XP_BY_FREQUENCY = {
  daily: 10,
  weekdays: 10,
  weekly: 25,
  monthly: 60,
} as const;

/** XP mínimo para cada estágio (em ordem). */
export const STAGES: { stage: Stage; minXp: number; label: string }[] = [
  { stage: 'ovo', minXp: 0, label: 'Ovo' },
  { stage: 'bebe', minXp: 50, label: 'Bebê' },
  { stage: 'filhote', minXp: 200, label: 'Filhote' },
  { stage: 'jovem', minXp: 500, label: 'Jovem' },
  { stage: 'adulto', minXp: 1000, label: 'Adulto' },
  { stage: 'lendario', minXp: 2500, label: 'Lendário' },
];

/** A partir deste estágio o pet ganha uma forma conforme as tarefas que o usuário mais faz. */
export const VARIANT_FROM_STAGE: Stage = 'jovem';
/** Fatia mínima do XP numa categoria para definir a forma; abaixo disso a forma é "equilibrado". */
export const VARIANT_MIN_SHARE = 0.4;

/** Um dia conta para o streak quando esta fração das tarefas do dia foi concluída. */
export const STREAK_MIN_RATIO = 0.8;

/** Auras de streak (mínimo de dias seguidos). */
export const AURAS: { aura: Aura; minStreak: number; label: string }[] = [
  { aura: 'nenhuma', minStreak: 0, label: 'Sem aura' },
  { aura: 'faisca', minStreak: 3, label: 'Faísca' },
  { aura: 'chama', minStreak: 7, label: 'Chama' },
  { aura: 'brasa', minStreak: 14, label: 'Brasa azul' },
  { aura: 'arco_iris', minStreak: 30, label: 'Arco-íris' },
  { aura: 'lendaria', minStreak: 100, label: 'Lendária' },
];

/** Dias seguidos sem concluir nenhuma tarefa até o pet ficar triste, doente e morrer. */
export const SAD_AFTER_INACTIVE_DAYS = 2;
export const SICK_AFTER_INACTIVE_DAYS = 4;
export const DEATH_AFTER_INACTIVE_DAYS = 7;
