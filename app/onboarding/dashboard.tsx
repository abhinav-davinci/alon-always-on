import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Settings, Plus, Bell } from 'lucide-react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import AlonAvatar from '../../components/AlonAvatar';
import AddPropertySheet from '../../components/AddPropertySheet';
import JourneyAccordion from '../../components/JourneyAccordion';
import ChatFullScreenBar from '../../components/ChatFullScreenBar';
import StageNavigator from '../../components/StageNavigator';
import AlonChat from '../../components/AlonChat';
import { Colors, Spacing } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboarding';
import { formatBudget } from '../../constants/locations';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locations, propertySize, budget, propertyType, userName, chatExpanded, activeStage } = useOnboardingStore();
  const [showAddSheet, setShowAddSheet] = useState(false);

  // Expand/collapse animation
  const expandProgress = useSharedValue(0);

  React.useEffect(() => {
    expandProgress.value = withTiming(chatExpanded ? 1 : 0, {
      duration: 350,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [chatExpanded]);

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expandProgress.value, [0, 0.3], [1, 0]),
    maxHeight: interpolate(expandProgress.value, [0, 0.8, 1], [300, 40, 0]),
    overflow: 'hidden' as const,
  }));

  const journeyAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expandProgress.value, [0, 0.2], [1, 0]),
    maxHeight: interpolate(expandProgress.value, [0, 0.6, 1], [400, 40, 0]),
    overflow: 'hidden' as const,
  }));

  const fullScreenBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expandProgress.value, [0.3, 0.7], [0, 1]),
    maxHeight: interpolate(expandProgress.value, [0, 0.3, 1], [0, 0, 80]),
    overflow: 'hidden' as const,
  }));

  const stageNavStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expandProgress.value, [0.4, 0.8], [0, 1]),
    maxHeight: interpolate(expandProgress.value, [0, 0.4, 1], [0, 0, 56]),
    overflow: 'hidden' as const,
  }));

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const preferenceSummary = [
    locations.join(', '),
    propertyType,
    propertySize.join(', '),
    `${formatBudget(budget.min)}–${formatBudget(budget.max)}`,
  ].filter(Boolean).join(' · ');

  return (
    <View style={styles.container}>
      {/* Safe area spacer — always present */}
      <View style={{ height: insets.top, backgroundColor: Colors.navy800 }} />

      {/* ══ Full-screen bar (visible when expanded) ══ */}
      <Animated.View style={fullScreenBarStyle}>
        <ChatFullScreenBar />
      </Animated.View>

      {/* ══ Stage Navigator (visible when expanded) ══ */}
      <Animated.View style={stageNavStyle}>
        <StageNavigator />
      </Animated.View>

      {/* ══ ZONE 1: Compact Header (hides when expanded) ══ */}
      <Animated.View style={[headerAnimStyle]}>
        <View style={[styles.header, { paddingTop: 12 }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>
                {getGreeting()}{userName ? `, ${userName.split(' ')[0]}` : ''}
              </Text>
              <View style={styles.statusRow}>
                <View style={styles.activeDot} />
                <Text style={styles.statusLabel}>ALON is active</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
                <Bell size={16} color="rgba(255,255,255,0.6)" strokeWidth={1.8} />
              </TouchableOpacity>
              <AlonAvatar size={30} showRings={false} showBlink variant="light" />
            </View>
          </View>

          {/* Preferences pill */}
          <View style={styles.prefRow}>
            <Text style={styles.prefText} numberOfLines={1}>{preferenceSummary}</Text>
            <TouchableOpacity style={styles.prefEdit} activeOpacity={0.7} onPress={() => router.push('/onboarding/tweak')}>
              <Settings size={12} color="rgba(255,255,255,0.5)" strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          {/* Add property link */}
          <TouchableOpacity
            style={styles.addPropertyRow}
            activeOpacity={0.7}
            onPress={() => setShowAddSheet(true)}
          >
            <Text style={styles.addPropertyLabel}>Got a shortlisted property?</Text>
            <View style={styles.addNowPill}>
              <Plus size={10} color="#fff" strokeWidth={2.5} />
              <Text style={styles.addNowText}>Add now</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ══ ZONE 2: Journey Accordion (hides when expanded) ══ */}
      <Animated.View style={journeyAnimStyle}>
        <View style={styles.journeyDivider} />
        <JourneyAccordion onStageChange={(s) => useOnboardingStore.getState().setActiveStage(s)} />
      </Animated.View>

      {/* ══ ZONE 3: ALON Chat ══ */}
      {!chatExpanded && <View style={styles.chatDivider} />}
      <KeyboardAvoidingView
        style={styles.chatZone}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={chatExpanded ? 0 : 0}
      >
        <AlonChat stage={activeStage} insetBottom={insets.bottom} />
      </KeyboardAvoidingView>

      <AddPropertySheet
        visible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onSelect={(option) => {
          setShowAddSheet(false);
          if (option === 'manual') router.push('/onboarding/add-property-manual');
          else if (option === 'screenshot') router.push('/onboarding/add-property-screenshot');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Header
  header: {
    backgroundColor: Colors.navy800,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  headerLeft: {},
  greeting: { fontFamily: 'DMSerifDisplay', fontSize: 22, color: '#fff', marginBottom: 3 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  statusLabel: { fontSize: 11, fontFamily: 'DMSans-Medium', color: '#22C55E' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },

  // Preferences
  prefRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 8,
  },
  prefText: { flex: 1, fontSize: 12, fontFamily: 'DMSans-Medium', color: 'rgba(255,255,255,0.75)' },
  prefEdit: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },

  addPropertyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  addPropertyLabel: { fontSize: 11, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.6)' },
  addNowPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.terra500, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  addNowText: { fontSize: 10, fontFamily: 'DMSans-SemiBold', color: '#fff' },

  // Dividers
  journeyDivider: { height: 1, backgroundColor: Colors.warm100, marginTop: Spacing.md },
  chatDivider: { height: 1, backgroundColor: Colors.warm100, marginTop: Spacing.sm },

  // Chat zone
  chatZone: { flex: 1 },
});
