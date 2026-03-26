import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Colors, Spacing } from '../constants/theme';
import { STAGES } from '../constants/stages';
import { useOnboardingStore } from '../store/onboarding';
import { SHORTLIST_PROPERTIES } from '../constants/properties';
import { useHaptics } from '../hooks/useHaptics';

export default function StageNavigator() {
  const haptics = useHaptics();
  const { activeStage, setActiveStage, likedPropertyIds, scheduledVisits } = useOnboardingStore();
  const scrollRef = useRef<ScrollView>(null);

  // Badge counts per stage
  const getBadge = (label: string): number | null => {
    if (label === 'Search') return SHORTLIST_PROPERTIES.length;
    if (label === 'Shortlist') return likedPropertyIds.length || null;
    if (label === 'Site Visits') return scheduledVisits.length || null;
    return null;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {STAGES.map((stage) => {
          const isActive = activeStage === stage.label;
          const Icon = stage.icon;
          const badge = getBadge(stage.label);

          return (
            <Pressable
              key={stage.label}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => { haptics.selection(); setActiveStage(stage.label); }}
            >
              <Icon
                size={12}
                color={isActive ? '#fff' : Colors.textTertiary}
                strokeWidth={2}
              />
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {stage.label}
              </Text>
              {badge != null && badge > 0 && (
                <View style={[styles.badge, isActive && styles.badgeActive]}>
                  <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
                    {badge}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warm100,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: 8,
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.warm200,
  },
  pillActive: {
    backgroundColor: Colors.terra500,
    borderColor: Colors.terra500,
  },
  pillText: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: '#fff',
    fontFamily: 'DMSans-SemiBold',
  },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.warm200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  badgeText: {
    fontSize: 9,
    fontFamily: 'DMSans-Bold',
    color: Colors.textSecondary,
  },
  badgeTextActive: {
    color: '#fff',
  },
});
