import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { signIn, signUp } from '@/lib/social';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === 'login') await signIn(email.trim(), password);
      else {
        if (!/^[a-z0-9_]{3,20}$/.test(username.toLowerCase())) {
          throw new Error('Nome de usuário: 3 a 20 letras, números ou _.');
        }
        const needsConfirmation = await signUp(email.trim(), password, username, displayName.trim() || username);
        if (needsConfirmation) {
          Alert.alert('Confirme seu e-mail', 'Enviamos um link para o seu e-mail. Depois de confirmar, volte aqui e entre.');
          setMode('login');
          return;
        }
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Ops', e.message ?? 'Algo deu errado.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</Text>
      {mode === 'signup' && (
        <>
          <TextInput style={styles.input} placeholder="Seu nome" value={displayName} onChangeText={setDisplayName} />
          <TextInput
            style={styles.input}
            placeholder="Nome de usuário"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
        </>
      )}
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput style={styles.input} placeholder="Senha" secureTextEntry value={password} onChangeText={setPassword} />
      <Pressable style={styles.button} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continuar</Text>}
      </Pressable>
      <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        <Text style={styles.link}>{mode === 'login' ? 'Não tem conta? Criar agora' : 'Já tenho conta'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 8 },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: 14, fontSize: 16, color: colors.text,
  },
  button: { backgroundColor: colors.primary, padding: 16, borderRadius: radius.md, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: colors.primary, textAlign: 'center', marginTop: 8, fontWeight: '600' },
});
