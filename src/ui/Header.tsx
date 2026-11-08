import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, R, T } from '../theme';
import { Icon } from './Bits';
import { Tap } from './Tap';

export function Header({ title, sub, onBack, right }: { title: string; sub?: string; onBack?: () => void; right?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      {onBack && (
        <Tap onPress={onBack} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="back" size={19} />
        </Tap>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ ...T.title, fontSize: 26, lineHeight: 30 }} numberOfLines={1}>{title}</Text>
        {!!sub && <Text style={{ ...T.small, fontSize: 13, marginTop: 1 }} numberOfLines={1}>{sub}</Text>}
      </View>
      {right}
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.98}
      style={{ height: 56, borderRadius: R.pill, backgroundColor: disabled ? C.sunken : C.navy, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontFamily: F.semi, fontSize: 15, color: disabled ? C.mute : C.onNavy, letterSpacing: 0.2 }}>{label}</Text>
    </Tap>
  );
}
