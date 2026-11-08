import React, { useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { useNav, useParams } from '../nav/Navigator';
import { C, F, T } from '../theme';
import { Reveal, Segmented } from '../ui/Bits';
import { Header } from '../ui/Header';
import { BoardingPass } from '../ui/Pass';
import { Tap } from '../ui/Tap';

export function Pass() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const nav = useNav();
  const { id } = useParams<{ id: string }>();
  const { bookings } = useStore();
  const b = bookings.find((x) => x.id === id);
  const [who, setWho] = useState(0);
  const [leg, setLeg] = useState(0);
  if (!b) return null;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header onBack={nav.pop} title="Boarding pass" sub={`${b.flight.from.city} to ${b.flight.to.city}${b.ret ? ' and back' : ''}`} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingTop: 6, paddingBottom: insets.bottom + 40 }}>
        {b.ret && (
          <Reveal i={0} style={{ marginBottom: 14 }}>
            <Segmented width={240} height={40} options={['Outbound', 'Return']} index={leg} onChange={setLeg} />
          </Reveal>
        )}
        {b.pax.length > 1 && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 20 }}>
            {b.pax.map((p, i) => (
              <Tap key={i} onPress={() => setWho(i)} style={{ paddingHorizontal: 14, height: 34, borderRadius: 17, backgroundColor: i === who ? C.navy : C.sunken, justifyContent: 'center' }}>
                <Text style={{ fontFamily: F.semi, fontSize: 13, color: i === who ? C.onNavy : C.text2 }}>{p.first}</Text>
              </Tap>
            ))}
          </View>
        )}
        <Reveal i={1}>
          <BoardingPass key={`${who}-${leg}`} booking={b} paxIndex={who} leg={leg} width={width - 40} />
        </Reveal>
        <Text style={{ ...T.place, marginTop: 24 }}>Drag the pass to tilt it.</Text>
      </ScrollView>
    </View>
  );
}
