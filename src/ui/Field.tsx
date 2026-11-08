import React, { useEffect, useState } from 'react';
import { KeyboardTypeOptions, Text, TextInput } from 'react-native';
import Animated, {
  interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { C, F, M, R } from '../theme';

type Props = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  shake?: number;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'words' | 'characters';
  maxLength?: number;
  secure?: boolean;
  mono?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  flex?: boolean;
};

/** Floating-label field: label glides up, border warms to amber, errors shake. */
export function Field({ label, value, onChangeText, error, shake = 0, keyboardType, autoCapitalize, maxLength, secure, mono, onFocus, onBlur, flex }: Props) {
  const [focused, setFocused] = useState(false);
  const lift = useSharedValue(0);
  const focus = useSharedValue(0);
  const sx = useSharedValue(0);

  useEffect(() => {
    lift.value = withSpring(focused || value.length > 0 ? 1 : 0, M.spring.snappy);
    focus.value = withTiming(focused ? 1 : 0, { duration: M.dur.base });
  }, [focused, value, lift, focus]);

  useEffect(() => {
    if (shake > 0) sx.value = withSequence(withTiming(-9, { duration: 50 }), withTiming(9, { duration: 70 }), withTiming(-6, { duration: 60 }), withSpring(0, M.spring.bouncy));
  }, [shake, sx]);

  const box = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.value, [0, 1], [C.line, C.navy]),
    transform: [{ translateX: sx.value }],
  }));
  const lab = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(lift.value, [0, 1], [0, -11]) }, { scale: interpolate(lift.value, [0, 1], [1, 0.74]) }],
  }));

  return (
    <Animated.View
      style={[
        { height: 60, borderRadius: R.control, borderWidth: 1.5, backgroundColor: C.surface, paddingHorizontal: 16, justifyContent: 'center', marginBottom: error ? 4 : 12 },
        flex && { flex: 1 },
        box,
        !!error && { borderColor: C.danger },
      ]}
    >
      <Animated.Text
        style={[{ position: 'absolute', left: 16, fontFamily: F.body, fontSize: 15, color: focused ? C.text : C.mute, transformOrigin: 'left center' }, lab]}
      >
        {label}
      </Animated.Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => { setFocused(true); onFocus?.(); }}
        onBlur={() => { setFocused(false); onBlur?.(); }}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'none'}
        autoCorrect={false}
        maxLength={maxLength}
        secureTextEntry={secure}
        selectionColor={C.accent}
        style={{ fontFamily: F.med, fontSize: 16, color: C.text, fontVariant: ['tabular-nums'], paddingTop: 16, padding: 0, paddingBottom: 0 }}
      />
      {!!error && (
        <Text style={{ position: 'absolute', left: 4, bottom: -17, fontFamily: F.body, fontSize: 11, color: C.danger }}>{error}</Text>
      )}
    </Animated.View>
  );
}
