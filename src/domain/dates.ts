import type { DateKey } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey(): DateKey {
  return toDateKey(new Date());
}

function parse(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(key: DateKey, days: number): DateKey {
  const d = parse(key);
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Quantos dias de `from` até `to` (positivo se `to` for depois). */
export function diffDays(from: DateKey, to: DateKey): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86_400_000);
}

/** 0 = domingo ... 6 = sábado. */
export function weekday(key: DateKey): number {
  return parse(key).getUTCDay();
}

/** Segunda-feira da semana da data. */
export function startOfWeek(key: DateKey): DateKey {
  const offset = (weekday(key) + 6) % 7;
  return addDays(key, -offset);
}

export function startOfMonth(key: DateKey): DateKey {
  return `${key.slice(0, 7)}-01`;
}
