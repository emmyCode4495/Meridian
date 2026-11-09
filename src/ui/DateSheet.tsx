import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { DAYS } from '../data';
import { C, F, M, R, T } from '../theme';
import { Segmented } from './Bits';
import { PrimaryButton } from './Header';
import { Tap } from './Tap';

export type DateMode = 'dep' | 'ret';
type Props = {
  visible: boolean;
  mode: DateMode;
  round: boolean;
  dayIdx: number;
  retIdx: number;
  onMode: (m: DateMode) => void;
  onPick: (patch: { dayIdx?: number; retIdx?: number }) => void;
  onClose: () => void;
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
type Cell = { i: number; d: Date } | null;

function useWeeks() {
  return useMemo(() => {
    const cells: Cell[] = [...Array<Cell>(DAYS[0].getDay()).fill(null), ...DAYS.map((d, i) => ({ i, d }))];
    while (cells.length % 7) cells.push(null);
    const weeks: Cell[][] = [];
    for (let k = 0; k < cells.length; k += 7) weeks.push(cells.slice(k, k + 7));
    return weeks;
  }, []);
}

function DayCell({ cell, dep, ret, mid, off, bandL, bandR, onPress }: { cell: Cell; dep: boolean; ret: boolean; mid: boolean; off: boolean; bandL: boolean; bandR: boolean; onPress: () => void }) {
  if (!cell) return <View style={{ flex: 1, height: 46 }} />;
  const on = dep || ret;
  return (
    <View style={{ flex: 1, height: 46, justifyContent: 'center', alignItems: 'center' }}>
      {(mid || bandL || bandR) && (
        <View style={{ position: 'absolute', top: 5, bottom: 5, left: bandL ? 0 : mid ? 0 : '50%', right: bandR ? 0 : mid ? 0 : '50%', backgroundColor: C.sunken }} />
      )}
      <Tap haptic={false} scaleTo={0.9} disabled={off} onPress={onPress} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? C.navy : 'transparent' }}>
        <Text style={{ fontFamily: on ? F.semi : F.med, fontSize: 15, color: on ? C.onNavy : off ? C.lineStrong : C.text, fontVariant: ['tabular-nums'] }}>{cell.d.getDate()}</Text>
      </Tap>
    </View>
  );
}

/** Range calendar in a bottom sheet. Pick the departure, it moves on to the return, then closes. */
export function DateSheet({ visible, mode, round, dayIdx, retIdx, onMode, onPick, onClose }: Props) {
  const { height } = useWindowDimensions();
  const panelH = Math.min(height * 0.82, 640);
  const y = useSharedValue(panelH + 40);
  const bd = useSharedValue(0);
  const weeks = useWeeks();

  useEffect(() => {
    if (visible) {
      y.value = withSpring(0, M.spring.soft);
      bd.value = withTiming(1, { duration: M.dur.base });
    } else {
      y.value = withTiming(panelH + 40, { duration: 260, easing: M.ease.exit });
      bd.value = withTiming(0, { duration: M.dur.base });
    }
  }, [visible, y, bd, panelH]);

  const pan = usePanGesture({
    onUpdate: (e) => {
      'worklet';
      y.value = Math.max(0, e.translationY);
    },
    onDeactivate: (e) => {
      'worklet';
      if (e.translationY > 120 || e.velocityY > 900) {
        y.value = withTiming(panelH + 40, { duration: 220 });
        scheduleOnRN(onClose);
      } else {
        y.value = withSpring(0, M.spring.snappy);
      }
    },
  });
  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const back = useAnimatedStyle(() => ({ opacity: bd.value }));

  const pick = (i: number) => {
    Haptics.selectionAsync();
    if (mode === 'dep') {
      onPick({ dayIdx: i });
      if (round) onMode('ret');
      else onClose();
    } else {
      onPick({ retIdx: i });
      onClose();
    }
  };

  return (
    <View pointerEvents={visible ? 'auto' : 'none'} style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11,34,57,0.38)' }, back]}>
        <Tap haptic={false} scaleTo={1} wrapStyle={StyleSheet.absoluteFill} style={StyleSheet.absoluteFill} onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </Tap>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, height: panelH, backgroundColor: C.bg, borderTopLeftRadius: R.sheet, borderTopRightRadius: R.sheet }, panel]}>
        <GestureDetector gesture={pan}>
          <View style={{ paddingTop: 10, paddingBottom: 8, alignItems: 'center' }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.lineStrong }} />
            <Text style={{ ...T.title, marginTop: 16, alignSelf: 'flex-start', paddingHorizontal: 24 }}>{round ? 'Pick your dates' : 'Pick your date'}</Text>
          </View>
        </GestureDetector>

        {round && (
          <View style={{ marginHorizontal: 20, marginTop: 6, marginBottom: 10 }}>
            <Segmented options={['Departure', 'Return']} index={mode === 'dep' ? 0 : 1} onChange={(i) => onMode(i === 0 ? 'dep' : 'ret')} height={42} />
          </View>
        )}

        <View style={{ paddingHorizontal: 14 }}>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            {WEEK.map((w, k) => (
              <Text key={k} style={{ flex: 1, textAlign: 'center', ...T.small }}>{w}</Text>
            ))}
          </View>
          {weeks.map((week, wi) => {
            const first = week.find((c) => c);
            const startsMonth = week.find((c) => c && c.d.getDate() === 1);
            const label = wi === 0 ? first : startsMonth;
            return (
              <View key={wi}>
                {label && <Text style={{ fontFamily: F.display, fontSize: 20, color: C.text, marginTop: 12, marginBottom: 4, marginLeft: 6 }}>{MONTHS[label.d.getMonth()]} {label.d.getFullYear()}</Text>}
                <View style={{ flexDirection: 'row' }}>
                  {week.map((cell, ci) => {
                    const i = cell?.i ?? -1;
                    const dep = i === dayIdx;
                    const ret = round && i === retIdx;
                    const span = round && retIdx > dayIdx;
                    return (
                      <DayCell
                        key={ci}
                        cell={cell}
                        dep={dep}
                        ret={ret}
                        mid={span && i > dayIdx && i < retIdx}
                        bandR={span && dep}
                        bandL={span && ret}
                        off={mode === 'ret' && round && i < dayIdx}
                        onPress={() => pick(i)}
                      />
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ position: 'absolute', left: 20, right: 20, bottom: 24 }}>
          <PrimaryButton label="Done" onPress={onClose} />
        </View>
      </Animated.View>
    </View>
  );
}
