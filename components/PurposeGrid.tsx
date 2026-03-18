import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, TrendingUp, Users, Briefcase } from 'lucide-react-native';
import { Colors, Spacing } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';

const PURPOSE_ITEMS = [
  { id: 'self', label: 'Live in it', icon: Home },
  { id: 'invest', label: 'Invest', icon: TrendingUp },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'work', label: 'Work hub', icon: Briefcase },
];

interface PurposeGridProps {
  selected: string;
  onSelect: (purpose: string) => void;
}

export default function PurposeGrid({ selected, onSelect }: PurposeGridProps) {
  const haptics = useHaptics();

  return (
    <View style={styles.grid}>
      {PURPOSE_ITEMS.map((option) => {
        const Icon = option.icon;
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
            <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
              <Icon
                size={18}
                color={isSelected ? Colors.blue500 : Colors.gray400}
                strokeWidth={1.8}
              />
            </View>
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
    gap: 10,
  },
  cell: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
  },
  cellSelected: {
    backgroundColor: Colors.blue50,
    borderColor: Colors.blue500,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: Colors.blue100,
  },
  label: {
    fontSize: 13,
    fontFamily: 'DMSans-Medium',
    color: Colors.textSecondary,
  },
  labelSelected: {
    color: Colors.blue600,
  },
});
