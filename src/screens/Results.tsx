import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DAYS, Flight, fmtDate, fmtDur, fmtTime, generateFlights, money } from '../data';
import { useStore } from '../store';
import { useNav } from '../nav/Navigator';
import { C, F, M, R, T } from '../theme';
import { RouteArc, useRouteLoop } from '../ui/Arc';
import { Roll, Segmented } from '../ui/Bits';
import { Header } from '../ui/Header';
import { Tap } from '../ui/Tap';

function Loading({ total, label, round, leg }: { total: number; label: string; round: boolean; leg: number }) {
  const { width } = useWindowDimensions();
  // Round trips always fly there and back; one-way trips fly one direction.
  const p = useRouteLoop(round, `${leg}`);
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((x) => Math.min(total, x + Math.ceil(total / 14))), 110);
    return () => clearInterval(id);
  }, [total]);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
      <RouteArc width={Math.min(width - 80, 300)} height={120} progress={p} planeSize={28} flip={round} persist />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 26, gap: 8 }}>
        <Roll value={n} size={38} style={{ fontFamily: F.display, fontSize: 32, color: C.text }} />
        <Text style={T.place}>flights compared</Text>
      </View>
      <Text style={{ ...T.small, marginTop: 6 }}>{label}</Text>
    </View>
  );
}

function Tag({ label }: { label: string }) {
  const color = label === 'Cheapest' ? C.good : label === 'Fastest' ? '#3F65BE' : '#9A6B12';
  const bg = label === 'Cheapest' ? C.goodSoft : label === 'Fastest' ? 'rgba(63,101,190,0.12)' : C.accentSoft;
  return (
    <View style={{ paddingHorizontal: 10, height: 22, borderRadius: 11, backgroundColor: bg, justifyContent: 'center' }}>
      <Text style={{ fontFamily: F.semi, fontSize: 11.5, color }}>{label}</Text>
    </View>
  );
}

function FlightCard({ f, i, onPress }: { f: Flight; i: number; onPress: () => void }) {
  const over = Math.floor(f.arrive / 1440);
  return (
    <Animated.View layout={LinearTransition.duration(300).easing(M.ease.out)} entering={FadeInDown.delay(i * M.stagger).duration(360).easing(M.ease.out)}>
      <Tap onPress={onPress} scaleTo={0.98} style={{ borderRadius: R.panel, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, padding: 18, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: f.airline.color }} />
          <Text style={{ ...T.label, flex: 1 }}>{f.airline.name}, {f.number}</Text>
          {f.tags.map((t) => <Tag key={t} label={t} />)}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18 }}>
          <View>
            <Text style={T.time}>{fmtTime(f.depart)}</Text>
            <Text style={T.small}>{f.from.code}</Text>
          </View>
          <View style={{ flex: 1, paddingHorizontal: 14, alignItems: 'center' }}>
            <Text style={T.small}>{fmtDur(f.duration)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 5 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.text }} />
              <View style={{ flex: 1, height: 1.5, backgroundColor: C.lineStrong }} />
              {f.stops > 0 && <View style={{ width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: C.accent, backgroundColor: C.surface, position: 'absolute', left: '47%' }} />}
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.text }} />
            </View>
            <Text style={{ fontFamily: F.med, fontSize: 12, color: f.stops ? '#9A6B12' : C.good }}>
              {f.stops ? `1 stop in ${f.via?.city}` : 'Nonstop'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={T.time}>
              {fmtTime(f.arrive)}
              {over > 0 && <Text style={{ fontSize: 11.5, color: '#9A6B12' }}> +{over}</Text>}
            </Text>
            <Text style={T.small}>{f.to.code}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16 }}>
          <View>
            <Text style={{ fontFamily: F.display, fontSize: 30, lineHeight: 32, color: C.text }}>{money(f.price)}</Text>
            <Text style={T.small}>per traveller</Text>
          </View>
          <View style={{ paddingHorizontal: 20, height: 38, borderRadius: 19, backgroundColor: C.navy, justifyContent: 'center' }}>
            <Text style={{ fontFamily: F.semi, fontSize: 13.5, color: C.onNavy }}>Select</Text>
          </View>
        </View>
      </Tap>
    </Animated.View>
  );
}

function Progress({ leg }: { leg: number }) {
  const v = useSharedValue(leg);
  useEffect(() => {
    v.value = withSpring(leg, M.spring.settle);
  }, [leg, v]);
  const fill = useAnimatedStyle(() => ({ width: `${50 + v.value * 50}%` }));
  return (
    <View style={{ marginHorizontal: 20, marginBottom: 14 }}>
      <View style={{ height: 3, borderRadius: 2, backgroundColor: C.sunken, overflow: 'hidden' }}>
        <Animated.View style={[{ height: 3, backgroundColor: C.navy, borderRadius: 2 }, fill]} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ fontFamily: leg === 0 ? F.semi : F.med, fontSize: 12.5, color: leg === 0 ? C.text : C.mute }}>Choose outbound</Text>
        <Text style={{ fontFamily: leg === 1 ? F.semi : F.med, fontSize: 12.5, color: leg === 1 ? C.text : C.mute }}>Choose return</Text>
      </View>
    </View>
  );
}

export function Results() {
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const { search, flight, setFlight, setRetFlight } = useStore();
  const round = search.trip === 'round';
  const [leg, setLeg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState(0);

  const out = useMemo(() => generateFlights(search.from, search.to, DAYS[search.dayIdx], search.cabin), [search.from, search.to, search.dayIdx, search.cabin]);
  const ret = useMemo(() => generateFlights(search.to, search.from, DAYS[search.retIdx], search.cabin), [search.from, search.to, search.retIdx, search.cabin]);
  const flights = leg === 0 ? out : ret;
  const total = 280 + flights.length * 17;

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), leg === 0 ? 2100 : 1000);
    return () => clearTimeout(t);
  }, [leg]);

  const sorted = useMemo(() => {
    const l = [...flights];
    if (sort === 1) l.sort((a, b) => a.price - b.price);
    else if (sort === 2) l.sort((a, b) => a.duration - b.duration);
    else {
      const minP = Math.min(...l.map((f) => f.price));
      const minD = Math.min(...l.map((f) => f.duration));
      l.sort((a, b) => a.price / minP + a.duration / minD - (b.price / minP + b.duration / minD));
    }
    return l;
  }, [flights, sort]);

  const from = leg === 0 ? search.from : search.to;
  const to = leg === 0 ? search.to : search.from;
  const date = DAYS[leg === 0 ? search.dayIdx : search.retIdx];

  const choose = (f: Flight) => {
    if (leg === 0) {
      setFlight(f);
      setRetFlight(null);
      if (round) {
        setLoading(true);
        setSort(0);
        setLeg(1);
      } else {
        nav.push('Detail');
      }
    } else {
      setRetFlight(f);
      nav.push('Detail');
    }
  };

  const back = () => {
    if (leg === 1) {
      setLoading(false);
      setSort(0);
      setLeg(0);
    } else nav.pop();
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header
        onBack={back}
        title={`${from.city} to ${to.city}`}
        sub={`${fmtDate(date)}, ${search.pax} traveller${search.pax > 1 ? 's' : ''}, ${search.cabin}`}
      />
      {round && <Progress leg={leg} />}
      {loading ? (
        <Loading total={total} round={round} leg={leg} label={leg === 0 ? (round ? 'Searching both directions' : 'Searching flights') : 'Now the way back'} />
      ) : (
        <ScrollView key={leg} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          {leg === 1 && flight && (
            <Animated.View entering={FadeIn.duration(300)} style={{ marginBottom: 14 }}>
              <Tap onPress={back} scaleTo={0.99} style={{ borderRadius: R.control, backgroundColor: C.sunken, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={T.small}>Outbound chosen</Text>
                  <Text style={{ fontFamily: F.med, fontSize: 14, color: C.text }}>{fmtDate(DAYS[search.dayIdx])} at {fmtTime(flight.depart)}, {money(flight.price)}</Text>
                </View>
                <Text style={{ fontFamily: F.semi, fontSize: 13, color: C.text2 }}>Change</Text>
              </Tap>
            </Animated.View>
          )}
          <Animated.View entering={FadeIn.duration(300)} style={{ marginBottom: 14 }}>
            <Segmented options={['Best', 'Cheapest', 'Fastest']} index={sort} onChange={setSort} />
          </Animated.View>
          {sorted.map((f, i) => (
            <FlightCard key={f.id} f={f} i={i} onPress={() => choose(f)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
