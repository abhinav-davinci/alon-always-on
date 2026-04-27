import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { Share2 } from 'lucide-react-native';
import { Colors, Spacing } from '../constants/theme';
import AlonAvatar from './AlonAvatar';
import { useHaptics } from '../hooks/useHaptics';

/**
 * Welcome Home — full-screen "you did it" moment.
 *
 * Fires once per property when the user finishes every Possession
 * checklist (snag walk + documents + handover-day). This is the only
 * place ALON dances — earned by completing real work, not by arrival.
 *
 * Design intent: cream backdrop, big serif headline, ALON center
 * stage, light confetti drift, two CTAs (share, continue). Calm-but-
 * warm vs the Disney route.
 */

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Halo size — generous so the gradient extends beyond ALON's body
// (120px) and dissolves smoothly into the navy bg.
const HALO_SIZE = 280;

// Confetti — side-cannon model. Particles launch from the bottom-left
// and bottom-right corners, arc upward toward the centre, peak, then
// fall back across the screen. Two waves (initial blast + a sustain
// volley ~1.4s in) give the moment density without monotony. Mix of
// dot and streamer shapes for visual variety on the navy canvas.
const CONFETTI_COLORS = [
  Colors.terra500,
  Colors.terra400,
  '#E8A84C', // warm gold
  '#22C55E', // soft green
  '#FFFFFF', // crisp white — only works because we're on navy
];

type ConfettiShape = 'dot' | 'streamer';

interface CannonParticle {
  side: 'left' | 'right';
  delay: number;
  startX: number;
  startY: number;
  peakX: number;
  peakY: number;
  endX: number;
  endY: number;
  color: string;
  shape: ConfettiShape;
  size: number;
  rotateFinal: number;
}

// Cannon origins sit just off-screen at the bottom corners so the
// particles "emerge" from outside the view, not from visible dots.
const CANNON_LEFT = { x: -10, y: SCREEN_H * 0.95 };
const CANNON_RIGHT = { x: SCREEN_W + 10, y: SCREEN_H * 0.95 };

// Wave timing — three pulses give the celebration a narrative arc:
// big initial blast, sustain, fade.
const WAVE_DELAYS = [0, 900, 1900] as const;

function makeParticle(side: 'left' | 'right', wave: 0 | 1 | 2): CannonParticle {
  const origin = side === 'left' ? CANNON_LEFT : CANNON_RIGHT;
  // Real cannons fire LATERALLY, not vertically. Each particle gets
  // its own trajectory length (some short, some across the whole
  // screen) and arc height, so the cloud has visible directional
  // motion all the way across — not a center pile-up.
  const trajectoryWidth = SCREEN_W * (0.55 + Math.random() * 0.85); // 55%–140%
  const direction = side === 'left' ? 1 : -1;
  const peakX = origin.x + direction * trajectoryWidth * (0.45 + Math.random() * 0.15);
  const peakY = SCREEN_H * (0.08 + Math.random() * 0.40); // upper 8–48%
  const endX = origin.x + direction * trajectoryWidth;
  const endY = SCREEN_H + 80;
  const baseDelay = WAVE_DELAYS[wave];
  // Tighter blast windows so each wave reads as a discrete pop.
  const jitter = wave === 0 ? 180 : 240;
  return {
    side,
    delay: baseDelay + Math.random() * jitter,
    startX: origin.x, startY: origin.y,
    peakX, peakY,
    endX, endY,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    shape: Math.random() > 0.7 ? 'streamer' : 'dot',
    size: 7 + Math.random() * 8, // 7–15
    rotateFinal: (Math.random() - 0.5) * 1440,
  };
}

// 70 in the initial blast (35 per side) + 50 sustain (25 per side)
// + 30 fade (15 per side) → 150 total across three beats.
const CONFETTI_PARTICLES: CannonParticle[] = [
  ...Array.from({ length: 35 }, () => makeParticle('left', 0)),
  ...Array.from({ length: 35 }, () => makeParticle('right', 0)),
  ...Array.from({ length: 25 }, () => makeParticle('left', 1)),
  ...Array.from({ length: 25 }, () => makeParticle('right', 1)),
  ...Array.from({ length: 15 }, () => makeParticle('left', 2)),
  ...Array.from({ length: 15 }, () => makeParticle('right', 2)),
];

export function WelcomeHomeOverlay({
  visible,
  propertyName,
  builderName,
  location,
  userName,
  onDismiss,
}: {
  visible: boolean;
  propertyName: string;
  builderName?: string;
  location?: string;
  /** Buyer's name from onboarding. When present, the headline reads
   *  "Welcome home, {firstName}." — anchors the moment as personal. */
  userName?: string;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const [celebrate, setCelebrate] = useState(false);
  // ⚠️ TEMPORARY (testing only) — replayKey forces ALON + confetti
  // to remount so the celebration can be replayed via the "Tell your
  // family" button without re-completing every checklist. Revert
  // to native share before merging to main.
  const [replayKey, setReplayKey] = useState(0);

  // Trigger ALON's dance shortly after the modal mounts so it lands
  // after the entrance animation, not on top of it.
  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => {
        setCelebrate(true);
        haptics.success();
      }, 280);
      return () => clearTimeout(t);
    }
    setCelebrate(false);
    setReplayKey(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Replay celebration — used by the testing-only "Tell your family"
  // hijack. Bumping replayKey re-mounts the confetti layer + ALON,
  // which resets the celebrationFired ref inside AlonAvatar so the
  // dance can play again. Toggling celebrate off→on triggers the
  // useEffect chain that re-fires haptics + the new sequence.
  const replayCelebration = () => {
    haptics.light();
    setCelebrate(false);
    setReplayKey((k) => k + 1);
    setTimeout(() => {
      setCelebrate(true);
      haptics.success();
    }, 80);
  };

  // Structured property line — "by Builder · Location" when we have
  // both, just one when we have one, nothing when we have neither.
  const propertyTail = (() => {
    const parts: string[] = [];
    if (builderName) parts.push(`by ${builderName}`);
    if (location) parts.push(location);
    return parts.join(' · ');
  })();

  // First name only — pull cleanly from "Abhinav Raj" or "Abhinav".
  const firstName = userName?.trim().split(/\s+/)[0] ?? '';
  const headline = firstName ? `Welcome home,\n${firstName}.` : 'Welcome home.';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Animated.View
          entering={FadeInUp.duration(360).springify()}
          style={[styles.panel, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        >
          <Animated.Text
            entering={FadeIn.delay(180).duration(360)}
            style={styles.eyebrow}
          >
            POSSESSION COMPLETE
          </Animated.Text>

          <Animated.Text
            entering={FadeInUp.delay(240).duration(420)}
            style={styles.headline}
          >
            {headline}
          </Animated.Text>

          <Animated.Text
            entering={FadeIn.delay(380).duration(360)}
            style={styles.propertyName}
            numberOfLines={2}
          >
            {propertyName}
          </Animated.Text>
          {propertyTail.length > 0 && (
            <Animated.Text
              entering={FadeIn.delay(440).duration(360)}
              style={styles.propertyTail}
              numberOfLines={2}
            >
              {propertyTail}
            </Animated.Text>
          )}

          <View style={styles.avatarWrap}>
            {/* Soft gold halo behind ALON — real radial gradient via
                react-native-svg so the gold fades cleanly to
                transparent at the edges, merging with the navy bg
                instead of showing as hard-edged discs. */}
            <View pointerEvents="none" style={styles.haloHost}>
              <Svg width={HALO_SIZE} height={HALO_SIZE}>
                <Defs>
                  <RadialGradient id="welcome-halo" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#E8A84C" stopOpacity={0.32} />
                    <Stop offset="50%" stopColor="#E8A84C" stopOpacity={0.10} />
                    <Stop offset="100%" stopColor="#E8A84C" stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Rect width={HALO_SIZE} height={HALO_SIZE} fill="url(#welcome-halo)" />
              </Svg>
            </View>
            <AlonAvatar
              key={`alon-${replayKey}`}
              size={120}
              showRings={true}
              showBlink={true}
              variant="light"
              interactive={false}
              celebrate={celebrate}
              celebrationText="You made it."
            />
          </View>

          <Animated.Text
            entering={FadeIn.delay(900).duration(360)}
            style={styles.tagline}
          >
            A home of your own. One of life's biggest moments — share it
            with the people who got you here.
          </Animated.Text>

          <View style={styles.ctaRow}>
            {/* ⚠️ TEMPORARY: hijacked to replay the celebration so we
                can iterate without re-completing every checklist.
                Revert to native share via Share.share before merging. */}
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={replayCelebration}
              activeOpacity={0.85}
            >
              <Share2 size={14} color={Colors.terra500} strokeWidth={2.2} />
              <Text style={styles.shareBtnText}>Tell your family</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => {
                haptics.light();
                onDismiss();
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Confetti layer — rendered AFTER the panel so particles draw
            on top of the headline + ALON + tagline + CTAs. Without
            this z-order the cannons get hidden behind text/avatar
            and the celebration disappears. Plus a brief cannon-flash
            at each corner on each wave so the user *sees* the launch.
            The `key={replayKey}` makes the whole layer re-mount on
            replay so all particle useEffects fire from scratch. */}
        {visible && (
          <View key={`confetti-${replayKey}`} style={StyleSheet.absoluteFill} pointerEvents="none">
            <CannonFlash side="left" />
            <CannonFlash side="right" />
            {CONFETTI_PARTICLES.map((p, i) => (
              <ConfettiParticle key={i} {...p} />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

// ── Cannon flash — a brief radial pop at each corner when a wave
// fires, so the user perceives the launch direction. Three flashes
// per corner (one per wave) chained via withDelay.
function CannonFlash({ side }: { side: 'left' | 'right' }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const triggerOne = (delay: number) => {
      scale.value = withDelay(delay, withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(3.2, { duration: 520, easing: Easing.out(Easing.quad) }),
      ));
      opacity.value = withDelay(delay, withSequence(
        withTiming(0.85, { duration: 60 }),
        withTiming(0, { duration: 460, easing: Easing.out(Easing.ease) }),
      ));
    };
    WAVE_DELAYS.forEach((d) => triggerOne(d));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const origin = side === 'left' ? CANNON_LEFT : CANNON_RIGHT;
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: origin.x - 50,
          top: origin.y - 50,
          width: 100, height: 100, borderRadius: 50,
          backgroundColor: '#E8A84C',
        },
        style,
      ]}
    />
  );
}

// ── Confetti particle — cannon-launched parabolic motion. Each
// particle has a launch corner, an apex point, and a landing point.
// Animation: 700ms rise to apex (deceleration), then 1500ms fall to
// landing (acceleration). Continuous rotation throughout. Streamers
// (~30%) are taller-than-wide rectangles; the rest are square dots.
function ConfettiParticle({
  side, delay,
  startX, startY,
  peakX, peakY,
  endX, endY,
  color, shape, size,
  rotateFinal,
}: CannonParticle) {
  const tx = useSharedValue(startX);
  const ty = useSharedValue(startY);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Rise — fast initial velocity, decelerating (ease-out) toward apex.
    tx.value = withDelay(delay, withSequence(
      withTiming(peakX, { duration: 700, easing: Easing.out(Easing.quad) }),
      withTiming(endX,  { duration: 1500, easing: Easing.linear }),
    ));
    ty.value = withDelay(delay, withSequence(
      withTiming(peakY, { duration: 700, easing: Easing.out(Easing.quad) }),
      withTiming(endY,  { duration: 1500, easing: Easing.in(Easing.quad) }),
    ));
    rotate.value = withDelay(delay, withTiming(rotateFinal, {
      duration: 2200, easing: Easing.linear,
    }));
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 80 }),
      withTiming(1, { duration: 1700 }),
      withTiming(0, { duration: 420 }),
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  // Streamers are tall thin rectangles that flutter as they tumble.
  const w = shape === 'streamer' ? Math.max(3, size * 0.4) : size;
  const h = shape === 'streamer' ? size * 2.2 : size;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0, top: 0,
          width: w, height: h,
          backgroundColor: color,
          borderRadius: shape === 'streamer' ? 1 : size / 4,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    // Deep navy canvas — Possession's culminating moment is "done,
    // breathe out" not "fanfare in cream." Navy gives the screen
    // gravity and lets the confetti + ALON pop. Headline + tagline
    // shift to light tones to read on the dark canvas.
    backgroundColor: Colors.navy800,
  },
  panel: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: 'DMSans-SemiBold', fontSize: 11,
    // Warm gold reads as celebratory on navy (terra600 was the right
    // choice on cream; on navy it muddies). #E8A84C is the activation-
    // glow accent already used on dark-canvas brand moments.
    color: '#E8A84C', letterSpacing: 1.4,
    marginBottom: 12,
  },
  headline: {
    fontFamily: 'DMSerifDisplay', fontSize: 40,
    color: Colors.warm50, textAlign: 'center',
    lineHeight: 46, letterSpacing: 0.2,
  },
  propertyName: {
    fontFamily: 'DMSans-SemiBold', fontSize: 18,
    color: Colors.warm50, textAlign: 'center',
    marginTop: 14, marginHorizontal: 16, letterSpacing: 0.2,
  },
  // Builder + location line under the property name. Slightly muted
  // so the property name owns visual weight; this line is the
  // attribution detail that makes the report-shareable.
  propertyTail: {
    fontFamily: 'DMSans-Regular', fontSize: 13,
    color: 'rgba(255,255,255,0.70)', textAlign: 'center',
    marginTop: 4, marginHorizontal: 16, letterSpacing: 0.2,
  },
  avatarWrap: {
    marginTop: 32, marginBottom: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  // Wraps the radial-gradient SVG. Absolutely positioned so the SVG
  // sits behind ALON without affecting the wrap's layout.
  haloHost: {
    position: 'absolute',
    width: HALO_SIZE, height: HALO_SIZE,
    alignItems: 'center', justifyContent: 'center',
  },
  tagline: {
    fontFamily: 'DMSans-Regular', fontSize: 15,
    color: 'rgba(255,255,255,0.72)', textAlign: 'center',
    lineHeight: 22, marginHorizontal: 12,
    fontStyle: 'italic',
  },
  ctaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 36, alignSelf: 'stretch',
  },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  shareBtnText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 13, color: Colors.warm50,
  },
  continueBtn: {
    flex: 1,
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.terra500,
    alignItems: 'center', justifyContent: 'center',
  },
  continueBtnText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.white,
  },
});
