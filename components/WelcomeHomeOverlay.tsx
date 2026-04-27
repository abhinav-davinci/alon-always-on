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

// Confetti — 28 particles, staggered over ~4s so the fall keeps
// going through most of the modal viewing time. Mix of brand terra,
// warm gold, soft green, plus white particles that pop on the navy
// canvas.
const CONFETTI_COLORS = [
  Colors.terra500,
  Colors.terra400,
  '#E8A84C', // warm gold
  '#22C55E', // soft green
  '#FFFFFF', // crisp white — only works because we're on navy
];
const CONFETTI_PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  x: (i / 28) * SCREEN_W + (i % 3 === 0 ? 22 : i % 3 === 1 ? -16 : 6),
  delay: i * 140, // ~4s total stagger
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 5 + (i % 4) * 2,
  drift: (Math.random() - 0.5) * 60, // small horizontal sway
}));

export function WelcomeHomeOverlay({
  visible,
  propertyName,
  builderName,
  location,
  onDismiss,
}: {
  visible: boolean;
  propertyName: string;
  builderName?: string;
  location?: string;
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        {/* Confetti layer — drifts down, fades out. Only visible
            during the celebration; not interactive. */}
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
            Welcome home.
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

// ── Confetti particle — single dot, drifts down + fades. Falls over
// ~4.5s with a small horizontal sway and continuous rotation, then
// fades out at the bottom. Combined with staggered launch delays
// (up to 4s) the overall confetti experience lasts ~8s.
function ConfettiParticle({
  x,
  delay,
  color,
  size,
  drift,
}: {
  x: number;
  delay: number;
  color: string;
  size: number;
  drift: number;
}) {
  const ty = useSharedValue(-30);
  const tx = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    ty.value = withDelay(delay, withTiming(SCREEN_H * 0.95, {
      duration: 4500, easing: Easing.in(Easing.quad),
    }));
    tx.value = withDelay(delay, withTiming(drift, {
      duration: 4500, easing: Easing.inOut(Easing.sin),
    }));
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 250 }),
      withTiming(1, { duration: 3500 }),
      withTiming(0, { duration: 750 }),
    ));
    rotate.value = withDelay(delay, withTiming(540 + (Math.random() * 360), {
      duration: 4500, easing: Easing.linear,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: ty.value },
      { translateX: tx.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: 0,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: size / 4,
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
    fontFamily: 'DMSerifDisplay', fontSize: 42,
    color: Colors.warm50, textAlign: 'center',
    lineHeight: 48,
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
