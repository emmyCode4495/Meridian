import React, { useEffect } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CABIN_BAGS, DAYS, Flight, fmtDate, fmtDur, fmtTime, money } from '../data';
import { useStore } from '../store';
import { useNav } from '../nav/Navigator';
import { C, F, R, T } from '../theme';
import { RouteArc } from '../ui/Arc';
import { Icon, Reveal, Roll } from '../ui/Bits';
import { Header, PrimaryButton } from '../ui/Header';

function Node({ time, code, name, top }: { time: string; code: string; name: string; top?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <Text style={{ ...T.time, width: 58, fontSize: 18 }}>{time}</Text>
      <View style={{ width: 13, height: 13, borderRadius: 7, borderWidth: 2.5, borderColor: top ? C.text : C.accent, backgroundColor: C.surface }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.display, fontSize: 21, lineHeight: 24, color: C.text }}>{code}</Text>
        <Text style={T.small} numberOfLines={1}>{name}</Text>
      </View>
    </View>
  );
}

function Leg({ f, date, title, delay }: { f: Flight; date: Date; title: string; delay: number }) {
  const line = useSharedValue(0);
  useEffect(() => {
    line.value = withDelay(delay, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [line, delay]);
  const lineStyle = useAnimatedStyle(() => ({ height: 78 * line.value }));
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <Text style={T.heading}>{title}</Text>
        <Text style={T.label}>{fmtDate(date)}</Text>
      </View>
      <View style={{ backgroundColor: C.surface, borderRadius: R.panel, borderWidth: 1, borderColor: C.line, padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: f.airline.color }} />
          <Text style={T.label}>{f.airline.name}, {f.number}, {f.aircraft}</Text>
        </View>
        <Node top time={fmtTime(f.depart)} code={f.from.code} name={f.from.name} />
        <View style={{ flexDirection: 'row', marginLeft: 58 + 16 + 5.5 }}>
          <Animated.View style={[{ width: 2, backgroundColor: C.accent, marginVertical: 5, borderRadius: 1 }, lineStyle]} />
          <View style={{ marginLeft: 24, marginTop: 18 }}>
            <Text style={{ fontFamily: F.med, fontSize: 13, color: C.text2 }}>
              {fmtDur(f.duration)}, {f.stops ? `via ${f.via?.city}, ${fmtDur(f.layover ?? 0)} layover` : 'nonstop'}
            </Text>
          </View>
        </View>
        <Node time={fmtTime(f.arrive)} code={f.to.code} name={f.to.name} />
      </View>
    </View>
  );
}

function Row({ l, r, strong }: { l: string; r: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <Text style={{ fontFamily: strong ? F.semi : F.body, fontSize: 15, color: strong ? C.text : C.text2 }}>{l}</Text>
      <Text style={{ fontFamily: strong ? F.display : F.med, fontSize: strong ? 22 : 15, color: C.text }}>{r}</Text>
    </View>
  );
}

export function Detail() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const nav = useNav();
  const { flight: f, retFlight, search, pricing } = useStore();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(250, withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.cubic) }));
  }, [p]);
  if (!f) return null;
  const round = search.trip === 'round' && !!retFlight;
  const { fare, taxes, total } = pricing();
  const perks = [
    `Checked bag ${CABIN_BAGS[search.cabin]}`,
    'Carry-on bag up to 8 kg',
    search.cabin === 'Economy' ? 'Meal and drinks on board' : 'Chef-curated dining',
    f.stops ? 'Wi-Fi on the long leg' : 'Free messaging Wi-Fi',
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <View>
          <LinearGradient colors={[f.to.hue[0], C.bg]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }} />
          <Header onBack={nav.pop} title={round ? 'Your round trip' : 'Your flight'} sub={`${f.from.city} to ${f.to.city}`} />
          <View style={{ alignItems: 'center', marginTop: 6 }}>
            <RouteArc width={width - 80} height={120} progress={p} planeSize={28} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 28, marginTop: 4 }}>
            <View>
              <Text style={{ ...T.code, fontSize: 40, lineHeight: 44 }}>{f.from.code}</Text>
              <Text style={T.place}>{f.from.city}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ ...T.code, fontSize: 40, lineHeight: 44 }}>{f.to.code}</Text>
              <Text style={T.place}>{f.to.city}</Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 26 }}>
          <Reveal i={0}>
            <Leg f={f} date={DAYS[search.dayIdx]} title={round ? 'Outbound' : 'Itinerary'} delay={500} />
          </Reveal>
          {round && retFlight && (
            <Reveal i={1}>
              <Leg f={retFlight} date={DAYS[search.retIdx]} title="Return" delay={800} />
            </Reveal>
          )}

          <Reveal i={2} style={{ marginTop: 8 }}>
            <Text style={{ ...T.heading, marginBottom: 10 }}>What&apos;s included</Text>
            <View style={{ backgroundColor: C.surface, borderRadius: R.panel, borderWidth: 1, borderColor: C.line, padding: 18, gap: 14 }}>
              {perks.map((t) => (
                <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: C.goodSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" size={14} color={C.good} />
                  </View>
                  <Text style={T.body}>{t}</Text>
                </View>
              ))}
            </View>
          </Reveal>

          <Reveal i={3} style={{ marginTop: 22 }}>
            <Text style={{ ...T.heading, marginBottom: 10 }}>Fare</Text>
            <View style={{ backgroundColor: C.surface, borderRadius: R.panel, borderWidth: 1, borderColor: C.line, padding: 20, gap: 10 }}>
              <Row l={`${round ? 'Both flights' : 'Flight'}, ${search.pax} traveller${search.pax > 1 ? 's' : ''}`} r={money(fare)} />
              <Row l="Taxes and airport fees" r={money(taxes)} />
              <View style={{ height: 1, backgroundColor: C.line, marginVertical: 4 }} />
              <Row strong l="Total" r={money(total)} />
            </View>
          </Reveal>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingBottom: insets.bottom + 14, paddingTop: 14, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.line, flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <View>
          <Text style={T.small}>Total</Text>
          <Roll value={total} prefix="$" size={34} style={{ fontFamily: F.display, fontSize: 30, color: C.text }} />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton label="Choose seats" onPress={() => nav.push('Seats')} />
        </View>
      </View>
    </View>
  );
}
