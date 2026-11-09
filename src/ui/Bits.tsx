import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing, FadeInDown, LinearTransition, SharedValue, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import { C, F, M } from '../theme';

/** One orchestrated entrance. Index drives the delay so siblings settle in reading order. */
export function Reveal({ i = 0, children, style, layout }: { i?: number; children: React.ReactNode; style?: StyleProp<ViewStyle>; layout?: boolean }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(100 + i * M.stagger).duration(380).easing(M.ease.out)}
      layout={layout ? LinearTransition.duration(260).easing(M.ease.out) : undefined}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export function Glass({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  if (Platform.OS === 'ios') {
    return (
      <BlurView tint="light" intensity={70} style={[{ overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.6)' }, style]}>
        {children}
      </BlurView>
    );
  }
  return <View style={[{ overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.96)' }, style]}>{children}</View>;
}

export function PlaneIcon({ size = 24, color = C.text, rotate = 0 }: { size?: number; color?: string; rotate?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: [{ rotate: `${rotate}deg` }] }}>
      <Path
        d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
        fill={color}
      />
    </Svg>
  );
}

export type IconName = 'back' | 'swap' | 'search' | 'ticket' | 'check' | 'plus' | 'minus' | 'oneway' | 'loop' | 'close';
const PATHS: Record<IconName, string> = {
  back: 'M15 5l-7 7 7 7',
  swap: 'M7 4v14m0 0l-3-3m3 3l3-3M17 20V6m0 0l-3 3m3-3l3 3',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16l-4-4',
  ticket: 'M4 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h16v-2a2 2 0 0 1 0-4v0a2 2 0 0 0 0-4V6H4zm10-2v12',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  oneway: 'M4 12h15m-5-5l5 5-5 5',
  loop: 'M4 8.5h14m-3-3l3 3-3 3M20 15.5H6m3-3l-3 3 3 3',
  close: 'M6 6l12 12M18 6L6 18',
};
export function Icon({ name, size = 22, color = C.text, stroke = 1.7 }: { name: IconName; size?: number; color?: string; stroke?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={PATHS[name]} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Digit({ d, h, style }: { d: number; h: number; style: StyleProp<TextStyle> }) {
  const y = useSharedValue(-d * h);
  useEffect(() => {
    y.value = withSpring(-d * h, M.spring.settle);
  }, [d, h, y]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <View style={{ height: h, overflow: 'hidden' }}>
      <Animated.View style={a}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <Text key={n} style={[style, { height: h, lineHeight: h }]}>{n}</Text>
        ))}
      </Animated.View>
    </View>
  );
}

/** Odometer number: each digit is a column that springs to its value. */
export function Roll({ value, size, style, prefix = '' }: { value: number; size: number; style: StyleProp<TextStyle>; prefix?: string }) {
  const str = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const chars = (prefix + str).split('');
  return (
    <View style={{ flexDirection: 'row', height: size }}>
      {chars.map((c, i) => {
        const key = chars.length - i;
        return /\d/.test(c) ? (
          <Digit key={key} d={Number(c)} h={size} style={style} />
        ) : (
          <Text key={key} style={[style, { height: size, lineHeight: size }]}>{c}</Text>
        );
      })}
    </View>
  );
}

export function useLoop(duration = 1400) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.cubic) }), -1, false);
  }, [v, duration]);
  return v as SharedValue<number>;
}

/** Sliding-pill segmented control. Optional icons; optional fixed width for compact use. */
export function Segmented({ options, index, onChange, icons, width, height = 44 }: { options: string[]; index: number; onChange: (i: number) => void; icons?: IconName[]; width?: number; height?: number }) {
  const [w, setW] = useState(width ?? 0);
  const x = useSharedValue(0);
  const itemW = (w - 8) / options.length;
  useEffect(() => {
    x.value = withSpring(index * itemW, M.spring.settle);
  }, [index, itemW, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View
      onLayout={(e: LayoutChangeEvent) => !width && setW(e.nativeEvent.layout.width)}
      style={[{ height, borderRadius: height / 2, backgroundColor: C.sunken, padding: 4, flexDirection: 'row' }, width ? { width } : null]}
    >
      {w > 0 && (
        <Animated.View style={[{ position: 'absolute', left: 4, top: 4, height: height - 8, width: itemW, borderRadius: (height - 8) / 2, backgroundColor: C.navy }, pill]} />
      )}
      {options.map((o, i) => (
        <Pressable
          key={o}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }}
          onPress={() => { Haptics.selectionAsync(); onChange(i); }}
        >
          {icons && <Icon name={icons[i]} size={16} color={i === index ? C.onNavy : C.text2} />}
          <Text style={{ fontFamily: F.med, fontSize: 13.5, color: i === index ? C.onNavy : C.text2 }}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}
