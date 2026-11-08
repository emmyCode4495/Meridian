import React, { memo, useEffect, useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { EXIT_ROWS, SEAT_COLS, SEAT_ROWS, money, seatExtra, takenSeats } from '../data';
import { useStore } from '../store';
import { useNav } from '../nav/Navigator';
import { C, F, M, R, T } from '../theme';
import { Roll } from '../ui/Bits';
import { Header, PrimaryButton } from '../ui/Header';
import { Tap } from '../ui/Tap';

type Kind = 'std' | 'extra' | 'exit';
type SeatProps = { id: string; taken: boolean; selected: boolean; kind: Kind; onPress: (id: string) => void };

const Seat = memo(function Seat({ id, taken, selected, kind, onPress }: SeatProps) {
  const p = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(selected ? 1 : 0, M.spring.bouncy);
  }, [selected, p]);
  const border = kind === 'extra' ? C.accent : kind === 'exit' ? C.good : C.lineStrong;
  const a = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], ['#FFFFFF', C.navy]),
    transform: [{ scale: 1 + p.value * 0.12 }, { translateY: -p.value * 2 }],
  }));
  if (taken) {
    return <View style={{ width: 38, height: 40, borderRadius: 11, backgroundColor: C.sunken, opacity: 0.7 }} />;
  }
  return (
    <Tap haptic={false} scaleTo={0.88} onPress={() => onPress(id)}>
      <Animated.View style={[{ width: 38, height: 40, borderTopLeftRadius: 13, borderTopRightRadius: 13, borderBottomLeftRadius: 7, borderBottomRightRadius: 7, borderWidth: 1.5, borderColor: selected ? C.navy : border, alignItems: 'center', justifyContent: 'center' }, a]}>
        {selected && <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.onNavy }}>{id.replace(/\d+/, '')}</Text>}
      </Animated.View>
    </Tap>
  );
});

function Legend({ color, label, fill }: { color: string; label: string; fill?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 14, height: 14, borderRadius: 4, borderWidth: 1.5, borderColor: color, backgroundColor: fill ? color : 'transparent' }} />
      <Text style={{ fontFamily: F.body, fontSize: 11.5, color: C.text2 }}>{label}</Text>
    </View>
  );
}

export function Seats() {
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const { flight, search, seats, setSeats, pricing } = useStore();
  const taken = useMemo(() => takenSeats(flight?.id ?? 'x'), [flight]);
  const round = search.trip === 'round';

  useEffect(() => { setSeats([]); }, [setSeats]);

  const toggle = (id: string) => {
    if (seats.includes(id)) {
      Haptics.selectionAsync();
      setSeats(seats.filter((s) => s !== id));
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSeats(seats.length >= search.pax ? [...seats.slice(1), id] : [...seats, id]);
    }
  };

  const done = seats.length === search.pax;
  const extras = pricing().seatsTotal;
  const kindOf = (row: number): Kind => (row <= 5 ? 'extra' : EXIT_ROWS.includes(row) ? 'exit' : 'std');

  const renderSeat = (row: number, c: string) => {
    const id = `${row}${c}`;
    return (
      <View key={id} style={{ marginHorizontal: 3 }}>
        <Seat id={id} taken={taken.has(id)} selected={seats.includes(id)} kind={kindOf(row)} onPress={toggle} />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header onBack={nav.pop} title="Choose seats" sub={round ? `${seats.length} of ${search.pax}, kept on both flights` : `${seats.length} of ${search.pax} selected`} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, paddingBottom: 10 }}>
        <Legend color={C.lineStrong} label="Standard" />
        <Legend color={C.accent} label="Extra legroom" />
        <Legend color={C.good} label="Exit row" />
        <Legend color={C.navy} label="Yours" fill />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingBottom: insets.bottom + 160, paddingTop: 10 }}>
        <View style={{ width: 330, borderTopLeftRadius: 150, borderTopRightRadius: 150, borderBottomLeftRadius: R.panel, borderBottomRightRadius: R.panel, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.line, paddingTop: 70, paddingBottom: 30, alignItems: 'center' }}>
          <Text style={{ ...T.place, position: 'absolute', top: 36, fontSize: 14 }}>Front of the aircraft</Text>
          {Array.from({ length: SEAT_ROWS }, (_, r) => r + 1).map((row) => (
            <View key={row}>
              {EXIT_ROWS[0] === row && <Text style={{ ...T.small, color: C.good, textAlign: 'center', marginVertical: 6 }}>Exit row</Text>}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 9 }}>
                {SEAT_COLS.slice(0, 3).map((c) => renderSeat(row, c))}
                <Text style={{ width: 34, textAlign: 'center', fontFamily: F.med, fontSize: 11.5, color: C.mute, fontVariant: ['tabular-nums'] }}>{row}</Text>
                {SEAT_COLS.slice(3).map((c) => renderSeat(row, c))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, paddingBottom: insets.bottom + 14, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8, flex: 1, flexWrap: 'wrap' }}>
            {seats.length === 0 && <Text style={T.place}>Tap a seat to claim it</Text>}
            {seats.map((s) => (
              <Animated.View key={s} entering={FadeIn.duration(200)} style={{ paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: C.sunken, justifyContent: 'center' }}>
                <Text style={{ fontFamily: F.semi, fontSize: 13, color: C.text }}>{s}{seatExtra(parseInt(s, 10)) ? `, +${money(seatExtra(parseInt(s, 10)))}` : ''}</Text>
              </Animated.View>
            ))}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={T.small}>Seat extras</Text>
            <Roll value={extras} prefix="$" size={28} style={{ fontFamily: F.display, fontSize: 22, color: C.text }} />
          </View>
        </View>
        <PrimaryButton label={done ? 'Traveller details' : `Select ${search.pax - seats.length} more`} disabled={!done} onPress={() => nav.push('Passengers')} />
      </View>
    </View>
  );
}
