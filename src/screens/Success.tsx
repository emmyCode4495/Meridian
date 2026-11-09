import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing, FadeIn, FadeInDown, FadeOut, useAnimatedProps, useSharedValue, withDelay, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useStore } from '../store';
import { useNav } from '../nav/Navigator';
import { C, F, M, T } from '../theme';
import { RouteArc, useRouteLoop } from '../ui/Arc';
import { Segmented } from '../ui/Bits';
import { PrimaryButton } from '../ui/Header';
import { BoardingPass } from '../ui/Pass';

const AnimCircle = Animated.createAnimatedComponent(Circle);
const AnimPath = Animated.createAnimatedComponent(Path);

function CheckRing() {
  const r = useSharedValue(0);
  const c = useSharedValue(0);
  useEffect(() => {
    r.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    c.value = withDelay(450, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
  }, [r, c]);
  const ring = useAnimatedProps(() => ({ strokeDashoffset: 245 * (1 - r.value) }));
  const tick = useAnimatedProps(() => ({ strokeDashoffset: 40 * (1 - c.value) }));
  return (
    <Svg width={84} height={84} viewBox="0 0 92 92">
      <AnimCircle cx={46} cy={46} r={39} stroke={C.good} strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray={[245, 245]} animatedProps={ring} rotation={-90} origin="46, 46" />
      <AnimPath d="M30 47 L41 58 L63 35" stroke={C.good} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={[40, 40]} animatedProps={tick} />
    </Svg>
  );
}

export function Success() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const nav = useNav();
  const { bookings, setTab } = useStore();
  const booking = bookings[0];
  const [phase, setPhase] = useState<'processing' | 'done'>('processing');
  const [leg, setLeg] = useState(0);
  const p = useRouteLoop(!!booking?.ret, 'pay');

  useEffect(() => {
    const t = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase('done');
    }, 2300);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {phase === 'processing' ? (
        <Animated.View exiting={FadeOut.duration(250)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 }}>
          <RouteArc width={Math.min(width - 80, 300)} height={120} progress={p} planeSize={28} flip={!!booking?.ret} persist />
          <Text style={{ ...T.title, fontSize: 26, marginTop: 28 }}>Confirming your seats</Text>
          <Text style={{ ...T.small, marginTop: 6 }}>This takes a moment.</Text>
        </Animated.View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingTop: insets.top + 24, paddingBottom: insets.bottom + 120 }}>
          <Animated.View entering={FadeIn.duration(300)}>
            <CheckRing />
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(350).duration(420).easing(M.ease.out)} style={{ ...T.hero, marginTop: 14 }}>
            You are booked
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(450).duration(420).easing(M.ease.out)} style={{ ...T.place, marginTop: 4, marginBottom: 22 }}>
            Drag your boarding pass to tilt it.
          </Animated.Text>
          {booking?.ret && (
            <Animated.View entering={FadeInDown.delay(520).duration(400).easing(M.ease.out)} style={{ marginBottom: 16 }}>
              <Segmented width={240} height={40} options={['Outbound', 'Return']} index={leg} onChange={setLeg} />
            </Animated.View>
          )}
          <Animated.View entering={FadeInDown.delay(600).duration(520).easing(M.ease.out)}>
            {booking && <BoardingPass key={leg} booking={booking} leg={leg} width={width - 40} />}
          </Animated.View>
        </ScrollView>
      )}
      {phase === 'done' && (
        <Animated.View entering={FadeInDown.delay(900).duration(400).easing(M.ease.out)} style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 14 }}>
          <PrimaryButton label="View my trips" onPress={() => { setTab(1); nav.popToTop(); }} />
        </Animated.View>
      )}
    </View>
  );
}
