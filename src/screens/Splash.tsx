import React, { useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing, FadeInUp, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { C, M } from '../theme';
import { useNav } from '../nav/Navigator';
import { Logo, OrbitGlobe } from '../ui/Globe';

function Cloud({ top, size, from, to, delay }: { top: string; size: number; from: number; to: number; delay: number }) {
  const x = useSharedValue(from);
  useEffect(() => {
    x.value = withDelay(delay, withRepeat(withSequence(withTiming(to, { duration: 9000, easing: Easing.inOut(Easing.sin) }), withTiming(from, { duration: 9000, easing: Easing.inOut(Easing.sin) })), -1));
  }, [x, from, to, delay]);
  const s = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top: top as `${number}%`, width: size, height: size * 0.34, borderRadius: size, backgroundColor: 'rgba(255,255,255,0.7)' }, s]}
    />
  );
}

export function Splash() {
  const { width } = useWindowDimensions();
  const nav = useNav();
  const intro = useSharedValue(0);
  const lap = useSharedValue(0);
  const gw = Math.min(width, 400);

  useEffect(() => {
    intro.value = withTiming(1, { duration: 1100, easing: M.ease.emphasized });
    // One complete 360° lap, starting once the globe has landed.
    lap.value = withDelay(750, withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.cubic) }));
    const t = setTimeout(() => nav.replace('Main'), 4900);
    return () => clearTimeout(t);
  }, [intro, lap, nav]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
      <LinearGradient colors={['#D3E5F4', C.bg]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '70%' }} />
      <Cloud top="14%" size={170} from={-60} to={40} delay={0} />
      <Cloud top="62%" size={210} from={width - 120} to={width - 220} delay={600} />
      <Cloud top="30%" size={110} from={width - 80} to={width - 150} delay={300} />

      <View style={{ marginTop: -30 }}>
        <OrbitGlobe width={gw} progress={lap} intro={intro} />
      </View>
      <Animated.View entering={FadeInUp.delay(1700).duration(900).easing(M.ease.out)} style={{ marginTop: 8 }}>
        <Logo size={54} />
      </Animated.View>
    </View>
  );
}
