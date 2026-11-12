/** Chave de data local no formato YYYY-MM-DD. */
export type DateKey = string;

export type Category =
  | 'exercicio'
  | 'alimentacao'
  | 'hidratacao'
  | 'estudo'
  | 'saude'
  | 'casa'
  | 'outro';

export type Frequency =
  | { type: 'daily' }
  /** Dias da semana específicos: 0 = domingo ... 6 = sábado. */
  | { type: 'weekdays'; days: number[] }
  | { type: 'weekly'; timesPerWeek: number }
  | { type: 'monthly'; timesPerMonth: number };

export interface Task {
  id: string;
  title: string;
  icon: string;
  category: Category;
  frequency: Frequency;
  /** Quantas vezes marcar no dia para concluir (ex.: 8 copos de água). */
  target: number;
  unit?: string;
  createdAt: DateKey;
  /** Tarefas removidas são arquivadas para não alterar o histórico de streak. */
  archivedAt?: DateKey;
}

/** Registro de progresso: data -> id da tarefa -> quantidade marcada. */
export type CompletionLog = Record<DateKey, Record<string, number>>;

export type Stage = 'ovo' | 'bebe' | 'filhote' | 'jovem' | 'adulto' | 'lendario';
export type Mood = 'radiante' | 'feliz' | 'normal' | 'triste' | 'doente' | 'morto';
export type Aura = 'nenhuma' | 'faisca' | 'chama' | 'brasa' | 'arco_iris' | 'lendaria';
export type Variant = Category | 'equilibrado' | 'nenhuma';

export interface Pet {
  id: string;
  name: string;
  species: string;
  xp: number;
  categoryXp: Partial<Record<Category, number>>;
  bornAt: DateKey;
}

export interface MemorialEntry {
  id: string;
  name: string;
  species: string;
  xp: number;
  stage: Stage;
  bornAt: DateKey;
  diedAt: DateKey;
}

/** Estado derivado do pet, usado pela tela e pela animação Rive. */
export interface PetStatus {
  stage: Stage;
  stageIndex: number;
  /** Progresso até o próximo estágio, de 0 a 1 (1 no estágio máximo). */
  stageProgress: number;
  nextStageXp: number | null;
  mood: Mood;
  streak: number;
  aura: Aura;
  variant: Variant;
  /** Dias completos sem nenhuma tarefa concluída (sem contar hoje). */
  inactiveDays: number;
  /** Dias restantes antes de o pet morrer (null se ele estiver ativo). */
  daysUntilDeath: number | null;
}
