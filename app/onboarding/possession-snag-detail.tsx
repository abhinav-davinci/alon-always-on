import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Info,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Camera,
  DoorOpen,
  DoorClosed,
  Sofa,
  ChefHat,
  Wrench,
  Sparkles,
  BookOpen,
  User,
  Droplet,
  Droplets,
  BedDouble,
  Bed,
  ShowerHead,
  Sun,
  Building2,
} from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/theme';
import {
  useOnboardingStore,
  type SnagStatus,
  type SnagSeverity,
  type SnagCategory,
} from '../../store/onboarding';
import { useHaptics } from '../../hooks/useHaptics';
import {
  generateRooms,
  findingKey,
  type RoomDef,
  type SubCategoryDef,
  type CheckAtom,
} from '../../constants/rooms';

// ═══════════════════════════════════════════════════════════════════
// Room detail (v2) — shows every check for a single room, grouped by
// sub-category (walls, floor, electrical…). Each check has a
// three-state control: OK / Defect / N/A. Defect opens severity +
// photo + notes in place.
//
// Prev/Next room navigation at the bottom so a resident walking the
// flat doesn't need to tap Back each time they finish a room.
// ═══════════════════════════════════════════════════════════════════

const ROOM_ICONS: Record<string, typeof DoorOpen> = {
  'door-open': DoorOpen,
  'door-closed': DoorClosed,
  'sofa': Sofa,
  'chef-hat': ChefHat,
  'wrench': Wrench,
  'sparkles': Sparkles,
  'book-open': BookOpen,
  'user': User,
  'droplet': Droplet,
  'droplets': Droplets,
  'bed-double': BedDouble,
  'bed': Bed,
  'shower-head': ShowerHead,
  'sun': Sun,
  'building-2': Building2,
};

export default function PossessionSnagDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ room?: string }>();
  const haptics = useHaptics();

  const { activeLegalPropertyId, possessions } = useOnboardingStore();
  const record = activeLegalPropertyId ? possessions[activeLegalPropertyId] : undefined;
  const config = record?.snagConfig;

  // Resolve the room + its position in the walking path.
  const { room, roomIdx, rooms } = useMemo(() => {
    if (!config) return { room: null, roomIdx: -1, rooms: [] as RoomDef[] };
    const list = generateRooms(config);
    const idx = list.findIndex((r) => r.id === params.room);
    return { room: idx >= 0 ? list[idx] : null, roomIdx: idx, rooms: list };
  }, [config, params.room]);

  if (!config || !activeLegalPropertyId || !room) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={{ padding: 24, fontFamily: 'DMSans-Regular', color: Colors.textSecondary }}>
          Room not found. Go back and pick one.
        </Text>
      </View>
    );
  }

  const Icon = ROOM_ICONS[room.icon] ?? DoorOpen;
  const findings = record?.findings ?? {};

  // Progress for this room.
  const totalChecks = room.subCategories.reduce((s, sc) => s + sc.checks.length, 0);
  const reviewed = Object.entries(findings).filter(
    ([k, v]) => k.startsWith(`${room.id}:`) && v.status !== 'unchecked',
  ).length;

  const goToRoom = (targetIdx: number) => {
    const next = rooms[targetIdx];
    if (!next) return;
    router.replace({
      pathname: '/onboarding/possession-snag-detail',
      params: { room: next.id },
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
          <Icon size={16} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.headerTitle} numberOfLines={1}>{room.label}</Text>
        </View>
        <Text style={styles.headerCount}>{reviewed}/{totalChecks}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Walk progress */}
        <Text style={styles.walkStep}>
          Room {roomIdx + 1} of {rooms.length}
        </Text>
        <View style={styles.walkBarTrack}>
          <View
            style={[
              styles.walkBarFill,
              { width: `${Math.round(((roomIdx + 1) / rooms.length) * 100)}%` as any },
            ]}
          />
        </View>

        {/* Watch out */}
        <Animated.View entering={FadeIn.duration(260)} style={styles.watchOutCard}>
          <View style={styles.watchOutHead}>
            <Info size={13} color={Colors.terra600} strokeWidth={2} />
            <Text style={styles.watchOutLabel}>WATCH OUT IN {room.label.toUpperCase()}</Text>
          </View>
          <Text style={styles.watchOutText}>{room.watchOut}</Text>
        </Animated.View>

        {/* Sub-categories — each is a titled group with its check rows */}
        {room.subCategories.map((sc) => (
          <SubCategoryBlock
            key={sc.id}
            subCategory={sc}
            roomId={room.id}
            propertyId={activeLegalPropertyId}
            findings={findings}
          />
        ))}
      </ScrollView>

      {/* Prev / Next room footer — stays parked above the safe area so
          a user walking the flat never hunts for navigation. On the
          last room, the primary CTA morphs into "Finish inspection" and
          routes back to the room list — a satisfying terminal state
          rather than a disabled dead-end. */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={[styles.navBtn, roomIdx === 0 && styles.navBtnDisabled]}
          onPress={() => goToRoom(roomIdx - 1)}
          disabled={roomIdx === 0}
          activeOpacity={0.8}
        >
          <ChevronLeft size={16} color={roomIdx === 0 ? Colors.warm400 : Colors.terra500} strokeWidth={2.2} />
          <Text style={[styles.navBtnText, roomIdx === 0 && styles.navBtnTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>
        {roomIdx === rooms.length - 1 ? (
          <TouchableOpacity
            style={styles.navBtnPrimary}
            onPress={() => {
              haptics.success();
              router.back();
            }}
            activeOpacity={0.88}
          >
            <Check size={16} color={Colors.white} strokeWidth={2.2} />
            <Text style={styles.navBtnPrimaryText}>Finish inspection</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.navBtnPrimary}
            onPress={() => goToRoom(roomIdx + 1)}
            activeOpacity={0.88}
          >
            <Text style={styles.navBtnPrimaryText} numberOfLines={1}>
              Next: {rooms[roomIdx + 1]?.label ?? ''}
            </Text>
            <ChevronRight size={16} color={Colors.white} strokeWidth={2.2} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SubCategoryBlock — one titled section within the room (Walls,
// Floor, Electrical…). Each holds the list of check rows it contains.
// ═══════════════════════════════════════════════════════════════════

function SubCategoryBlock({
  subCategory,
  roomId,
  propertyId,
  findings,
}: {
  subCategory: SubCategoryDef;
  roomId: string;
  propertyId: string;
  findings: Record<string, { status: SnagStatus; severity?: SnagSeverity; photoCount: number; notes: string }>;
}) {
  return (
    <View style={styles.subCatBlock}>
      <Text style={styles.subCatLabel}>{subCategory.label.toUpperCase()}</Text>
      <View style={styles.subCatCard}>
        {subCategory.checks.map((check, i) => {
          const key = findingKey(roomId, subCategory.id, check.id);
          const finding = findings[key];
          return (
            <View key={check.id}>
              <CheckRow
                check={check}
                status={finding?.status ?? 'unchecked'}
                severity={finding?.severity}
                photoCount={finding?.photoCount ?? 0}
                notes={finding?.notes ?? ''}
                propertyId={propertyId}
                roomId={roomId}
                subCategoryId={subCategory.id}
                category={subCategory.category}
              />
              {i < subCategory.checks.length - 1 && <View style={styles.rowDivider} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CheckRow — one check within a sub-category. Mirrors the v1 CheckCard
// behaviour (OK / Defect / N/A) but uses updateSnagFindingV2 so the
// finding gets tagged with room + sub-category automatically.
// ═══════════════════════════════════════════════════════════════════

function CheckRow({
  check, status, severity, photoCount, notes,
  propertyId, roomId, subCategoryId, category,
}: {
  check: CheckAtom;
  status: SnagStatus;
  severity?: SnagSeverity;
  photoCount: number;
  notes: string;
  propertyId: string;
  roomId: string;
  subCategoryId: string;
  category: SnagCategory;
}) {
  const haptics = useHaptics();
  const updateSnagFindingV2 = useOnboardingStore((s) => s.updateSnagFindingV2);
  const [localNotes, setLocalNotes] = useState(notes);

  const setStatus = (next: SnagStatus) => {
    haptics.selection();
    updateSnagFindingV2(propertyId, roomId, subCategoryId, category, check.id, {
      status: next,
      severity: next === 'defect' ? severity : undefined,
    });
  };

  const setSeverity = (sev: SnagSeverity) => {
    haptics.light();
    updateSnagFindingV2(propertyId, roomId, subCategoryId, category, check.id, { severity: sev });
  };

  const addPhoto = () => {
    haptics.light();
    updateSnagFindingV2(propertyId, roomId, subCategoryId, category, check.id, {
      photoCount: photoCount + 1,
    });
  };

  const commitNotes = () => {
    if (localNotes !== notes) {
      updateSnagFindingV2(propertyId, roomId, subCategoryId, category, check.id, { notes: localNotes });
    }
  };

  const isDefect = status === 'defect';

  return (
    <View style={[styles.checkRow, isDefect && styles.checkRowDefect]}>
      <Text style={styles.checkLabel}>{check.label}</Text>
      <Text style={styles.checkHint}>{check.hint}</Text>

      <View style={styles.statusRow}>
        <StatusPill
          label="OK"
          icon={CheckCircle2}
          color={Colors.green500}
          bg={Colors.green100}
          active={status === 'ok'}
          onPress={() => setStatus('ok')}
        />
        <StatusPill
          label="Defect"
          icon={XCircle}
          color={Colors.red500}
          bg={'#FEE2E2'}
          active={status === 'defect'}
          onPress={() => setStatus('defect')}
        />
        <StatusPill
          label="N/A"
          icon={MinusCircle}
          color={Colors.textTertiary}
          bg={Colors.warm100}
          active={status === 'na'}
          onPress={() => setStatus('na')}
        />
      </View>

      {isDefect && (
        <View style={styles.defectBlock}>
          <Text style={styles.defectLabel}>SEVERITY</Text>
          <View style={styles.sevRow}>
            <SeverityChip label="Critical" active={severity === 'critical'} color="#DC2626" bg="#FEE2E2" onPress={() => setSeverity('critical')} />
            <SeverityChip label="Major"    active={severity === 'major'}    color="#C2410C" bg="#FFEDD5" onPress={() => setSeverity('major')} />
            <SeverityChip label="Minor"    active={severity === 'minor'}    color={Colors.warm600} bg={Colors.warm100} onPress={() => setSeverity('minor')} />
          </View>

          <TouchableOpacity style={styles.photoBtn} onPress={addPhoto} activeOpacity={0.8}>
            <Camera size={14} color={Colors.terra500} strokeWidth={2} />
            <Text style={styles.photoBtnText}>
              {photoCount === 0
                ? 'Add photo'
                : `${photoCount} photo${photoCount === 1 ? '' : 's'} — add another`}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={styles.notesInput}
            placeholder="Notes (optional) — e.g. exact location, what you observed"
            placeholderTextColor={Colors.textTertiary}
            value={localNotes}
            onChangeText={setLocalNotes}
            onBlur={commitNotes}
            multiline
            numberOfLines={2}
          />
        </View>
      )}
    </View>
  );
}

function StatusPill({
  label, icon: Icon, color, bg, active, onPress,
}: {
  label: string;
  icon: typeof CheckCircle2;
  color: string;
  bg: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.statusPill, active && { backgroundColor: bg, borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Icon size={12} color={active ? color : Colors.textTertiary} strokeWidth={2.2} />
      <Text style={[styles.statusPillText, active && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SeverityChip({
  label, active, color, bg, onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.sevChip, active && { backgroundColor: bg, borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.sevChipText, active && { color, fontFamily: 'DMSans-SemiBold' }]}>{label}</Text>
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
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontFamily: 'DMSans-Bold', color: Colors.textPrimary },
  headerCount: {
    fontFamily: 'DMSans-SemiBold', fontSize: 12, color: Colors.terra500,
    minWidth: 36, textAlign: 'right',
  },

  content: { paddingTop: Spacing.lg, paddingHorizontal: 0 },

  walkStep: {
    fontFamily: 'DMSans-SemiBold', fontSize: 10, color: Colors.textTertiary,
    letterSpacing: 0.6, marginHorizontal: Spacing.xxl, marginBottom: 6,
  },
  walkBarTrack: {
    height: 3, borderRadius: 2,
    marginHorizontal: Spacing.xxl, marginBottom: 14,
    backgroundColor: Colors.warm200, overflow: 'hidden',
  },
  walkBarFill: {
    height: '100%', backgroundColor: Colors.terra500,
  },

  watchOutCard: {
    marginHorizontal: Spacing.xxl, padding: 12,
    backgroundColor: Colors.terra50, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.terra100,
  },
  watchOutHead: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6,
  },
  watchOutLabel: {
    fontFamily: 'DMSans-SemiBold', fontSize: 10, color: Colors.terra600, letterSpacing: 0.6,
    flexShrink: 1,
  },
  watchOutText: {
    fontFamily: 'DMSans-Regular', fontSize: 12,
    color: Colors.textPrimary, lineHeight: 17,
  },

  subCatBlock: { marginTop: 20 },
  subCatLabel: {
    fontSize: 10, fontFamily: 'DMSans-SemiBold', color: Colors.terra600,
    letterSpacing: 0.9, marginHorizontal: Spacing.xxl, marginBottom: 8,
  },
  subCatCard: {
    marginHorizontal: Spacing.xxl,
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200,
    paddingHorizontal: 14,
  },
  rowDivider: {
    height: 1, backgroundColor: Colors.warm100,
  },

  checkRow: {
    paddingVertical: 14,
  },
  checkRowDefect: {
    // No background change at row level to keep the card clean.
  },
  checkLabel: {
    fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.textPrimary,
  },
  checkHint: {
    fontFamily: 'DMSans-Regular', fontSize: 11,
    color: Colors.textSecondary, marginTop: 3, lineHeight: 16,
  },

  statusRow: {
    flexDirection: 'row', gap: 6, marginTop: 10,
  },
  statusPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.warm200, backgroundColor: Colors.white,
  },
  statusPillText: {
    fontFamily: 'DMSans-Medium', fontSize: 12, color: Colors.textTertiary,
  },

  defectBlock: {
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#FECACA',
  },
  defectLabel: {
    fontFamily: 'DMSans-SemiBold', fontSize: 9, color: Colors.textTertiary,
    letterSpacing: 0.6, marginBottom: 6,
  },
  sevRow: {
    flexDirection: 'row', gap: 6, marginBottom: 10,
  },
  sevChip: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.warm200, backgroundColor: Colors.white,
    alignItems: 'center',
  },
  sevChipText: {
    fontFamily: 'DMSans-Medium', fontSize: 12, color: Colors.textSecondary,
  },

  photoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.terra200, backgroundColor: Colors.terra50,
    marginBottom: 10,
  },
  photoBtnText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 12, color: Colors.terra500,
  },

  notesInput: {
    padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.warm200, backgroundColor: Colors.warm50,
    fontFamily: 'DMSans-Regular', fontSize: 12, color: Colors.textPrimary,
    minHeight: 52,
    textAlignVertical: 'top',
  },

  // ── Footer nav (Prev / Next room) ─────────────────────────────────
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.xxl, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: Colors.warm100, backgroundColor: Colors.white,
  },
  navBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10,
    backgroundColor: Colors.cream,
  },
  navBtnText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 13, color: Colors.terra500,
  },
  navBtnPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10,
    backgroundColor: Colors.terra500,
  },
  navBtnPrimaryText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 13, color: Colors.white,
  },
  navBtnDisabled: { opacity: 0.5 },
  navBtnTextDisabled: { color: Colors.warm400 },
});
