import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, ScrollViewInstance, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing, FadeInDown, FadeOutUp, LinearTransition, SharedValue, interpolate, interpolateColor,
  useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AIRPORTS, Airport, DAYS, distanceKm, fmtDate, fmtDur, money, monthShort, weekday } from '../data';
import { Booking, useStore } from '../store';
import { useNav } from '../nav/Navigator';
import { C, F, M, R, T, shadow } from '../theme';
import { Glass, Icon, Reveal, Roll, Segmented } from '../ui/Bits';
import { RouteArc } from '../ui/Arc';
import { GlobeMark } from '../ui/Globe';
import { AirportSheet } from '../ui/Sheet';
import { PrimaryButton } from '../ui/Header';
import { Tap } from '../ui/Tap';

const PAD = 20;
const CABINS = ['Economy', 'Premium', 'Business'] as const;

function DayChip({ d, selected, onPress }: { d: Date; selected: boolean; onPress: () => void }) {
  const p = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(selected ? 1 : 0, M.spring.snappy);
  }, [selected, p]);
  const box = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], ['#FFFFFF', C.navy]),
    transform: [{ translateY: interpolate(p.value, [0, 1], [0, -4]) }],
  }));
  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); onPress(); }}>
      <Animated.View style={[{ width: 58, height: 82, borderRadius: R.panel - 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line }, box]}>
        <Text style={{ fontFamily: F.med, fontSize: 12, color: selected ? 'rgba(244,248,252,0.7)' : C.mute }}>{weekday(d)}</Text>
        <Text style={{ fontFamily: F.display, fontSize: 28, lineHeight: 32, color: selected ? C.onNavy : C.text }}>{d.getDate()}</Text>
        <Text style={{ fontFamily: F.body, fontSize: 11.5, color: selected ? 'rgba(244,248,252,0.7)' : C.mute }}>{monthShort(d)}</Text>
      </Animated.View>
    </Pressable>
  );
}

function DayStrip({ from, selected, onSelect }: { from: number; selected: number; onSelect: (i: number) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: PAD, gap: 8, paddingTop: 6, paddingBottom: 2 }}>
      {DAYS.map((d, i) => (i >= from ? <DayChip key={i} d={d} selected={i === selected} onPress={() => onSelect(i)} /> : null))}
    </ScrollView>
  );
}

function Code({ a, align }: { a: Airport; align: 'left' | 'right' }) {
  return (
    <Animated.View key={a.code} entering={FadeInDown.springify().damping(15)} exiting={FadeOutUp.duration(120)} style={{ alignItems: align === 'left' ? 'flex-start' : 'flex-end', flex: 1 }}>
      <Text style={T.code}>{a.code}</Text>
      <Text style={T.place} numberOfLines={1}>{a.city}</Text>
    </Animated.View>
  );
}

function Destination({ a, i, scrollX, from, onPress }: { a: Airport; i: number; scrollX: SharedValue<number>; from: Airport; onPress: () => void }) {
  const W = 200;
  const card = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scrollX.value, [(i - 1) * W, i * W, (i + 1) * W], [0.94, 1, 0.94], 'clamp') }],
  }));
  const glow = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(scrollX.value, [(i - 1) * W, (i + 1) * W], [46, -46]) }],
  }));
  const price = Math.round(70 + distanceKm(from, a) * 0.065);
  return (
    <Tap onPress={onPress} scaleTo={0.97} wrapStyle={{ marginRight: 12 }}>
      <Animated.View style={[{ width: 188, height: 240, borderRadius: R.panel + 4, overflow: 'hidden' }, card]}>
        <LinearGradient colors={a.hue} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
        <Animated.View style={[{ position: 'absolute', top: 24, right: -56, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.45)' }, glow]} />
        <Text style={{ position: 'absolute', top: 18, left: 20, fontFamily: F.light, fontSize: 20, letterSpacing: 1.5, color: C.text }}>{a.code}</Text>
        <View style={{ position: 'absolute', left: 20, right: 16, bottom: 18 }}>
          <Text style={{ fontFamily: F.display, fontSize: 34, lineHeight: 36, color: C.text }} numberOfLines={1}>{a.city}</Text>
          <Text style={{ ...T.small, color: C.text2, marginTop: 2 }}>{a.country}</Text>
          <Text style={{ fontFamily: F.med, fontSize: 13, color: C.text, marginTop: 10 }}>From {money(price)}</Text>
        </View>
      </Animated.View>
    </Tap>
  );
}

function TripCard({ b, i, onPress }: { b: Booking; i: number; onPress: () => void }) {
  const f = b.flight;
  const p = useSharedValue(1);
  return (
    <Reveal i={i}>
      <Tap onPress={onPress} scaleTo={0.985} style={{ borderRadius: R.panel + 2, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, padding: 20, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: f.airline.color }} />
          <Text style={{ ...T.label, flex: 1 }}>{f.airline.name}</Text>
          <View style={{ paddingHorizontal: 10, height: 24, borderRadius: 12, backgroundColor: C.sunken, justifyContent: 'center' }}>
            <Text style={{ fontFamily: F.med, fontSize: 11.5, color: C.text2 }}>{b.ret ? 'Round trip' : 'One way'}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
          <Text style={{ ...T.code, fontSize: 36, lineHeight: 40 }}>{f.from.code}</Text>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <RouteArc width={90} height={34} progress={p} planeSize={14} ends={false} />
          </View>
          <Text style={{ ...T.code, fontSize: 36, lineHeight: 40 }}>{f.to.code}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
          <Text style={T.small}>{b.retDate ? `${fmtDate(b.date)} to ${fmtDate(b.retDate)}` : fmtDate(b.date)}</Text>
          <Text style={{ ...T.small, color: C.text2 }}>Seat {b.seats.join(', ')}, ref {b.pnr}</Text>
        </View>
      </Tap>
    </Reveal>
  );
}

export function Main() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const nav = useNav();
  const { search, setSearch, tab, setTab, bookings, setFlight, setRetFlight } = useStore();
  const [sheet, setSheet] = useState<'from' | 'to' | null>(null);
  const [err, setErr] = useState('');
  const scroll = React.useRef<ScrollViewInstance>(null);
  const round = search.trip === 'round';

  const tabV = useSharedValue(tab);
  useEffect(() => {
    tabV.value = withSpring(tab, M.spring.fluid);
  }, [tab, tabV]);
  const exploreS = useAnimatedStyle(() => ({ opacity: interpolate(tabV.value, [0, 1], [1, 0]), transform: [{ translateX: interpolate(tabV.value, [0, 1], [0, -40]) }] }));
  const tripsS = useAnimatedStyle(() => ({ opacity: interpolate(tabV.value, [0, 1], [0, 1]), transform: [{ translateX: interpolate(tabV.value, [0, 1], [40, 0]) }] }));

  const arc = useSharedValue(1);
  useEffect(() => {
    arc.value = 0;
    arc.value = withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.cubic) });
  }, [search.from.code, search.to.code, arc]);

  const rot = useSharedValue(0);
  const swap = () => {
    rot.value = withSpring(rot.value + 180, M.spring.bouncy);
    setSearch({ from: search.to, to: search.from });
    setErr('');
  };
  const swapStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));

  const scrollX = useSharedValue(0);
  const onScrollX = useAnimatedScrollHandler((e) => { scrollX.value = e.contentOffset.x; });

  const shake = useSharedValue(0);
  const ctaShake = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const go = () => {
    if (search.from.code === search.to.code) {
      setErr('Choose two different airports.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shake.value = withSequence(withTiming(-10, { duration: 50 }), withTiming(10, { duration: 70 }), withTiming(-6, { duration: 60 }), withSpring(0, M.spring.bouncy));
      return;
    }
    setFlight(null);
    setRetFlight(null);
    nav.push('Results');
  };

  const cardInner = width - PAD * 2 - 44;
  const km = distanceKm(search.from, search.to);
  const dests = AIRPORTS.filter((a) => a.code !== search.from.code && ['LHR', 'DXB', 'JFK', 'CDG', 'SIN', 'NBO', 'ACC', 'LOS'].includes(a.code));
  const nights = search.retIdx - search.dayIdx;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Explore */}
      <Animated.View style={[StyleSheet.absoluteFill, exploreS]} pointerEvents={tab === 0 ? 'auto' : 'none'}>
        <ScrollView ref={scroll} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: PAD }}>
            <Reveal i={0} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <GlobeMark size={34} />
              <Text style={{ fontFamily: F.display, fontSize: 26, color: C.text, letterSpacing: -0.3 }}>Meridian</Text>
            </Reveal>
            <Reveal i={1}>
              <Text style={{ ...T.hero, marginTop: 22 }}>Where to?</Text>
            </Reveal>

            <Reveal i={2} style={{ marginTop: 18 }}>
              <Segmented
                width={246}
                height={42}
                options={['One way', 'Round trip']}
                icons={['oneway', 'loop']}
                index={round ? 1 : 0}
                onChange={(i) => setSearch({ trip: i === 1 ? 'round' : 'oneway' })}
              />
            </Reveal>

            <Reveal i={3} style={{ marginTop: 14 }}>
              <View style={{ borderRadius: R.panel + 2, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, padding: 22, paddingBottom: 18 }}>
                <View style={{ flexDirection: 'row' }}>
                  <Tap onPress={() => setSheet('from')} wrapStyle={{ flex: 1 }} scaleTo={0.97}>
                    <Text style={{ ...T.small, marginBottom: 2 }}>From</Text>
                    <Code a={search.from} align="left" />
                  </Tap>
                  <Tap onPress={() => setSheet('to')} wrapStyle={{ flex: 1 }} scaleTo={0.97}>
                    <Text style={{ ...T.small, marginBottom: 2, textAlign: 'right' }}>To</Text>
                    <Code a={search.to} align="right" />
                  </Tap>
                </View>
                <View style={{ marginTop: 8, alignItems: 'center' }}>
                  <RouteArc width={cardInner} height={60} progress={arc} planeSize={20} />
                  <Animated.View style={[{ position: 'absolute', top: -30 }, swapStyle]}>
                    <Tap onPress={swap} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center', ...shadow(6, 12, 0.5) }}>
                      <Icon name="swap" size={20} color={C.onNavy} />
                    </Tap>
                  </Animated.View>
                </View>
                <Text style={{ ...T.small, textAlign: 'center', marginTop: 4 }}>
                  {Math.round(km).toLocaleString()} km, about {fmtDur(Math.round(35 + (km / 820) * 60))} nonstop
                </Text>
              </View>
            </Reveal>

            <Reveal i={4} layout style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 24, marginBottom: 8 }}>
              <Text style={T.label}>Departure</Text>
              <Text style={{ fontFamily: F.display, fontSize: 18, color: C.text }}>{fmtDate(DAYS[search.dayIdx])}</Text>
            </Reveal>
          </View>
          <Reveal i={5} layout>
            <DayStrip from={0} selected={search.dayIdx} onSelect={(i) => setSearch({ dayIdx: i })} />
          </Reveal>

          {round && (
            <Animated.View entering={FadeInDown.springify().damping(18)} exiting={FadeOutUp.duration(160)} layout={LinearTransition.springify().damping(20)}>
              <View style={{ paddingHorizontal: PAD, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 20, marginBottom: 8 }}>
                <Text style={T.label}>Return, {nights} {nights === 1 ? 'night' : 'nights'} away</Text>
                <Text style={{ fontFamily: F.display, fontSize: 18, color: C.text }}>{fmtDate(DAYS[search.retIdx])}</Text>
              </View>
              <DayStrip from={search.dayIdx} selected={search.retIdx} onSelect={(i) => setSearch({ retIdx: i })} />
            </Animated.View>
          )}

          <Animated.View layout={LinearTransition.springify().damping(20)} style={{ paddingHorizontal: PAD }}>
            <Reveal i={6} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, backgroundColor: C.surface, borderRadius: R.panel, borderWidth: 1, borderColor: C.line, paddingVertical: 12, paddingHorizontal: 18 }}>
              <View>
                <Text style={{ fontFamily: F.med, fontSize: 16, color: C.text }}>Travellers</Text>
                <Text style={T.small}>{search.pax === 1 ? 'Just me' : `${search.pax} people`}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Tap onPress={() => setSearch({ pax: Math.max(1, search.pax - 1) })} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.sunken, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="minus" size={17} />
                </Tap>
                <View style={{ minWidth: 20, alignItems: 'center' }}>
                  <Roll value={search.pax} size={36} style={{ fontFamily: F.display, fontSize: 30, color: C.text }} />
                </View>
                <Tap onPress={() => setSearch({ pax: Math.min(6, search.pax + 1) })} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.sunken, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="plus" size={17} />
                </Tap>
              </View>
            </Reveal>

            <Reveal i={7} style={{ marginTop: 12 }}>
              <Segmented options={[...CABINS]} index={CABINS.indexOf(search.cabin)} onChange={(i) => setSearch({ cabin: CABINS[i] })} />
            </Reveal>

            <Reveal i={8} style={{ marginTop: 20 }}>
              <Animated.View style={ctaShake}>
                <PrimaryButton label={round ? 'Search round trip' : 'Search flights'} onPress={go} />
              </Animated.View>
              {!!err && <Text style={{ fontFamily: F.body, fontSize: 13, color: C.danger, textAlign: 'center', marginTop: 10 }}>{err}</Text>}
            </Reveal>

            <Reveal i={9}>
              <Text style={{ ...T.heading, fontSize: 24, marginTop: 34, marginBottom: 14 }}>Wander somewhere</Text>
            </Reveal>
          </Animated.View>
          <Animated.View layout={LinearTransition.springify().damping(20)}>
            <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} onScroll={onScrollX} scrollEventThrottle={16} snapToInterval={200} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: 18 }}>
              {dests.map((a, i) => (
                <Destination key={a.code} a={a} i={i} scrollX={scrollX} from={search.from} onPress={() => { setSearch({ to: a }); setErr(''); scroll.current?.scrollTo({ y: 0, animated: true }); }} />
              ))}
            </Animated.ScrollView>
          </Animated.View>
        </ScrollView>
      </Animated.View>

      {/* Trips */}
      <Animated.View style={[StyleSheet.absoluteFill, tripsS]} pointerEvents={tab === 1 ? 'auto' : 'none'}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: PAD, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
          <Text style={{ ...T.hero, marginTop: 8 }}>Your trips</Text>
          <Text style={{ ...T.place, marginTop: 4, marginBottom: 22 }}>{bookings.length} upcoming</Text>
          {bookings.length === 0 && <Text style={{ ...T.place, fontSize: 20, textAlign: 'center', marginTop: 80 }}>Nothing booked yet. Search a route to get started.</Text>}
          {bookings.map((b, i) => (
            <TripCard key={b.id} b={b} i={i} onPress={() => nav.push('Pass', { id: b.id })} />
          ))}
        </ScrollView>
      </Animated.View>

      <Dock tab={tab} onChange={setTab} bottom={insets.bottom + 16} />

      <AirportSheet
        visible={sheet !== null}
        title={sheet === 'from' ? 'Fly from' : 'Fly to'}
        exclude={sheet === 'from' ? search.to.code : search.from.code}
        onClose={() => setSheet(null)}
        onSelect={(a) => {
          Haptics.selectionAsync();
          setSearch(sheet === 'from' ? { from: a } : { to: a });
          setErr('');
          setSheet(null);
        }}
      />
    </View>
  );
}

function Dock({ tab, onChange, bottom }: { tab: number; onChange: (n: number) => void; bottom: number }) {
  const x = useSharedValue(tab * 108);
  useEffect(() => {
    x.value = withSpring(tab * 108, M.spring.snappy);
  }, [tab, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const items = [
    { label: 'Explore', icon: 'search' as const },
    { label: 'Trips', icon: 'ticket' as const },
  ];
  return (
    <Glass style={{ position: 'absolute', alignSelf: 'center', bottom, width: 224, height: 60, borderRadius: 30, borderWidth: 1, borderColor: C.line, flexDirection: 'row', padding: 4, ...shadow(10, 24, 0.5) }}>
      <Animated.View style={[{ position: 'absolute', left: 4, top: 4, width: 108, height: 52, borderRadius: 26, backgroundColor: C.navy }, pill]} />
      {items.map((it, i) => (
        <Pressable key={it.label} onPress={() => { Haptics.selectionAsync(); onChange(i); }} style={{ width: 108, height: 52, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
          <Icon name={it.icon} size={19} color={tab === i ? C.onNavy : C.text2} />
          <Text style={{ fontFamily: F.semi, fontSize: 14, color: tab === i ? C.onNavy : C.text2 }}>{it.label}</Text>
        </Pressable>
      ))}
    </Glass>
  );
}
