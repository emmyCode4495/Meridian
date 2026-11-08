import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect } from 'react-native-svg';
import { Booking } from '../store';
import { fmtDate, fmtTime } from '../data';
import { C, F, M, shadow } from '../theme';
import { PlaneIcon } from './Bits';

export function Barcode({ seed, width, height }: { seed: string; width: number; height: number }) {
  const bars = useMemo(() => {
    let a = 0;
    for (let i = 0; i < seed.length; i++) a = (a * 31 + seed.charCodeAt(i)) >>> 0;
    const out: { x: number; w: number }[] = [];
    let x = 0;
    while (x < width) {
      a = (a * 1664525 + 1013904223) >>> 0;
      const w = 1 + (a % 4);
      if ((a >> 8) % 3 !== 0) out.push({ x, w });
      x += w + 1 + ((a >> 12) % 2);
    }
    return out;
  }, [seed, width]);
  return (
    <Svg width={width} height={height}>
      {bars.map((b, i) => (
        <Rect key={i} x={b.x} y={0} width={b.w} height={height} fill={C.navy} />
      ))}
    </Svg>
  );
}

function Cell({ label, value, serif }: { label: string; value: string; serif?: boolean }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: F.med, fontSize: 11, color: C.mute }}>{label}</Text>
      <Text style={{ fontFamily: serif ? F.display : F.med, fontSize: serif ? 26 : 15, lineHeight: serif ? 30 : 20, color: C.text, marginTop: 1, fontVariant: ['tabular-nums'] }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/** Boarding pass with a perforated stub. Drag to tilt it in 3D; a sheen follows the light. */
export function BoardingPass({ booking, paxIndex = 0, leg = 0, width }: { booking: Booking; paxIndex?: number; leg?: number; width: number }) {
  const isRet = leg === 1 && !!booking.ret;
  const f = isRet ? booking.ret! : booking.flight;
  const date = isRet ? booking.retDate! : booking.date;
  const p = booking.pax[paxIndex] ?? booking.pax[0];
  const rx = useSharedValue(0);
  const ry = useSharedValue(0);

  const pan = usePanGesture({
    onUpdate: (e) => {
      'worklet';
      ry.value = Math.max(-16, Math.min(16, e.translationX / 8));
      rx.value = Math.max(-16, Math.min(16, -e.translationY / 8));
    },
    onDeactivate: () => {
      'worklet';
      rx.value = withSpring(0, M.spring.bouncy);
      ry.value = withSpring(0, M.spring.bouncy);
    },
  });

  const tilt = useAnimatedStyle(() => ({
    transform: [{ perspective: 900 }, { rotateX: `${rx.value}deg` }, { rotateY: `${ry.value}deg` }],
  }));
  const sheen = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(ry.value) + Math.abs(rx.value), [0, 24], [0, 0.6]),
    transform: [{ translateX: ry.value * 10 }, { rotate: '18deg' }],
  }));

  const notch = { position: 'absolute' as const, width: 28, height: 28, borderRadius: 14, backgroundColor: C.bg, top: 262 };

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ width, borderRadius: 26, backgroundColor: C.surface, overflow: 'hidden', ...shadow(18, 36, 0.5) }, tilt]}>
        <LinearGradient colors={[C.sky, '#E6F0F8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 22, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: f.airline.color }} />
            <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.text }}>{f.airline.name}</Text>
          </View>
          <Text style={{ fontFamily: F.italic, fontSize: 16, color: C.text2 }}>{isRet ? 'Return' : booking.ret ? 'Outbound' : 'Boarding pass'}</Text>
        </LinearGradient>

        <View style={{ padding: 22, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontFamily: F.light, fontSize: 46, lineHeight: 50, letterSpacing: 1.5, color: C.text }}>{f.from.code}</Text>
              <Text style={{ fontFamily: F.italic, fontSize: 16, color: C.text2 }}>{f.from.city}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <PlaneIcon size={22} color={C.accent} rotate={90} />
              <Text style={{ fontFamily: F.med, fontSize: 11, color: C.mute, marginTop: 4 }}>{f.number}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: F.light, fontSize: 46, lineHeight: 50, letterSpacing: 1.5, color: C.text }}>{f.to.code}</Text>
              <Text style={{ fontFamily: F.italic, fontSize: 16, color: C.text2 }}>{f.to.city}</Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: C.line, marginVertical: 16 }} />
          <Cell label="Passenger" value={`${p.first} ${p.last}`} />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
            <Cell label="Date" value={fmtDate(date)} />
            <Cell label="Departs" value={fmtTime(f.depart)} />
            <Cell label="Boards" value={fmtTime(f.depart - 40)} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
            <Cell serif label="Gate" value={booking.gate} />
            <Cell serif label="Terminal" value={booking.terminal} />
            <Cell serif label="Seat" value={booking.seats[paxIndex] ?? '-'} />
          </View>
        </View>

        <View style={{ height: 1, marginHorizontal: 22, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: C.lineStrong }} />
        <View style={[notch, { left: -14 }]} />
        <View style={[notch, { right: -14 }]} />

        <View style={{ padding: 22, paddingTop: 18, alignItems: 'center' }}>
          <Barcode seed={booking.pnr + (booking.seats[paxIndex] ?? '') + leg} width={width - 44} height={52} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', width: width - 44, marginTop: 10 }}>
            <Text style={T_SMALL}>Booking ref</Text>
            <Text style={{ fontFamily: F.semi, fontSize: 15, letterSpacing: 3.5, color: C.text }}>{booking.pnr}</Text>
            <Text style={T_SMALL}>{booking.cabin}</Text>
          </View>
        </View>

        <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: -60, bottom: -60, width: 90, left: width / 2 - 45 }, sheen]}>
          <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const T_SMALL = { fontFamily: F.med, fontSize: 11, color: C.mute } as const;
