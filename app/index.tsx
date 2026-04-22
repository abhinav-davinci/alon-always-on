import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { ShieldCheck, Route, UserCheck } from 'lucide-react-native';
import AlonAvatar from '../components/AlonAvatar';
import Button from '../components/Button';
import { Colors, Typography, Spacing } from '../constants/theme';
import TrythatLogo from '../assets/trythat-logo-white.svg';

const { width: SW, height: SH } = Dimensions.get('window');
const LOGO_LARGE = SW * 0.682; // 10% bigger than the previous 0.62
const LOGO_SMALL = 100;
// Aspect ratio of assets/trythat-logo-white.svg (2604 × 677 viewBox).
// Update this if the source SVG proportions change.
const LOGO_RATIO = 677 / 2604;

// ── Timings ──
const T = {
  LOGO_IN: 200,           // TryThat fades in at center
  MOVE_START: 1100,       // Logo starts moving up + shrinking
  MOVE_END: 2100,         // Logo settles at top
  PRESENTS: 1800,         // "presents" fades in (during the move)
  ALON: 2200,             // ALON avatar scales in
  WORDMARK: 2600,         // "ALON" text
  SUBTITLE: 2800,         // Tagline
  PROMISES: 3100,         // Promises card
  CTA: 3400,              // Launch button
};

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Logo starts at screen center, moves to top of hero zone
  // move: 0 = center of screen, 1 = final top position
  const ttOp = useSharedValue(0);
  const move = useSharedValue(0);

  const presentsOp = useSharedValue(0);
  const alonOp = useSharedValue(0);
  const alonScale = useSharedValue(0);
  const wordmarkOp = useSharedValue(0);
  const wordmarkY = useSharedValue(10);
  const subtitleOp = useSharedValue(0);
  const subtitleY = useSharedValue(10);
  const promisesOp = useSharedValue(0);
  const promisesY = useSharedValue(15);
  const ctaOp = useSharedValue(0);
  const ctaY = useSharedValue(12);

  useEffect(() => {
    const ease = Easing.out(Easing.ease);
    const cubic = Easing.inOut(Easing.cubic);

    // Beat 1: Logo appears at center
    ttOp.value = withDelay(T.LOGO_IN, withTiming(1, { duration: 500 }));

    // Beat 2: Logo moves up + shrinks to final position
    move.value = withDelay(T.MOVE_START, withTiming(1, { duration: 1000, easing: cubic }));

    // "presents" appears as logo is settling
    presentsOp.value = withDelay(T.PRESENTS, withTiming(1, { duration: 500 }));

    // Beat 3: ALON grows in
    alonOp.value = withDelay(T.ALON, withTiming(1, { duration: 500 }));
    alonScale.value = withDelay(T.ALON, withTiming(1, { duration: 600, easing: ease }));

    // Beat 4: Content cascade
    wordmarkOp.value = withDelay(T.WORDMARK, withTiming(1, { duration: 400 }));
    wordmarkY.value = withDelay(T.WORDMARK, withTiming(0, { duration: 400, easing: ease }));
    subtitleOp.value = withDelay(T.SUBTITLE, withTiming(1, { duration: 400 }));
    subtitleY.value = withDelay(T.SUBTITLE, withTiming(0, { duration: 400, easing: ease }));
    promisesOp.value = withDelay(T.PROMISES, withTiming(1, { duration: 400 }));
    promisesY.value = withDelay(T.PROMISES, withTiming(0, { duration: 400, easing: ease }));
    ctaOp.value = withDelay(T.CTA, withTiming(1, { duration: 400 }));
    ctaY.value = withDelay(T.CTA, withTiming(0, { duration: 400, easing: ease }));
  }, []);

  // ── TryThat logo: absolute overlay that moves from center → top ──
  const ttStyle = useAnimatedStyle(() => {
    const scale = interpolate(move.value, [0, 1], [1, LOGO_SMALL / LOGO_LARGE]);
    // Start at roughly center of screen, end at top of hero
    const translateY = interpolate(move.value, [0, 1], [SH * 0.35, 0]);
    return {
      opacity: ttOp.value,
      transform: [{ translateY }, { scale }],
    };
  });

  // "presents" — fades in at its layout position, only after logo starts moving
  const presentsStyle = useAnimatedStyle(() => ({
    opacity: presentsOp.value,
  }));

  const alonStyle = useAnimatedStyle(() => ({
    opacity: alonOp.value,
    transform: [{ scale: alonScale.value }],
  }));
  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOp.value,
    transform: [{ translateY: wordmarkY.value }],
  }));
  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOp.value,
    transform: [{ translateY: subtitleY.value }],
  }));
  const promisesStyle = useAnimatedStyle(() => ({
    opacity: promisesOp.value,
    transform: [{ translateY: promisesY.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOp.value,
    transform: [{ translateY: ctaY.value }],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }]}>

      {/* ── Main layout (everything in normal flow) ── */}
      <View style={styles.heroZone}>
        {/* TryThat logo — final resting position at top of hero.
            SVG component via react-native-svg-transformer; stays crisp
            across all scale transforms in the splash intro animation. */}
        <Animated.View style={[styles.ttFinalPos, ttStyle]}>
          <TrythatLogo
            width={LOGO_LARGE}
            height={LOGO_LARGE * LOGO_RATIO}
          />
        </Animated.View>

        {/* ── presents ── */}
        <Animated.View style={[styles.presentsWrap, presentsStyle]}>
          <View style={styles.presentsLine} />
          <Text style={styles.presentsText}>PRESENTS</Text>
          <View style={styles.presentsLine} />
        </Animated.View>

        {/* ALON avatar */}
        <Animated.View style={[styles.alonWrap, alonStyle]}>
          <AlonAvatar size={100} showRings showBlink autoGreet variant="light" />
        </Animated.View>

        {/* Wordmark + subtitle */}
        <Animated.View style={[styles.textWrap, wordmarkStyle]}>
          <Text style={styles.wordmark}>ALON</Text>
        </Animated.View>
        <Animated.View style={subtitleStyle}>
          <Text style={styles.subtitle}>
            Your personal AI for the entire{'\n'}home-buying journey
          </Text>
        </Animated.View>
      </View>

      {/* ── Promises card ── */}
      <Animated.View style={[styles.promisesCard, promisesStyle]}>
        <Text style={styles.promisesHeading}>My Promises</Text>
        <View style={styles.promisesList}>
          <View style={styles.promiseRow}>
            <View style={[styles.promiseIcon, styles.promiseIconBlue]}>
              <ShieldCheck size={15} color="#7B9BF2" strokeWidth={2} />
            </View>
            <View style={styles.promiseContent}>
              <Text style={styles.promiseBold}>Your contact is yours</Text>
              <Text style={styles.promiseSub}>Never shared without your go-ahead</Text>
            </View>
          </View>
          <View style={styles.promiseDivider} />
          <View style={styles.promiseRow}>
            <View style={[styles.promiseIcon, styles.promiseIconAmber]}>
              <Route size={15} color="#F5C16C" strokeWidth={2} />
            </View>
            <View style={styles.promiseContent}>
              <Text style={styles.promiseBold}>Complete journey, not just listings</Text>
              <Text style={styles.promiseSub}>Search to possession — all 9 stages</Text>
            </View>
          </View>
          <View style={styles.promiseDivider} />
          <View style={styles.promiseRow}>
            <View style={[styles.promiseIcon, styles.promiseIconBlue]}>
              <UserCheck size={15} color="#7B9BF2" strokeWidth={2} />
            </View>
            <View style={styles.promiseContent}>
              <Text style={styles.promiseBold}>Always in your corner</Text>
              <Text style={styles.promiseSub}>Works for you — never the builder or agent</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* ── CTA ── */}
      <Animated.View style={[styles.ctaWrap, ctaStyle]}>
        <Button
          title="Launch ALON →"
          onPress={() => router.push('/onboarding/goal')}
          variant="primaryWhite"
        />
        <Text style={styles.finePrint}>Free forever for buyers · No spam, ever</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy800,
    paddingHorizontal: Spacing.xxl,
  },

  heroZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ttFinalPos: {
    marginBottom: 4,
  },
  presentsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
    alignSelf: 'stretch',
    marginHorizontal: 20,
  },
  presentsLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  presentsText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 10,
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 3,
  },
  alonWrap: {
    marginBottom: 12,
  },
  textWrap: {
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 30,
    color: Colors.white,
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 15,
  },

  // Promises card
  promisesCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    marginBottom: Spacing.lg,
  },
  promisesHeading: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
    marginBottom: 14,
  },
  promisesList: { gap: 0 },
  promiseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  promiseIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promiseIconBlue: { backgroundColor: 'rgba(74,114,232,0.2)' },
  promiseIconAmber: { backgroundColor: 'rgba(245,166,35,0.15)' },
  promiseContent: { flex: 1, gap: 2 },
  promiseBold: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 13,
    color: Colors.white,
  },
  promiseSub: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 15,
  },
  promiseDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: 46,
  },

  // CTA
  ctaWrap: { alignItems: 'center', gap: Spacing.lg },
  finePrint: { ...Typography.small, color: 'rgba(255,255,255,0.25)' },
});
