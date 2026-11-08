import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useStore, Passenger } from '../store';
import { useNav } from '../nav/Navigator';
import { C, F, R, T } from '../theme';
import { Reveal } from '../ui/Bits';
import { Field } from '../ui/Field';
import { Header, PrimaryButton } from '../ui/Header';
import { Tap } from '../ui/Tap';

const empty = (): Passenger => ({ first: '', last: '', email: '', phone: '' });
const SAMPLE: Passenger[] = [
  { first: 'Ada', last: 'Okafor', email: 'ada@example.com', phone: '08012345678' },
  { first: 'Tunde', last: 'Bello', email: '', phone: '' },
  { first: 'Zainab', last: 'Musa', email: '', phone: '' },
  { first: 'Chidi', last: 'Eze', email: '', phone: '' },
  { first: 'Ngozi', last: 'Obi', email: '', phone: '' },
  { first: 'Ibrahim', last: 'Sani', email: '', phone: '' },
];

export function Passengers() {
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const { search, seats, setPassengers } = useStore();
  const [list, setList] = useState<Passenger[]>(() => Array.from({ length: search.pax }, empty));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(0);

  const set = (i: number, k: keyof Passenger, v: string) => {
    setList((l) => l.map((p, j) => (j === i ? { ...p, [k]: v } : p)));
    setErrors((e) => { const n = { ...e }; delete n[`${i}.${k}`]; return n; });
  };

  const submit = () => {
    const e: Record<string, string> = {};
    list.forEach((p, i) => {
      if (p.first.trim().length < 2) e[`${i}.first`] = 'Enter a first name';
      if (p.last.trim().length < 2) e[`${i}.last`] = 'Enter a last name';
      if (i === 0) {
        if (!/^\S+@\S+\.\S+$/.test(p.email)) e[`${i}.email`] = 'Enter a valid email';
        if (p.phone.replace(/\D/g, '').length < 7) e[`${i}.phone`] = 'Enter a phone number';
      }
    });
    setErrors(e);
    if (Object.keys(e).length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setShake((s) => s + 1);
      return;
    }
    setPassengers(list);
    nav.push('Payment');
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header onBack={nav.pop} title="Who is flying?" sub="Names must match travel documents" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}>
          <Reveal i={0} style={{ alignItems: 'flex-end', marginBottom: 6 }}>
            <Tap onPress={() => setList(Array.from({ length: search.pax }, (_, i) => SAMPLE[i]))} style={{ paddingHorizontal: 14, height: 34, borderRadius: 17, backgroundColor: C.sunken, justifyContent: 'center' }}>
              <Text style={{ fontFamily: F.semi, fontSize: 12.5, color: C.text2 }}>Fill sample details</Text>
            </Tap>
          </Reveal>
          {list.map((p, i) => (
            <Reveal key={i} i={i + 1} style={{ backgroundColor: C.surface, borderRadius: R.panel, borderWidth: 1, borderColor: C.line, padding: 18, paddingBottom: 10, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                <Text style={T.heading}>Traveller {i + 1}</Text>
                <Text style={{ fontFamily: F.med, fontSize: 13, color: C.text2 }}>Seat {seats[i]}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Field flex label="First name" value={p.first} onChangeText={(t) => set(i, 'first', t)} error={errors[`${i}.first`]} shake={shake} autoCapitalize="words" />
                <Field flex label="Last name" value={p.last} onChangeText={(t) => set(i, 'last', t)} error={errors[`${i}.last`]} shake={shake} autoCapitalize="words" />
              </View>
              {i === 0 && (
                <>
                  <Field label="Email" value={p.email} onChangeText={(t) => set(i, 'email', t)} error={errors[`${i}.email`]} shake={shake} keyboardType="email-address" />
                  <Field label="Phone" value={p.phone} onChangeText={(t) => set(i, 'phone', t)} error={errors[`${i}.phone`]} shake={shake} keyboardType="phone-pad" />
                </>
              )}
            </Reveal>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, paddingBottom: insets.bottom + 14, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.line }}>
        <PrimaryButton label="Continue to payment" onPress={submit} />
      </View>
    </View>
  );
}
