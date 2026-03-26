import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import AlonAvatar from './AlonAvatar';
import { Colors, Spacing } from '../constants/theme';
import { useOnboardingStore } from '../store/onboarding';

export default function ChatFullScreenBar() {
  const { setChatExpanded } = useOnboardingStore();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <AlonAvatar size={24} showRings={false} showBlink={false} variant="light" />
        <View>
          <Text style={styles.title}>ALON</Text>
          <Text style={styles.subtitle}>Always on</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.collapseBtn}
        onPress={() => setChatExpanded(false)}
        activeOpacity={0.7}
      >
        <ChevronDown size={18} color="rgba(255,255,255,0.7)" strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.navy800,
    paddingHorizontal: Spacing.xxl,
    paddingTop: 8,
    paddingBottom: 12,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 15, fontFamily: 'DMSans-SemiBold', color: '#fff' },
  subtitle: { fontSize: 10, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.4)' },
  collapseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
});
