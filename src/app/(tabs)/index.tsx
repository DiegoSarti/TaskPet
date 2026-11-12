import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PetView } from '@/components/PetView';
import { TaskRow } from '@/components/TaskRow';
import { colors, MOOD_LABEL, radius } from '@/constants/theme';
import { todayKey } from '@/domain/dates';
import { dayRatio, tasksForDay } from '@/domain/engine';
import { AURAS, STAGES } from '@/domain/rules';
import { useAppStore, usePetStatus } from '@/store/useAppStore';

export default function TodayScreen() {
  const pet = useAppStore((s) => s.pet);
  const allTasks = useAppStore((s) => s.tasks);
  const log = useAppStore((s) => s.log);
  const mark = useAppStore((s) => s.mark);
  const archiveTask = useAppStore((s) => s.archiveTask);
  const status = usePetStatus();
  const today = todayKey();

  if (!pet || !status) return null;

  const tasks = tasksForDay(allTasks, today);
  const ratio = dayRatio(allTasks, log, today);
  const mood = MOOD_LABEL[status.mood];
  const stageLabel = STAGES[status.stageIndex].label;
  const auraLabel = AURAS.find((a) => a.aura === status.aura)?.label;

  const confirmArchive = (id: string, title: string) =>
    Alert.alert('Remover tarefa', `Remover "${title}"? O histórico continua salvo.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => archiveTask(id) },
    ]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.petCard}>
        <PetView species={pet.species} stage={status.stage} mood={status.mood} aura={status.aura} variant={status.variant} />
        <Text style={styles.petName}>{pet.name}</Text>
        <Text style={styles.petMeta}>
          {stageLabel} · {mood.emoji} {mood.label}
        </Text>

        <View style={styles.xpBar}>
          <View style={[styles.xpFill, { width: `${status.stageProgress * 100}%` }]} />
        </View>
        <Text style={styles.xpText}>
          {status.nextStageXp ? `${pet.xp} / ${status.nextStageXp} XP para evoluir` : `${pet.xp} XP · estágio máximo!`}
        </Text>

        <View style={styles.chips}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>🔥 {status.streak} {status.streak === 1 ? 'dia' : 'dias'}</Text>
          </View>
          {status.aura !== 'nenhuma' && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>✨ Aura {auraLabel}</Text>
            </View>
          )}
        </View>

        {status.daysUntilDeath !== null && (
          <View style={styles.warning}>
            <Text style={styles.warningText}>
              {pet.name} está {status.mood === 'doente' ? 'doente' : 'triste'} e não está evoluindo.{' '}
              {status.daysUntilDeath === 1
                ? `Conclua uma tarefa hoje ou ${pet.name} vai partir amanhã!`
                : `Conclua uma tarefa. Faltam ${status.daysUntilDeath} dias para ${pet.name} partir.`}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tarefas de hoje</Text>
        {ratio !== null && <Text style={styles.muted}>{Math.round(ratio * 100)}%</Text>}
      </View>

      {tasks.length === 0 ? (
        <Text style={[styles.muted, { textAlign: 'center', marginVertical: 24 }]}>
          Nenhuma tarefa ainda. Crie a primeira para {pet.name} começar a crescer!
        </Text>
      ) : (
        <View style={{ gap: 10 }}>
          {tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              log={log}
              date={today}
              onIncrement={() => mark(t.id, 1)}
              onDecrement={() => mark(t.id, -1)}
              onLongPress={() => confirmArchive(t.id, t.title)}
            />
          ))}
          <Text style={[styles.muted, { textAlign: 'center', fontSize: 12 }]}>Segure uma tarefa para remover.</Text>
        </View>
      )}

      <Pressable style={styles.addBtn} onPress={() => router.push('/new-task')}>
        <Text style={styles.addBtnText}>+ Nova tarefa</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, gap: 12 },
  petCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 20, alignItems: 'center', gap: 4 },
  petName: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 8 },
  petMeta: { fontSize: 14, color: colors.muted },
  xpBar: { width: '100%', height: 10, borderRadius: 5, backgroundColor: colors.primarySoft, marginTop: 12, overflow: 'hidden' },
  xpFill: { height: 10, backgroundColor: colors.primary },
  xpText: { fontSize: 12, color: colors.muted, marginTop: 4 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 10 },
  chip: { backgroundColor: colors.primarySoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  warning: { backgroundColor: '#FFF4E5', borderRadius: radius.md, padding: 12, marginTop: 12, width: '100%' },
  warningText: { color: '#8A5300', fontSize: 13, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted },
  addBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: radius.md, alignItems: 'center', marginTop: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
