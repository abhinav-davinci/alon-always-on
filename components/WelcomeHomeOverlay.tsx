import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Share,
  Dimensions,
} from 'react-native';
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
const CANNON_LEFT = { x: -20, y: SCREEN_H * 0.85 };
const CANNON_RIGHT = { x: SCREEN_W + 20, y: SCREEN_H * 0.85 };

function makeParticle(side: 'left' | 'right', wave: 0 | 1, i: number): CannonParticle {
  const origin = side === 'left' ? CANNON_LEFT : CANNON_RIGHT;
  // Each particle aims for a peak somewhere in the upper-mid screen,
  // crossing toward the center horizontally. Random spread per particle
  // so the cloud disperses naturally.
  const peakX = SCREEN_W * (0.30 + Math.random() * 0.40);
  const peakY = SCREEN_H * (0.10 + Math.random() * 0.35);
  const endY = SCREEN_H + 60;
  const endX = peakX + (Math.random() - 0.5) * 320;
  const baseDelay = wave === 0 ? 0 : 1400;
  return {
    side,
    delay: baseDelay + Math.random() * 280,
    startX: origin.x, startY: origin.y,
    peakX, peakY,
    endX, endY,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    shape: Math.random() > 0.7 ? 'streamer' : 'dot',
    size: 5 + Math.random() * 6,
    rotateFinal: (Math.random() - 0.5) * 1080,
  };
}

// 60 particles in the initial blast (30 per side) + 24 in the sustain
// wave (12 per side) → 84 total across two beats.
const CONFETTI_PARTICLES: CannonParticle[] = [
  ...Array.from({ length: 30 }, (_, i) => makeParticle('left', 0, i)),
  ...Array.from({ length: 30 }, (_, i) => makeParticle('right', 0, i)),
  ...Array.from({ length: 12 }, (_, i) => makeParticle('left', 1, i)),
  ...Array.from({ length: 12 }, (_, i) => makeParticle('right', 1, i)),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleShare = async () => {
    haptics.light();
    const builderTail = builderName ? ` by ${builderName}` : '';
    const locationTail = location ? ` (${location})` : '';
    try {
      await Share.share({
        title: 'I got the keys!',
        message: `I just got the keys to ${propertyName}${builderTail}${locationTail}. Big day.`,
      });
    } catch {
      // Cancelled or unavailable — non-fatal.
    }
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
        {/* Confetti layer — particles cannon from bottom-left and
            bottom-right, arc up toward centre, then fall. Two waves
            (initial blast + sustain ~1.4s in). Not interactive. */}
        {visible && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {CONFETTI_PARTICLES.map((p, i) => (
              <ConfettiParticle key={i} {...p} />
            ))}
          </View>
        )}

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
            {/* Soft gold halo behind ALON — gives the avatar warmth
                and centres the eye. Stacked translucent circles
                approximate a radial glow without needing a real
                radial-gradient library. */}
            <View pointerEvents="none" style={styles.haloOuter} />
            <View pointerEvents="none" style={styles.haloInner} />
            <AlonAvatar
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
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
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
      </View>
    </Modal>
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
  // Two stacked translucent gold circles behind ALON to fake a soft
  // radial glow. Outer is wider + dimmer, inner is tighter + warmer.
  // Both absolutely positioned so they sit *behind* the avatar.
  haloOuter: {
    position: 'absolute',
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(232,168,76,0.06)',
  },
  haloInner: {
    position: 'absolute',
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(232,168,76,0.10)',
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
