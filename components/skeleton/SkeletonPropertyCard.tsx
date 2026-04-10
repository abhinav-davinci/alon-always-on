import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import Skeleton, { SkeletonLine } from './Skeleton';
import { Colors, Spacing } from '../../constants/theme';

/** Single property card skeleton — matches shortlist card layout */
function SkeletonPropertyCardItem() {
  return (
    <View style={styles.card}>
      {/* Image */}
      <Skeleton width={90} height={120} borderRadius={0} style={styles.cardImage} />
      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.cardTopRow}>
          <SkeletonLine width={'75%'} height={14} />
          <Skeleton width={28} height={28} borderRadius={14} />
        </View>
        <SkeletonLine width={'50%'} height={11} style={{ marginTop: 4 }} />
        <View style={styles.cardPriceRow}>
          <SkeletonLine width={80} height={14} />
          <SkeletonLine width={60} height={11} />
        </View>
        <View style={styles.cardTags}>
          <Skeleton width={48} height={18} borderRadius={4} />
          <Skeleton width={56} height={18} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

/** Full shortlist skeleton — header tabs + card list */
export default function SkeletonPropertyList({ count = 5 }: { count?: number }) {
  return (
    <Animated.View exiting={FadeOut.duration(200)}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {[80, 90, 60].map((w, i) => (
          <Skeleton key={i} width={w} height={32} borderRadius={20} />
        ))}
      </View>

      {/* Timestamp */}
      <View style={styles.timestamp}>
        <SkeletonLine width={160} height={11} />
      </View>

      {/* Cards */}
      <View style={styles.cardList}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonPropertyCardItem key={i} />
        ))}
      </View>
    </Animated.View>
  );
}

/** Export single card for reuse */
export { SkeletonPropertyCardItem };

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xxl,
    gap: 6,
    paddingVertical: 12,
  },
  timestamp: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: 4,
    paddingBottom: 8,
  },
  cardList: {
    paddingHorizontal: Spacing.xxl,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.warm200,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardImage: {
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  cardInfo: {
    flex: 1,
    padding: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cardTags: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
});
