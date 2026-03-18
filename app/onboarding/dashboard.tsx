import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import PropertyCard from '../../components/PropertyCard';
import AlertCard from '../../components/AlertCard';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboarding';
import { formatBudget } from '../../constants/locations';

const DEMO_PROPERTIES = [
  {
    name: 'Godrej Hillside',
    location: 'Baner, Pune',
    price: '₹1.35 Cr',
    size: '3 BHK · 1,450 sq.ft',
    image: '',
    tags: ['RERA ✓', 'Premium'],
    isNew: true,
  },
  {
    name: 'Pride World City',
    location: 'Balewadi, Pune',
    price: '₹1.18 Cr',
    size: '3 BHK · 1,320 sq.ft',
    image: '',
    tags: ['RERA ✓', 'Ready'],
    isNew: true,
  },
  {
    name: 'Kolte Patil 24K',
    location: 'Wakad, Pune',
    price: '₹98 L',
    size: '2 BHK · 1,050 sq.ft',
    image: '',
    tags: ['RERA ✓'],
    isNew: false,
  },
];

function useCountAnimation(target: number, duration: number = 1500) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const frame = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [target]);

  return count;
}

export default function DashboardScreen() {
  const { locations, propertySize, budget } = useOnboardingStore();
  const checkedCount = useCountAnimation(12847);
  const newToday = useCountAnimation(23);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Blue gradient header */}
        <View style={styles.header}>
          <Animated.View entering={FadeIn.duration(500)}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <View style={styles.statusRow}>
              <View style={styles.greenDot} />
              <Text style={styles.statusText}>ALON is active</Text>
            </View>
          </Animated.View>

          {/* Active search card */}
          <Animated.View
            style={styles.searchCard}
            entering={FadeIn.delay(300).duration(400)}
          >
            <View style={styles.searchCardHeader}>
              <Text style={styles.searchCardTitle}>Active Search</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>live</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>
                  {checkedCount.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>listings checked</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{newToday}</Text>
                <Text style={styles.statLabel}>new today</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>6pm</Text>
                <Text style={styles.statLabel}>next report</Text>
              </View>
            </View>
            <Text style={styles.criteria}>
              {locations.join(', ')} · {propertySize.join(', ')} ·{' '}
              {formatBudget(budget.min)}–{formatBudget(budget.max)}
            </Text>
          </Animated.View>
        </View>

        {/* Top matches */}
        <Animated.View
          style={styles.section}
          entering={FadeIn.delay(600).duration(400)}
        >
          <Text style={styles.sectionTitle}>Top matches for you</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.propertiesScroll}
          >
            {DEMO_PROPERTIES.map((property) => (
              <PropertyCard key={property.name} {...property} />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ALON Alerts */}
        <Animated.View
          style={styles.section}
          entering={FadeIn.delay(800).duration(400)}
        >
          <Text style={styles.sectionTitle}>ALON Alerts</Text>
          <AlertCard
            icon="🏗"
            title="New site visit available"
            subtitle="Godrej Hillside · Sat 10am – 1pm"
            action="Schedule"
          />
          <AlertCard
            icon="📊"
            title="Market insight"
            subtitle="Baner prices up 3.2% this quarter"
            action="View"
          />
          <AlertCard
            icon="✏️"
            title="Refine your preferences?"
            subtitle="Update budget or add more locations"
            action="Update"
          />
        </Animated.View>

        {/* 8-step journey placeholder */}
        <Animated.View
          style={styles.journeyCard}
          entering={FadeIn.delay(1000).duration(400)}
        >
          <Text style={styles.journeyTitle}>Your Home Journey</Text>
          <Text style={styles.journeySubtitle}>
            8 stages from Search to Possession — ALON guides you through each
            one
          </Text>
          <View style={styles.journeySteps}>
            {['Search', 'Shortlist', 'Visit', 'Compare', 'Finance', 'Legal', 'Buy', 'Possess'].map(
              (step, i) => (
                <View
                  key={step}
                  style={[
                    styles.journeyStep,
                    i === 0 && styles.journeyStepActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.journeyStepText,
                      i === 0 && styles.journeyStepTextActive,
                    ]}
                  >
                    {step}
                  </Text>
                </View>
              )
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxxl,
  },
  header: {
    backgroundColor: Colors.blue800,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
  },
  greeting: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 28,
    color: Colors.white,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.green500,
  },
  statusText: {
    ...Typography.small,
    color: Colors.green500,
  },
  searchCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  searchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  searchCardTitle: {
    ...Typography.bodySemiBold,
    color: Colors.white,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,197,94,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green500,
  },
  liveText: {
    ...Typography.small,
    color: Colors.green500,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    ...Typography.heading2,
    color: Colors.white,
  },
  statLabel: {
    ...Typography.small,
    color: Colors.blue200,
    marginTop: 2,
  },
  criteria: {
    ...Typography.small,
    color: Colors.blue200,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: Spacing.xxl,
    marginTop: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  propertiesScroll: {
    paddingRight: Spacing.xxl,
  },
  journeyCard: {
    marginHorizontal: Spacing.xxl,
    marginTop: Spacing.xxl,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadows.md,
  },
  journeyTitle: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },
  journeySubtitle: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  journeySteps: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  journeyStep: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray100,
  },
  journeyStepActive: {
    backgroundColor: Colors.blue500,
  },
  journeyStepText: {
    ...Typography.smallMedium,
    color: Colors.textSecondary,
  },
  journeyStepTextActive: {
    color: Colors.white,
  },
});
