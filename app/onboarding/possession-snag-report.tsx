import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  FileText,
  Check,
  AlertTriangle,
  Calendar,
  Info,
  Sparkles,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/theme';
import {
  useOnboardingStore,
  type SnagFinding,
  type SnagCategory,
  type SnagSeverity,
} from '../../store/onboarding';
import { useHaptics } from '../../hooks/useHaptics';
import {
  generateRooms,
  type PropertyConfig,
  type RoomDef,
} from '../../constants/rooms';
import { resolveLegalProperty } from '../../utils/legalProperty';
import { RenamePropertySheet } from '../../components/RenamePropertySheet';

// ═══════════════════════════════════════════════════════════════════
// Snag Report — the "paper trail" preview.
//
// Serves as both a review surface for the user (see everything before
// sending) and the actual payload they share with the builder. Dual
// indexing: "By Room" (walkthrough / user's mental model) then "By
// Trade" (what the builder's electrician / plumber / mason each need
// to fix).
//
// The share flow uses React Native's built-in Share API, which opens
// the native share sheet on both iOS and Android. Content is plain
// text so it travels cleanly across WhatsApp / Email / Messages.
// Proper PDF generation would require `expo-print`; we'll add that
// when v2 merges to main.
// ═══════════════════════════════════════════════════════════════════

export default function PossessionSnagReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const {
    activeLegalPropertyId,
    possessions,
    userProperties,
    externalProperties,
    addSnagReportShare,
    updateExternalProperty,
  } = useOnboardingStore();

  const record = activeLegalPropertyId ? possessions[activeLegalPropertyId] : undefined;
  const config = record?.snagConfig;
  const property = resolveLegalProperty(
    { userProperties, externalProperties },
    activeLegalPropertyId,
  );

  // Checkbox default: on. Most users hitting this screen are about to
  // send — defaulting off would lose the paper trail the feature is
  // built around. They can untick explicitly if just previewing.
  const [recordDate, setRecordDate] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  // Inline "complete your property details" flow — lets the user add
  // name / location / builder without navigating away from the report
  // preview. Only meaningful for external properties (shortlist / user
  // records are authoritative and not editable here).
  const canEditProperty = property?.source === 'external';
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftLocation, setDraftLocation] = useState('');
  const [draftBuilder, setDraftBuilder] = useState('');

  const openDetailsSheet = () => {
    if (!property) return;
    haptics.light();
    // Pre-fill with current values (placeholder name collapses to blank
    // so the user isn't staring at "Your property" in the input).
    setDraftName(property.name === 'Your property' ? '' : property.name);
    setDraftLocation(property.location);
    setDraftBuilder(property.builderName ?? '');
    setDetailsSheetOpen(true);
  };
  const saveDetails = () => {
    if (!activeLegalPropertyId) return;
    const name = draftName.trim() || 'Your property';
    const location = draftLocation.trim();
    const builderName = draftBuilder.trim() || undefined;
    updateExternalProperty(activeLegalPropertyId, { name, location, builderName });
    haptics.success();
    setDetailsSheetOpen(false);
  };

  const rooms = useMemo(() => (config ? generateRooms(config) : []), [config]);

  // Group findings by room and by trade. Both views use the same
  // underlying defect set; just two indices.
  const { defects, byRoom, byTrade, severityCounts } = useMemo(() => {
    const findings = record?.findings ?? {};
    const defectList = Object.values(findings).filter((f) => f.status === 'defect');

    const roomMap = new Map<string, SnagFinding[]>();
    const tradeMap = new Map<SnagCategory, SnagFinding[]>();
    const sev = { critical: 0, major: 0, minor: 0 };

    for (const f of defectList) {
      if (f.severity === 'critical') sev.critical += 1;
      else if (f.severity === 'major') sev.major += 1;
      else sev.minor += 1;

      const rid = f.roomId ?? 'unassigned';
      if (!roomMap.has(rid)) roomMap.set(rid, []);
      roomMap.get(rid)!.push(f);

      if (!tradeMap.has(f.category)) tradeMap.set(f.category, []);
      tradeMap.get(f.category)!.push(f);
    }
    return {
      defects: defectList,
      byRoom: roomMap,
      byTrade: tradeMap,
      severityCounts: sev,
    };
  }, [record]);

  if (!config || !activeLegalPropertyId || !property) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={{ padding: 24, fontFamily: 'DMSans-Regular', color: Colors.textSecondary }}>
          Configure your home first to generate a report.
        </Text>
      </View>
    );
  }

  const prior = record?.snagReportShares ?? [];
  const today = new Date();
  const displayToday = today.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    haptics.success();

    try {
      // Record the share *before* opening the native sheet. Rationale:
      // the native share API on iOS/Android doesn't reliably tell us
      // whether the user completed the share — a cancelled share and
      // a successful share look the same. We treat the user's *intent*
      // (ticked checkbox + tapped the primary CTA) as the event, and
      // trust them to untick if they were just previewing.
      if (recordDate) {
        addSnagReportShare(activeLegalPropertyId, {
          sharedAt: toISODate(today),
          defectCount: defects.length,
        });
      }

      const reportText = buildReportText({
        property,
        config,
        rooms,
        byRoom,
        byTrade,
        defects,
        severityCounts,
        generatedAt: displayToday,
      });

      await Share.share({
        title: `Snag Report — ${property.name}`,
        message: reportText,
      });
    } catch (err: any) {
      Alert.alert('Share failed', err?.message ?? 'Unknown error while opening share sheet.');
    } finally {
      setIsSharing(false);
    }
  };

  const cleanInspection = defects.length === 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <FileText size={16} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.headerTitle}>Snag Report</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 160 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Inline nudge — any property detail still at its placeholder
            or empty? Prompt the user to complete them so the shared
            report reads as an official document. Non-blocking; user
            can scroll past. */}
        {canEditProperty && needsDetails(property) && (
          <Animated.View
            entering={FadeInDown.duration(260)}
            style={styles.nudgeCard}
          >
            <View style={styles.nudgeIcon}>
              <Sparkles size={14} color={Colors.terra500} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nudgeTitle}>Make this report official</Text>
              <Text style={styles.nudgeBody}>
                Add your project name, location, and builder — it'll appear on
                the report you share with the builder.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.nudgeBtn}
              onPress={openDetailsSheet}
              activeOpacity={0.85}
            >
              <Text style={styles.nudgeBtnText}>Complete</Text>
              <ChevronRight size={14} color={Colors.white} strokeWidth={2.2} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Paper-like report body ───────────────────────────────── */}
        <Animated.View entering={FadeIn.duration(280)} style={styles.paper}>
          {/* Report header */}
          <Text style={styles.paperEyebrow}>SNAG REPORT</Text>
          <Text style={styles.paperTitle}>{property.name}</Text>
          {property.builderName && (
            <Text style={styles.paperByline}>by {property.builderName}</Text>
          )}
          {(property.location || property.price) && (
            <Text style={styles.paperMeta}>
              {property.location}
              {property.location && property.price ? ' · ' : ''}
              {property.price ?? ''}
            </Text>
          )}
          <Text style={styles.paperGenerated}>Generated · {displayToday}</Text>

          <View style={styles.paperDivider} />

          {/* Summary stats */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryValue}>{defects.length}</Text>
              <Text style={styles.summaryLabel}>
                {defects.length === 1 ? 'Defect' : 'Defects'}
              </Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryValue}>{byRoom.size}</Text>
              <Text style={styles.summaryLabel}>
                {byRoom.size === 1 ? 'Area affected' : 'Areas affected'}
              </Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryValue}>{rooms.length}</Text>
              <Text style={styles.summaryLabel}>Areas total</Text>
            </View>
          </View>

          {/* Severity dots */}
          {!cleanInspection && (
            <View style={styles.severityRow}>
              <SeverityDot color={Colors.red500} label="Critical" count={severityCounts.critical} />
              <SeverityDot color="#C2410C" label="Major" count={severityCounts.major} />
              <SeverityDot color={Colors.warm600} label="Minor" count={severityCounts.minor} />
            </View>
          )}

          {cleanInspection && (
            <View style={styles.cleanBanner}>
              <Check size={14} color={Colors.green500} strokeWidth={2.5} />
              <Text style={styles.cleanBannerText}>
                All areas reviewed. No defects logged — ready for handover.
              </Text>
            </View>
          )}

          {/* ── BY ROOM ────────────────────────────────────────────── */}
          {!cleanInspection && (
            <>
              <View style={styles.paperDivider} />
              <Text style={styles.sectionHeader}>BY ROOM · WALKTHROUGH</Text>
              {rooms
                .filter((room) => byRoom.has(room.id))
                .map((room) => (
                  <RoomSection
                    key={room.id}
                    room={room}
                    findings={byRoom.get(room.id) ?? []}
                  />
                ))}

              {/* ── BY TRADE ─────────────────────────────────────── */}
              <View style={styles.paperDivider} />
              <Text style={styles.sectionHeader}>BY TRADE · FOR BUILDER</Text>
              {Array.from(byTrade.entries()).map(([category, findings]) => (
                <TradeSection
                  key={category}
                  category={category}
                  findings={findings}
                  rooms={rooms}
                />
              ))}
            </>
          )}

          {/* ── Footer ──────────────────────────────────────────── */}
          <View style={styles.paperDivider} />
          <Text style={styles.paperFooter}>
            Generated by ALON · alon.app · Prepared for sharing with builder.
            Recipients may use this to dispatch trade-specific follow-ups.
          </Text>
        </Animated.View>

        {/* ── Share history ────────────────────────────────────────── */}
        {prior.length > 0 && (
          <Animated.View entering={FadeInDown.delay(120).duration(260)} style={styles.historyCard}>
            <View style={styles.historyHead}>
              <Calendar size={12} color={Colors.terra500} strokeWidth={2} />
              <Text style={styles.historyTitle}>PREVIOUSLY SHARED</Text>
            </View>
            {prior
              .slice()
              .reverse()
              .map((s, i) => (
                <Text key={i} style={styles.historyRow}>
                  {formatShareDate(s.sharedAt)} · {s.defectCount} defect
                  {s.defectCount === 1 ? '' : 's'} on record
                </Text>
              ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* Sticky bottom bar — checkbox + primary CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={styles.recordRow}
          onPress={() => {
            haptics.selection();
            setRecordDate((v) => !v);
          }}
          activeOpacity={0.75}
        >
          <View style={[styles.checkbox, recordDate && styles.checkboxActive]}>
            {recordDate && <Check size={12} color={Colors.white} strokeWidth={3} />}
          </View>
          <Text style={styles.recordText}>
            Record today ({displayToday}) as the date I shared this
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShare}
          activeOpacity={0.88}
          disabled={isSharing}
        >
          <Share2 size={15} color={Colors.white} strokeWidth={2.2} />
          <Text style={styles.shareBtnText}>
            {isSharing ? 'Opening…' : 'Share with builder'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Details sheet — reachable from the nudge card. Mirrors the
          one on Possession home so the pattern is consistent. */}
      <RenamePropertySheet
        visible={detailsSheetOpen}
        name={draftName}
        location={draftLocation}
        builder={draftBuilder}
        onName={setDraftName}
        onLocation={setDraftLocation}
        onBuilder={setDraftBuilder}
        onSave={saveDetails}
        onClose={() => setDetailsSheetOpen(false)}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Sections
// ═══════════════════════════════════════════════════════════════════

function RoomSection({
  room,
  findings,
}: {
  room: RoomDef;
  findings: SnagFinding[];
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{room.label}</Text>
        <Text style={styles.sectionCount}>
          {findings.length} defect{findings.length === 1 ? '' : 's'}
        </Text>
      </View>
      {findings.map((f, i) => (
        <FindingRow key={`${f.roomId}-${f.checkItemId}-${i}`} finding={f} roomLabel={null} />
      ))}
    </View>
  );
}

function TradeSection({
  category,
  findings,
  rooms,
}: {
  category: SnagCategory;
  findings: SnagFinding[];
  rooms: RoomDef[];
}) {
  const label = TRADE_LABELS[category] ?? category;
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{label}</Text>
        <Text style={styles.sectionCount}>
          {findings.length} issue{findings.length === 1 ? '' : 's'}
        </Text>
      </View>
      {findings.map((f, i) => {
        const roomLabel = f.roomId
          ? rooms.find((r) => r.id === f.roomId)?.label ?? null
          : null;
        return (
          <FindingRow
            key={`${f.roomId}-${f.checkItemId}-${i}`}
            finding={f}
            roomLabel={roomLabel}
          />
        );
      })}
    </View>
  );
}

function FindingRow({
  finding,
  roomLabel,
}: {
  finding: SnagFinding;
  roomLabel: string | null;
}) {
  const sevColor = SEVERITY_COLORS[finding.severity ?? 'minor'];
  return (
    <View style={styles.findingRow}>
      <View style={[styles.findingBullet, { backgroundColor: sevColor }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.findingLabel}>
          {/* Use checkItemId as the fallback label — the preview still
              reads well since the ID is slug-like. Full human labels
              would require joining findings back to the RoomDef atoms
              — keep that out of v1 prototype scope. */}
          {humanize(finding.checkItemId)}
        </Text>
        {roomLabel && (
          <Text style={styles.findingMeta}>{roomLabel}</Text>
        )}
        {finding.notes ? (
          <Text style={styles.findingNote}>"{finding.notes}"</Text>
        ) : null}
        <View style={styles.findingTags}>
          <View style={[styles.sevTag, { backgroundColor: sevColor + '22' }]}>
            <Text style={[styles.sevTagText, { color: sevColor }]}>
              {(finding.severity ?? 'minor').toUpperCase()}
            </Text>
          </View>
          {finding.photoCount > 0 && (
            <Text style={styles.photoTag}>
              {finding.photoCount} photo{finding.photoCount === 1 ? '' : 's'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function SeverityDot({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <View style={styles.sevCell}>
      <View style={[styles.sevDot, { backgroundColor: color }]} />
      <Text style={styles.sevCellLabel}>{label}</Text>
      <Text style={[styles.sevCellValue, { color }]}>{count}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

const TRADE_LABELS: Record<SnagCategory, string> = {
  structural: 'Structural',
  flooring: 'Flooring',
  walls: 'Walls & Paint',
  'doors-windows': 'Doors & Windows',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  kitchen: 'Kitchen',
  balconies: 'Balconies & Terrace',
  common: 'Common Areas',
};

const SEVERITY_COLORS: Record<SnagSeverity, string> = {
  critical: '#DC2626',
  major: '#C2410C',
  minor: '#8B7355',
};

/** True when any user-facing property detail is at its placeholder or
 *  empty. Used to decide whether to show the "Make this report official"
 *  nudge card at the top of the preview. */
function needsDetails(
  p: { name: string; location: string; builderName?: string },
): boolean {
  return (
    p.name === 'Your property'
    || p.name.trim() === ''
    || p.location.trim() === ''
    || !p.builderName
    || p.builderName.trim() === ''
  );
}

function humanize(id: string): string {
  return id
    .split('-')
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatShareDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

/** Compose a plain-text report payload for the native share sheet.
 *  Plain text travels across WhatsApp, Email, Messages, Slack, etc.
 *  without any native-package dependency. */
function buildReportText({
  property,
  config,
  rooms,
  byRoom,
  byTrade,
  defects,
  severityCounts,
  generatedAt,
}: {
  property: { name: string; location: string; price?: string; builderName?: string };
  config: PropertyConfig;
  rooms: RoomDef[];
  byRoom: Map<string, SnagFinding[]>;
  byTrade: Map<SnagCategory, SnagFinding[]>;
  defects: SnagFinding[];
  severityCounts: { critical: number; major: number; minor: number };
  generatedAt: string;
}): string {
  const lines: string[] = [];
  lines.push(`SNAG REPORT — ${property.name}`);
  if (property.builderName) lines.push(`by ${property.builderName}`);
  if (property.location) lines.push(property.location);
  lines.push(`Generated ${generatedAt}`);
  lines.push('');
  lines.push(`${config.bhk} ${config.type.replace('-', ' ')} · ${rooms.length} areas · ${defects.length} defect${defects.length === 1 ? '' : 's'}`);
  if (defects.length > 0) {
    lines.push(
      `Severity — Critical ${severityCounts.critical} · Major ${severityCounts.major} · Minor ${severityCounts.minor}`,
    );
  }
  lines.push('');

  if (defects.length === 0) {
    lines.push('All areas reviewed. No defects logged.');
    lines.push('');
    lines.push('— Generated by ALON (alon.app)');
    return lines.join('\n');
  }

  lines.push('──────── BY ROOM ────────');
  for (const room of rooms) {
    const list = byRoom.get(room.id);
    if (!list || list.length === 0) continue;
    lines.push('');
    lines.push(`${room.label} — ${list.length} defect${list.length === 1 ? '' : 's'}`);
    for (const f of list) {
      lines.push(
        `  • ${humanize(f.checkItemId)} [${(f.severity ?? 'minor').toUpperCase()}]${
          f.photoCount > 0 ? ` · ${f.photoCount} photo${f.photoCount === 1 ? '' : 's'}` : ''
        }`,
      );
      if (f.notes) lines.push(`    "${f.notes}"`);
    }
  }

  lines.push('');
  lines.push('──────── BY TRADE ────────');
  for (const [cat, list] of byTrade.entries()) {
    if (list.length === 0) continue;
    lines.push('');
    lines.push(`${TRADE_LABELS[cat] ?? cat} — ${list.length} issue${list.length === 1 ? '' : 's'}`);
    for (const f of list) {
      const roomLabel = f.roomId ? rooms.find((r) => r.id === f.roomId)?.label ?? null : null;
      lines.push(
        `  • ${humanize(f.checkItemId)}${roomLabel ? ` (${roomLabel})` : ''} [${(f.severity ?? 'minor').toUpperCase()}]`,
      );
      if (f.notes) lines.push(`    "${f.notes}"`);
    }
  }

  lines.push('');
  lines.push('— Generated by ALON (alon.app)');
  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.warm50 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.warm100,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 17, fontFamily: 'DMSans-Bold', color: Colors.textPrimary },

  content: { paddingTop: Spacing.lg, paddingHorizontal: Spacing.xxl },

  // ── Nudge card — "Make this report official" ───────────────────────
  // Appears above the paper when property details are still at their
  // placeholder values (name = "Your property" / empty location /
  // missing builder). Dismissed implicitly by completing the details.
  nudgeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, marginBottom: 12, borderRadius: 12,
    backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.warm200,
  },
  nudgeIcon: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: Colors.terra50,
    alignItems: 'center', justifyContent: 'center',
  },
  nudgeTitle: {
    fontFamily: 'DMSans-SemiBold', fontSize: 13, color: Colors.textPrimary,
  },
  nudgeBody: {
    fontFamily: 'DMSans-Regular', fontSize: 11, color: Colors.textSecondary,
    marginTop: 2, lineHeight: 15,
  },
  nudgeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8,
    backgroundColor: Colors.terra500,
  },
  nudgeBtnText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 11, color: Colors.white,
  },

  // ── Paper (the "PDF preview") ──────────────────────────────────────
  paper: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200,
    padding: 20,
    shadowColor: '#0D1F4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 12,
    elevation: 3,
  },
  paperEyebrow: {
    fontFamily: 'DMSans-SemiBold', fontSize: 10,
    color: Colors.terra500, letterSpacing: 1.2,
  },
  paperTitle: {
    fontFamily: 'DMSerifDisplay', fontSize: 22, color: Colors.textPrimary,
    lineHeight: 26, marginTop: 6,
  },
  // "by {Builder}" line under the property name — classic document
  // attribution. Italic + muted so it reads as a byline, not a title.
  paperByline: {
    fontFamily: 'DMSans-Regular', fontSize: 12, color: Colors.textSecondary,
    marginTop: 2, fontStyle: 'italic',
  },
  paperMeta: {
    fontFamily: 'DMSans-Regular', fontSize: 12, color: Colors.textSecondary,
    marginTop: 3,
  },
  paperGenerated: {
    fontFamily: 'DMSans-Regular', fontSize: 11, color: Colors.textTertiary,
    marginTop: 4,
  },
  paperDivider: {
    height: 1, backgroundColor: Colors.warm200, marginVertical: 16,
  },
  paperFooter: {
    fontFamily: 'DMSans-Regular', fontSize: 10, color: Colors.textTertiary,
    lineHeight: 15, fontStyle: 'italic',
  },

  // ── Summary ────────────────────────────────────────────────────────
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryCell: {
    flex: 1, padding: 10, borderRadius: 10,
    backgroundColor: Colors.cream,
    alignItems: 'center',
  },
  summaryValue: {
    fontFamily: 'DMSerifDisplay', fontSize: 22, color: Colors.textPrimary,
  },
  summaryLabel: {
    fontFamily: 'DMSans-Regular', fontSize: 10, color: Colors.textSecondary,
    marginTop: 2, textAlign: 'center',
  },

  severityRow: {
    flexDirection: 'row', gap: 8, marginTop: 12,
  },
  sevCell: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8,
    backgroundColor: Colors.warm50, borderWidth: 1, borderColor: Colors.warm200,
  },
  sevDot: { width: 8, height: 8, borderRadius: 4 },
  sevCellLabel: {
    flex: 1, fontFamily: 'DMSans-Medium', fontSize: 11, color: Colors.textSecondary,
  },
  sevCellValue: { fontFamily: 'DMSans-SemiBold', fontSize: 13 },

  cleanBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, marginTop: 12,
    backgroundColor: Colors.green100, borderWidth: 1, borderColor: '#BBF7D0',
  },
  cleanBannerText: {
    flex: 1, fontFamily: 'DMSans-Medium', fontSize: 12, color: Colors.green500, lineHeight: 17,
  },

  // ── Sections ──────────────────────────────────────────────────────
  sectionHeader: {
    fontFamily: 'DMSans-SemiBold', fontSize: 11, color: Colors.terra500,
    letterSpacing: 0.9, marginBottom: 12,
  },
  section: { marginBottom: 18 },
  sectionTitleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.textPrimary,
  },
  sectionCount: {
    fontFamily: 'DMSans-Medium', fontSize: 11, color: Colors.textTertiary,
  },

  findingRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: Colors.warm100,
  },
  findingBullet: {
    width: 6, height: 6, borderRadius: 3, marginTop: 6,
  },
  findingLabel: {
    fontFamily: 'DMSans-Medium', fontSize: 13, color: Colors.textPrimary,
  },
  findingMeta: {
    fontFamily: 'DMSans-Regular', fontSize: 10, color: Colors.textTertiary, marginTop: 1,
  },
  findingNote: {
    fontFamily: 'DMSans-Regular', fontSize: 11, color: Colors.textSecondary,
    marginTop: 3, fontStyle: 'italic',
  },
  findingTags: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5,
  },
  sevTag: {
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5,
  },
  sevTagText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 8, letterSpacing: 0.4,
  },
  photoTag: {
    fontFamily: 'DMSans-Regular', fontSize: 10, color: Colors.textTertiary,
  },

  // ── Share history card ────────────────────────────────────────────
  historyCard: {
    marginTop: 14, padding: 12, borderRadius: 12,
    backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.warm200,
  },
  historyHead: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6,
  },
  historyTitle: {
    fontFamily: 'DMSans-SemiBold', fontSize: 10, color: Colors.terra500, letterSpacing: 0.9,
  },
  historyRow: {
    fontFamily: 'DMSans-Regular', fontSize: 12, color: Colors.textPrimary, marginTop: 4,
  },

  // ── Sticky footer ─────────────────────────────────────────────────
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: Spacing.xxl, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.warm100, backgroundColor: Colors.white,
    gap: 10,
  },
  recordRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 1.5, borderColor: Colors.warm300,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.terra500, borderColor: Colors.terra500,
  },
  recordText: {
    flex: 1, fontFamily: 'DMSans-Regular', fontSize: 12, color: Colors.textSecondary,
    lineHeight: 17,
  },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.terra500,
  },
  shareBtnText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.white,
  },
});
