import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { X, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { SHORTLIST_PROPERTIES } from '../constants/properties';
import { useOnboardingStore } from '../store/onboarding';

interface CompareSelectionBarProps {
  selectedIds: string[];
  onRemove: (id: string) => void;
  onCompare: () => void;
}

export default function CompareSelectionBar({
  selectedIds,
  onRemove,
  onCompare,
}: CompareSelectionBarProps) {
  if (selectedIds.length === 0) return null;

  const canCompare = selectedIds.length >= 2;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(15).stiffness(150)}
      exiting={FadeOutDown.duration(200)}
      style={styles.container}
    >
      <View style={styles.chipsRow}>
        {selectedIds.map((id) => {
          const prop = SHORTLIST_PROPERTIES.find((p) => p.id === id);
          const userProp = !prop ? useOnboardingStore.getState().userProperties.find((p) => p.id === id) : null;
          const displayName = prop?.name || userProp?.name || id;
          return (
            <View key={id} style={styles.chip}>
              <Text style={styles.chipText} numberOfLines={1}>
                {displayName}
              </Text>
              <TouchableOpacity onPress={() => onRemove(id)} hitSlop={8}>
                <X size={12} color={Colors.warm500} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.countText}>
          {selectedIds.length} of 3 selected
        </Text>
        <TouchableOpacity
          style={[styles.compareBtn, !canCompare && styles.compareBtnDisabled]}
          onPress={onCompare}
          disabled={!canCompare}
          activeOpacity={0.8}
        >
          <Text style={[styles.compareBtnText, !canCompare && styles.compareBtnTextDisabled]}>
            Compare Now
          </Text>
          <ArrowRight size={14} color={canCompare ? Colors.white : Colors.warm300} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {!canCompare && (
        <Text style={styles.hint}>Select at least 2 properties to compare</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    shadowColor: Colors.navy900,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.warm50,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: '45%',
  },
  chipText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: Colors.textTertiary,
  },
  compareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.terra500,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  compareBtnDisabled: {
    backgroundColor: Colors.warm100,
  },
  compareBtnText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 14,
    color: Colors.white,
  },
  compareBtnTextDisabled: {
    color: Colors.warm300,
  },
  hint: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
