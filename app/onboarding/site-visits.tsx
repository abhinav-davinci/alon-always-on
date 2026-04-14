import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Clock,
  Download,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Heart,
  Shield,
  Info,
  Lightbulb,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import BottomSheet from '../../components/BottomSheet';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboarding';
import { SHORTLIST_PROPERTIES } from '../../constants/properties';
import { useHaptics } from '../../hooks/useHaptics';

// ── Pre-visit checklist (generic Phase 1) ──
const PRE_VISIT_CHECKLIST = [
  'Check water pressure in all bathrooms and kitchen',
  'Inspect walls and ceilings for dampness, cracks, or seepage',
  'Verify actual carpet area matches the agreement',
  'Test mobile network signal strength in every room',
  'Ask about monthly maintenance charges and society rules',
  'Check parking allotment — covered vs open, visitor slots',
  'Photograph everything — ALON will store it for your records',
];

// ── ALON visit tips (rotates based on visit count) ──
const VISIT_TIPS = [
  'Visit the property between 6–8 PM to check evening lighting and noise levels — it tells a different story than a morning visit.',
  'Ask the watchman or existing residents about water supply timing and power backup — they have no reason to exaggerate.',
  'Check Google Maps traffic from the property to your office at 9 AM on a weekday — the commute is the one thing that never changes.',
  'Bring a phone charger and test every power outlet. Faulty wiring is the most common hidden defect in new constructions.',
  'Walk the full perimeter of the building, not just your flat. Check the compound wall, drainage, and garbage disposal area.',
];

// ── Generate next 7 days ──
function getUpcomingDates() {
  const dates: { label: string; day: string; date: string; full: string }[] = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      label: i === 1 ? 'Tomorrow' : days[d.getDay()],
      day: `${d.getDate()}`,
      date: `${d.getDate()} ${months[d.getMonth()]}`,
      full: `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`,
    });
  }
  return dates;
}

const TIME_SLOTS = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

export default function SiteVisitsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const {
    likedPropertyIds,
    userProperties,
    scheduledVisits,
    addScheduledVisit,
  } = useOnboardingStore();

  // ── Data ──
  const allProperties = useMemo(() => {
    const liked = SHORTLIST_PROPERTIES.filter((p) => likedPropertyIds.includes(p.id));
    const userAdded = userProperties.map((p) => ({
      id: p.id,
      name: p.name,
      area: p.area,
      price: p.price,
      image: p.images?.[0],
      isUserAdded: true,
    }));
    return [
      ...liked.map((p) => ({ id: p.id, name: p.name, area: p.area, price: p.price, image: p.image, isUserAdded: false })),
      ...userAdded,
    ];
  }, [likedPropertyIds, userProperties]);

  const visitedIds = useMemo(() => new Set(scheduledVisits.map((v) => v.propertyId)), [scheduledVisits]);
  const unscheduled = useMemo(() => allProperties.filter((p) => !visitedIds.has(p.id)), [allProperties, visitedIds]);
  const hasProperties = allProperties.length > 0;
  const hasVisits = scheduledVisits.length > 0;

  // ── Expanded checklists ──
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);

  // ── Schedule bottom sheet ──
  const [scheduleForProperty, setScheduleForProperty] = useState<{ id: string; name: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const upcomingDates = useMemo(getUpcomingDates, []);

  const openScheduleSheet = useCallback((id: string, name: string) => {
    haptics.light();
    setScheduleForProperty({ id, name });
    setSelectedDate(null);
    setSelectedTime(null);
  }, []);

  const confirmSchedule = useCallback(() => {
    if (!scheduleForProperty || !selectedDate || !selectedTime) return;
    haptics.success();
    addScheduledVisit({
      propertyId: scheduleForProperty.id,
      propertyName: scheduleForProperty.name,
      date: selectedDate,
      time: selectedTime,
    });
    setScheduleForProperty(null);
  }, [scheduleForProperty, selectedDate, selectedTime]);

  const downloadPdf = () => {
    haptics.medium();
    Alert.alert(
      'Coming soon',
      'PDF download of your visit schedule will be available in the next update.',
      [{ text: 'OK' }]
    );
  };

  const tipIndex = scheduledVisits.length % VISIT_TIPS.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <MapPin size={16} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.headerTitle}>Site Visits</Text>
        </View>
        {hasVisits ? (
          <TouchableOpacity style={styles.downloadBtn} onPress={downloadPdf} activeOpacity={0.7}>
            <Download size={18} color={Colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ══ EMPTY STATE: No properties ══ */}
        {!hasProperties && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Heart size={28} color={Colors.warm300} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>No properties shortlisted yet</Text>
            <Text style={styles.emptySub}>
              Browse your matches and tap ♡ on properties you like — then you can schedule
              site visits for them.
            </Text>
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => router.push('/onboarding/shortlist')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyCtaText}>Browse Matches</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ══ EMPTY STATE: Properties but no visits ══ */}
        {hasProperties && !hasVisits && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.noVisitsHero}>
            <View style={styles.noVisitsIconWrap}>
              <Calendar size={24} color={Colors.terra500} strokeWidth={1.8} />
            </View>
            <Text style={styles.noVisitsTitle}>Schedule your first visit</Text>
            <Text style={styles.noVisitsSub}>
              Pick a property below — your number stays hidden from the builder.
            </Text>
          </Animated.View>
        )}

        {/* ══ UPCOMING VISITS ══ */}
        {hasVisits && (
          <Animated.View entering={FadeIn.duration(300)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>UPCOMING ({scheduledVisits.length})</Text>
            </View>

            {scheduledVisits.map((visit, i) => {
              const prop = allProperties.find((p) => p.id === visit.propertyId);
              const isExpanded = expandedVisit === visit.propertyId;

              return (
                <Animated.View
                  key={visit.propertyId}
                  entering={FadeInDown.delay(i * 60).duration(250)}
                >
                  <View style={styles.visitCard}>
                    {/* Visit info */}
                    <View style={styles.visitCardTop}>
                      {prop?.image ? (
                        <Image source={{ uri: prop.image }} style={styles.visitImage} />
                      ) : (
                        <View style={[styles.visitImage, styles.visitImagePlaceholder]}>
                          <MapPin size={16} color={Colors.terra400} strokeWidth={1.8} />
                        </View>
                      )}
                      <View style={styles.visitInfo}>
                        <Text style={styles.visitName} numberOfLines={1}>{visit.propertyName}</Text>
                        <Text style={styles.visitArea} numberOfLines={1}>{prop?.area || ''}</Text>
                        <View style={styles.visitDateRow}>
                          <Calendar size={11} color={Colors.terra500} strokeWidth={2} />
                          <Text style={styles.visitDate}>{visit.date}</Text>
                          <Clock size={11} color={Colors.terra500} strokeWidth={2} />
                          <Text style={styles.visitDate}>{visit.time}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Checklist toggle */}
                    <TouchableOpacity
                      style={styles.checklistToggle}
                      onPress={() => {
                        haptics.light();
                        setExpandedVisit(isExpanded ? null : visit.propertyId);
                      }}
                      activeOpacity={0.7}
                    >
                      <CheckCircle2 size={13} color={Colors.terra500} strokeWidth={2} />
                      <Text style={styles.checklistToggleText}>Pre-visit checklist</Text>
                      {isExpanded ? (
                        <ChevronUp size={14} color={Colors.warm400} strokeWidth={2} />
                      ) : (
                        <ChevronDown size={14} color={Colors.warm400} strokeWidth={2} />
                      )}
                    </TouchableOpacity>

                    {/* Expanded checklist */}
                    {isExpanded && (
                      <Animated.View entering={FadeIn.duration(200)} style={styles.checklistBody}>
                        {PRE_VISIT_CHECKLIST.map((item, ci) => (
                          <View key={ci} style={styles.checklistItem}>
                            <View style={styles.checklistBullet} />
                            <Text style={styles.checklistText}>{item}</Text>
                          </View>
                        ))}
                      </Animated.View>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </Animated.View>
        )}

        {/* ══ NOT YET SCHEDULED ══ */}
        {hasProperties && unscheduled.length > 0 && (
          <Animated.View entering={FadeInDown.delay(hasVisits ? 200 : 0).duration(300)}>
            <View style={[styles.sectionHeader, hasVisits && { marginTop: 20 }]}>
              <Text style={styles.sectionLabel}>
                {hasVisits ? `NOT YET SCHEDULED (${unscheduled.length})` : 'YOUR SHORTLISTED PROPERTIES'}
              </Text>
            </View>

            {unscheduled.map((p, i) => (
              <Animated.View
                key={p.id}
                entering={FadeInDown.delay((hasVisits ? 250 : 80) + i * 60).duration(250)}
              >
                <View style={styles.unscheduledCard}>
                  {p.image ? (
                    <Image source={{ uri: p.image }} style={styles.unschedImage} />
                  ) : (
                    <View style={[styles.unschedImage, styles.visitImagePlaceholder]}>
                      <MapPin size={14} color={Colors.terra400} strokeWidth={1.8} />
                    </View>
                  )}
                  <View style={styles.unschedInfo}>
                    <Text style={styles.unschedName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.unschedMeta} numberOfLines={1}>
                      {p.area} · {p.price}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.scheduleBtn}
                    onPress={() => openScheduleSheet(p.id, p.name)}
                    activeOpacity={0.8}
                  >
                    <Calendar size={13} color={Colors.white} strokeWidth={2} />
                    <Text style={styles.scheduleBtnText}>Schedule</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* All properties have visits */}
        {hasProperties && unscheduled.length === 0 && hasVisits && (
          <View style={styles.allScheduledBadge}>
            <CheckCircle2 size={13} color="#22C55E" strokeWidth={2} />
            <Text style={styles.allScheduledText}>All shortlisted properties have visits scheduled</Text>
          </View>
        )}

        {/* ══ ALON's Visit Tip ══ */}
        {hasProperties && (
          <Animated.View
            entering={FadeInDown.delay(400).duration(300)}
            style={styles.tipCard}
          >
            <View style={styles.tipHeader}>
              <Lightbulb size={14} color={Colors.activationGlow} strokeWidth={2} />
              <Text style={styles.tipLabel}>ALON's visit tip</Text>
            </View>
            <Text style={styles.tipText}>{VISIT_TIPS[tipIndex]}</Text>
          </Animated.View>
        )}

        {/* Privacy note */}
        <View style={styles.disclaimer}>
          <Shield size={12} color={Colors.warm400} strokeWidth={1.5} />
          <Text style={styles.disclaimerText}>
            Your phone number is never shared with the builder. ALON books visits using a
            reference ID — you stay anonymous until you choose to connect.
          </Text>
        </View>
      </ScrollView>

      {/* ══ SCHEDULE BOTTOM SHEET ══ */}
      <BottomSheet
        visible={!!scheduleForProperty}
        title={`Visit ${scheduleForProperty?.name || ''}`}
        onClose={() => setScheduleForProperty(null)}
      >
        {/* Date selection */}
        <Text style={styles.sheetLabel}>Pick a date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dateScroll}
          contentContainerStyle={styles.dateScrollContent}
        >
          {upcomingDates.map((d) => {
            const isSelected = selectedDate === d.full;
            return (
              <Pressable
                key={d.full}
                style={[styles.dateChip, isSelected && styles.dateChipActive]}
                onPress={() => { haptics.selection(); setSelectedDate(d.full); }}
              >
                <Text style={[styles.dateChipLabel, isSelected && styles.dateChipLabelActive]}>
                  {d.label}
                </Text>
                <Text style={[styles.dateChipDay, isSelected && styles.dateChipDayActive]}>
                  {d.day}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Time selection */}
        <Text style={[styles.sheetLabel, { marginTop: 20 }]}>Pick a time</Text>
        <View style={styles.timeGrid}>
          {TIME_SLOTS.map((t) => {
            const isSelected = selectedTime === t;
            return (
              <Pressable
                key={t}
                style={[styles.timeChip, isSelected && styles.timeChipActive]}
                onPress={() => { haptics.selection(); setSelectedTime(t); }}
              >
                <Clock size={11} color={isSelected ? '#fff' : Colors.textTertiary} strokeWidth={2} />
                <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Privacy */}
        <View style={styles.sheetPrivacy}>
          <Shield size={12} color={Colors.textTertiary} strokeWidth={2} />
          <Text style={styles.sheetPrivacyText}>Your number stays hidden from the builder</Text>
        </View>

        {/* Confirm */}
        <TouchableOpacity
          style={[styles.sheetConfirm, (!selectedDate || !selectedTime) && styles.sheetConfirmDisabled]}
          activeOpacity={0.85}
          disabled={!selectedDate || !selectedTime}
          onPress={confirmSchedule}
        >
          <Calendar size={16} color="#fff" strokeWidth={2} />
          <Text style={styles.sheetConfirmText}>
            {selectedDate && selectedTime
              ? `Confirm · ${selectedDate.split(', ')[0]}, ${selectedTime}`
              : 'Select date & time'}
          </Text>
        </TouchableOpacity>
      </BottomSheet>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warm100,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 17, fontFamily: 'DMSans-Bold', color: Colors.textPrimary },
  downloadBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.warm50, alignItems: 'center', justifyContent: 'center',
  },

  content: { paddingTop: Spacing.lg },

  // ── Empty states ──
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingTop: 60,
  },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.warm50, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'DMSerifDisplay', fontSize: 20, color: Colors.textPrimary,
    textAlign: 'center', marginBottom: 8,
  },
  emptySub: {
    fontFamily: 'DMSans-Regular', fontSize: 13, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 19, marginBottom: 20,
  },
  emptyCta: {
    backgroundColor: Colors.terra500, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: Radius.sm,
  },
  emptyCtaText: { fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.white },

  noVisitsHero: {
    alignItems: 'center', paddingHorizontal: Spacing.xxl, paddingBottom: 20,
  },
  noVisitsIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.terra50, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  noVisitsTitle: {
    fontFamily: 'DMSerifDisplay', fontSize: 18, color: Colors.textPrimary,
    textAlign: 'center', marginBottom: 4,
  },
  noVisitsSub: {
    fontFamily: 'DMSans-Regular', fontSize: 12, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 17,
  },

  // ── Section headers ──
  sectionHeader: {
    paddingHorizontal: Spacing.xxl, paddingVertical: 10,
    backgroundColor: Colors.cream, borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  sectionLabel: {
    fontSize: 10, fontFamily: 'DMSans-SemiBold', color: Colors.textTertiary,
    letterSpacing: 0.8,
  },

  // ── Visit cards (scheduled) ──
  visitCard: {
    marginHorizontal: Spacing.xxl, marginTop: 10,
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200, overflow: 'hidden',
  },
  visitCardTop: {
    flexDirection: 'row', gap: 12, padding: 12,
  },
  visitImage: {
    width: 56, height: 56, borderRadius: 10, backgroundColor: Colors.warm100,
  },
  visitImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  visitInfo: { flex: 1, justifyContent: 'center' },
  visitName: { fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.textPrimary },
  visitArea: { fontFamily: 'DMSans-Regular', fontSize: 11, color: Colors.textTertiary, marginTop: 1 },
  visitDateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6,
  },
  visitDate: { fontFamily: 'DMSans-Medium', fontSize: 11, color: Colors.terra600 },

  // Checklist toggle
  checklistToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: Colors.warm100,
    backgroundColor: Colors.warm50,
  },
  checklistToggleText: {
    flex: 1, fontFamily: 'DMSans-Medium', fontSize: 12, color: Colors.terra500,
  },
  checklistBody: {
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: Colors.warm50, gap: 8,
  },
  checklistItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  checklistBullet: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.terra400, marginTop: 5,
  },
  checklistText: {
    flex: 1, fontFamily: 'DMSans-Regular', fontSize: 12, color: Colors.textSecondary, lineHeight: 17,
  },

  // ── Unscheduled cards ──
  unscheduledCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: Spacing.xxl, marginTop: 10,
    padding: 10, backgroundColor: Colors.white,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.warm200,
  },
  unschedImage: {
    width: 44, height: 44, borderRadius: 8, backgroundColor: Colors.warm100,
  },
  unschedInfo: { flex: 1 },
  unschedName: { fontFamily: 'DMSans-SemiBold', fontSize: 13, color: Colors.textPrimary },
  unschedMeta: { fontFamily: 'DMSans-Regular', fontSize: 11, color: Colors.textTertiary, marginTop: 1 },
  scheduleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.terra500, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8,
  },
  scheduleBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: 11, color: Colors.white },

  // All scheduled badge
  allScheduledBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: Spacing.xxl, marginTop: 16,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#F0FDF4', borderRadius: 8,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  allScheduledText: {
    fontFamily: 'DMSans-Medium', fontSize: 12, color: '#166534',
  },

  // ── Tip card ──
  tipCard: {
    marginHorizontal: Spacing.xxl, marginTop: 20,
    padding: 14, backgroundColor: Colors.cream,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.warm200,
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  tipLabel: {
    fontFamily: 'DMSans-SemiBold', fontSize: 11, color: Colors.activationGlow,
    letterSpacing: 0.4,
  },
  tipText: {
    fontFamily: 'DMSans-Regular', fontSize: 12, color: Colors.textSecondary, lineHeight: 18,
  },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row', gap: 6,
    marginHorizontal: Spacing.xxl, marginTop: 16, padding: 12,
  },
  disclaimerText: {
    flex: 1, fontSize: 10, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, lineHeight: 14,
  },

  // ═══ Bottom sheet styles ═══
  sheetLabel: {
    fontFamily: 'DMSans-SemiBold', fontSize: 13, color: Colors.textSecondary, marginBottom: 10,
  },
  dateScroll: { marginHorizontal: -Spacing.xxl },
  dateScrollContent: { paddingHorizontal: Spacing.xxl, gap: 8 },
  dateChip: {
    width: 64, paddingVertical: 10, borderRadius: 12,
    backgroundColor: Colors.warm50, borderWidth: 1, borderColor: Colors.warm100,
    alignItems: 'center', gap: 2,
  },
  dateChipActive: { backgroundColor: Colors.terra500, borderColor: Colors.terra500 },
  dateChipLabel: { fontFamily: 'DMSans-Medium', fontSize: 10, color: Colors.textTertiary },
  dateChipLabelActive: { color: 'rgba(255,255,255,0.7)' },
  dateChipDay: { fontFamily: 'DMSans-Bold', fontSize: 18, color: Colors.textPrimary },
  dateChipDayActive: { color: '#fff' },

  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10,
    backgroundColor: Colors.warm50, borderWidth: 1, borderColor: Colors.warm100,
  },
  timeChipActive: { backgroundColor: Colors.terra500, borderColor: Colors.terra500 },
  timeChipText: { fontFamily: 'DMSans-Medium', fontSize: 12, color: Colors.textSecondary },
  timeChipTextActive: { color: '#fff' },

  sheetPrivacy: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 16, marginBottom: 12,
  },
  sheetPrivacyText: { fontFamily: 'DMSans-Regular', fontSize: 11, color: Colors.textTertiary },

  sheetConfirm: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.terra500, paddingVertical: 14, borderRadius: 14,
  },
  sheetConfirmDisabled: { backgroundColor: Colors.warm200 },
  sheetConfirmText: { fontFamily: 'DMSans-SemiBold', fontSize: 15, color: '#fff' },
});
