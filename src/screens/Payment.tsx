import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { money } from '../data';
import { useStore } from '../store';
import { useNav } from '../nav/Navigator';
import { C, F, M, shadow } from '../theme';
import { Reveal, Roll } from '../ui/Bits';
import { Field } from '../ui/Field';
import { Header } from '../ui/Header';
import { SlideToPay } from '../ui/Slide';
import { Tap } from '../ui/Tap';

const fmtNum = (s: string) => s.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const fmtExp = (s: string) => {
  const d = s.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};
const CARD_TEXT = '#F4F8FC';
const CARD_MUTE = 'rgba(244,248,252,0.55)';

export function Payment() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const nav = useNav();
  const { pricing, book, passengers } = useStore();
  const total = pricing().total;
  const cw = width - 40;
  const ch = cw / 1.586;

  const [num, setNum] = useState('');
  const [name, setName] = useState(passengers[0] ? `${passengers[0].first} ${passengers[0].last}`.toUpperCase() : '');
  const [exp, setExp] = useState('');
  const [cvv, setCvv] = useState('');
  const flip = useSharedValue(0);
  const rx = useSharedValue(0);
  const ry = useSharedValue(0);

  const valid = num.replace(/\s/g, '').length === 16 && name.trim().length > 2 && /^\d\d\/\d\d$/.test(exp) && cvv.length >= 3;

  const pan = usePanGesture({
    onUpdate: (e) => {
      'worklet';
      ry.value = Math.max(-18, Math.min(18, e.translationX / 6));
      rx.value = Math.max(-18, Math.min(18, -e.translationY / 6));
    },
    onDeactivate: () => {
      'worklet';
      rx.value = withSpring(0, M.spring.bouncy);
      ry.value = withSpring(0, M.spring.bouncy);
    },
  });

  const tilt = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateX: `${rx.value}deg` }, { rotateY: `${ry.value}deg` }],
  }));
  const front = useAnimatedStyle(() => ({ transform: [{ perspective: 1000 }, { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` }] }));
  const back = useAnimatedStyle(() => ({ transform: [{ perspective: 1000 }, { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` }] }));
  const sheen = useAnimatedStyle(() => ({ opacity: interpolate(Math.abs(ry.value) + Math.abs(rx.value), [0, 30], [0, 0.4]), transform: [{ translateX: ry.value * 8 }, { rotate: '20deg' }] }));

  const face = { position: 'absolute' as const, width: cw, height: ch, borderRadius: 24, overflow: 'hidden' as const, backfaceVisibility: 'hidden' as const };

  const pay = () => {
    book();
    nav.push('Success');
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header onBack={nav.pop} title="Payment" sub="Demo only, nothing is charged" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 170 }}>
          <Reveal i={0} style={{ alignItems: 'center' }}>
            <GestureDetector gesture={pan}>
              <Animated.View style={[{ width: cw, height: ch, ...shadow(16, 30, 0.6) }, tilt]}>
                <Animated.View style={[face, front]}>
                  <LinearGradient colors={['#173A5C', '#0B2239']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, padding: 22, justifyContent: 'space-between' }}>
                    <View style={{ position: 'absolute', top: -50, right: -50, width: 190, height: 190, borderRadius: 95, borderWidth: 1.5, borderColor: 'rgba(194,142,43,0.5)' }} />
                    <View style={{ position: 'absolute', top: -20, right: -20, width: 130, height: 130, borderRadius: 65, borderWidth: 1, borderColor: 'rgba(194,142,43,0.28)' }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontFamily: F.display, fontSize: 22, color: CARD_TEXT }}>Meridian</Text>
                      <View style={{ width: 42, height: 30, borderRadius: 7, backgroundColor: C.accent }} />
                    </View>
                    <Text style={{ fontFamily: F.med, fontSize: 21, letterSpacing: 2.2, color: CARD_TEXT, fontVariant: ['tabular-nums'] }}>{num || '•••• •••• •••• ••••'}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View>
                        <Text style={{ fontFamily: F.body, fontSize: 10.5, color: CARD_MUTE }}>Cardholder</Text>
                        <Text style={{ fontFamily: F.med, fontSize: 14, color: CARD_TEXT }} numberOfLines={1}>{name || 'YOUR NAME'}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontFamily: F.body, fontSize: 10.5, color: CARD_MUTE }}>Expires</Text>
                        <Text style={{ fontFamily: F.med, fontSize: 14, color: CARD_TEXT }}>{exp || 'MM/YY'}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </Animated.View>
                <Animated.View style={[face, back]}>
                  <LinearGradient colors={['#0B2239', '#173A5C']} style={{ flex: 1, paddingTop: 28 }}>
                    <View style={{ height: 44, backgroundColor: '#050F1A' }} />
                    <View style={{ margin: 22, height: 40, borderRadius: 8, backgroundColor: C.surface, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 14 }}>
                      <Text style={{ fontFamily: F.semi, fontSize: 18, color: C.text, letterSpacing: 3 }}>{cvv || '•••'}</Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
                <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: -30, bottom: -30, width: 70, left: cw / 2 - 35 }, sheen]}>
                  <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
                </Animated.View>
              </Animated.View>
            </GestureDetector>
          </Reveal>

          <Reveal i={1} style={{ marginTop: 22 }}>
            <Field label="Card number" value={num} onChangeText={(t) => setNum(fmtNum(t))} keyboardType="number-pad" maxLength={19} />
            <Field label="Name on card" value={name} onChangeText={(t) => setName(t.toUpperCase())} autoCapitalize="characters" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Field flex label="Expiry" value={exp} onChangeText={(t) => setExp(fmtExp(t))} keyboardType="number-pad" maxLength={5} />
              <Field flex label="CVV" value={cvv} onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" maxLength={4} onFocus={() => { flip.value = withSpring(1, M.spring.fluid); }} onBlur={() => { flip.value = withSpring(0, M.spring.fluid); }} />
            </View>
            <Tap onPress={() => { setNum('4242 4242 4242 4242'); setExp('12/29'); setCvv('123'); if (!name) setName('ADA OKAFOR'); }} style={{ alignSelf: 'center', paddingHorizontal: 16, height: 34, borderRadius: 17, backgroundColor: C.sunken, justifyContent: 'center', marginTop: 4 }}>
              <Text style={{ fontFamily: F.semi, fontSize: 12.5, color: C.text2 }}>Use test card</Text>
            </Tap>
          </Reveal>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, paddingBottom: insets.bottom + 14, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.line, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: F.body, fontSize: 14, color: C.mute }}>{valid ? 'Slide to confirm' : 'Complete the card details to pay'}</Text>
          <Roll value={total} prefix="$" size={32} style={{ fontFamily: F.display, fontSize: 27, color: C.text }} />
        </View>
        <SlideToPay width={width - 40} enabled={valid} label={`Slide to pay ${money(total)}`} onConfirm={pay} />
      </View>
    </View>
  );
}
