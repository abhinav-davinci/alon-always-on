import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '../constants/theme';
import { PURPOSE_OPTIONS } from '../constants/locations';
import { useHaptics } from '../hooks/useHaptics';

interface PurposeGridProps {
  selected: string;
  onSelect: (purpose: string) => void;
}

export default function PurposeGrid({ selected, onSelect }: PurposeGridProps) {
  const haptics = useHaptics();

  return (
    <View style={styles.grid}>
      {PURPOSE_OPTIONS.map((option) => {
        const isSelected = selected === option.id;
        return (
          <TouchableOpacity
            key={option.id}
            style={[styles.cell, isSelected && styles.cellSelected]}
            onPress={() => {
              haptics.selection();
              onSelect(option.id);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{option.icon}</Text>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  cell: {
    width: '47%',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.gray50,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    alignItems: 'center',
  },
  cellSelected: {
    backgroundColor: Colors.blue50,
    borderColor: Colors.blue500,
  },
  icon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  label: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  labelSelected: {
    color: Colors.blue600,
  },
});
