import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { CATEGORIES } from '@/domain/species';
import type { Category, Frequency, Task } from '@/domain/types';
import { useAppStore } from '@/store/useAppStore';

type FreqType = Frequency['type'];

const TEMPLATES: Omit<Task, 'id' | 'createdAt'>[] = [
  { title: 'Beber água', icon: '💧', category: 'hidratacao', frequency: { type: 'daily' }, target: 8, unit: 'copos' },
  { title: 'Academia', icon: '🏋️', category: 'exercicio', frequency: { type: 'weekly', timesPerWeek: 3 }, target: 1 },
  { title: 'Café da manhã da dieta', icon: '🥣', category: 'alimentacao', frequency: { type: 'daily' }, target: 1 },
  { title: 'Estudar espanhol', icon: '📚', category: 'estudo', frequency: { type: 'weekdays', days: [1, 2, 3, 4, 5] }, target: 1 },
  { title: 'Meditar', icon: '🧘', category: 'saude', frequency: { type: 'daily' }, target: 1 },
  { title: 'Arrumar o quarto', icon: '🧹', category: 'casa', frequency: { type: 'weekly', timesPerWeek: 1 }, target: 1 },
];

const FREQS: { id: FreqType; label: string }[] = [
  { id: 'daily', label: 'Todo dia' },
  { id: 'weekdays', label: 'Dias da semana' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'monthly', label: 'Mensal' },
];
const WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function NewTaskScreen() {
  const addTask = useAppStore((s) => s.addTask);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('outro');
  const [freq, setFreq] = useState<FreqType>('daily');
  const [days, setDays] = useState<number[]>([1, 3, 5]);
  const [times, setTimes] = useState(3);
  const [target, setTarget] = useState(1);
  const [unit, setUnit] = useState('');

  const icon = CATEGORIES.find((c) => c.id === category)?.icon ?? '⭐';
  const valid = title.trim().length > 0 && (freq !== 'weekdays' || days.length > 0);

  const buildFrequency = (): Frequency => {
    if (freq === 'weekdays') return { type: 'weekdays', days: [...days].sort((a, b) => a - b) };
    if (freq === 'weekly') return { type: 'weekly', timesPerWeek: times };
    if (freq === 'monthly') return { type: 'monthly', timesPerMonth: times };
    return { type: 'daily' };
  };

  const save = () => {
    if (!valid) return;
    addTask({ title: title.trim(), icon, category, frequency: buildFrequency(), target, unit: unit.trim() || undefined });
    router.back();
  };

  const applyTemplate = (t: (typeof TEMPLATES)[number]) => {
    addTask(t);
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Sugestões rápidas</Text>
      <View style={styles.wrap}>
        {TEMPLATES.map((t) => (
          <Pressable key={t.title} style={styles.pill} onPress={() => applyTemplate(t)}>
            <Text style={styles.pillText}>
              {t.icon} {t.title}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Ou crie a sua</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="Nome da tarefa" style={styles.input} maxLength={40} />

      <Text style={styles.label}>Categoria</Text>
      <Text style={styles.hint}>A categoria que você mais cumpre define a forma do seu pet quando ele crescer.</Text>
      <View style={styles.wrap}>
        {CATEGORIES.map((c) => (
          <Pressable key={c.id} style={[styles.pill, category === c.id && styles.pillOn]} onPress={() => setCategory(c.id)}>
            <Text style={[styles.pillText, category === c.id && styles.pillTextOn]}>
              {c.icon} {c.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Frequência</Text>
      <View style={styles.wrap}>
        {FREQS.map((f) => (
          <Pressable key={f.id} style={[styles.pill, freq === f.id && styles.pillOn]} onPress={() => setFreq(f.id)}>
            <Text style={[styles.pillText, freq === f.id && styles.pillTextOn]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      {freq === 'weekdays' && (
        <View style={styles.wrap}>
          {WEEK.map((d, i) => {
            const on = days.includes(i);
            return (
              <Pressable
                key={i}
                style={[styles.day, on && styles.pillOn]}
                onPress={() => setDays(on ? days.filter((x) => x !== i) : [...days, i])}>
                <Text style={[styles.pillText, on && styles.pillTextOn]}>{d}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {(freq === 'weekly' || freq === 'monthly') && (
        <Stepper
          label={freq === 'weekly' ? 'Vezes por semana' : 'Vezes por mês'}
          value={times}
          min={1}
          max={freq === 'weekly' ? 7 : 31}
          onChange={setTimes}
        />
      )}

      <Stepper label="Quantidade por dia" value={target} min={1} max={30} onChange={setTarget} />
      {target > 1 && (
        <TextInput value={unit} onChangeText={setUnit} placeholder="Unidade (ex.: copos, páginas)" style={styles.input} maxLength={15} />
      )}

      <Pressable style={[styles.button, !valid && { opacity: 0.4 }]} disabled={!valid} onPress={save}>
        <Text style={styles.buttonText}>Salvar tarefa</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stepper(props: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  const { label, value, min, max, onChange } = props;
  return (
    <View style={styles.stepper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepperCtrl}>
        <Pressable style={styles.stepBtn} onPress={() => onChange(Math.max(min, value - 1))}>
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{value}</Text>
        <Pressable style={styles.stepBtn} onPress={() => onChange(Math.min(max, value + 1))}>
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, paddingBottom: 40 },
  label: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 6 },
  hint: { fontSize: 12, color: colors.muted },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: 14, fontSize: 16, color: colors.text,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  pillOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { color: colors.text, fontSize: 14 },
  pillTextOn: { color: '#fff', fontWeight: '700' },
  day: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepperCtrl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { fontSize: 20, color: colors.primary, fontWeight: '700' },
  stepValue: { fontSize: 18, fontWeight: '700', minWidth: 28, textAlign: 'center', color: colors.text },
  button: { backgroundColor: colors.primary, padding: 16, borderRadius: radius.md, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
