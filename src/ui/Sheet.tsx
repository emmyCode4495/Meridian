import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { AIRPORTS, Airport } from '../data';
import { C, F, M, R, T } from '../theme';
import { Tap } from './Tap';
import { Icon } from './Bits';

type Props = { visible: boolean; title: string; exclude?: string; onClose: () => void; onSelect: (a: Airport) => void };

/** Bottom sheet with a drag handle: velocity-aware dismiss, springs back otherwise. */
export function AirportSheet({ visible, title, exclude, onClose, onSelect }: Props) {
  const { height } = useWindowDimensions();
  const panelH = height * 0.78;
  const y = useSharedValue(panelH + 40);
  const bd = useSharedValue(0);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (visible) {
      y.value = withSpring(0, M.spring.soft);
      bd.value = withTiming(1, { duration: M.dur.base });
    } else {
      y.value = withTiming(panelH + 40, { duration: 260, easing: M.ease.exit });
      bd.value = withTiming(0, { duration: M.dur.base });
      setQ('');
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

  const data = useMemo(() => {
    const t = q.trim().toLowerCase();
    return AIRPORTS.filter((a) => a.code !== exclude).filter(
      (a) => !t || a.city.toLowerCase().includes(t) || a.code.toLowerCase().includes(t) || a.country.toLowerCase().includes(t),
    );
  }, [q, exclude]);

  return (
    <View pointerEvents={visible ? 'auto' : 'none'} style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11,34,57,0.38)' }, back]}>
        <Tap haptic={false} scaleTo={1} wrapStyle={StyleSheet.absoluteFill} style={StyleSheet.absoluteFill} onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </Tap>
      </Animated.View>
      <Animated.View
        style={[
          { position: 'absolute', left: 0, right: 0, bottom: 0, height: panelH, backgroundColor: C.bg, borderTopLeftRadius: R.sheet, borderTopRightRadius: R.sheet },
          panel,
        ]}
      >
        <GestureDetector gesture={pan}>
          <View style={{ paddingTop: 10, paddingBottom: 8, alignItems: 'center' }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.lineStrong }} />
            <Text style={{ ...T.title, marginTop: 16, alignSelf: 'flex-start', paddingHorizontal: 24 }}>{title}</Text>
          </View>
        </GestureDetector>
        <View style={{ marginHorizontal: 20, marginVertical: 8, height: 50, borderRadius: R.control, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 }}>
          <Icon name="search" size={18} color={C.mute} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="City, airport or country"
            placeholderTextColor={C.mute}
            selectionColor={C.accent}
            style={{ flex: 1, fontFamily: F.body, fontSize: 16, color: C.text, padding: 0 }}
          />
        </View>
        <FlatList
          data={data}
          keyExtractor={(a) => a.code}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 40 }}
          ListEmptyComponent={<Text style={{ ...T.place, fontSize: 18, textAlign: 'center', marginTop: 40 }}>No airports match that.</Text>}
          renderItem={({ item }) => (
            <Tap onPress={() => onSelect(item)} scaleTo={0.985} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 12, gap: 14 }}>
              <Text style={{ fontFamily: F.light, fontSize: 24, letterSpacing: 1.2, color: C.text, width: 64 }}>{item.code}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.display, fontSize: 21, color: C.text }}>{item.city}</Text>
                <Text style={T.small}>{item.name}, {item.country}</Text>
              </View>
            </Tap>
          )}
        />
      </Animated.View>
    </View>
  );
}
