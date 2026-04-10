import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import Skeleton, { SkeletonLine, SkeletonCircle } from './Skeleton';
import { Colors } from '../../constants/theme';

/** Skeleton for StagePinnedContent — adapts to the active stage */
export default function SkeletonStagePinned({ stage }: { stage: string }) {
  // Shortlist: mini card scroll
  if (stage === 'Shortlist') {
    return (
      <Animated.View style={styles.wrap} exiting={FadeOut.duration(200)}>
        <View style={styles.miniCardScroll}>
          {[0, 1].map((i) => (
            <View key={i} style={styles.miniCard}>
              <Skeleton width={44} height={44} borderRadius={0} />
              <View style={styles.miniCardInfo}>
                <SkeletonLine width={'80%'} height={12} />
                <SkeletonLine width={'50%'} height={11} style={{ marginTop: 3 }} />
              </View>
            </View>
          ))}
        </View>
      </Animated.View>
    );
  }

  // Site Visits: visit card
  if (stage === 'Site Visits') {
    return (
      <Animated.View style={styles.wrap} exiting={FadeOut.duration(200)}>
        <View style={styles.visitCard}>
          <Skeleton width={32} height={32} borderRadius={10} />
          <View style={{ flex: 1, gap: 4 }}>
            <SkeletonLine width={'60%'} height={13} />
            <SkeletonLine width={'40%'} height={11} />
          </View>
        </View>
      </Animated.View>
    );
  }

  // Compare: intro card + CTA
  if (stage === 'Compare') {
    return (
      <Animated.View style={styles.wrap} exiting={FadeOut.duration(200)}>
        <View style={styles.introCard}>
          <SkeletonCircle size={16} />
          <View style={{ flex: 1, gap: 4 }}>
            <SkeletonLine width={'90%'} height={12} />
            <SkeletonLine width={'60%'} height={12} />
          </View>
        </View>
        <Skeleton width={'100%'} height={34} borderRadius={8} style={{ marginTop: 8 }} />
      </Animated.View>
    );
  }

  // Finance: CIBIL info card
  if (stage === 'Finance') {
    return (
      <Animated.View style={styles.wrap} exiting={FadeOut.duration(200)}>
        <View style={styles.introCard}>
          <SkeletonCircle size={16} />
          <View style={{ flex: 1, gap: 4 }}>
            <SkeletonLine width={'85%'} height={12} />
            <SkeletonLine width={'55%'} height={12} />
          </View>
        </View>
      </Animated.View>
    );
  }

  // Default: generic intro card
  return (
    <Animated.View style={styles.wrap} exiting={FadeOut.duration(200)}>
      <View style={styles.introCard}>
        <SkeletonCircle size={16} />
        <View style={{ flex: 1, gap: 4 }}>
          <SkeletonLine width={'90%'} height={12} />
          <SkeletonLine width={'70%'} height={12} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  miniCardScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  miniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.warm200,
    borderRadius: 12,
    paddingRight: 10,
    width: 210,
    overflow: 'hidden',
  },
  miniCardInfo: { flex: 1, paddingVertical: 8 },
  visitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.terra50,
    borderWidth: 1,
    borderColor: Colors.terra200,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.cream,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
