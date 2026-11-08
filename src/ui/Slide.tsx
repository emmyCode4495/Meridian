import React from 'react';
import { Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { C, F, M, shadow } from '../theme';
import { PlaneIcon } from './Bits';

const KNOB = 52;

/** Slide-to-confirm. The plane rides the track; release past 85% commits. */
export function SlideToPay({ width, label, enabled, onConfirm }: { width: number; label: string; enabled: boolean; onConfirm: () => void }) {
  const max = width - KNOB - 8;
  const x = useSharedValue(0);

  const done = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm();
  };
  const tick = () => Haptics.selectionAsync();

  const pan = usePanGesture({
    enabled,
    activeOffsetX: [-6, 6],
    onUpdate: (e) => {
      'worklet';
      const next = Math.min(max, Math.max(0, e.translationX));
      if (Math.floor(next / (max / 6)) !== Math.floor(x.value / (max / 6))) scheduleOnRN(tick);
      x.value = next;
    },
    onDeactivate: () => {
      'worklet';
      if (x.value > max * 0.85) {
        x.value = withSpring(max, M.spring.snappy);
        scheduleOnRN(done);
      } else {
        x.value = withSpring(0, M.spring.bouncy);
      }
    },
  });

  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const fill = useAnimatedStyle(() => ({ width: x.value + KNOB + 8 }));
  const text = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, max * 0.5], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateX: interpolate(x.value, [0, max], [0, 24], Extrapolation.CLAMP) }],
  }));
  const r = (KNOB + 8) / 2;

  return (
    <View style={{ width, height: KNOB + 8, borderRadius: r, backgroundColor: C.sunken, justifyContent: 'center', opacity: enabled ? 1 : 0.55 }}>
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: r, backgroundColor: C.accentSoft }, fill]} />
      <Animated.View style={[{ alignItems: 'center', paddingLeft: KNOB * 0.5 }, text]}>
        <Text style={{ fontFamily: F.med, color: C.text, fontSize: 15 }}>{label}</Text>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            { position: 'absolute', left: 4, top: 4, width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', ...shadow(5, 12, 0.5) },
            knob,
          ]}
        >
          <PlaneIcon size={22} color={C.navy} rotate={90} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
