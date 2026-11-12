import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { STAGES } from '@/domain/rules';
import { getSpecies, VARIANT_BADGE } from '@/domain/species';
import { isSocialEnabled, myProfile, signOut } from '@/lib/social';
import { useAppStore, usePetStatus } from '@/store/useAppStore';

type Profile = Awaited<ReturnType<typeof myProfile>>;

export default function ProfileScreen() {
  const pet = useAppStore((s) => s.pet);
  const memorial = useAppStore((s) => s.memorial);
  const status = usePetStatus();
  const [profile, setProfile] = useState<Profile>(null);

  useFocusEffect(
    useCallback(() => {
      if (isSocialEnabled()) myProfile().then(setProfile).catch(() => setProfile(null));
    }, []),
  );

  const stageLabel = (stage: string) => STAGES.find((s) => s.stage === stage)?.label ?? stage;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {profile ? (
          <>
            <Text style={styles.title}>{profile.display_name}</Text>
            <Text style={styles.muted}>@{profile.username}</Text>
            <Text style={[styles.label, { marginTop: 12 }]}>Seu código de amigo</Text>
            <Text style={styles.code}>{profile.friend_code}</Text>
            <View style={styles.row}>
              <Pressable
                style={styles.button}
                onPress={() => Share.share({ message: `Vem cuidar de um pet comigo no TaskPet! Meu código: ${profile.friend_code}` })}>
                <Text style={styles.buttonText}>Compartilhar</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.buttonGhost]} onPress={() => signOut().then(() => setProfile(null))}>
                <Text style={[styles.buttonText, { color: colors.primary }]}>Sair</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>Sem conta</Text>
            <Text style={styles.muted}>
              Seu pet e suas tarefas ficam salvos neste aparelho. Crie uma conta para adicionar amigos e entrar no ranking.
            </Text>
            {isSocialEnabled() && (
              <Pressable style={[styles.button, { marginTop: 12 }]} onPress={() => router.push('/auth')}>
                <Text style={styles.buttonText}>Entrar / Criar conta</Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      {pet && status && (
        <View style={styles.card}>
          <Text style={styles.label}>Seu pet</Text>
          <Text style={styles.big}>
            {getSpecies(pet.species).emoji} {pet.name}
          </Text>
          <Text style={styles.muted}>
            {getSpecies(pet.species).name} · {stageLabel(status.stage)} · {pet.xp} XP
          </Text>
          {status.variant !== 'nenhuma' && <Text style={styles.muted}>{VARIANT_BADGE[status.variant].emoji} {VARIANT_BADGE[status.variant].label}</Text>}
          <Text style={styles.muted}>Nasceu em {pet.bornAt.split('-').reverse().join('/')}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>Memorial 🪦</Text>
        {memorial.length === 0 ? (
          <Text style={styles.muted}>Nenhum pet perdido. Continue assim!</Text>
        ) : (
          memorial.map((m) => (
            <Text key={m.id} style={styles.muted}>
              {getSpecies(m.species).emoji} {m.name}: {stageLabel(m.stage)}, {m.xp} XP ({m.bornAt.split('-').reverse().join('/')} –{' '}
              {m.diedAt.split('-').reverse().join('/')})
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, gap: 4 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  big: { fontSize: 20, fontWeight: '700', color: colors.text },
  label: { fontSize: 14, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, fontSize: 14 },
  code: { fontSize: 32, fontWeight: '800', letterSpacing: 6, color: colors.primary },
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  button: { flex: 1, backgroundColor: colors.primary, padding: 12, borderRadius: radius.md, alignItems: 'center' },
  buttonGhost: { backgroundColor: colors.primarySoft },
  buttonText: { color: '#fff', fontWeight: '700' },
});
