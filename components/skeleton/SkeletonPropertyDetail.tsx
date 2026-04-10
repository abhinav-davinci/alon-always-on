import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import Skeleton, { SkeletonLine, SkeletonCircle } from './Skeleton';
import { Colors, Spacing } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SkeletonPropertyDetail() {
  return (
    <Animated.View exiting={FadeOut.duration(200)}>
      {/* Hero image */}
      <Skeleton width={SCREEN_WIDTH} height={280} borderRadius={0} />

      {/* Price + name section */}
      <View style={styles.headerSection}>
        <View style={styles.priceRow}>
          <SkeletonLine width={120} height={26} />
          <SkeletonLine width={80} height={12} style={{ marginTop: 10 }} />
        </View>
        <SkeletonLine width={'70%'} height={20} style={{ marginTop: 8 }} />
        <View style={styles.locationRow}>
          <SkeletonCircle size={13} />
          <SkeletonLine width={100} height={12} />
        </View>

        {/* Quick specs row */}
        <View style={styles.specsRow}>
          {[0, 1, 2].map((i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={styles.specDivider} />}
              <View style={styles.specItem}>
                <SkeletonLine width={50} height={14} />
                <SkeletonLine width={30} height={10} style={{ marginTop: 4 }} />
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* ALON Insight card */}
      <View style={styles.section}>
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <SkeletonCircle size={7} />
            <SkeletonLine width={80} height={12} />
          </View>
          <SkeletonLine width={'100%'} height={12} style={{ marginTop: 10 }} />
          <SkeletonLine width={'85%'} height={12} style={{ marginTop: 6 }} />
          <SkeletonLine width={'60%'} height={12} style={{ marginTop: 6 }} />
          <View style={styles.matchRow}>
            <SkeletonLine width={70} height={10} />
            <Skeleton width={'50%'} height={4} borderRadius={2} />
            <SkeletonLine width={28} height={10} />
          </View>
        </View>
      </View>

      {/* Details grid */}
      <View style={styles.section}>
        <SkeletonLine width={120} height={16} style={{ marginBottom: 12 }} />
        <View style={styles.detailsGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.detailCell}>
              <SkeletonCircle size={15} />
              <SkeletonLine width={'70%'} height={13} style={{ marginTop: 6 }} />
              <SkeletonLine width={'50%'} height={10} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Amenities */}
      <View style={styles.section}>
        <SkeletonLine width={80} height={16} style={{ marginBottom: 12 }} />
        <View style={styles.amenitiesRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.amenityItem}>
              <Skeleton width={44} height={44} borderRadius={12} />
              <SkeletonLine width={40} height={10} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Builder card */}
      <View style={styles.section}>
        <SkeletonLine width={60} height={16} style={{ marginBottom: 12 }} />
        <View style={styles.builderCard}>
          <View style={styles.builderTop}>
            <Skeleton width={40} height={40} borderRadius={12} />
            <View style={{ flex: 1, gap: 4 }}>
              <SkeletonLine width={120} height={14} />
              <SkeletonLine width={90} height={11} />
            </View>
            <Skeleton width={48} height={24} borderRadius={8} />
          </View>
          <SkeletonLine width={'80%'} height={11} style={{ marginTop: 12 }} />
          <SkeletonLine width={'65%'} height={11} style={{ marginTop: 6 }} />
        </View>
      </View>

      {/* Price history */}
      <View style={styles.section}>
        <SkeletonLine width={100} height={16} style={{ marginBottom: 12 }} />
        <View style={styles.priceHistoryCard}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.phRow, i > 0 && styles.phRowBorder]}>
              <SkeletonLine width={60} height={13} />
              <SkeletonLine width={70} height={14} />
              <Skeleton width={48} height={20} borderRadius={6} />
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warm100,
  },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  specsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.cream,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  specItem: { flex: 1, alignItems: 'center', gap: 2 },
  specDivider: { width: 1, backgroundColor: Colors.warm200, marginVertical: 2 },
  section: { paddingHorizontal: Spacing.xxl, marginTop: 20 },
  insightCard: {
    backgroundColor: Colors.navy800,
    borderRadius: 16,
    padding: 16,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detailCell: {
    width: '47%' as any,
    backgroundColor: Colors.cream,
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  amenityItem: { alignItems: 'center', width: 56 },
  builderCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warm200,
    padding: 14,
  },
  builderTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceHistoryCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warm200,
    overflow: 'hidden',
  },
  phRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  phRowBorder: { borderTopWidth: 1, borderTopColor: Colors.warm100 },
});
