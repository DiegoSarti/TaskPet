/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { addDays } from '../dates';
import { atTime, DEFAULT_REMINDER_SETTINGS, planNotifications } from '../reminders';
import type { CompletionLog, Pet, Task } from '../types';

const TODAY = '2026-11-12'; // quinta
const START = '2026-10-01';
const water: Task = {
  id: 'agua', title: 'Beber água', icon: '💧', category: 'hidratacao', frequency: { type: 'daily' },
  target: 8, unit: 'copos', reminderTime: '10:00', createdAt: START,
};
const gym: Task = {
  id: 'academia', title: 'Academia', icon: '🏋️', category: 'exercicio',
  frequency: { type: 'weekly', timesPerWeek: 1 }, target: 1, reminderTime: '18:00', createdAt: START,
};
const pet: Pet = { id: 'p', name: 'Pipoca', species: 'brasinha', xp: 0, categoryXp: {}, bornAt: START };
const onlyTasks = { ...DEFAULT_REMINDER_SETTINGS, petAlerts: false };
const onlyPet = { ...DEFAULT_REMINDER_SETTINGS, taskReminders: false };

describe('lembretes de tarefas', () => {
  it('agenda os próximos dias e pula horário que já passou', () => {
    const plan = planNotifications({ tasks: [water], log: {}, pet, settings: onlyTasks, now: atTime(TODAY, '11:00') });
    assert.deepEqual(plan.map((n) => n.id), [`task:agua:${addDays(TODAY, 1)}`, `task:agua:${addDays(TODAY, 2)}`]);
  });

  it('não lembra tarefa já concluída hoje e mostra quanto falta', () => {
    const now = atTime(TODAY, '08:00');
    const done = planNotifications({ tasks: [water], log: { [TODAY]: { agua: 8 } }, pet, settings: onlyTasks, now });
    assert.equal(done.some((n) => n.id === `task:agua:${TODAY}`), false);
    const partial = planNotifications({ tasks: [water], log: { [TODAY]: { agua: 3 } }, pet, settings: onlyTasks, now });
    assert.match(partial[0].body, /Faltam 5 copos/);
  });

  it('tarefa semanal com meta batida só volta na semana seguinte', () => {
    const log: CompletionLog = { '2026-11-10': { academia: 1 } };
    const plan = planNotifications({ tasks: [gym], log, pet, settings: onlyTasks, now: atTime(TODAY, '08:00') });
    assert.equal(plan.length, 0); // qui, sex, sáb são da mesma semana
    const sat = planNotifications({ tasks: [gym], log, pet, settings: onlyTasks, now: atTime('2026-11-14', '08:00') });
    assert.deepEqual(sat.map((n) => n.id), ['task:academia:2026-11-16']); // segunda
  });
});

describe('avisos do pet', () => {
  it('avisa triste, doente e último dia contando a partir da última atividade', () => {
    const log: CompletionLog = { [TODAY]: { agua: 8 } };
    const plan = planNotifications({ tasks: [water], log, pet, settings: onlyPet, now: atTime(TODAY, '20:00') });
    // Hoje ativo -> dia+3 tem 2 dias inativos (triste), dia+5 tem 4 (doente), dia+7 tem 6 (último dia).
    assert.deepEqual(plan.map((n) => n.id), [3, 5, 7].map((n) => `pet:p:${addDays(TODAY, n)}`));
    assert.match(plan[0].body, /triste/);
    assert.match(plan[1].body, /doente/);
    assert.match(plan[2].body, /Último dia/);
  });

  it('se o usuário já está sumido, avisa hoje à noite', () => {
    const log: CompletionLog = { [addDays(TODAY, -3)]: { agua: 8 } };
    const plan = planNotifications({ tasks: [water], log, pet, settings: onlyPet, now: atTime(TODAY, '09:00') });
    assert.equal(plan[0].id, `pet:p:${TODAY}`);
    assert.match(plan[0].body, /triste/);
  });
});
