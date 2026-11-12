import { useEffect } from 'react';

import { todayKey } from '@/domain/dates';
import { weeklyXp } from '@/domain/engine';
import { syncSnapshot } from '@/lib/social';
import { supabase } from '@/lib/supabase';
import { useAppStore, usePetStatus } from '@/store/useAppStore';

/** Publica a "foto" do pet no servidor sempre que algo visível para os amigos muda. */
export function useSnapshotSync() {
  const pet = useAppStore((s) => s.pet);
  const tasks = useAppStore((s) => s.tasks);
  const log = useAppStore((s) => s.log);
  const petsLost = useAppStore((s) => s.memorial.length);
  const status = usePetStatus();
  const weekly = weeklyXp(tasks, log, todayKey());

  const key = pet && status
    ? [pet.id, pet.xp, status.stage, status.mood, status.aura, status.variant, status.streak, weekly, petsLost].join('|')
    : null;

  useEffect(() => {
    if (!supabase || !pet || !status) return;
    const t = setTimeout(() => {
      syncSnapshot({
        petName: pet.name,
        species: pet.species,
        stage: status.stage,
        mood: status.mood,
        aura: status.aura,
        variant: status.variant,
        xp: pet.xp,
        streak: status.streak,
        weeklyXp: weekly,
        petsLost,
      }).catch((e) => console.warn('Falha ao sincronizar pet', e));
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
