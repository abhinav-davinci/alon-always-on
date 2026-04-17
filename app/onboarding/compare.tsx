import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, LayoutDashboard, Heart, Share2 } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboarding';
import CompareTable from '../../components/CompareTable';
import AlonAvatar from '../../components/AlonAvatar';
import CompareShareSheet from '../../components/CompareShareSheet';
import { SkeletonCompareTable } from '../../components/skeleton';

export default function CompareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    comparePropertyIds,
    likedPropertyIds,
    budget,
    locations,
    propertySize,
    setActiveStage,
  } = useOnboardingStore();

  const preferences = { budget, locations, propertySize };
  const hasEnough = comparePropertyIds.length >= 2;
  const [isLoading, setIsLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (!hasEnough) { setIsLoading(false); return; }
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [hasEnough]);

  const goToDashboard = () => {
    setActiveStage('Compare');
    router.push('/onboarding/dashboard');
  };

  const goToShortlist = () => {
    router.push('/onboarding/shortlist');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={22} color={Colors.terra500} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Property Comparison</Text>
        {hasEnough && !isLoading ? (
          <TouchableOpacity style={styles.shareBtn} onPress={() => setShowShare(true)} activeOpacity={0.7}>
            <Share2 size={18} color={Colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {/* --- Content --- */}
      {hasEnough && isLoading ? (
        <SkeletonCompareTable columns={comparePropertyIds.length === 3 ? 3 : 2} />
      ) : hasEnough ? (
        <CompareTable propertyIds={comparePropertyIds} preferences={preferences} />
      ) : (
        <Animated.View entering={FadeIn.delay(200)} style={styles.emptyState}>
          <AlonAvatar size={56} showRings={false} showBlink variant="default" />

          {likedPropertyIds.length === 0 ? (
            <>
              <Text style={styles.emptyTitle}>No properties shortlisted yet</Text>
              <Text style={styles.emptyBody}>
                Start by browsing properties and tapping{' '}
                <Heart size={13} color={Colors.terra400} strokeWidth={2} fill={Colors.terra400} />{' '}
                on the ones you like. Once you have 2 or more, ALON will help you compare.
              </Text>
              <TouchableOpacity style={styles.nudgeCta} onPress={() => router.push('/onboarding/properties')} activeOpacity={0.8}>
                <Text style={styles.nudgeCtaText}>Browse Properties</Text>
              </TouchableOpacity>
            </>
          ) : likedPropertyIds.length === 1 ? (
            <>
              <Text style={styles.emptyTitle}>One more to go!</Text>
              <Text style={styles.emptyBody}>
                You've shortlisted 1 property. Add at least one more to your shortlist and ALON will build a detailed comparison for you.
              </Text>
              <TouchableOpacity style={styles.nudgeCta} onPress={goToShortlist} activeOpacity={0.8}>
                <Text style={styles.nudgeCtaText}>View Shortlist</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.emptyTitle}>Select properties to compare</Text>
              <Text style={styles.emptyBody}>
                You have {likedPropertyIds.length} shortlisted properties. Go back and select 2–3 for a side-by-side comparison.
              </Text>
              <TouchableOpacity style={styles.nudgeCta} onPress={goToShortlist} activeOpacity={0.8}>
                <Text style={styles.nudgeCtaText}>Select from Shortlist</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      )}

      {/* --- Bottom CTAs --- */}
      {hasEnough && (
        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}
        >
          <TouchableOpacity style={styles.bottomBtn} onPress={goToDashboard} activeOpacity={0.8}>
            <LayoutDashboard size={16} color={Colors.textSecondary} strokeWidth={1.8} />
            <Text style={styles.bottomBtnText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomBtn} onPress={goToShortlist} activeOpacity={0.8}>
            <Heart size={16} color={Colors.textSecondary} strokeWidth={1.8} />
            <Text style={styles.bottomBtnText}>Shortlist</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <CompareShareSheet
        visible={showShare}
        onClose={() => setShowShare(false)}
        propertyIds={comparePropertyIds}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.warm50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.warm50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
  },

  // --- Empty / nudge states ---
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  emptyTitle: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 22,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  emptyBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  nudgeCta: {
    backgroundColor: Colors.terra500,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: Radius.sm,
  },
  nudgeCtaText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 14,
    color: Colors.white,
  },

  // --- Bottom bar ---
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  bottomBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    backgroundColor: Colors.warm50,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bottomBtnText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
