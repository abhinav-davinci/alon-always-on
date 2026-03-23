import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radius, Shadows } from '../constants/theme';

interface StatusItem {
  icon: string;
  label: string;
  status: 'done' | 'active' | 'pending';
}

const statusItems: StatusItem[] = [
  { icon: '✅', label: 'Profile locked', status: 'done' },
  { icon: '🔵', label: 'Scanning listings · 12L+ checked', status: 'active' },
  { icon: '⏳', label: 'RERA & builder trust check', status: 'pending' },
  { icon: '⏳', label: 'Transaction history analysis', status: 'pending' },
];

export default function WorkingCard() {
  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(0.72, {
      duration: 2500,
      easing: Easing.out(Easing.cubic),
    });
    pulse.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      )
    );
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>ALON is working on it</Text>

      {statusItems.map((item, index) => (
        <View key={index} style={styles.statusRow}>
          <Text style={styles.statusIcon}>{item.icon}</Text>
          <Text
            style={[
              styles.statusLabel,
              item.status === 'done' && styles.statusDone,
              item.status === 'active' && styles.statusActive,
              item.status === 'pending' && styles.statusPending,
            ]}
          >
            {item.label}
          </Text>
          {item.status === 'done' && (
            <View style={styles.doneBadge}>
              <Text style={styles.doneBadgeText}>done</Text>
            </View>
          )}
          {item.status === 'active' && (
            <Animated.View style={[styles.liveBadge, pulseStyle]}>
              <Text style={styles.liveBadgeText}>live</Text>
            </Animated.View>
          )}
        </View>
      ))}

      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
        <Text style={styles.progressText}>~72%</Text>
      </View>

      <Text style={styles.eta}>Top 5 curated matches in under 2 hrs</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadows.md,
  },
  title: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: Spacing.md,
    width: 24,
  },
  statusLabel: {
    ...Typography.caption,
    flex: 1,
  },
  statusDone: {
    color: Colors.green500,
  },
  statusActive: {
    color: Colors.terra600,
  },
  statusPending: {
    color: Colors.textTertiary,
  },
  doneBadge: {
    backgroundColor: Colors.green100,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  doneBadgeText: {
    ...Typography.small,
    color: Colors.green500,
  },
  liveBadge: {
    backgroundColor: Colors.terra100,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  liveBadgeText: {
    ...Typography.small,
    color: Colors.terra600,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  progressBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.gray100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.terra500,
    borderRadius: 3,
  },
  progressText: {
    ...Typography.smallMedium,
    color: Colors.terra600,
  },
  eta: {
    ...Typography.small,
    color: Colors.textTertiary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
