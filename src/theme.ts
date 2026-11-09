import { Easing } from 'react-native-reanimated';

/**
 * Meridian — instrument navy and brass on pale sky.
 * Reference: an antique desk globe. Brass meridian ring, ocean-blue enamel, navy lettering.
 */
export const C = {
  bg: '#EDF2F7',        // mist: the pale sky everything sits on
  surface: '#FFFFFF',   // paper
  surface2: '#F6F9FC',  // raised-but-quiet fill
  sunken: '#E2E9F1',    // inset controls
  text: '#0B2239',      // deep ocean navy
  text2: '#44576B',
  mute: '#7D90A4',
  line: 'rgba(11,34,57,0.09)',
  lineStrong: 'rgba(11,34,57,0.18)',
  navy: '#0B2239',
  onNavy: '#F4F8FC',
  accent: '#C28E2B',    // brass
  accentSoft: 'rgba(194,142,43,0.15)',
  sky: '#CFE2F2',
  sky2: '#8DB9DE',
  good: '#1F8A70',
  goodSoft: 'rgba(31,138,112,0.12)',
  danger: '#C8414B',
} as const;

export const F = {
  display: 'InstrumentSerif_400Regular',
  italic: 'InstrumentSerif_400Regular_Italic',
  light: 'HankenGrotesk_300Light',
  body: 'HankenGrotesk_400Regular',
  med: 'HankenGrotesk_500Medium',
  semi: 'HankenGrotesk_600SemiBold',
} as const;

/** Type scale (major-third-ish). Weight stays light; hierarchy comes from size and family. */
export const T = {
  hero: { fontFamily: F.display, fontSize: 44, lineHeight: 48, letterSpacing: -0.6, color: C.text },
  title: { fontFamily: F.display, fontSize: 30, lineHeight: 34, letterSpacing: -0.3, color: C.text },
  heading: { fontFamily: F.display, fontSize: 22, lineHeight: 26, color: C.text },
  place: { fontFamily: F.italic, fontSize: 17, lineHeight: 21, color: C.text2 },
  code: { fontFamily: F.light, fontSize: 46, lineHeight: 50, letterSpacing: 1.5, color: C.text },
  time: { fontFamily: F.med, fontSize: 21, lineHeight: 26, color: C.text, fontVariant: ['tabular-nums'] as ('tabular-nums')[] },
  body: { fontFamily: F.body, fontSize: 15, lineHeight: 21, color: C.text },
  label: { fontFamily: F.med, fontSize: 13, lineHeight: 17, color: C.text2 },
  small: { fontFamily: F.body, fontSize: 12, lineHeight: 16, color: C.mute },
} as const;

export const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, huge: 48 } as const;
// Radii follow hierarchy: sheets > panels > controls > chips.
export const R = { chip: 12, control: 16, panel: 22, sheet: 30, pill: 999 } as const;

export const M = {
  dur: { fast: 160, base: 260, slow: 420, hero: 700 },
  ease: {
    standard: Easing.bezier(0.2, 0, 0, 1),
    emphasized: Easing.bezier(0.3, 0, 0, 1),
    exit: Easing.bezier(0.4, 0, 1, 1),
    out: Easing.out(Easing.cubic),
  },
  spring: {
    snappy: { damping: 20, stiffness: 300, mass: 0.9 },
    fluid: { damping: 18, stiffness: 160, mass: 1 },
    bouncy: { damping: 11, stiffness: 180, mass: 1 },
    soft: { damping: 22, stiffness: 120, mass: 1 },
    // Critically damped and clamped: moves to its target and stops. Used for tabs and selectors.
    settle: { damping: 40, stiffness: 340, mass: 1, overshootClamping: true },
  },
  stagger: 55,
} as const;

/** Shadows are reserved for objects that float (dock, pass, card, knob). Panels use hairlines. */
export const shadow = (y = 12, blur = 24, opacity = 0.2) => ({
  shadowColor: '#0B2239',
  shadowOffset: { width: 0, height: y },
  shadowOpacity: opacity * 0.55,
  shadowRadius: blur,
  elevation: Math.round(blur / 3),
});
