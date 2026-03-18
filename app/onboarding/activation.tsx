import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check, Shield, Search, FileCheck, BarChart3 } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  interpolate,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import AlonAvatar from '../../components/AlonAvatar';
import Button from '../../components/Button';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboarding';
import { useHaptics } from '../../hooks/useHaptics';
import { formatBudget } from '../../constants/locations';

// Animated counter that counts up
function AnimatedCounter({ target, duration = 2000, delay = 0, suffix = '' }: { target: number; duration?: number; delay?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = Date.now();
      const frame = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(eased * target));
        if (progress < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target]);
  return <Text style={styles.counterText}>{count.toLocaleString()}{suffix}</Text>;
}

// Scanning line animation
function ScanLine() {
  const pos = useSharedValue(0);
  useEffect(() => {
    pos.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    left: `${pos.value * 100}%`,
  }));
  return (
    <View style={styles.scanTrack}>
      <Animated.View style={[styles.scanDot, style]} />
    </View>
  );
}

// Status step component
function StatusStep({ icon: Icon, label, status, delay }: {
  icon: typeof Search;
  label: string;
  status: 'done' | 'active' | 'pending';
  delay: number;
}) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-8);
  const pulse = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateX.value = withDelay(delay, withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) }));
    if (status === 'active') {
      pulse.value = withDelay(delay + 400, withRepeat(
        withSequence(
          withTiming(1.15, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      ));
    }
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={[styles.stepRow, animStyle]}>
      <Animated.View style={[
        styles.stepDot,
        status === 'done' && styles.stepDotDone,
        status === 'active' && styles.stepDotActive,
        dotStyle,
      ]}>
        {status === 'done' ? (
          <Check size={10} color="#fff" strokeWidth={3} />
        ) : status === 'active' ? (
          <View style={styles.stepDotInner} />
        ) : (
          <View style={styles.stepDotPending} />
        )}
      </Animated.View>
      <View style={styles.stepContent}>
        <Text style={[
          styles.stepLabel,
          status === 'done' && styles.stepLabelDone,
          status === 'active' && styles.stepLabelActive,
        ]}>{label}</Text>
      </View>
      {status === 'active' && <ScanLine />}
    </Animated.View>
  );
}

export default function ActivationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { locations, propertySize, budget, purpose, propertyType, notifyVia, setNotifyVia } =
    useOnboardingStore();

  // Hero animation values
  const heroScale = useSharedValue(0);
  const heroOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.6);
  const ringOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(15);
  const subtitleOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    // Orchestrated entrance sequence
    // 1. Avatar pops in with spring
    heroOpacity.value = withDelay(200, withTiming(1, { duration: 200 }));
    heroScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 120 }));

    // 2. Ring expands
    ringOpacity.value = withDelay(400, withTiming(0.4, { duration: 400 }));
    ringScale.value = withDelay(400, withSpring(1, { damping: 15, stiffness: 80 }));

    // 3. Title fades up
    titleOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    titleY.value = withDelay(700, withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }));

    // 4. Subtitle
    subtitleOpacity.value = withDelay(1000, withTiming(1, { duration: 400 }));

    // 5. Progress bar fills
    progressWidth.value = withDelay(1800, withTiming(72, { duration: 2500, easing: Easing.out(Easing.cubic) }));

    // 6. Continuous glow
    glowPulse.value = withDelay(1200, withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    ));

    setTimeout(() => haptics.success(), 500);
  }, []);

  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
    opacity: heroOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.1, 0.25]),
    transform: [{ scale: interpolate(glowPulse.value, [0, 1], [0.95, 1.08]) }],
  }));

  const summaryItems = [
    locations.join(', '),
    propertyType,
    propertySize.join(', '),
    `${formatBudget(budget.min)} – ${formatBudget(budget.max)}`,
  ].filter(Boolean);

  const notifyOptions: Array<{ key: 'push' | 'whatsapp' | 'email'; label: string }> = [
    { key: 'push', label: 'Push' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'email', label: 'Email' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color="rgba(255,255,255,0.6)" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero section — ALON eye with glow */}
        <View style={styles.heroSection}>
          <Animated.View style={[styles.heroGlow, glowStyle]} />
          <Animated.View style={[styles.heroRing, ringStyle]} />
          <Animated.View style={heroStyle}>
            <AlonAvatar size={44} showRings={false} showBlink variant="light" />
          </Animated.View>
        </View>

        {/* Title */}
        <Animated.View style={[styles.titleSection, titleStyle]}>
          <Text style={styles.title}>ALON is on it.</Text>
          <Text style={styles.subtitle}>
            Scanning 12L+ listings and verifying RERA data — just for you.
          </Text>
        </Animated.View>

        {/* Live status card */}
        <Animated.View
          style={styles.statusCard}
          entering={FadeInDown.delay(1200).duration(500)}
        >
          {/* Summary pills inside card */}
          <View style={styles.pillsRow}>
            {summaryItems.map((item) => (
              <View key={item} style={styles.pill}>
                <Text style={styles.pillText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.cardDivider} />

          {/* Live counter header */}
          <View style={styles.counterRow}>
            <View style={styles.counterBlock}>
              <AnimatedCounter target={12847} delay={1600} />
              <Text style={styles.counterLabel}>listings scanned</Text>
            </View>
            <View style={styles.counterDivider} />
            <View style={styles.counterBlock}>
              <AnimatedCounter target={342} delay={1800} />
              <Text style={styles.counterLabel}>matches found</Text>
            </View>
            <View style={styles.counterDivider} />
            <View style={styles.counterBlock}>
              <AnimatedCounter target={5} delay={2000} suffix=" " />
              <Text style={styles.counterLabel}>shortlisted</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Status steps */}
          <StatusStep icon={Check} label="Profile locked & preferences saved" status="done" delay={1600} />
          <StatusStep icon={Search} label="Scanning listings across Pune" status="active" delay={1800} />
          <StatusStep icon={Shield} label="RERA verification & builder trust check" status="pending" delay={2000} />
          <StatusStep icon={BarChart3} label="Price history & deal analysis" status="pending" delay={2200} />

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, progressStyle]} />
            </View>
            <Text style={styles.progressLabel}>We'll show you top 5 matches under 1 hour</Text>
          </View>
        </Animated.View>

        {/* Bottom — notify + CTA compact */}
        <Animated.View
          style={styles.bottomSection}
          entering={FadeIn.delay(2400).duration(400)}
        >
          <View style={styles.notifyRow}>
            <Text style={styles.notifyTitle}>Notify via</Text>
            {notifyOptions.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.notifyChip, notifyVia === opt.key && styles.notifyChipActive]}
                onPress={() => {
                  haptics.selection();
                  setNotifyVia(opt.key);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.notifyChipText, notifyVia === opt.key && styles.notifyChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title="See your live dashboard →"
            onPress={() => router.push('/onboarding/dashboard')}
            variant="primaryWhite"
          />

          <View style={styles.alwaysOnBadge}>
            <View style={styles.alwaysOnDot} />
            <Text style={styles.alwaysOnText}>ALON stays on until you find your home</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1B3D',
  },
  topBar: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    zIndex: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.xxl,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  heroGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    // Warm amber-gold glow — "ALON is powering up"
    backgroundColor: '#E8A84C',
  },
  heroRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(232,168,76,0.25)',
  },

  // Title
  titleSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 26,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'DMSans-Regular',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Pills
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 0,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  pillText: {
    fontSize: 12,
    fontFamily: 'DMSans-Medium',
    color: 'rgba(255,255,255,0.6)',
  },

  // Status card
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 14,
    marginBottom: Spacing.lg,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  counterBlock: {
    flex: 1,
    alignItems: 'center',
  },
  counterText: {
    fontSize: 20,
    fontFamily: 'DMSans-Bold',
    color: '#FFFFFF',
  },
  counterLabel: {
    fontSize: 10,
    fontFamily: 'DMSans-Regular',
    color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
  },
  counterDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },

  // Steps
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  stepDotActive: {
    backgroundColor: Colors.blue500,
    borderColor: Colors.blue400,
  },
  stepDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  stepDotPending: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 13,
    fontFamily: 'DMSans-Regular',
    color: 'rgba(255,255,255,0.3)',
  },
  stepLabelDone: {
    color: 'rgba(255,255,255,0.6)',
  },
  stepLabelActive: {
    color: '#FFFFFF',
    fontFamily: 'DMSans-Medium',
  },

  // Scan line
  scanTrack: {
    width: 40,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scanDot: {
    position: 'absolute',
    width: 12,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.blue400,
  },

  // Progress
  progressSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.blue400,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },

  // Bottom
  bottomSection: {
    gap: Spacing.lg,
  },
  notifyTitle: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
    color: 'rgba(255,255,255,0.35)',
    marginRight: 8,
  },
  notifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  notifyChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  notifyChipActive: {
    borderColor: Colors.blue400,
    backgroundColor: 'rgba(41,82,216,0.2)',
  },
  notifyChipText: {
    fontSize: 12,
    fontFamily: 'DMSans-Medium',
    color: 'rgba(255,255,255,0.4)',
  },
  notifyChipTextActive: {
    color: Colors.blue300,
  },

  // Always on
  alwaysOnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  alwaysOnDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  alwaysOnText: {
    fontSize: 12,
    fontFamily: 'DMSans-Medium',
    color: 'rgba(255,255,255,0.4)',
  },
});
