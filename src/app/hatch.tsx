import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius } from '@/constants/theme';
import { SPECIES } from '@/domain/species';
import { useAppStore } from '@/store/useAppStore';

export default function HatchScreen() {
  const hatchPet = useAppStore((s) => s.hatchPet);
  const lastLost = useAppStore((s) => s.memorial[0]);
  const [species, setSpecies] = useState(SPECIES[0].id);
  const [name, setName] = useState('');

  const hatch = () => {
    if (!name.trim()) return;
    hatchPet(name, species);
    router.replace('/');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {lastLost ? (
            <View style={styles.memorial}>
              <Text style={styles.memorialEmoji}>🪦</Text>
              <Text style={styles.memorialText}>
                {lastLost.name} ficou 7 dias sem cuidados e partiu. Vamos começar de novo? Desta vez, com calma e
                constância.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Bem-vindo ao TaskPet!</Text>
              <Text style={styles.subtitle}>
                Cumpra suas tarefas do dia e seu bichinho cresce. Se você sumir, ele fica triste.
              </Text>
            </>
          )}

          <Text style={styles.label}>Escolha seu ovo</Text>
          <View style={{ gap: 10 }}>
            {SPECIES.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setSpecies(s.id)}
                style={[styles.option, species === s.id && { borderColor: s.color, backgroundColor: s.color + '18' }]}>
                <Text style={{ fontSize: 34 }}>{s.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>{s.name}</Text>
                  <Text style={styles.optionDesc}>{s.description}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Dê um nome</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ex.: Bolinha"
            maxLength={20}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={hatch}
          />

          <Pressable style={[styles.button, !name.trim() && { opacity: 0.4 }]} onPress={hatch} disabled={!name.trim()}>
            <Text style={styles.buttonText}>Chocar ovo 🥚</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 20 },
  subtitle: { fontSize: 15, color: colors.muted },
  memorial: { alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: 20, marginTop: 20 },
  memorialEmoji: { fontSize: 48 },
  memorialText: { textAlign: 'center', color: colors.text, marginTop: 8, fontSize: 15 },
  label: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 12 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card,
  },
  optionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  optionDesc: { fontSize: 13, color: colors.muted },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: 14, fontSize: 16, color: colors.text,
  },
  button: { backgroundColor: colors.primary, padding: 16, borderRadius: radius.md, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
