import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import Skeleton, { SkeletonLine } from './Skeleton';
import { Colors, Spacing } from '../../constants/theme';

export default function SkeletonLoanPlanner() {
  return (
    <Animated.View exiting={FadeOut.duration(200)}>
      {/* Property selector */}
      <View style={styles.propertyScroll}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.propertyCard}>
            <Skeleton width={94} height={54} borderRadius={8} />
            <SkeletonLine width={'80%'} height={11} style={{ marginTop: 6 }} />
            <SkeletonLine width={'60%'} height={10} style={{ marginTop: 3 }} />
          </View>
        ))}
      </View>

      {/* CIBIL card */}
      <View style={styles.cibilCard}>
        <SkeletonLine width={120} height={13} style={{ marginBottom: 10 }} />
        <View style={styles.cibilScoreRow}>
          <SkeletonLine width={70} height={32} />
          <Skeleton width={80} height={24} borderRadius={100} />
        </View>
        {/* Rate row */}
        <Skeleton width={'100%'} height={36} borderRadius={8} style={{ marginTop: 10 }} />
        {/* Bracket bar */}
        <Skeleton width={'100%'} height={5} borderRadius={3} style={{ marginTop: 10 }} />
        <View style={styles.bracketLabels}>
          <SkeletonLine width={40} height={9} />
          <SkeletonLine width={40} height={9} />
          <SkeletonLine width={40} height={9} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.tab}>
            <SkeletonLine width={50} height={13} />
          </View>
        ))}
      </View>

      {/* EMI result box */}
      <View style={styles.emiBox}>
        <SkeletonLine width={100} height={10} />
        <SkeletonLine width={150} height={26} style={{ marginTop: 6 }} />
        <SkeletonLine width={120} height={10} style={{ marginTop: 4 }} />
      </View>

      {/* Summary row */}
      <View style={styles.summaryRow}>
        {[0, 1, 2].map((i) => (
          <React.Fragment key={i}>
            {i > 0 && <View style={styles.summaryDivider} />}
            <View style={styles.summaryItem}>
              <SkeletonLine width={50} height={10} />
              <SkeletonLine width={60} height={13} style={{ marginTop: 4 }} />
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Slider placeholders */}
      <View style={styles.sliderSection}>
        <View style={styles.sliderRow}>
          <SkeletonLine width={80} height={12} />
          <SkeletonLine width={50} height={12} />
        </View>
        <Skeleton width={'100%'} height={6} borderRadius={3} style={{ marginTop: 8 }} />
      </View>
      <View style={styles.sliderSection}>
        <View style={styles.sliderRow}>
          <SkeletonLine width={90} height={12} />
          <SkeletonLine width={40} height={12} />
        </View>
        <Skeleton width={'100%'} height={6} borderRadius={3} style={{ marginTop: 8 }} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  propertyScroll: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xxl,
    gap: 10,
    paddingBottom: 4,
    marginTop: 12,
  },
  propertyCard: {
    width: 110,
    borderRadius: 14,
    padding: 8,
    backgroundColor: Colors.warm50,
    borderWidth: 1.5,
    borderColor: Colors.warm100,
    alignItems: 'center',
  },
  cibilCard: {
    marginHorizontal: Spacing.xxl,
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.cream,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.warm200,
  },
  cibilScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  bracketLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xxl,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warm100,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  emiBox: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: Colors.navy800,
    borderRadius: 14,
    marginHorizontal: Spacing.xxl,
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: Colors.cream,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: Spacing.xxl,
    marginTop: 12,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 28, backgroundColor: Colors.warm200 },
  sliderSection: {
    marginHorizontal: Spacing.xxl,
    marginTop: 16,
  },
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
