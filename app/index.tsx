import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
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

const trythatWhite = require('../assets/trythat-logo-white.png');

const { width: SW } = Dimensions.get('window');
const LOGO_W = SW * 0.52;
const LOGO_H = LOGO_W * (174 / 800);

// ── Timings (single connected sequence) ──
const T_LOGO = 300;         // TryThat logo fades in
const T_PRESENTS = 1000;    // "Presents" appears below logo
const T_ALON = 1700;        // ALON avatar scales in below
const T_TAGLINE = 2200;     // Tagline under ALON
const T_DIVIDER = 2600;     // Thin divider line draws
const T_TRANSITION = 3200;  // Intro block lifts, main screen appears
const T_PROMISES = 3600;    // Trust promises
const T_CTA = 3900;         // CTA + bottom badge

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Intro sequence (all in one centered block) ──
  const logoOp = useSharedValue(0);
  const logoScale = useSharedValue(0.9);
  const presentsOp = useSharedValue(0);
  const presentsY = useSharedValue(6);
  const alonIntroOp = useSharedValue(0);
  const alonIntroScale = useSharedValue(0.85);
  const taglineOp = useSharedValue(0);
  const taglineY = useSharedValue(8);
  const dividerW = useSharedValue(0);

  // ── Transition: intro lifts away, main screen reveals ──
  const phase = useSharedValue(0); // 0 = intro, 1 = main

  // ── Main screen elements ──
  const mainLogoOp = useSharedValue(0);
  const mainLogoScale = useSharedValue(0.95);
  const mainTextOp = useSharedValue(0);
  const mainTextY = useSharedValue(12);
  const promisesOp = useSharedValue(0);
  const promisesY = useSharedValue(12);
  const ctaOp = useSharedValue(0);
  const ctaY = useSharedValue(12);

  useEffect(() => {
    const ease = Easing.out(Easing.ease);

    // Intro sequence
    logoOp.value = withDelay(T_LOGO, withTiming(1, { duration: 600 }));
    logoScale.value = withDelay(T_LOGO, withTiming(1, { duration: 600, easing: ease }));

    presentsOp.value = withDelay(T_PRESENTS, withTiming(1, { duration: 400 }));
    presentsY.value = withDelay(T_PRESENTS, withTiming(0, { duration: 400, easing: ease }));

    alonIntroOp.value = withDelay(T_ALON, withTiming(1, { duration: 500 }));
    alonIntroScale.value = withDelay(T_ALON, withTiming(1, { duration: 500, easing: ease }));

    taglineOp.value = withDelay(T_TAGLINE, withTiming(1, { duration: 400 }));
    taglineY.value = withDelay(T_TAGLINE, withTiming(0, { duration: 400, easing: ease }));

    dividerW.value = withDelay(T_DIVIDER, withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }));

    // Transition to main
    phase.value = withDelay(T_TRANSITION, withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }));

    // Main screen
    mainLogoOp.value = withDelay(T_TRANSITION + 200, withTiming(1, { duration: 500 }));
    mainLogoScale.value = withDelay(T_TRANSITION + 200, withTiming(1, { duration: 500, easing: ease }));
    mainTextOp.value = withDelay(T_TRANSITION + 400, withTiming(1, { duration: 400 }));
    mainTextY.value = withDelay(T_TRANSITION + 400, withTiming(0, { duration: 400 }));
    promisesOp.value = withDelay(T_PROMISES, withTiming(1, { duration: 400 }));
    promisesY.value = withDelay(T_PROMISES, withTiming(0, { duration: 400 }));
    ctaOp.value = withDelay(T_CTA, withTiming(1, { duration: 400 }));
    ctaY.value = withDelay(T_CTA, withTiming(0, { duration: 400 }));
  }, []);

  // ── Intro styles ──
  const introOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(phase.value, [0, 0.6], [1, 0]),
    transform: [
      { translateY: interpolate(phase.value, [0, 1], [0, -50]) },
      { scale: interpolate(phase.value, [0, 1], [1, 0.92]) },
    ],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOp.value,
    transform: [{ scale: logoScale.value }],
  }));
  const presentsStyle = useAnimatedStyle(() => ({
    opacity: presentsOp.value,
    transform: [{ translateY: presentsY.value }],
  }));
  const alonIntroStyle = useAnimatedStyle(() => ({
    opacity: alonIntroOp.value,
    transform: [{ scale: alonIntroScale.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOp.value,
    transform: [{ translateY: taglineY.value }],
  }));
  const dividerStyle = useAnimatedStyle(() => ({
    width: interpolate(dividerW.value, [0, 1], [0, 60]),
    opacity: interpolate(dividerW.value, [0, 0.3, 1], [0, 1, 1]),
  }));

  // ── Main screen styles ──
  const mainStyle = useAnimatedStyle(() => ({
    opacity: interpolate(phase.value, [0.3, 1], [0, 1]),
  }));
  const mLogoStyle = useAnimatedStyle(() => ({
    opacity: mainLogoOp.value,
    transform: [{ scale: mainLogoScale.value }],
  }));
  const mTextStyle = useAnimatedStyle(() => ({
    opacity: mainTextOp.value,
    transform: [{ translateY: mainTextY.value }],
  }));
  const mPromisesStyle = useAnimatedStyle(() => ({
    opacity: promisesOp.value,
    transform: [{ translateY: promisesY.value }],
  }));
  const mCtaStyle = useAnimatedStyle(() => ({
    opacity: ctaOp.value,
    transform: [{ translateY: ctaY.value }],
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(phase.value, [0.6, 1], [0, 0.6]),
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }]}>

      {/* ══════════════════════════════════════════
           MAIN SCREEN (underneath, fades in Phase 2)
           ══════════════════════════════════════════ */}
      <Animated.View style={[styles.mainWrap, mainStyle]}>
        <View style={styles.topSection}>
          <Animated.View style={[styles.mainLogoWrap, mLogoStyle]}>
            <AlonAvatar size={100} showRings showBlink autoGreet variant="light" />
          </Animated.View>
          <Animated.View style={[styles.textWrap, mTextStyle]}>
            <Text style={styles.wordmark}>ALON</Text>
            <Text style={styles.subtitle}>
              Your personal AI for the entire{'\n'}home-buying journey
            </Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.promisesCard, mPromisesStyle]}>
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

        <Animated.View style={[styles.ctaWrap, mCtaStyle]}>
          <Button
            title="Launch ALON →"
            onPress={() => router.push('/onboarding/goal')}
            variant="primaryWhite"
          />
          <Text style={styles.finePrint}>Free forever for buyers · No spam, ever</Text>
        </Animated.View>

        {/* TryThat badge below CTA */}
        <Animated.View style={[styles.bottomBadge, badgeStyle]}>
          <Text style={styles.bottomBadgeLabel}>Powered by</Text>
          <Image source={trythatWhite} style={styles.bottomBadgeImg} resizeMode="contain" />
        </Animated.View>
      </Animated.View>

      {/* ══════════════════════════════════════════
           INTRO: Connected TryThat → ALON reveal
           ══════════════════════════════════════════ */}
      <Animated.View style={[styles.introOverlay, introOverlayStyle]} pointerEvents="none">
        {/* TryThat logo — large, white */}
        <Animated.View style={logoStyle}>
          <Image source={trythatWhite} style={styles.introLogo} resizeMode="contain" />
        </Animated.View>

        {/* "Presents" */}
        <Animated.View style={presentsStyle}>
          <Text style={styles.presentsText}>presents</Text>
        </Animated.View>

        {/* Thin divider */}
        <Animated.View style={[styles.divider, dividerStyle]} />

        {/* ALON avatar — smaller */}
        <Animated.View style={alonIntroStyle}>
          <AlonAvatar size={52} showRings={false} showBlink={false} variant="light" />
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={taglineStyle}>
          <Text style={styles.introWordmark}>ALON</Text>
          <Text style={styles.introTagline}>
            The AI that never leaves your side{'\n'}from search to possession
          </Text>
        </Animated.View>
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

  // ── Intro overlay ──
  introOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    zIndex: 10,
  },
  introLogo: {
    width: SW * 0.52,
    height: (SW * 0.52) * (174 / 800),
  },
  presentsText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 4,
    textTransform: 'lowercase',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  introWordmark: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 26,
    color: Colors.white,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  introTagline: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 19,
  },

  // ── Main screen ──
  mainWrap: { flex: 1 },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainLogoWrap: { marginBottom: Spacing.xl },
  textWrap: { alignItems: 'center' },
  wordmark: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 32,
    color: Colors.white,
    letterSpacing: 1,
    marginBottom: Spacing.xxl,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Promises card
  promisesCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    marginBottom: Spacing.xxl,
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

  // Bottom TryThat badge
  bottomBadge: {
    alignItems: 'center',
    gap: 3,
    marginTop: 14,
    paddingBottom: 4,
  },
  bottomBadgeLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 9,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 0.5,
  },
  bottomBadgeImg: {
    width: 90,
    height: 90 * (174 / 800),
  },
});
