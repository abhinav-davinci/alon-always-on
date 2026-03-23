import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';

interface PillSelectorProps {
  options: string[];
  selected: string[];
  onSelect: (selected: string[]) => void;
  multiSelect?: boolean;
  scrollable?: boolean;
}

export default function PillSelector({
  options,
  selected,
  onSelect,
  multiSelect = false,
  scrollable = false,
}: PillSelectorProps) {
  const haptics = useHaptics();

  const handleSelect = (option: string) => {
    haptics.selection();
    if (multiSelect) {
      if (selected.includes(option)) {
        onSelect(selected.filter((s) => s !== option));
      } else {
        onSelect([...selected, option]);
      }
    } else {
      onSelect([option]);
    }
  };

  const pills = options.map((option) => {
    const isSelected = selected.includes(option);
    return (
      <TouchableOpacity
        key={option}
        style={[styles.pill, isSelected && styles.pillSelected]}
        onPress={() => handleSelect(option)}
        activeOpacity={0.7}
      >
        <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
          {option}
        </Text>
      </TouchableOpacity>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {pills}
      </ScrollView>
    );
  }

  return <View style={styles.container}>{pills}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  pill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.cream,
    borderWidth: 1.5,
    borderColor: Colors.warm200,
  },
  pillSelected: {
    backgroundColor: Colors.terra50,
    borderColor: Colors.terra500,
  },
  pillText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  pillTextSelected: {
    color: Colors.terra600,
  },
});
