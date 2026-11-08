import React, { useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  SharedValue, interpolate, useAnimatedProps, useAnimatedStyle,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { C } from '../theme';
import { PlaneIcon } from './Bits';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
  width: number;
  height: number;
  progress: SharedValue<number>;
  color?: string;
  planeColor?: string;
  planeSize?: number;
  ends?: boolean;
};

/** A great-circle style arc that draws itself while a plane rides it, banking along the tangent. */
export function RouteArc({ width, height, progress, color = C.accent, planeColor = C.navy, planeSize = 22, ends = true }: Props) {
  const pad = 12;
  const x0 = pad, y0 = height - pad, x1 = width - pad, y1 = height - pad;
  const cx = width / 2;
  const cy = y0 - (height - pad * 2) * 2;

  const { length, d } = useMemo(() => {
    let len = 0, px = x0, py = y0;
    for (let i = 1; i <= 48; i++) {
      const t = i / 48;
      const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
      const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
      len += Math.hypot(x - px, y - py);
      px = x; py = y;
    }
    return { length: len, d: `M ${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}` };
  }, [x0, y0, x1, y1, cx, cy]);

  const props = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - progress.value) }));

  const plane = useAnimatedStyle(() => {
    const t = progress.value;
    const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
    const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
    const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx);
    const dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy);
    return {
      opacity: interpolate(t, [0, 0.03], [0, 1], 'clamp'),
      transform: [
        { translateX: x - planeSize / 2 },
        { translateY: y - planeSize / 2 },
        { rotate: `${Math.atan2(dy, dx) + Math.PI / 2}rad` },
      ],
    };
  });

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Path d={d} stroke={C.lineStrong} strokeWidth={1.5} strokeDasharray={[2, 6]} strokeLinecap="round" fill="none" />
        <AnimatedPath
          d={d}
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={[length, length]}
          animatedProps={props}
        />
        {ends && <Circle cx={x0} cy={y0} r={4} fill={C.navy} />}
        {ends && <Circle cx={x1} cy={y1} r={4} fill={C.navy} />}
      </Svg>
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0 }, plane]}>
        <PlaneIcon size={planeSize} color={planeColor} />
      </Animated.View>
    </View>
  );
}
