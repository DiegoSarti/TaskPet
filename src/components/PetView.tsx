import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { AURA_COLORS } from '@/constants/theme';
import { getSpecies, STAGE_SCALE, VARIANT_BADGE } from '@/domain/species';
import type { Aura, Mood, Stage, Variant } from '@/domain/types';

export interface PetViewProps {
  species: string;
  stage: Stage;
  mood: Mood;
  aura: Aura;
  variant: Variant;
  size?: number;
}

/**
 * Visual provisório do pet. Quando o arquivo .riv estiver pronto, este componente
 * passa a renderizar o Rive com as mesmas props (veja docs/RIVE.md).
 */
export function PetView({ species, stage, mood, aura, variant, size = 200 }: PetViewProps) {
  const sp = getSpecies(species);
  const [bounce] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(0));

  const sad = mood === 'triste' || mood === 'doente';

  useEffect(() => {
    const speed = mood === 'radiante' ? 500 : sad ? 1600 : 900;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1, duration: speed, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: speed, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bounce, mood, sad]);

  useEffect(() => {
    if (aura === 'nenhuma') return;
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [aura, pulse]);

  const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, sad ? -3 : -12] });
  const auraScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.25] });
  const auraOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });
  const scale = STAGE_SCALE[stage];
  const emoji = stage === 'ovo' ? '🥚' : sp.emoji;
  const badge = variant !== 'nenhuma' ? VARIANT_BADGE[variant] : null;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {aura !== 'nenhuma' && (
        <Animated.View
          style={[
            styles.aura,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: AURA_COLORS[aura],
              opacity: auraOpacity,
              transform: [{ scale: auraScale }],
            },
          ]}
        />
      )}
      <View
        style={[
          styles.body,
          {
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: size * 0.4,
            backgroundColor: sad ? '#D9D6E3' : sp.color + '33',
            borderColor: aura !== 'nenhuma' ? AURA_COLORS[aura] : 'transparent',
          },
        ]}>
        <Animated.Text style={{ fontSize: size * 0.4 * scale, opacity: sad ? 0.6 : 1, transform: [{ translateY }] }}>
          {emoji}
        </Animated.Text>
      </View>
      {badge && (
        <View style={styles.badge}>
          <Text style={{ fontSize: size * 0.12 }}>{badge.emoji}</Text>
        </View>
      )}
      {sad && <Text style={[styles.tear, { fontSize: size * 0.12 }]}>{mood === 'doente' ? '🤒' : '💧'}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  aura: { position: 'absolute' },
  body: { alignItems: 'center', justifyContent: 'center', borderWidth: 4 },
  badge: {
    position: 'absolute',
    right: '8%',
    bottom: '8%',
    backgroundColor: '#fff',
    borderRadius: 999,
    padding: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tear: { position: 'absolute', top: '12%', right: '18%' },
});
