import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PetView } from '@/components/PetView';
import { colors, MOOD_LABEL, radius } from '@/constants/theme';
import { todayKey } from '@/domain/dates';
import { weeklyXp } from '@/domain/engine';
import { STAGES } from '@/domain/rules';
import {
  acceptRequest,
  addFriendByCode,
  type BoardEntry,
  currentUserId,
  DEMO_FRIENDS,
  fetchBoard,
  fetchPendingRequests,
  isSocialEnabled,
  type PendingRequest,
  sendCheer,
} from '@/lib/social';
import { useAppStore, usePetStatus } from '@/store/useAppStore';

type SortBy = 'weeklyXp' | 'streak' | 'xp';
const SORTS: { id: SortBy; label: string }[] = [
  { id: 'weeklyXp', label: 'XP da semana' },
  { id: 'streak', label: 'Streak' },
  { id: 'xp', label: 'XP total' },
];
const CHEERS = ['👏', '💪', '🔥', '❤️', '⭐'];

export default function FriendsScreen() {
  const pet = useAppStore((s) => s.pet);
  const tasks = useAppStore((s) => s.tasks);
  const log = useAppStore((s) => s.log);
  const status = usePetStatus();

  const [loggedIn, setLoggedIn] = useState(false);
  const [board, setBoard] = useState<BoardEntry[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('weeklyXp');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const demo = !isSocialEnabled() || !loggedIn;

  const load = useCallback(async () => {
    if (!isSocialEnabled()) return;
    setLoading(true);
    try {
      const id = await currentUserId();
      setLoggedIn(!!id);
      if (!id) return;
      const [b, p] = await Promise.all([fetchBoard(), fetchPendingRequests()]);
      setBoard(b);
      setPending(p);
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Não foi possível carregar seus amigos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // No modo demonstração, mostra você (dados locais) junto com amigos fictícios.
  const entries = useMemo<BoardEntry[]>(() => {
    if (!demo) return board;
    if (!pet || !status) return DEMO_FRIENDS;
    const me: BoardEntry = {
      userId: 'me', username: 'voce', displayName: 'Você', petName: pet.name, species: pet.species,
      stage: status.stage, mood: status.mood, aura: status.aura, variant: status.variant,
      xp: pet.xp, streak: status.streak, weeklyXp: weeklyXp(tasks, log, todayKey()), isMe: true,
    };
    return [me, ...DEMO_FRIENDS];
  }, [demo, board, pet, status, tasks, log]);

  const ranked = [...entries].sort((a, b) => b[sortBy] - a[sortBy]);

  const onAdd = async () => {
    if (!code.trim()) return;
    try {
      await addFriendByCode(code);
      setCode('');
      Alert.alert('Pedido enviado!', 'Quando a pessoa aceitar, o pet dela aparece aqui.');
      load();
    } catch (e: any) {
      Alert.alert('Ops', e.message);
    }
  };

  const onCheer = (entry: BoardEntry) => {
    if (demo) {
      Alert.alert('Modo demonstração', 'Entre na sua conta para incentivar amigos de verdade.');
      return;
    }
    Alert.alert(`Incentivar ${entry.displayName}`, 'Escolha um incentivo', [
      ...CHEERS.map((emoji) => ({
        text: emoji,
        onPress: () => sendCheer(entry.userId, emoji).catch((e) => Alert.alert('Ops', e.message)),
      })),
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      {demo && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            {isSocialEnabled()
              ? 'Você está vendo amigos de exemplo. Entre na sua conta para adicionar amigos de verdade.'
              : 'Modo demonstração: o servidor ainda não foi configurado, então estes amigos são de exemplo.'}
          </Text>
          {isSocialEnabled() && (
            <Pressable style={styles.bannerBtn} onPress={() => router.push('/auth')}>
              <Text style={styles.bannerBtnText}>Entrar / Criar conta</Text>
            </Pressable>
          )}
        </View>
      )}

      {!demo && (
        <View style={styles.addRow}>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Código do amigo"
            autoCapitalize="characters"
            style={[styles.input, { flex: 1 }]}
            maxLength={6}
          />
          <Pressable style={styles.addBtn} onPress={onAdd}>
            <Text style={styles.addBtnText}>Adicionar</Text>
          </Pressable>
        </View>
      )}

      {pending.map((p) => (
        <View key={p.userId} style={styles.pending}>
          <Text style={{ flex: 1, color: colors.text }}>
            <Text style={{ fontWeight: '700' }}>{p.displayName}</Text> quer ser seu amigo
          </Text>
          <Pressable style={styles.addBtn} onPress={() => acceptRequest(p.userId).then(load)}>
            <Text style={styles.addBtnText}>Aceitar</Text>
          </Pressable>
        </View>
      ))}

      <Text style={styles.title}>Ranking</Text>
      <View style={styles.sorts}>
        {SORTS.map((s) => (
          <Pressable key={s.id} onPress={() => setSortBy(s.id)} style={[styles.sort, sortBy === s.id && styles.sortOn]}>
            <Text style={[styles.sortText, sortBy === s.id && styles.sortTextOn]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      {ranked.map((e, i) => (
        <View key={e.userId} style={[styles.card, e.isMe && styles.cardMe]}>
          <Text style={styles.position}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}º`}</Text>
          {e.species && e.stage && e.mood && e.aura && e.variant ? (
            <PetView species={e.species} stage={e.stage} mood={e.mood} aura={e.aura} variant={e.variant} size={64} />
          ) : (
            <View style={{ width: 64, alignItems: 'center' }}>
              <Text style={{ fontSize: 30 }}>❔</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{e.displayName}</Text>
            <Text style={styles.meta}>
              {e.petName ?? 'Sem pet'}
              {e.stage ? ` · ${STAGES.find((s) => s.stage === e.stage)?.label}` : ''}
              {e.mood ? ` · ${MOOD_LABEL[e.mood].emoji}` : ''}
            </Text>
            <Text style={styles.meta}>
              🔥 {e.streak} · ⚡ {e.weeklyXp} XP semana · {e.xp} XP total
            </Text>
          </View>
          {!e.isMe && (
            <Pressable onPress={() => onCheer(e)} hitSlop={8} style={styles.cheer}>
              <Text style={{ fontSize: 20 }}>👏</Text>
            </Pressable>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, paddingBottom: 40 },
  banner: { backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: 14, gap: 10 },
  bannerText: { color: colors.text, fontSize: 13 },
  bannerBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, padding: 10, alignItems: 'center' },
  bannerBtnText: { color: '#fff', fontWeight: '700' },
  addRow: { flexDirection: 'row', gap: 8 },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: colors.text,
  },
  addBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 14, justifyContent: 'center', paddingVertical: 10 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  pending: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, padding: 12, borderRadius: radius.md },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 6 },
  sorts: { flexDirection: 'row', gap: 8 },
  sort: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  sortOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  sortText: { color: colors.text, fontSize: 13 },
  sortTextOn: { color: '#fff', fontWeight: '700' },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card,
    borderRadius: radius.md, padding: 10, borderWidth: 1, borderColor: colors.border,
  },
  cardMe: { borderColor: colors.primary, borderWidth: 2 },
  position: { width: 30, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.muted },
  cheer: { padding: 6 },
});
