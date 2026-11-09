import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, ScrollViewInstance, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  FadeIn, FadeInDown, FadeOutUp, SharedValue, interpolate,
  useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AIRPORTS, Airport, DAYS, distanceKm, fmtDate, fmtDur, money } from '../data';
import { Booking, useStore } from '../store';
import { useNav } from '../nav/Navigator';
import { C, F, M, R, T, shadow } from '../theme';
import { Glass, Icon, Reveal, Roll, Segmented } from '../ui/Bits';
import { RouteArc, useRouteLoop } from '../ui/Arc';
import { GlobeMark } from '../ui/Globe';
import { AirportSheet } from '../ui/Sheet';
import { DateMode, DateSheet } from '../ui/DateSheet';
import { PrimaryButton } from '../ui/Header';
import { Tap } from '../ui/Tap';

const PAD = 20;
const CABINS = ['Economy', 'Premium', 'Business'] as const;

function DateTile({ label, value, sub, ghost, onPress }: { label: string; value: string; sub?: string; ghost?: boolean; onPress: () => void }) {
  return (
    <Tap
      onPress={onPress}
      scaleTo={0.97}
      wrapStyle={{ flex: 1 }}
      style={[
        { minHeight: 62, borderRadius: R.panel - 4, paddingVertical: 10, paddingHorizontal: 14, justifyContent: 'center' },
        ghost ? { borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.lineStrong } : { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
      ]}
    >
      <Text style={T.small}>{label}</Text>
      <Animated.View key={value} entering={FadeIn.duration(200)}>
        <Text style={ghost ? { ...T.place, fontSize: 18 } : { fontFamily: F.display, fontSize: 21, lineHeight: 25, color: C.text }}>{value}</Text>
      </Animated.View>
      {!!sub && <Text style={{ ...T.small, fontSize: 11.5 }}>{sub}</Text>}
    </Tap>
  );
}

function Code({ a, align }: { a: Airport; align: 'left' | 'right' }) {
  return (
    <Animated.View key={a.code} entering={FadeInDown.duration(260).easing(M.ease.out)} exiting={FadeOutUp.duration(120)} style={{ alignItems: align === 'left' ? 'flex-start' : 'flex-end', flex: 1 }}>
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
  // Round trips fly there and back, one-way trips fly one direction: same loop as everywhere else.
  const p = useRouteLoop(!!b.ret, b.id);
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
            <RouteArc width={90} height={34} progress={p} planeSize={14} ends={false} flip={!!b.ret} persist />
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
  const [dateSheet, setDateSheet] = useState<DateMode | null>(null);
  const [err, setErr] = useState('');
  const scroll = React.useRef<ScrollViewInstance>(null);
  const round = search.trip === 'round';

  // Tabs cross-fade with a short, eased slide. No springs, so nothing overshoots or wobbles.
  const tabV = useSharedValue(tab);
  useEffect(() => {
    tabV.value = withTiming(tab, { duration: 240, easing: M.ease.standard });
  }, [tab, tabV]);
  const exploreS = useAnimatedStyle(() => ({ opacity: interpolate(tabV.value, [0, 1], [1, 0], 'clamp'), transform: [{ translateX: interpolate(tabV.value, [0, 1], [0, -14], 'clamp') }] }));
  const tripsS = useAnimatedStyle(() => ({ opacity: interpolate(tabV.value, [0, 1], [0, 1], 'clamp'), transform: [{ translateX: interpolate(tabV.value, [0, 1], [14, 0], 'clamp') }] }));

  // One way flies A to B; round trip flies there and back.
  const arc = useRouteLoop(round, search.from.code + search.to.code);

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
        <ScrollView ref={scroll} contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 220 }} showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: PAD }}>
            <Reveal i={0} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <GlobeMark size={32} />
              <Text style={{ fontFamily: F.display, fontSize: 25, color: C.text, letterSpacing: -0.3 }}>Meridian</Text>
            </Reveal>
            <Reveal i={1}>
              <Text style={{ ...T.hero, fontSize: 38, lineHeight: 42, marginTop: 14 }}>Where to?</Text>
            </Reveal>

            <Reveal i={2} style={{ marginTop: 14 }}>
              <Segmented
                width={246}
                height={40}
                options={['One way', 'Round trip']}
                icons={['oneway', 'loop']}
                index={round ? 1 : 0}
                onChange={(i) => setSearch({ trip: i === 1 ? 'round' : 'oneway' })}
              />
            </Reveal>

            <Reveal i={3} style={{ marginTop: 12 }}>
              <View style={{ borderRadius: R.panel + 2, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, padding: 18, paddingBottom: 14 }}>
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
                <View style={{ marginTop: 4, alignItems: 'center' }}>
                  <RouteArc width={cardInner} height={52} progress={arc} planeSize={20} flip={round} persist />
                  <Animated.View style={[{ position: 'absolute', top: -28 }, swapStyle]}>
                    <Tap onPress={swap} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center', ...shadow(6, 12, 0.5) }}>
                      <Icon name="swap" size={19} color={C.onNavy} />
                    </Tap>
                  </Animated.View>
                </View>
                <Text style={{ ...T.small, textAlign: 'center', marginTop: 2, color: err ? C.danger : C.mute }}>
                  {err || `${Math.round(km).toLocaleString()} km, about ${fmtDur(Math.round(35 + (km / 820) * 60))} nonstop`}
                </Text>
              </View>
            </Reveal>

            <Reveal i={4} style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <DateTile label="Departure" value={fmtDate(DAYS[search.dayIdx])} onPress={() => setDateSheet('dep')} />
              {round ? (
                <DateTile
                  label="Return"
                  value={fmtDate(DAYS[search.retIdx])}
                  sub={`${nights} ${nights === 1 ? 'night' : 'nights'} away`}
                  onPress={() => setDateSheet('ret')}
                />
              ) : (
                <DateTile ghost label="Return" value="Add a return" onPress={() => { setSearch({ trip: 'round' }); setDateSheet('ret'); }} />
              )}
            </Reveal>

            <Reveal i={5} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, backgroundColor: C.surface, borderRadius: R.panel - 4, borderWidth: 1, borderColor: C.line, paddingVertical: 9, paddingHorizontal: 16 }}>
              <View>
                <Text style={{ fontFamily: F.med, fontSize: 15, color: C.text }}>Travellers</Text>
                <Text style={T.small}>{search.pax === 1 ? 'Just me' : `${search.pax} people`}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Tap onPress={() => setSearch({ pax: Math.max(1, search.pax - 1) })} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.sunken, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="minus" size={16} />
                </Tap>
                <View style={{ minWidth: 18, alignItems: 'center' }}>
                  <Roll value={search.pax} size={34} style={{ fontFamily: F.display, fontSize: 28, color: C.text }} />
                </View>
                <Tap onPress={() => setSearch({ pax: Math.min(6, search.pax + 1) })} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.sunken, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="plus" size={16} />
                </Tap>
              </View>
            </Reveal>

            <Reveal i={6} style={{ marginTop: 10 }}>
              <Segmented height={40} options={[...CABINS]} index={CABINS.indexOf(search.cabin)} onChange={(i) => setSearch({ cabin: CABINS[i] })} />
            </Reveal>

            <Reveal i={7}>
              <Text style={{ ...T.heading, fontSize: 24, marginTop: 30, marginBottom: 14 }}>Wander somewhere</Text>
            </Reveal>
          </View>
          <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} onScroll={onScrollX} scrollEventThrottle={16} snapToInterval={200} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: 18 }}>
            {dests.map((a, i) => (
              <Destination key={a.code} a={a} i={i} scrollX={scrollX} from={search.from} onPress={() => { setSearch({ to: a }); setErr(''); scroll.current?.scrollTo({ y: 0, animated: true }); }} />
            ))}
          </Animated.ScrollView>
        </ScrollView>

        {/* The primary action never scrolls away: pinned above the dock. */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(237,242,247,0)', C.bg, C.bg]}
          locations={[0, 0.55, 1]}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: insets.bottom + 190 }}
        />
        <Animated.View style={[{ position: 'absolute', left: PAD, right: PAD, bottom: insets.bottom + 88 }, ctaShake]}>
          <PrimaryButton label={round ? 'Search round trip' : 'Search flights'} onPress={go} />
        </Animated.View>
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

      <DateSheet
        visible={dateSheet !== null}
        mode={dateSheet ?? 'dep'}
        round={round}
        dayIdx={search.dayIdx}
        retIdx={search.retIdx}
        onMode={setDateSheet}
        onPick={setSearch}
        onClose={() => setDateSheet(null)}
      />

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
    x.value = withTiming(tab * 108, { duration: 240, easing: M.ease.standard });
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
