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
import { ChevronLeft, Check, Shield, Search, BarChart3, Bell, MessageCircle, Mail } from 'lucide-react-native';
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
  const { locations, propertySize, budget, purpose, propertyType, notifyVia, toggleNotifyVia, userName } =
    useOnboardingStore();

  // Hero animation values
  const heroScale = useSharedValue(0);
  const heroOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(15);
  const subtitleOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  // 3 radial signal rings — staggered outward pulse
  const sig1Scale = useSharedValue(0.5);
  const sig1Opacity = useSharedValue(0);
  const sig2Scale = useSharedValue(0.5);
  const sig2Opacity = useSharedValue(0);
  const sig3Scale = useSharedValue(0.5);
  const sig3Opacity = useSharedValue(0);

  useEffect(() => {
    // 1. Avatar pops in
    heroOpacity.value = withDelay(200, withTiming(1, { duration: 200 }));
    heroScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 120 }));

    // 2. Signal rings — sine-wave modulated pulse
    // Each ring breathes outward with sinusoidal easing:
    // slow start → smooth expansion → gentle fade
    // Like ripples in still water, not a radar ping
    const CYCLE = 3500; // 3.5s per ring — deliberate, premium
    const STAGGER = 1100; // generous gap between rings

    const signalAnim = (delay: number) => ({
      scale: withDelay(
        800 + delay,
        withRepeat(
          withSequence(
            withTiming(0.6, { duration: 0 }),
            // Sine easing: slow start, smooth middle, soft end
            withTiming(1.35, { duration: CYCLE, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          false
        )
      ),
      opacity: withDelay(
        800 + delay,
        withRepeat(
          withSequence(
            withTiming(0, { duration: 0 }),
            // Fade in during first 30% of cycle
            withTiming(0.45, { duration: CYCLE * 0.3, easing: Easing.out(Easing.sin) }),
            // Hold briefly
            withTiming(0.35, { duration: CYCLE * 0.15, easing: Easing.inOut(Easing.sin) }),
            // Long gentle fade out — the premium part
            withTiming(0, { duration: CYCLE * 0.55, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          false
        )
      ),
    });

    const s1 = signalAnim(0);
    sig1Scale.value = s1.scale;
    sig1Opacity.value = s1.opacity;

    const s2 = signalAnim(STAGGER);
    sig2Scale.value = s2.scale;
    sig2Opacity.value = s2.opacity;

    const s3 = signalAnim(STAGGER * 2);
    sig3Scale.value = s3.scale;
    sig3Opacity.value = s3.opacity;

    // 3. Title fades up
    titleOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    titleY.value = withDelay(700, withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }));

    // 4. Subtitle
    subtitleOpacity.value = withDelay(1000, withTiming(1, { duration: 400 }));

    // 5. Progress bar fills
    progressWidth.value = withDelay(1800, withTiming(72, { duration: 2500, easing: Easing.out(Easing.cubic) }));

    setTimeout(() => haptics.success(), 500);
  }, []);

  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
    opacity: heroOpacity.value,
  }));

  const sig1Style = useAnimatedStyle(() => ({
    transform: [{ scale: sig1Scale.value }],
    opacity: sig1Opacity.value,
  }));
  const sig2Style = useAnimatedStyle(() => ({
    transform: [{ scale: sig2Scale.value }],
    opacity: sig2Opacity.value,
  }));
  const sig3Style = useAnimatedStyle(() => ({
    transform: [{ scale: sig3Scale.value }],
    opacity: sig3Opacity.value,
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

  const summaryItems = [
    locations.length > 0 ? locations.join(', ') : null,
    propertyType || null,
    propertySize.length > 0 ? propertySize.join(', ') : null,
    `${formatBudget(budget.min)} – ${formatBudget(budget.max)}`,
    purpose || null,
  ].filter(Boolean) as string[];

  const notifyOptions: Array<{ key: string; label: string; icon: typeof Bell }> = [
    { key: 'push', label: 'Push', icon: Bell },
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { key: 'email', label: 'Email', icon: Mail },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.textOnDarkSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — ALON eye with radial signal rings */}
        <View style={styles.heroSection}>
          <Animated.View style={[styles.signalRing, styles.signalRing1, sig1Style]} />
          <Animated.View style={[styles.signalRing, styles.signalRing2, sig2Style]} />
          <Animated.View style={[styles.signalRing, styles.signalRing3, sig3Style]} />
          <Animated.View style={heroStyle}>
            <AlonAvatar size={44} showRings={false} showBlink variant="light" />
          </Animated.View>
        </View>

        {/* Title */}
        <Animated.View style={[styles.titleSection, titleStyle]}>
          <Text style={styles.title}>{userName ? `${userName.split(' ')[0]}, ALON is on it.` : 'ALON is on it.'}</Text>
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
            {notifyOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = notifyVia.includes(opt.key);
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.notifyChip, isActive && styles.notifyChipActive]}
                  onPress={() => {
                    haptics.selection();
                    toggleNotifyVia(opt.key);
                  }}
                  activeOpacity={0.7}
                >
                  <Icon
                    size={13}
                    color={isActive ? Colors.terra300 : Colors.textOnDarkTertiary}
                    strokeWidth={1.8}
                  />
                  <Text style={[styles.notifyChipText, isActive && styles.notifyChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
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

// Canvas: DARK (Canvas.activation) — navy800, same as splash/goal/intent.
// ALON is actively scanning/verifying; the user is watching ALON perform.
// All surfaces use the *OnDark tokens so the elevation ladder stays
// consistent with the rest of the dark canvases.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy800,
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
    backgroundColor: Colors.surfaceOnDark2,
    borderWidth: 1,
    borderColor: Colors.borderOnDarkStrong,
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
    marginTop: 16,
    marginBottom: Spacing.md,
    overflow: 'visible',
  },
  signalRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: Colors.activationGlow,
  },
  signalRing1: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  signalRing2: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
  },
  signalRing3: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 0.5,
  },

  // Title
  titleSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 26,
    color: Colors.textOnDarkPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'DMSans-Regular',
    color: Colors.textOnDarkSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Pills
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.surfaceOnDark2,
    borderWidth: 1,
    borderColor: Colors.borderOnDarkStrong,
  },
  pillText: {
    fontSize: 12,
    fontFamily: 'DMSans-Medium',
    color: Colors.textOnDarkSecondary,
  },

  // Status card
  statusCard: {
    backgroundColor: Colors.surfaceOnDark1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderOnDark,
    padding: 16,
    marginBottom: Spacing.xl,
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
    color: Colors.textOnDarkPrimary,
  },
  counterLabel: {
    fontSize: 10,
    fontFamily: 'DMSans-Regular',
    color: Colors.textOnDarkTertiary,
    marginTop: 2,
  },
  counterDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderOnDark,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderOnDark,
    marginVertical: 12,
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
    backgroundColor: Colors.surfaceOnDark2,
    borderWidth: 1,
    borderColor: Colors.borderOnDarkStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: Colors.green500,
    borderColor: Colors.green500,
  },
  stepDotActive: {
    backgroundColor: Colors.terra500,
    borderColor: Colors.terra400,
  },
  stepDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  stepDotPending: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textOnDarkQuaternary,
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 13,
    fontFamily: 'DMSans-Regular',
    color: Colors.textOnDarkQuaternary,
  },
  stepLabelDone: {
    color: Colors.textOnDarkSecondary,
  },
  stepLabelActive: {
    color: Colors.textOnDarkPrimary,
    fontFamily: 'DMSans-Medium',
  },

  // Scan line
  scanTrack: {
    width: 40,
    height: 3,
    backgroundColor: Colors.surfaceOnDark2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  scanDot: {
    position: 'absolute',
    width: 12,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.terra400,
  },

  // Progress
  progressSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderOnDark,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.surfaceOnDark2,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.terra400,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: Colors.textOnDarkTertiary,
    textAlign: 'center',
  },

  // Bottom
  bottomSection: {
    gap: Spacing.md,
  },
  notifyTitle: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
    color: Colors.textOnDarkTertiary,
    marginRight: 8,
  },
  notifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  notifyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderOnDarkStrong,
    backgroundColor: Colors.surfaceOnDark1,
  },
  notifyChipActive: {
    borderColor: Colors.terra400,
    backgroundColor: 'rgba(217,95,43,0.2)', // terra500 @ 20% — active glow
  },
  notifyChipText: {
    fontSize: 12,
    fontFamily: 'DMSans-Medium',
    color: Colors.textOnDarkTertiary,
  },
  notifyChipTextActive: {
    color: Colors.terra300,
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
    backgroundColor: Colors.green500,
  },
  alwaysOnText: {
    fontSize: 12,
    fontFamily: 'DMSans-Medium',
    color: Colors.textOnDarkTertiary,
  },
});
