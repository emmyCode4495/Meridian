import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { M } from '../theme';

type Props = {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  wrapStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  scaleTo?: number;
  haptic?: boolean;
  disabled?: boolean;
  hitSlop?: number;
};

export function Tap({ onPress, style, wrapStyle, children, scaleTo = 0.96, haptic = true, disabled, hitSlop }: Props) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable
      style={wrapStyle}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => { s.value = withSpring(scaleTo, M.spring.snappy); }}
      onPressOut={() => { s.value = withSpring(1, M.spring.bouncy); }}
      onPress={() => {
        if (haptic) Haptics.selectionAsync();
        onPress?.();
      }}
    >
      <Animated.View style={[style, a]}>{children}</Animated.View>
    </Pressable>
  );
}
