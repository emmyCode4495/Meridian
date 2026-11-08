import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation, SharedValue, interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { C, M } from '../theme';

export type ScreenName =
  | 'Splash' | 'Main' | 'Results' | 'Detail' | 'Seats' | 'Passengers' | 'Payment' | 'Success' | 'Pass';

type Entry = { key: string; name: ScreenName; params?: unknown; mode: 'sheet' | 'fade'; leaving?: boolean };
type Nav = {
  push: (n: ScreenName, p?: unknown) => void;
  pop: () => void;
  popToTop: () => void;
  replace: (n: ScreenName, p?: unknown) => void;
  canGoBack: boolean;
};

const NavCtx = createContext<Nav>(null as unknown as Nav);
const ParamsCtx = createContext<unknown>(undefined);
export const useNav = () => useContext(NavCtx);
export const useParams = <T,>() => useContext(ParamsCtx) as T;

type Props = { screens: Record<ScreenName, React.ComponentType>; initial: ScreenName };

export function Navigator({ screens, initial }: Props) {
  const counter = useRef(0);
  const [stack, setStack] = useState<Entry[]>([{ key: 'k0', name: initial, mode: 'fade' }]);
  const count = useSharedValue(1);
  const live = stack.filter((e) => !e.leaving).length;

  useEffect(() => {
    count.value = withSpring(live, M.spring.fluid);
  }, [live, count]);

  const nextKey = () => `k${++counter.current}`;

  const push = useCallback((name: ScreenName, params?: unknown) => {
    setStack((s) => [...s, { key: nextKey(), name, params, mode: 'sheet' }]);
  }, []);

  const pop = useCallback(() => {
    setStack((s) => {
      const liveIdx = s.map((e, i) => (e.leaving ? -1 : i)).filter((i) => i >= 0);
      if (liveIdx.length <= 1) return s;
      const top = liveIdx[liveIdx.length - 1];
      return s.map((e, i) => (i === top ? { ...e, leaving: true } : e));
    });
  }, []);

  const popToTop = useCallback(() => {
    setStack((s) => s.map((e, i) => (i === 0 ? e : { ...e, leaving: true })));
  }, []);

  const replace = useCallback((name: ScreenName, params?: unknown) => {
    setStack((s) => {
      const liveIdx = s.map((e, i) => (e.leaving ? -1 : i)).filter((i) => i >= 0);
      const top = liveIdx[liveIdx.length - 1];
      return [...s.map((e, i) => (i === top ? { ...e, leaving: true } : e)), { key: nextKey(), name, params, mode: 'fade' as const }];
    });
  }, []);

  const gone = useCallback((key: string) => setStack((s) => s.filter((e) => e.key !== key)), []);

  const nav = useMemo<Nav>(
    () => ({ push, pop, popToTop, replace, canGoBack: live > 1 }),
    [push, pop, popToTop, replace, live],
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (live > 1) { pop(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [live, pop]);

  const topLive = [...stack].reverse().find((e) => !e.leaving)?.key;

  return (
    <NavCtx.Provider value={nav}>
      {stack.map((entry, index) => (
        <Item
          key={entry.key}
          entry={entry}
          index={index}
          count={count}
          Screen={screens[entry.name]}
          focused={entry.key === topLive}
          onGone={gone}
        />
      ))}
    </NavCtx.Provider>
  );
}

type ItemProps = {
  entry: Entry; index: number; count: SharedValue<number>;
  Screen: React.ComponentType; focused: boolean; onGone: (k: string) => void;
};

function Item({ entry, index, count, Screen, focused, onGone }: ItemProps) {
  const { height } = useWindowDimensions();
  const enter = useSharedValue(0);
  const sheet = entry.mode === 'sheet';

  useEffect(() => {
    enter.value = sheet ? withSpring(1, M.spring.fluid) : withTiming(1, { duration: M.dur.slow, easing: M.ease.standard });
  }, [enter, sheet]);

  useEffect(() => {
    if (!entry.leaving) return;
    enter.value = withTiming(
      0,
      { duration: sheet ? 340 : M.dur.base, easing: M.ease.exit },
      (finished) => {
        'worklet';
        if (finished) scheduleOnRN(onGone, entry.key);
      },
    );
  }, [entry.leaving, entry.key, enter, sheet, onGone]);

  const style = useAnimatedStyle(() => {
    const d = count.value - 1 - index;
    return {
      opacity: sheet ? 1 : enter.value,
      borderRadius: interpolate(d, [0, 1], [0, 34], Extrapolation.CLAMP),
      transform: [
        { translateY: sheet ? (1 - enter.value) * height : 0 },
        { scale: interpolate(d, [0, 1, 2], [1, 0.925, 0.88], Extrapolation.CLAMP) },
      ],
    };
  });
  const dim = useAnimatedStyle(() => ({
    opacity: interpolate(count.value - 1 - index, [0, 1], [0, 0.34], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View
      pointerEvents={focused ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: C.bg }, style]}
    >
      <ParamsCtx.Provider value={entry.params}>
        <Screen />
      </ParamsCtx.Provider>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: C.navy }, dim]} />
    </Animated.View>
  );
}
