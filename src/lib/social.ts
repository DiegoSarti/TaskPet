import { startOfWeek, todayKey } from '@/domain/dates';
import type { Aura, Mood, Stage, Variant } from '@/domain/types';

import { supabase } from './supabase';

export interface BoardEntry {
  userId: string;
  username: string;
  displayName: string;
  petName: string | null;
  species: string | null;
  stage: Stage | null;
  mood: Mood | null;
  aura: Aura | null;
  variant: Variant | null;
  xp: number;
  streak: number;
  weeklyXp: number;
  isMe: boolean;
}

export interface PendingRequest {
  userId: string;
  displayName: string;
  username: string;
}

export interface Snapshot {
  petName: string;
  species: string;
  stage: Stage;
  mood: Mood;
  aura: Aura;
  variant: Variant;
  xp: number;
  streak: number;
  weeklyXp: number;
  petsLost: number;
}

export const isSocialEnabled = () => supabase !== null;

function client() {
  if (!supabase) throw new Error('Supabase não configurado');
  return supabase;
}

export async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function signUp(email: string, password: string, username: string, displayName: string) {
  const sb = client();
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Confira seu e-mail para confirmar a conta.');
  const { error: pErr } = await sb
    .from('profiles')
    .insert({ id: data.user.id, username: username.toLowerCase(), display_name: displayName });
  if (pErr) throw pErr;
}

export async function signIn(email: string, password: string) {
  const { error } = await client().auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  await client().auth.signOut();
}

export async function myProfile() {
  const id = await currentUserId();
  if (!id) return null;
  const { data, error } = await client()
    .from('profiles')
    .select('username, display_name, friend_code')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as { username: string; display_name: string; friend_code: string };
}

/** Publica a "foto" do pet para os amigos verem. */
export async function syncSnapshot(s: Snapshot) {
  const id = await currentUserId();
  if (!id) return;
  const { error } = await client().from('pet_snapshots').upsert({
    user_id: id,
    pet_name: s.petName,
    species: s.species,
    stage: s.stage,
    mood: s.mood,
    aura: s.aura,
    variant: s.variant,
    xp: s.xp,
    streak: s.streak,
    weekly_xp: s.weeklyXp,
    week_start: startOfWeek(todayKey()),
    pets_lost: s.petsLost,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function fetchBoard(): Promise<BoardEntry[]> {
  const me = await currentUserId();
  const { data, error } = await client().from('friend_board').select('*');
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    userId: r.user_id,
    username: r.username,
    displayName: r.display_name,
    petName: r.pet_name,
    species: r.species,
    stage: r.stage,
    mood: r.mood,
    aura: r.aura,
    variant: r.variant,
    xp: r.xp ?? 0,
    streak: r.streak ?? 0,
    weeklyXp: r.weekly_xp ?? 0,
    isMe: r.user_id === me,
  }));
}

export async function fetchPendingRequests(): Promise<PendingRequest[]> {
  const me = await currentUserId();
  if (!me) return [];
  const { data, error } = await client()
    .from('friendships')
    .select('requester, profiles!friendships_requester_fkey(username, display_name)')
    .eq('addressee', me)
    .eq('status', 'pending');
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    userId: r.requester,
    username: r.profiles?.username ?? '',
    displayName: r.profiles?.display_name ?? '',
  }));
}

export async function addFriendByCode(code: string) {
  const { error } = await client().rpc('send_friend_request', { code });
  if (error) throw error;
}

export async function acceptRequest(requesterId: string) {
  const me = await currentUserId();
  const { error } = await client()
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('requester', requesterId)
    .eq('addressee', me);
  if (error) throw error;
}

export async function sendCheer(toUserId: string, emoji: string) {
  const me = await currentUserId();
  const { error } = await client().from('cheers').insert({ from_user: me, to_user: toUserId, emoji });
  if (error) throw error;
}

/** Amigos fictícios para visualizar a tela enquanto o Supabase não está configurado. */
export const DEMO_FRIENDS: BoardEntry[] = [
  { userId: 'd1', username: 'ana', displayName: 'Ana', petName: 'Faísca', species: 'brasinha', stage: 'adulto', mood: 'radiante', aura: 'chama', variant: 'exercicio', xp: 1340, streak: 9, weeklyXp: 210, isMe: false },
  { userId: 'd2', username: 'leo', displayName: 'Léo', petName: 'Gelatina', species: 'gotinha', stage: 'filhote', mood: 'feliz', aura: 'faisca', variant: 'nenhuma', xp: 320, streak: 4, weeklyXp: 150, isMe: false },
  { userId: 'd3', username: 'bia', displayName: 'Bia', petName: 'Folhinha', species: 'brotinho', stage: 'jovem', mood: 'triste', aura: 'nenhuma', variant: 'estudo', xp: 610, streak: 0, weeklyXp: 40, isMe: false },
];
