import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { ShieldCheck, Route, UserCheck } from 'lucide-react-native';
import AlonAvatar from '../components/AlonAvatar';
import Button from '../components/Button';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.95);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(12);
  const promisesOpacity = useSharedValue(0);
  const promisesTranslateY = useSharedValue(12);
  const ctaOpacity = useSharedValue(0);
  const ctaTranslateY = useSharedValue(12);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 500 });
    logoScale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });

    textOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    textTranslateY.value = withDelay(300, withTiming(0, { duration: 400 }));

    promisesOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
    promisesTranslateY.value = withDelay(600, withTiming(0, { duration: 400 }));

    ctaOpacity.value = withDelay(900, withTiming(1, { duration: 400 }));
    ctaTranslateY.value = withDelay(900, withTiming(0, { duration: 400 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const promisesStyle = useAnimatedStyle(() => ({
    opacity: promisesOpacity.value,
    transform: [{ translateY: promisesTranslateY.value }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslateY.value }],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      {/* Top section — logo + wordmark */}
      <View style={styles.topSection}>
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <AlonAvatar size={80} showRings showBlink variant="light" />
        </Animated.View>

        <Animated.View style={[styles.textWrap, textStyle]}>
          <Text style={styles.wordmark}>ALON</Text>
          <Text style={styles.tagline}>Always On · by TryThat.ai</Text>
          <Text style={styles.subtitle}>
            Your personal AI for the entire{'\n'}home-buying journey
          </Text>
        </Animated.View>
      </View>

      {/* Trust promises */}
      <Animated.View style={[styles.promises, promisesStyle]}>
        <View style={styles.promiseRow}>
          <View style={[styles.promiseIcon, styles.promiseIconBlue]}>
            <ShieldCheck size={14} color="#7B9BF2" strokeWidth={1.8} />
          </View>
          <Text style={styles.promiseText}>
            <Text style={styles.promiseBold}>Your contact is yours.</Text>
            {' '}ALON never shares your number without your go-ahead.
          </Text>
        </View>

        <View style={styles.promiseRow}>
          <View style={[styles.promiseIcon, styles.promiseIconAmber]}>
            <Route size={14} color="#F5C16C" strokeWidth={1.8} />
          </View>
          <Text style={styles.promiseText}>
            <Text style={styles.promiseBold}>Complete journey, not just listings.</Text>
            {' '}Search to possession — all 8 stages.
          </Text>
        </View>

        <View style={styles.promiseRow}>
          <View style={[styles.promiseIcon, styles.promiseIconBlue]}>
            <UserCheck size={14} color="#7B9BF2" strokeWidth={1.8} />
          </View>
          <Text style={styles.promiseText}>
            <Text style={styles.promiseBold}>Always in your corner.</Text>
            {' '}Works for you — never the builder or agent.
          </Text>
        </View>
      </Animated.View>

      {/* CTA */}
      <Animated.View style={[styles.ctaWrap, ctaStyle]}>
        <Button
          title="Activate ALON →"
          onPress={() => router.push('/onboarding/intent')}
          variant="primaryWhite"
        />
        <Text style={styles.finePrint}>
          Free forever for buyers · No spam, ever
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.blue800,
    paddingHorizontal: Spacing.xxl,
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    marginBottom: Spacing.xxl,
  },
  textWrap: {
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 32,
    color: Colors.white,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: Spacing.xxl,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Trust promises
  promises: {
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  promiseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  promiseIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  promiseIconBlue: {
    backgroundColor: 'rgba(74,114,232,0.25)',
  },
  promiseIconAmber: {
    backgroundColor: 'rgba(245,166,35,0.2)',
  },
  promiseText: {
    flex: 1,
    ...Typography.small,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 18,
  },
  promiseBold: {
    color: Colors.blue100,
    fontFamily: 'DMSans-Medium',
  },

  // CTA
  ctaWrap: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  finePrint: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.25)',
  },
});
