/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { addDays, startOfWeek } from '../dates';
import {
  auraForStreak,
  computeInactiveDays,
  computePetStatus,
  computeStreak,
  stageForXp,
  variantFor,
  weeklyXp,
  xpDelta,
} from '../engine';
import type { CompletionLog, Pet, Task } from '../types';

const TODAY = '2026-11-12'; // quinta-feira
const START = '2026-10-01';

const water: Task = {
  id: 'agua', title: 'Beber água', icon: '💧', category: 'hidratacao',
  frequency: { type: 'daily' }, target: 8, unit: 'copos', createdAt: START,
};
const gym: Task = {
  id: 'academia', title: 'Academia', icon: '🏋️', category: 'exercicio',
  frequency: { type: 'weekly', timesPerWeek: 3 }, target: 1, createdAt: START,
};
const spanish: Task = {
  id: 'espanhol', title: 'Estudar espanhol', icon: '📚', category: 'estudo',
  frequency: { type: 'weekdays', days: [1, 3, 5] }, target: 1, createdAt: START,
};

function logDays(days: string[], entries: Record<string, number>): CompletionLog {
  return Object.fromEntries(days.map((d) => [d, { ...entries }]));
}
const lastNDays = (n: number, from = TODAY) => Array.from({ length: n }, (_, i) => addDays(from, -i));

const pet: Pet = { id: 'p', name: 'Bolinha', species: 'blob', xp: 0, categoryXp: {}, bornAt: START };

describe('streak', () => {
  it('conta dias seguidos e não quebra por hoje ainda não ter sido feito', () => {
    const log = logDays(lastNDays(5, addDays(TODAY, -1)), { agua: 8 });
    assert.equal(computeStreak([water], log, TODAY), 5);
    log[TODAY] = { agua: 8 };
    assert.equal(computeStreak([water], log, TODAY), 6);
  });

  it('quebra quando um dia fica abaixo de 80%', () => {
    const log = logDays(lastNDays(3, addDays(TODAY, -1)), { agua: 8 });
    log[addDays(TODAY, -2)] = { agua: 3 };
    assert.equal(computeStreak([water], log, TODAY), 1);
  });

  it('dias sem tarefa marcada são neutros', () => {
    // Espanhol só seg/qua/sex. Hoje é quinta; ontem (qua) e segunda feitos.
    const log: CompletionLog = { '2026-11-11': { espanhol: 1 }, '2026-11-09': { espanhol: 1 } };
    assert.equal(computeStreak([spanish], log, TODAY), 2);
  });
});

describe('aura', () => {
  it('evolui com o streak', () => {
    assert.equal(auraForStreak(0), 'nenhuma');
    assert.equal(auraForStreak(3), 'faisca');
    assert.equal(auraForStreak(7), 'chama');
    assert.equal(auraForStreak(30), 'arco_iris');
  });
});

describe('inatividade e morte', () => {
  it('zero quando houve atividade hoje ou ontem', () => {
    assert.equal(computeInactiveDays([water], { [TODAY]: { agua: 8 } }, TODAY, START), 0);
    assert.equal(computeInactiveDays([water], { [addDays(TODAY, -1)]: { agua: 8 } }, TODAY, START), 0);
  });

  it('marcar só parte da meta não conta como atividade', () => {
    const log: CompletionLog = { [addDays(TODAY, -3)]: { agua: 8 }, [addDays(TODAY, -1)]: { agua: 2 } };
    assert.equal(computeInactiveDays([water], log, TODAY, START), 2);
  });

  it('fica triste, doente e morre após 7 dias', () => {
    const at = (n: number) => computePetStatus(pet, [water], { [addDays(TODAY, -(n + 1))]: { agua: 8 } }, TODAY);
    assert.equal(at(1).mood, 'normal');
    assert.equal(at(2).mood, 'triste');
    assert.equal(at(2).daysUntilDeath, 5);
    assert.equal(at(4).mood, 'doente');
    assert.equal(at(6).daysUntilDeath, 1);
    assert.equal(at(7).mood, 'morto');
  });

  it('o dia de nascimento é período de graça', () => {
    const born = addDays(TODAY, -1);
    const s = computePetStatus({ ...pet, bornAt: born }, [{ ...water, createdAt: born }], {}, TODAY);
    assert.equal(s.inactiveDays, 0);
  });

  it('dias sem tarefa marcada não contam para a morte', () => {
    // Só tarefa semanal: nunca tem dia marcado, então o pet não morre.
    const s = computePetStatus(pet, [gym], {}, TODAY);
    assert.equal(s.inactiveDays, 0);
  });
});

describe('evolução', () => {
  it('estágio por XP', () => {
    assert.equal(stageForXp(0).stage, 'ovo');
    assert.equal(stageForXp(49).stage, 'ovo');
    assert.equal(stageForXp(50).stage, 'bebe');
    assert.equal(stageForXp(125).progress, 0.5);
    assert.equal(stageForXp(9999).stage, 'lendario');
    assert.equal(stageForXp(9999).nextStageXp, null);
  });

  it('forma depende da categoria predominante a partir de jovem', () => {
    assert.equal(variantFor('filhote', { exercicio: 100 }), 'nenhuma');
    assert.equal(variantFor('jovem', { exercicio: 300, estudo: 100 }), 'exercicio');
    assert.equal(variantFor('jovem', { exercicio: 100, estudo: 100, casa: 100 }), 'equilibrado');
  });
});

describe('xp', () => {
  it('só dá XP ao atingir a meta e remove ao desfazer', () => {
    assert.equal(xpDelta(water, { [TODAY]: { agua: 6 } }, TODAY, 7), 0);
    assert.equal(xpDelta(water, { [TODAY]: { agua: 7 } }, TODAY, 8), 10);
    assert.equal(xpDelta(water, { [TODAY]: { agua: 8 } }, TODAY, 9), 0);
    assert.equal(xpDelta(water, { [TODAY]: { agua: 8 } }, TODAY, 7), -10);
  });

  it('tarefa semanal só rende XP até a meta da semana', () => {
    const mon = startOfWeek(TODAY);
    const log: CompletionLog = {
      [mon]: { academia: 1 },
      [addDays(mon, 1)]: { academia: 1 },
      [addDays(mon, 2)]: { academia: 1 },
    };
    assert.equal(xpDelta(gym, log, TODAY, 1), 0);
    const log2: CompletionLog = { [mon]: { academia: 1 } };
    assert.equal(xpDelta(gym, log2, TODAY, 1), 25);
  });
});

describe('ranking semanal', () => {
  it('soma o XP desde segunda respeitando a meta semanal', () => {
    const mon = startOfWeek(TODAY);
    const log: CompletionLog = {
      [addDays(mon, -1)]: { agua: 8 }, // domingo anterior: não conta
      [mon]: { agua: 8, academia: 1 },
      [addDays(mon, 1)]: { academia: 1 },
      [addDays(mon, 2)]: { academia: 1 },
      [TODAY]: { agua: 8, academia: 1 }, // 4ª academia: acima da meta
    };
    assert.equal(weeklyXp([water, gym], log, TODAY), 10 + 25 * 3 + 10);
  });
});
