import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { periodGoal, periodOccurrences } from '@/domain/engine';
import type { CompletionLog, DateKey, Task } from '@/domain/types';

interface Props {
  task: Task;
  log: CompletionLog;
  date: DateKey;
  onIncrement: () => void;
  onDecrement: () => void;
  onLongPress?: () => void;
}

const FREQ_LABEL = (t: Task) => {
  const f = t.frequency;
  if (f.type === 'daily') return 'Todo dia';
  if (f.type === 'weekdays') return ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].filter((_, i) => f.days.includes(i)).join(' ');
  if (f.type === 'weekly') return `${f.timesPerWeek}x por semana`;
  return `${f.timesPerMonth}x por mês`;
};

export function TaskRow({ task, log, date, onIncrement, onDecrement, onLongPress }: Props) {
  const count = log[date]?.[task.id] ?? 0;
  const done = count >= task.target;
  const isPeriod = task.frequency.type === 'weekly' || task.frequency.type === 'monthly';
  const periodText = isPeriod
    ? ` · ${periodOccurrences(task, log, date)}/${periodGoal(task)} ${task.frequency.type === 'weekly' ? 'na semana' : 'no mês'}`
    : '';

  return (
    <Pressable
      onPress={done ? onDecrement : onIncrement}
      onLongPress={onLongPress}
      style={[styles.row, done && styles.rowDone]}
      accessibilityRole="button"
      accessibilityLabel={`${task.title}, ${count} de ${task.target}`}>
      <Text style={styles.icon}>{task.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, done && styles.titleDone]}>{task.title}</Text>
        <Text style={styles.meta}>
          {FREQ_LABEL(task)}
          {periodText}
          {task.reminderTime ? ` · 🔔 ${task.reminderTime}` : ''}
        </Text>
        {task.target > 1 && (
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${(count / task.target) * 100}%` }]} />
          </View>
        )}
      </View>
      {task.target > 1 ? (
        <View style={styles.counter}>
          <Pressable onPress={onDecrement} hitSlop={8} style={styles.counterBtn}>
            <Text style={styles.counterBtnText}>−</Text>
          </Pressable>
          <Text style={styles.counterText}>
            {count}/{task.target}
            {task.unit ? `\n${task.unit}` : ''}
          </Text>
          <Pressable onPress={onIncrement} hitSlop={8} style={styles.counterBtn}>
            <Text style={styles.counterBtnText}>+</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.check, done && styles.checkDone]}>{done && <Text style={styles.checkMark}>✓</Text>}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowDone: { backgroundColor: '#F1FBF6', borderColor: '#BDEBD3' },
  icon: { fontSize: 26 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  titleDone: { color: colors.success },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  bar: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: colors.primary },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  counterBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  counterBtnText: { fontSize: 18, color: colors.primary, fontWeight: '700' },
  counterText: { minWidth: 40, textAlign: 'center', fontSize: 13, fontWeight: '600', color: colors.text },
  check: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.success, borderColor: colors.success },
  checkMark: { color: '#fff', fontWeight: '800' },
});
