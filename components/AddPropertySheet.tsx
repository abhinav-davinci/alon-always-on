import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Mic, PenLine, Camera, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import BottomSheet from './BottomSheet';
import { Colors, Spacing } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';

interface AddPropertySheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: 'voice' | 'manual' | 'screenshot') => void;
}

const OPTIONS = [
  {
    key: 'voice' as const,
    icon: Mic,
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
    title: 'Add by Voice',
    subtitle: 'Describe the property — ALON fills in the rest',
    comingSoon: false,
  },
  {
    key: 'manual' as const,
    icon: PenLine,
    iconBg: Colors.terra50,
    iconColor: Colors.terra500,
    title: 'Add Manually',
    subtitle: 'Enter building name, BHK, price & more',
    comingSoon: false,
  },
  {
    key: 'screenshot' as const,
    icon: Camera,
    iconBg: '#DBEAFE',
    iconColor: '#2563EB',
    title: 'Share a Screenshot',
    subtitle: 'Upload a listing screenshot — ALON extracts the details',
    comingSoon: false,
  },
];

export default function AddPropertySheet({ visible, onClose, onSelect }: AddPropertySheetProps) {
  const haptics = useHaptics();

  return (
    <BottomSheet visible={visible} title="Add a property" onClose={onClose}>
      <Text style={styles.subtitle}>
        Already found something you like? Add it to your list and let ALON verify it.
      </Text>
      {OPTIONS.map((opt, i) => (
        <Animated.View key={opt.key} entering={FadeInUp.delay(i * 80).duration(250)}>
          <TouchableOpacity
            style={styles.optionRow}
            activeOpacity={0.7}
            onPress={() => {
              haptics.light();
              if (!opt.comingSoon) onSelect(opt.key);
            }}
          >
            <View style={[styles.optionIcon, { backgroundColor: opt.iconBg }]}>
              <opt.icon size={20} color={opt.iconColor} strokeWidth={1.8} />
            </View>
            <View style={styles.optionText}>
              <View style={styles.optionTitleRow}>
                <Text style={styles.optionTitle}>{opt.title}</Text>
                {opt.comingSoon && (
                  <View style={styles.soonBadge}>
                    <Text style={styles.soonBadgeText}>SOON</Text>
                  </View>
                )}
              </View>
              <Text style={styles.optionSub}>{opt.subtitle}</Text>
            </View>
            <ChevronRight size={16} color={Colors.warm300} strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>
      ))}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 13,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
    lineHeight: 19,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warm100,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
  optionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  optionTitle: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  optionSub: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, marginTop: 2, lineHeight: 15 },
  soonBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  soonBadgeText: { fontSize: 8, fontFamily: 'DMSans-Bold', color: '#7C3AED', letterSpacing: 0.4 },
});
