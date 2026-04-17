import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Pressable,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Heart,
  Shield,
  Info,
  Lightbulb,
  RefreshCw,
  X,
  CalendarPlus,
  Pencil,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
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
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function SiteVisitsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const {
    likedPropertyIds,
    userProperties,
    scheduledVisits,
    addScheduledVisit,
    removeScheduledVisit,
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
  const [conflictData, setConflictData] = useState<{ conflictName: string; newName: string; newId: string; date: string; time: string } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ propertyId: string; propertyName: string; date: string; time: string } | null>(null);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customDay, setCustomDay] = useState('');
  const [customMonth, setCustomMonth] = useState(new Date().getMonth());
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customHour, setCustomHour] = useState('');
  const [customMinute, setCustomMinute] = useState('');
  const [customAmPm, setCustomAmPm] = useState<'AM' | 'PM'>('AM');
  const upcomingDates = useMemo(getUpcomingDates, []);

  const openScheduleSheet = useCallback((id: string, name: string) => {
    haptics.light();
    setScheduleForProperty({ id, name });
    setSelectedDate(null);
    setSelectedTime(null);
    setShowCustomDate(false);
    setShowCustomTime(false);
  }, []);

  const applyCustomDate = useCallback(() => {
    const dayNum = parseInt(customDay, 10);
    if (!dayNum || dayNum < 1 || dayNum > 31) return;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const d = new Date(new Date().getFullYear(), customMonth, dayNum);
    setSelectedDate(`${days[d.getDay()]}, ${dayNum} ${MONTHS[customMonth]}`);
    setShowCustomDate(false);
    haptics.selection();
  }, [customDay, customMonth]);

  const applyCustomTime = useCallback(() => {
    const h = parseInt(customHour, 10);
    const m = parseInt(customMinute || '0', 10);
    if (!h || h < 1 || h > 12) return;
    const mm = m < 10 ? `0${m}` : `${m}`;
    setSelectedTime(`${h}:${mm} ${customAmPm}`);
    setShowCustomTime(false);
    haptics.selection();
  }, [customHour, customMinute, customAmPm]);

  const confirmSchedule = useCallback(() => {
    if (!scheduleForProperty || !selectedDate || !selectedTime) return;

    // Check for time conflict with existing visits
    const conflict = scheduledVisits.find(
      (v) => v.date === selectedDate && v.time === selectedTime && v.propertyId !== scheduleForProperty.id
    );

    if (conflict) {
      haptics.medium();
      setConflictData({
        conflictName: conflict.propertyName,
        newName: scheduleForProperty.name,
        newId: scheduleForProperty.id,
        date: selectedDate,
        time: selectedTime,
      });
      setScheduleForProperty(null);
      return;
    }

    haptics.success();
    addScheduledVisit({
      propertyId: scheduleForProperty.id,
      propertyName: scheduleForProperty.name,
      date: selectedDate,
      time: selectedTime,
    });
    setScheduleForProperty(null);
  }, [scheduleForProperty, selectedDate, selectedTime, scheduledVisits]);

  const tipIndex = scheduledVisits.length % VISIT_TIPS.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <MapPin size={16} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.headerTitle}>Site Visits</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ══ EMPTY STATE: No properties AND no visits ══ */}
        {!hasProperties && !hasVisits && (
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

                    {/* Reschedule + Cancel */}
                    <View style={styles.visitActions}>
                      <TouchableOpacity
                        style={styles.visitActionBtn}
                        onPress={() => {
                          haptics.light();
                          openScheduleSheet(visit.propertyId, visit.propertyName);
                        }}
                        activeOpacity={0.7}
                      >
                        <RefreshCw size={12} color={Colors.terra500} strokeWidth={2} />
                        <Text style={styles.visitActionText}>Reschedule</Text>
                      </TouchableOpacity>
                      <View style={styles.visitActionDivider} />
                      <TouchableOpacity
                        style={styles.visitActionBtn}
                        onPress={() => {
                          haptics.medium();
                          setCancelTarget({
                            propertyId: visit.propertyId,
                            propertyName: visit.propertyName,
                            date: visit.date,
                            time: visit.time,
                          });
                        }}
                        activeOpacity={0.7}
                      >
                        <X size={12} color={Colors.warm500} strokeWidth={2} />
                        <Text style={[styles.visitActionText, styles.visitActionTextCancel]}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
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
                onPress={() => { haptics.selection(); setSelectedDate(d.full); setShowCustomDate(false); }}
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
          {/* Custom date chip */}
          <Pressable
            style={[styles.dateChip, styles.dateChipCustom, showCustomDate && styles.dateChipActive]}
            onPress={() => { haptics.selection(); setShowCustomDate(!showCustomDate); }}
          >
            <CalendarPlus size={14} color={showCustomDate ? '#fff' : Colors.terra500} strokeWidth={2} />
            <Text style={[styles.dateChipLabel, showCustomDate && styles.dateChipLabelActive, { marginTop: 2 }]}>Custom</Text>
          </Pressable>
        </ScrollView>

        {/* Custom date picker */}
        {showCustomDate && (
          <Animated.View style={styles.customDateRow} entering={FadeInUp.duration(200)}>
            <View style={styles.customFieldGroup}>
              <Text style={styles.customFieldLabel}>Day</Text>
              <TextInput
                style={styles.customInput}
                placeholder="DD"
                placeholderTextColor={Colors.warm300}
                keyboardType="number-pad"
                maxLength={2}
                value={customDay}
                onChangeText={setCustomDay}
              />
            </View>
            <View style={styles.customFieldGroup}>
              <Text style={styles.customFieldLabel}>Month</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.monthRow}>
                  {MONTHS.map((m, i) => (
                    <Pressable
                      key={m}
                      style={[styles.monthChip, customMonth === i && styles.monthChipActive]}
                      onPress={() => { setCustomMonth(i); haptics.selection(); }}
                    >
                      <Text style={[styles.monthChipText, customMonth === i && styles.monthChipTextActive]}>{m}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
            <TouchableOpacity
              style={[styles.customApplyBtn, !customDay && styles.customApplyBtnDisabled]}
              onPress={applyCustomDate}
              disabled={!customDay}
              activeOpacity={0.85}
            >
              <Text style={styles.customApplyText}>Set date</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Time selection */}
        <Text style={[styles.sheetLabel, { marginTop: 20 }]}>Pick a time</Text>
        <View style={styles.timeGrid}>
          {TIME_SLOTS.map((t) => {
            const isSelected = selectedTime === t;
            const conflictVisit = selectedDate
              ? scheduledVisits.find((v) => v.date === selectedDate && v.time === t)
              : null;
            const hasConflict = !!conflictVisit;
            return (
              <Pressable
                key={t}
                style={[styles.timeChip, isSelected && styles.timeChipActive, hasConflict && !isSelected && styles.timeChipConflict]}
                onPress={() => { haptics.selection(); setSelectedTime(t); setShowCustomTime(false); }}
              >
                <Clock size={11} color={isSelected ? '#fff' : hasConflict ? Colors.ember : Colors.textTertiary} strokeWidth={2} />
                <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive, hasConflict && !isSelected && styles.timeChipTextConflict]}>
                  {t}
                </Text>
                {hasConflict && !isSelected && <View style={styles.conflictDot} />}
              </Pressable>
            );
          })}
          {/* Custom time chip */}
          <Pressable
            style={[styles.timeChip, showCustomTime && styles.timeChipActive]}
            onPress={() => { haptics.selection(); setShowCustomTime(!showCustomTime); }}
          >
            <Pencil size={11} color={showCustomTime ? '#fff' : Colors.textTertiary} strokeWidth={2} />
            <Text style={[styles.timeChipText, showCustomTime && styles.timeChipTextActive]}>Custom</Text>
          </Pressable>
        </View>

        {/* Custom time input */}
        {showCustomTime && (
          <Animated.View style={styles.customTimeRow} entering={FadeInUp.duration(200)}>
            <View style={styles.customTimeInputs}>
              <View style={styles.customFieldGroup}>
                <Text style={styles.customFieldLabel}>Hour</Text>
                <TextInput
                  style={styles.customInputSmall}
                  placeholder="HH"
                  placeholderTextColor={Colors.warm300}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={customHour}
                  onChangeText={setCustomHour}
                />
              </View>
              <Text style={styles.customTimeSep}>:</Text>
              <View style={styles.customFieldGroup}>
                <Text style={styles.customFieldLabel}>Min</Text>
                <TextInput
                  style={styles.customInputSmall}
                  placeholder="MM"
                  placeholderTextColor={Colors.warm300}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={customMinute}
                  onChangeText={setCustomMinute}
                />
              </View>
              <View style={styles.customFieldGroup}>
                <Text style={styles.customFieldLabel}>{' '}</Text>
                <View style={styles.amPmToggle}>
                  <Pressable
                    style={[styles.amPmBtn, customAmPm === 'AM' && styles.amPmBtnActive]}
                    onPress={() => { setCustomAmPm('AM'); haptics.selection(); }}
                  >
                    <Text style={[styles.amPmText, customAmPm === 'AM' && styles.amPmTextActive]}>AM</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.amPmBtn, customAmPm === 'PM' && styles.amPmBtnActive]}
                    onPress={() => { setCustomAmPm('PM'); haptics.selection(); }}
                  >
                    <Text style={[styles.amPmText, customAmPm === 'PM' && styles.amPmTextActive]}>PM</Text>
                  </Pressable>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.customApplyBtn, !customHour && styles.customApplyBtnDisabled]}
              onPress={applyCustomTime}
              disabled={!customHour}
              activeOpacity={0.85}
            >
              <Text style={styles.customApplyText}>Set time</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        {selectedDate && selectedTime && scheduledVisits.find((v) => v.date === selectedDate && v.time === selectedTime) && (
          <View style={styles.conflictWarning}>
            <Info size={12} color={Colors.ember} strokeWidth={2} />
            <Text style={styles.conflictWarningText}>
              You have a visit to {scheduledVisits.find((v) => v.date === selectedDate && v.time === selectedTime)!.propertyName} at this time
            </Text>
          </View>
        )}

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

      {/* ══ CONFLICT RESOLUTION SHEET ══ */}
      <BottomSheet
        visible={!!conflictData}
        title="Time conflict"
        onClose={() => setConflictData(null)}
      >
        {conflictData && (
          <View style={styles.conflictSheet}>
            <View style={styles.conflictIconWrap}>
              <Clock size={24} color={Colors.ember} strokeWidth={1.8} />
            </View>
            <Text style={styles.conflictSheetBody}>
              You already have a visit to{' '}
              <Text style={styles.conflictSheetBold}>{conflictData.conflictName}</Text> at{' '}
              <Text style={styles.conflictSheetBold}>{conflictData.time}</Text> on{' '}
              <Text style={styles.conflictSheetBold}>{conflictData.date}</Text>.
            </Text>
            <Text style={styles.conflictSheetSub}>
              Would you like to pick a different time for {conflictData.newName}, or keep this time and reschedule the other visit later?
            </Text>

            <TouchableOpacity
              style={styles.conflictBtnPrimary}
              onPress={() => {
                setConflictData(null);
                // Reopen the scheduler for the same property
                setScheduleForProperty({ id: conflictData.newId, name: conflictData.newName });
                setSelectedDate(conflictData.date);
                setSelectedTime(null);
              }}
              activeOpacity={0.85}
            >
              <Calendar size={15} color={Colors.white} strokeWidth={2} />
              <Text style={styles.conflictBtnPrimaryText}>Pick a different time</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.conflictBtnSecondary}
              onPress={() => {
                haptics.success();
                addScheduledVisit({
                  propertyId: conflictData.newId,
                  propertyName: conflictData.newName,
                  date: conflictData.date,
                  time: conflictData.time,
                });
                setConflictData(null);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.conflictBtnSecondaryText}>
                Keep this time — I'll reschedule {conflictData.conflictName.split(' ')[0]} later
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheet>

      {/* ══ CANCEL CONFIRMATION SHEET ══ */}
      <BottomSheet
        visible={!!cancelTarget}
        title="Cancel this visit?"
        onClose={() => setCancelTarget(null)}
      >
        {cancelTarget && (
          <View style={styles.conflictSheet}>
            <View style={styles.cancelIconWrap}>
              <X size={24} color="#DC2626" strokeWidth={2} />
            </View>
            <Text style={styles.conflictSheetBody}>
              Cancel your visit to{' '}
              <Text style={styles.conflictSheetBold}>{cancelTarget.propertyName}</Text> on{' '}
              <Text style={styles.conflictSheetBold}>{cancelTarget.date}</Text> at{' '}
              <Text style={styles.conflictSheetBold}>{cancelTarget.time}</Text>?
            </Text>
            <Text style={styles.conflictSheetSub}>
              You can reschedule any time — but the current slot will be released.
            </Text>

            <TouchableOpacity
              style={styles.conflictBtnSecondary}
              onPress={() => setCancelTarget(null)}
              activeOpacity={0.85}
            >
              <Text style={styles.conflictBtnSecondaryText}>Keep visit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtnDestructive}
              onPress={() => {
                haptics.medium();
                removeScheduledVisit(cancelTarget.propertyId);
                setCancelTarget(null);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelBtnDestructiveText}>Yes, cancel visit</Text>
            </TouchableOpacity>
          </View>
        )}
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
  visitActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.warm100,
  },
  visitActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
  },
  visitActionDivider: {
    width: 1,
    backgroundColor: Colors.warm100,
    marginVertical: 6,
  },
  visitActionText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: Colors.terra500,
  },
  visitActionTextCancel: {
    color: Colors.warm500,
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
  timeChipConflict: {
    borderColor: Colors.ember,
    backgroundColor: '#FFF7ED',
  },
  timeChipTextConflict: { color: Colors.ember },
  conflictDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.ember,
  },
  conflictWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  conflictWarningText: {
    flex: 1,
    fontFamily: 'DMSans-Medium',
    fontSize: 11,
    color: '#9A3412',
    lineHeight: 15,
  },

  // ── Conflict resolution sheet ──
  conflictSheet: {
    alignItems: 'center',
  },
  conflictIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  conflictSheetBody: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 8,
  },
  conflictSheetBold: {
    fontFamily: 'DMSans-SemiBold',
  },
  conflictSheetSub: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  conflictBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    paddingVertical: 14,
    backgroundColor: Colors.terra500,
    borderRadius: 14,
    marginBottom: 10,
  },
  conflictBtnPrimaryText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 15,
    color: Colors.white,
  },
  conflictBtnSecondary: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: Colors.warm50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warm200,
    alignItems: 'center',
  },
  conflictBtnSecondaryText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  cancelIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cancelBtnDestructive: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelBtnDestructiveText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 13,
    color: '#DC2626',
  },

  dateChipCustom: {
    justifyContent: 'center',
    gap: 4,
  },

  // Custom date picker
  customDateRow: {
    marginTop: 12,
    backgroundColor: Colors.warm50,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  customFieldGroup: { gap: 4 },
  customFieldLabel: {
    fontFamily: 'DMSans-Medium',
    fontSize: 10,
    color: Colors.textTertiary,
  },
  customInput: {
    width: 70,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.warm200,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'DMSans-SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  monthRow: { flexDirection: 'row', gap: 6 },
  monthChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.warm200,
  },
  monthChipActive: {
    backgroundColor: Colors.terra500,
    borderColor: Colors.terra500,
  },
  monthChipText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 11,
    color: Colors.textSecondary,
  },
  monthChipTextActive: { color: '#fff' },
  customApplyBtn: {
    backgroundColor: Colors.terra500,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  customApplyBtnDisabled: { backgroundColor: Colors.warm200 },
  customApplyText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 13,
    color: '#fff',
  },

  // Custom time picker
  customTimeRow: {
    marginTop: 12,
    backgroundColor: Colors.warm50,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  customTimeInputs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  customInputSmall: {
    width: 52,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.warm200,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontFamily: 'DMSans-SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  customTimeSep: {
    fontFamily: 'DMSans-Bold',
    fontSize: 20,
    color: Colors.textTertiary,
    marginBottom: 8,
  },
  amPmToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.warm200,
  },
  amPmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: Colors.white,
  },
  amPmBtnActive: {
    backgroundColor: Colors.terra500,
  },
  amPmText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  amPmTextActive: { color: '#fff' },

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
