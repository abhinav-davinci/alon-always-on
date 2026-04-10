import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import Skeleton, { SkeletonLine } from './Skeleton';
import { Colors, Spacing } from '../../constants/theme';

interface Props {
  columns?: 2 | 3;
}

export default function SkeletonCompareTable({ columns = 2 }: Props) {
  const colWidth = columns === 2 ? '48%' : '31%';

  return (
    <Animated.View exiting={FadeOut.duration(200)}>
      {/* Property header columns */}
      <View style={styles.headerColumns}>
        {Array.from({ length: columns }).map((_, i) => (
          <View key={i} style={[styles.headerCol, { width: colWidth as any }]}>
            <Skeleton width={'100%'} height={56} borderRadius={8} />
            <SkeletonLine width={'80%'} height={12} style={{ marginTop: 8 }} />
            <SkeletonLine width={'60%'} height={10} style={{ marginTop: 4 }} />
            <SkeletonLine width={'70%'} height={14} style={{ marginTop: 6 }} />
            <Skeleton width={60} height={22} borderRadius={100} style={{ marginTop: 8 }} />
          </View>
        ))}
      </View>

      {/* Comparison groups */}
      {['Basics', 'Financial', 'Trust Score'].map((group) => (
        <View key={group}>
          {/* Group header */}
          <View style={styles.groupHeader}>
            <SkeletonLine width={80} height={12} />
          </View>

          {/* Data rows */}
          {[0, 1, 2, 3].map((row) => (
            <View
              key={row}
              style={[styles.dataRow, row % 2 === 1 && styles.dataRowAlt]}
            >
              <SkeletonLine width={90} height={11} style={{ marginBottom: 6 }} />
              <View style={styles.rowValues}>
                {Array.from({ length: columns }).map((_, c) => (
                  <View key={c} style={[styles.cell, { width: colWidth as any }]}>
                    <SkeletonLine width={'60%'} height={13} />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: 8,
  },
  headerCol: {
    alignItems: 'center',
    backgroundColor: Colors.warm50,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    backgroundColor: Colors.cream,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  dataRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  dataRowAlt: {
    backgroundColor: 'rgba(245,240,232,0.3)',
  },
  rowValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  cell: {
    alignItems: 'center',
  },
});
