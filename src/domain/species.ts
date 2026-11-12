import type { Category, Stage } from './types';

/**
 * Catálogo de espécies. Enquanto as artes Rive não existem, cada espécie usa
 * um emoji como marcador visual. `riveArtboard` é o nome da artboard no arquivo .riv.
 */
export interface Species {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  riveArtboard: string;
}

export const SPECIES: Species[] = [
  {
    id: 'gotinha',
    name: 'Gotinha',
    description: 'Uma gota de geleia curiosa que muda de cor conforme seus hábitos.',
    emoji: '🫧',
    color: '#5CC8FF',
    riveArtboard: 'Gotinha',
  },
  {
    id: 'brasinha',
    name: 'Brasinha',
    description: 'Um bichinho de fogo que adora streaks. Quanto mais constante, mais forte brilha.',
    emoji: '🦊',
    color: '#FF8A3D',
    riveArtboard: 'Brasinha',
  },
  {
    id: 'brotinho',
    name: 'Brotinho',
    description: 'Uma semente que vira planta. Cresce devagar, mas cresce sempre.',
    emoji: '🌱',
    color: '#4CC38A',
    riveArtboard: 'Brotinho',
  },
];

export const getSpecies = (id: string) => SPECIES.find((s) => s.id === id) ?? SPECIES[0];

/** Tamanho relativo do pet em cada estágio (marcador visual). */
export const STAGE_SCALE: Record<Stage, number> = {
  ovo: 0.7,
  bebe: 0.8,
  filhote: 0.9,
  jovem: 1,
  adulto: 1.1,
  lendario: 1.2,
};

/** Acessório que representa a forma conquistada por categoria. */
export const VARIANT_BADGE: Record<Category | 'equilibrado', { emoji: string; label: string }> = {
  exercicio: { emoji: '💪', label: 'Forma Atleta' },
  alimentacao: { emoji: '🥗', label: 'Forma Chef' },
  hidratacao: { emoji: '💧', label: 'Forma Aquática' },
  estudo: { emoji: '🎓', label: 'Forma Sábia' },
  saude: { emoji: '🧘', label: 'Forma Zen' },
  casa: { emoji: '🏠', label: 'Forma Caseira' },
  outro: { emoji: '⭐', label: 'Forma Estrela' },
  equilibrado: { emoji: '☯️', label: 'Forma Equilibrada' },
};

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'exercicio', label: 'Exercício', icon: '🏋️' },
  { id: 'alimentacao', label: 'Alimentação', icon: '🥗' },
  { id: 'hidratacao', label: 'Hidratação', icon: '💧' },
  { id: 'estudo', label: 'Estudo', icon: '📚' },
  { id: 'saude', label: 'Saúde', icon: '🧘' },
  { id: 'casa', label: 'Casa', icon: '🧹' },
  { id: 'outro', label: 'Outro', icon: '⭐' },
];
