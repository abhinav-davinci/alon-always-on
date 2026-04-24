import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  FileDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  Pencil,
  DoorOpen,
  Sofa,
  ChefHat,
  Wrench,
  Sparkles,
  BookOpen,
  User,
  Droplet,
  BedDouble,
  Bed,
  ShowerHead,
  Sun,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboarding';
import { useHaptics } from '../../hooks/useHaptics';
import {
  generateRooms,
  type RoomDef,
  type PropertyConfig,
} from '../../constants/rooms';

// ═══════════════════════════════════════════════════════════════════
// Snag Inspection — Room List (v2)
//
// The screen the user reaches when they tap "Run a snag inspection" on
// Possession. Shows the rooms of *their* home in walking-path order.
// First-visit behaviour: if the user hasn't configured their home yet,
// we redirect to the setup wizard (setup replaces this route so Back
// from the wizard goes back to Possession, not to an empty list).
// ═══════════════════════════════════════════════════════════════════

// Icon resolver — maps the string name stored on RoomDef to a Lucide
// component. Keeps room templates icon-agnostic (no JSX in constants).
const ROOM_ICONS: Record<string, typeof DoorOpen> = {
  'door-open': DoorOpen,
  'sofa': Sofa,
  'chef-hat': ChefHat,
  'wrench': Wrench,
  'sparkles': Sparkles,
  'book-open': BookOpen,
  'user': User,
  'droplet': Droplet,
  'bed-double': BedDouble,
  'bed': Bed,
  'shower-head': ShowerHead,
  'sun': Sun,
};

export default function PossessionSnagScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const { activeLegalPropertyId, possessions } = useOnboardingStore();

  // Pull the saved config for this property's inspection. If missing,
  // redirect to the setup wizard — the user has to configure before
  // they can see a personalized checklist.
  const record = activeLegalPropertyId ? possessions[activeLegalPropertyId] : undefined;
  const config = record?.snagConfig;

  useEffect(() => {
    if (!activeLegalPropertyId) return;
    if (!config) {
      router.replace('/onboarding/possession-snag-setup');
    }
  }, [config, activeLegalPropertyId, router]);

  // Hold render until we know the config path. The useEffect above
  // will navigate away if it's missing.
  if (!config || !activeLegalPropertyId) {
    return <View style={[styles.container, { paddingTop: insets.top }]} />;
  }

  return <RoomList config={config} propertyId={activeLegalPropertyId} />;
}

// ═══════════════════════════════════════════════════════════════════
// RoomList — the actual screen, extracted so we can short-circuit the
// gate above and keep this body focused on rendering the list.
// ═══════════════════════════════════════════════════════════════════

function RoomList({
  config,
  propertyId,
}: {
  config: PropertyConfig;
  propertyId: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const { possessions } = useOnboardingStore();
  const record = possessions[propertyId];

  const rooms = useMemo(() => generateRooms(config), [config]);

  // Per-room counters: checks reviewed vs total, and defects. A "check
  // reviewed" means status !== 'unchecked' (so OK / defect / na all
  // count as progress toward done).
  const perRoom = useMemo(() => {
    const findings = record?.findings ?? {};
    const byRoom: Record<string, { checked: number; defects: number; total: number }> = {};
    for (const room of rooms) {
      const total = room.subCategories.reduce((s, sc) => s + sc.checks.length, 0);
      // Findings whose key starts with this roomId belong to this room.
      const prefix = `${room.id}:`;
      const forThisRoom = Object.entries(findings)
        .filter(([k]) => k.startsWith(prefix))
        .map(([, v]) => v);
      const defects = forThisRoom.filter((f) => f.status === 'defect').length;
      const checked = forThisRoom.filter((f) => f.status !== 'unchecked').length;
      byRoom[room.id] = { checked, defects, total };
    }
    return byRoom;
  }, [rooms, record]);

  const totalChecks = rooms.reduce((s, r) => s + perRoom[r.id].total, 0);
  const totalChecked = rooms.reduce((s, r) => s + perRoom[r.id].checked, 0);
  const totalDefects = rooms.reduce((s, r) => s + perRoom[r.id].defects, 0);

  const summary = useMemo(() => {
    const typeLabel = ({
      'apartment': 'Apartment',
      'row-house': 'Row House',
      'penthouse': 'Penthouse',
    } as const)[config.type];
    return `${config.bhk} ${typeLabel} · ${rooms.length} rooms · ${totalChecks} checks`;
  }, [config, rooms.length, totalChecks]);

  const openRoom = (roomId: string) => {
    haptics.light();
    router.push({ pathname: '/onboarding/possession-snag-detail', params: { room: roomId } });
  };

  const editConfig = () => {
    haptics.light();
    router.push({
      pathname: '/onboarding/possession-snag-setup',
      params: { propertyId, mode: 'edit' },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Search size={16} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.headerTitle}>Snag Inspection</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={editConfig} activeOpacity={0.7}>
          <Pencil size={16} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary card */}
        <Animated.View entering={FadeIn.duration(260)} style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {totalDefects > 0
              ? `${totalDefects} defect${totalDefects === 1 ? '' : 's'} logged`
              : totalChecked === totalChecks
                ? 'All clear — ready for handover'
                : 'Walk the flat room-by-room'}
          </Text>
          <Text style={styles.summarySub}>{summary}</Text>
          <Text style={styles.summaryProgress}>
            {totalChecked} of {totalChecks} checks reviewed
          </Text>
          <View style={styles.summaryBarTrack}>
            <View
              style={[
                styles.summaryBarFill,
                { width: `${Math.round((totalChecked / totalChecks) * 100)}%` as any },
              ]}
            />
          </View>
        </Animated.View>

        {/* Usage hint */}
        <View style={styles.usageCard}>
          <Info size={12} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.usageText}>
            For each check: mark OK, defect, or N/A. Defects take a photo + severity tag.
            Progress saves — pick up anytime.
          </Text>
        </View>

        {/* Walking path */}
        <Text style={styles.sectionLabel}>WALK THE FLAT</Text>
        {rooms.map((room, idx) => (
          <RoomCard
            key={room.id}
            index={idx + 1}
            room={room}
            checked={perRoom[room.id].checked}
            total={perRoom[room.id].total}
            defects={perRoom[room.id].defects}
            onPress={() => openRoom(room.id)}
          />
        ))}

        {/* View full report — preview-first language. Entry to the
            shareable report (grouped by room AND by trade) where the
            user can also timestamp the share for builder follow-ups.
            Disabled only when nothing has been reviewed at all — an
            empty report helps no one. */}
        <Animated.View entering={FadeInDown.delay(80).duration(260)} style={{ marginTop: 20 }}>
          <TouchableOpacity
            style={[styles.exportBtn, totalChecked === 0 && styles.exportBtnDisabled]}
            onPress={() => {
              if (totalChecked === 0) return;
              haptics.light();
              router.push('/onboarding/possession-snag-report');
            }}
            disabled={totalChecked === 0}
            activeOpacity={0.88}
          >
            <FileDown size={15} color={Colors.white} strokeWidth={2} />
            <Text style={styles.exportBtnText}>
              {totalChecked === 0 ? 'Start checking to build your report' : 'View full report'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.exportHint}>
            {totalDefects === 0
              ? 'Preview your clean report before sharing with the builder.'
              : `Preview ${totalDefects} defect${totalDefects === 1 ? '' : 's'} grouped by room and by trade, then share with the builder.`}
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// RoomCard — one row per room in the walking path. Numbered, iconified,
// with a progress counter and a defect badge / all-clear chip.
// ═══════════════════════════════════════════════════════════════════

function RoomCard({
  index,
  room,
  checked,
  total,
  defects,
  onPress,
}: {
  index: number;
  room: RoomDef;
  checked: number;
  total: number;
  defects: number;
  onPress: () => void;
}) {
  const Icon = ROOM_ICONS[room.icon] ?? DoorOpen;
  const isAllClear = checked === total && defects === 0;

  // Rooms show a 1-2 sub-category preview so the user gets a
  // fingerprint of what's inside without opening.
  const preview = room.subCategories.slice(0, 2).map((sc) => sc.label).join(' · ');

  return (
    <TouchableOpacity style={styles.roomCard} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.roomIndex}>{index}</Text>
      <View style={styles.roomIcon}>
        <Icon size={18} color={Colors.terra500} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.roomHeadRow}>
          <Text style={styles.roomTitle} numberOfLines={1}>{room.label}</Text>
          {defects > 0 && (
            <View style={styles.defectPill}>
              <AlertTriangle size={9} color={Colors.red500} strokeWidth={2.2} />
              <Text style={styles.defectPillText}>{defects}</Text>
            </View>
          )}
          {isAllClear && (
            <View style={styles.donePill}>
              <CheckCircle2 size={10} color={Colors.green500} strokeWidth={2.5} />
              <Text style={styles.donePillText}>all clear</Text>
            </View>
          )}
        </View>
        <Text style={styles.roomPreview} numberOfLines={1}>{preview}</Text>
        <Text style={styles.roomProgress}>{checked}/{total} checked</Text>
      </View>
      <ChevronRight size={16} color={Colors.warm400} strokeWidth={2} />
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.warm100,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 17, fontFamily: 'DMSans-Bold', color: Colors.textPrimary },

  content: { paddingTop: Spacing.lg },

  // ── Summary ───────────────────────────────────────────────────────
  summaryCard: {
    marginHorizontal: Spacing.xxl, padding: 14,
    backgroundColor: Colors.cream, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200,
  },
  summaryTitle: { fontFamily: 'DMSerifDisplay', fontSize: 20, color: Colors.textPrimary },
  summarySub: {
    fontFamily: 'DMSans-Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 4,
  },
  summaryProgress: {
    fontFamily: 'DMSans-Medium', fontSize: 11, color: Colors.textTertiary, marginTop: 8, marginBottom: 8,
  },
  summaryBarTrack: {
    height: 4, borderRadius: 2,
    backgroundColor: Colors.warm200, overflow: 'hidden',
  },
  summaryBarFill: {
    height: '100%', backgroundColor: Colors.terra500,
  },

  usageCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: Spacing.xxl, marginTop: 12,
    padding: 12, borderRadius: 10,
    backgroundColor: Colors.terra50, borderWidth: 1, borderColor: Colors.terra100,
  },
  usageText: {
    flex: 1, fontFamily: 'DMSans-Regular', fontSize: 12,
    color: Colors.textSecondary, lineHeight: 17,
  },

  sectionLabel: {
    fontSize: 10, fontFamily: 'DMSans-SemiBold', color: Colors.textTertiary,
    letterSpacing: 0.8, marginHorizontal: Spacing.xxl, marginTop: 20, marginBottom: 10,
  },

  // ── Room cards ────────────────────────────────────────────────────
  roomCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: Spacing.xxl, marginBottom: 8,
    padding: 12, backgroundColor: Colors.white, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.warm200,
  },
  roomIndex: {
    fontFamily: 'DMSans-SemiBold', fontSize: 12, color: Colors.terra500,
    width: 18, textAlign: 'center',
  },
  roomIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.terra50, alignItems: 'center', justifyContent: 'center',
  },
  roomHeadRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap',
  },
  roomTitle: { fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.textPrimary },
  roomPreview: {
    fontFamily: 'DMSans-Regular', fontSize: 11, color: Colors.textSecondary, marginTop: 2,
  },
  roomProgress: {
    fontFamily: 'DMSans-Medium', fontSize: 10, color: Colors.textTertiary, marginTop: 4,
  },
  defectPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, backgroundColor: '#FEE2E2',
  },
  defectPillText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 10, color: Colors.red500,
  },
  donePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, backgroundColor: Colors.green100,
  },
  donePillText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 10, color: Colors.green500, letterSpacing: 0.3,
  },

  // ── Export ────────────────────────────────────────────────────────
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: Spacing.xxl, paddingVertical: 13, borderRadius: 12,
    backgroundColor: Colors.terra500,
  },
  exportBtnDisabled: { backgroundColor: Colors.warm300 },
  exportBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.white },
  exportHint: {
    fontFamily: 'DMSans-Regular', fontSize: 11,
    color: Colors.textTertiary, textAlign: 'center',
    marginTop: 8, marginHorizontal: Spacing.xxl, lineHeight: 15,
  },
});
