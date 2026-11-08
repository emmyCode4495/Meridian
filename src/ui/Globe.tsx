import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  SharedValue, interpolate, useAnimatedProps, useAnimatedStyle,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';
import { GLOBE_DOTS, GLOBE_GRATICULE } from '../globeData';
import { C, F } from '../theme';
import { PlaneIcon } from './Bits';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const clamp01 = (v: number) => {
  'worklet';
  return Math.min(1, Math.max(0, v));
};

/** Land dots grouped into opacity buckets so the whole map is only four draw calls. */
function useDotPaths() {
  return useMemo(() => {
    const buckets = ['', '', '', ''];
    for (let i = 0; i < GLOBE_DOTS.length; i += 3) {
      const o = GLOBE_DOTS[i + 2];
      const b = o < 0.5 ? 0 : o < 0.7 ? 1 : o < 0.88 ? 2 : 3;
      buckets[b] += `M${GLOBE_DOTS[i]} ${GLOBE_DOTS[i + 1]}h0.01`;
    }
    return buckets;
  }, []);
}

type Props = {
  width: number;
  /** 0 → 1: one complete 360° lap of the plane around the globe. */
  progress: SharedValue<number>;
  /** 0 → 1: globe fades and scales in. */
  intro: SharedValue<number>;
};

export function OrbitGlobe({ width, progress, intro }: Props) {
  const Rg = width * 0.3;
  const a = Rg * 1.58;
  const b = a * 0.3;
  const tilt = (-17 * Math.PI) / 180;
  const W = width;
  const H = width * 0.86;
  const cx = W / 2;
  const cy = H / 2;
  const planeSize = 26;
  const dots = useDotPaths();

  const half = useMemo(() => {
    let len = 0, px = a, py = 0;
    for (let i = 1; i <= 60; i++) {
      const t = (i / 60) * Math.PI;
      const x = a * Math.cos(t), y = b * Math.sin(t);
      len += Math.hypot(x - px, y - py);
      px = x; py = y;
    }
    return len;
  }, [a, b]);

  const front = `M ${cx + a} ${cy} A ${a} ${b} 0 0 1 ${cx - a} ${cy}`;
  const back = `M ${cx - a} ${cy} A ${a} ${b} 0 0 1 ${cx + a} ${cy}`;
  const rot = `rotate(${(tilt * 180) / Math.PI} ${cx} ${cy})`;

  const frontProps = useAnimatedProps(() => ({ strokeDashoffset: half * (1 - clamp01(progress.value / 0.5)) }));
  const backProps = useAnimatedProps(() => ({ strokeDashoffset: half * (1 - clamp01((progress.value - 0.5) / 0.5)) }));

  const planeStyle = (isFront: boolean) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => {
      const th = progress.value * Math.PI * 2;
      const ex = a * Math.cos(th), ey = b * Math.sin(th);
      const X = cx + ex * Math.cos(tilt) - ey * Math.sin(tilt);
      const Y = cy + ex * Math.sin(tilt) + ey * Math.cos(tilt);
      const dex = -a * Math.sin(th), dey = b * Math.cos(th);
      const dX = dex * Math.cos(tilt) - dey * Math.sin(tilt);
      const dY = dex * Math.sin(tilt) + dey * Math.cos(tilt);
      const depth = Math.sin(th); // >0: in front of the globe
      const visible = isFront ? depth >= 0 : depth < 0;
      const s = 0.8 + 0.28 * ((depth + 1) / 2);
      return {
        opacity: visible ? interpolate(intro.value, [0.4, 1], [0, isFront ? 1 : 0.55], 'clamp') : 0,
        transform: [
          { translateX: X - planeSize / 2 },
          { translateY: Y - planeSize / 2 },
          { rotate: `${Math.atan2(dY, dX) + Math.PI / 2}rad` },
          { scale: s },
        ],
      };
    });
  const backPlane = planeStyle(false);
  const frontPlane = planeStyle(true);

  const globeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(intro.value, [0, 0.7], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(intro.value, [0, 1], [0.86, 1]) }],
  }));

  const guide = { stroke: C.lineStrong, strokeWidth: 1, strokeDasharray: [2, 5], strokeLinecap: 'round' as const, fill: 'none' as const };
  const trail = { stroke: C.accent, strokeWidth: 2.6, strokeLinecap: 'round' as const, fill: 'none' as const, strokeDasharray: [half, half] };

  return (
    <View style={{ width: W, height: H }}>
      {/* behind the globe */}
      <Svg width={W} height={H} style={{ position: 'absolute' }}>
        <G transform={rot}>
          <Path d={back} {...guide} />
          <AnimatedPath d={back} {...trail} animatedProps={backProps} />
        </G>
      </Svg>
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0 }, backPlane]}>
        <PlaneIcon size={planeSize} color={C.navy} />
      </Animated.View>

      {/* the globe */}
      <Animated.View style={[{ position: 'absolute', left: cx - Rg, top: cy - Rg, width: Rg * 2, height: Rg * 2 }, globeStyle]}>
        <Svg width={Rg * 2} height={Rg * 2} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="ocean" cx="36%" cy="30%" r="80%">
              <Stop offset="0" stopColor="#FFFFFF" />
              <Stop offset="0.5" stopColor="#E3EFF9" />
              <Stop offset="1" stopColor="#B4D2EB" />
            </RadialGradient>
            <RadialGradient id="shade" cx="50%" cy="50%" r="50%">
              <Stop offset="0.7" stopColor={C.navy} stopOpacity="0" />
              <Stop offset="1" stopColor={C.navy} stopOpacity="0.16" />
            </RadialGradient>
          </Defs>
          <Circle cx={100} cy={100} r={100} fill="url(#ocean)" />
          <Path d={GLOBE_GRATICULE} stroke={C.navy} strokeOpacity={0.09} strokeWidth={0.5} fill="none" />
          <Path d={dots[0]} stroke={C.navy} strokeOpacity={0.28} strokeWidth={2.3} strokeLinecap="round" />
          <Path d={dots[1]} stroke={C.navy} strokeOpacity={0.5} strokeWidth={2.3} strokeLinecap="round" />
          <Path d={dots[2]} stroke={C.navy} strokeOpacity={0.72} strokeWidth={2.4} strokeLinecap="round" />
          <Path d={dots[3]} stroke={C.navy} strokeOpacity={0.92} strokeWidth={2.5} strokeLinecap="round" />
          <Circle cx={100} cy={100} r={100} fill="url(#shade)" />
          <Circle cx={100} cy={100} r={99.3} fill="none" stroke={C.navy} strokeOpacity={0.14} strokeWidth={1} />
        </Svg>
      </Animated.View>

      {/* in front of the globe */}
      <Svg width={W} height={H} style={{ position: 'absolute' }} pointerEvents="none">
        <G transform={rot}>
          <Path d={front} {...guide} />
          <AnimatedPath d={front} {...trail} animatedProps={frontProps} />
        </G>
      </Svg>
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0 }, frontPlane]}>
        <PlaneIcon size={planeSize} color={C.navy} />
      </Animated.View>
    </View>
  );
}

/** Compact mark: enamel globe, graticule, brass orbit. */
export function GlobeMark({ size = 34 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Defs>
        <RadialGradient id="mk" cx="35%" cy="30%" r="80%">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#A9CBE6" />
        </RadialGradient>
      </Defs>
      <Circle cx={20} cy={20} r={12.5} fill="url(#mk)" stroke={C.navy} strokeWidth={1.2} />
      <Ellipse cx={20} cy={20} rx={5.2} ry={12.5} fill="none" stroke={C.navy} strokeWidth={0.8} strokeOpacity={0.55} />
      <Path d="M7.5 20h25M9.5 14h21M9.5 26h21" stroke={C.navy} strokeWidth={0.7} strokeOpacity={0.4} />
      <Ellipse cx={20} cy={20} rx={18.5} ry={6} fill="none" stroke={C.accent} strokeWidth={1.7} transform="rotate(-17 20 20)" />
      <Circle cx={36.6} cy={14.8} r={2.1} fill={C.navy} />
    </Svg>
  );
}

/** The logo: mark, wordmark, and the line that says what we do. */
export function Logo({ size = 52, tagline = true, light }: { size?: number; tagline?: boolean; light?: boolean }) {
  const col = light ? C.onNavy : C.text;
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontFamily: F.display, fontSize: size, lineHeight: size * 1.05, color: col, letterSpacing: -size * 0.012 }}>Meridian</Text>
      {tagline && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: size * 0.1 }}>
          <View style={{ width: 26, height: 1, backgroundColor: C.accent }} />
          <Text style={{ fontFamily: F.italic, fontSize: size * 0.36, color: C.text2, letterSpacing: 0.4 }}>fly beautifully</Text>
          <View style={{ width: 26, height: 1, backgroundColor: C.accent }} />
        </View>
      )}
    </View>
  );
}
