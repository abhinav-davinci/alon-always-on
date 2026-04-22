import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  FileText,
  Info,
  CheckCircle2,
  Circle,
  AlertTriangle,
  X,
} from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/theme';
import {
  useOnboardingStore,
  type PossessionDocKey,
  type PossessionDocStatus,
} from '../../store/onboarding';
import { useHaptics } from '../../hooks/useHaptics';
import {
  POSSESSION_DOCUMENTS,
  POSSESSION_DOCUMENT_MAP,
} from '../../constants/possession';

// ═══════════════════════════════════════════════════════════════
// Document vault — 12 handover documents. Each row shows status
// (received / pending / n/a). Tap a row → detail sheet with source,
// why-it-matters, and red-flag notes. From the sheet the user can
// mark received / pending / n/a.
// ═══════════════════════════════════════════════════════════════

export default function PossessionDocumentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const { activeLegalPropertyId, possessions } = useOnboardingStore();
  const [sheetKey, setSheetKey] = useState<PossessionDocKey | null>(null);

  const docs = activeLegalPropertyId
    ? possessions[activeLegalPropertyId]?.documents ?? {}
    : {};

  const received = POSSESSION_DOCUMENTS.filter((d) => docs[d.key] === 'received').length;
  const ocPending = (docs.oc ?? 'pending') !== 'received';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <FileText size={16} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.headerTitle}>Document Vault</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <Animated.View entering={FadeIn.duration(260)} style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {received} of {POSSESSION_DOCUMENTS.length} received
          </Text>
          <Text style={styles.summarySub}>
            Mark each document as received, pending, or not applicable. Tap a row for
            source + why it matters.
          </Text>
          <View style={styles.summaryBarTrack}>
            <View style={[styles.summaryBarFill, {
              width: `${(received / POSSESSION_DOCUMENTS.length) * 100}%` as any,
            }]} />
          </View>
        </Animated.View>

        {ocPending && (
          <View style={styles.ocWarn}>
            <AlertTriangle size={14} color="#C2410C" strokeWidth={2} />
            <Text style={styles.ocWarnText}>
              <Text style={styles.ocWarnBold}>OC is the blocker.</Text> Don't accept keys
              without the Occupation Certificate in hand.
            </Text>
          </View>
        )}

        {/* Document list */}
        <Text style={styles.sectionLabel}>DOCUMENTS</Text>
        {POSSESSION_DOCUMENTS.map((doc) => {
          const status: PossessionDocStatus = docs[doc.key] ?? 'pending';
          return (
            <TouchableOpacity
              key={doc.key}
              style={styles.docRow}
              onPress={() => {
                haptics.light();
                setSheetKey(doc.key);
              }}
              activeOpacity={0.85}
            >
              <StatusIcon status={status} />
              <View style={{ flex: 1 }}>
                <Text style={styles.docLabel}>{doc.label}</Text>
                <Text style={styles.docSource}>From: {doc.source}</Text>
              </View>
              <StatusPill status={status} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Detail sheet */}
      {sheetKey && (
        <DocDetailSheet
          docKey={sheetKey}
          status={docs[sheetKey] ?? 'pending'}
          onClose={() => setSheetKey(null)}
          propertyId={activeLegalPropertyId}
        />
      )}
    </View>
  );
}

function StatusIcon({ status }: { status: PossessionDocStatus }) {
  if (status === 'received') {
    return (
      <View style={[styles.statusIcon, { backgroundColor: Colors.green100 }]}>
        <CheckCircle2 size={14} color={Colors.green500} strokeWidth={2.5} />
      </View>
    );
  }
  if (status === 'na') {
    return (
      <View style={[styles.statusIcon, { backgroundColor: Colors.warm100 }]}>
        <Circle size={12} color={Colors.textTertiary} strokeWidth={2.5} />
      </View>
    );
  }
  return (
    <View style={[styles.statusIcon, { backgroundColor: Colors.terra50 }]}>
      <Circle size={12} color={Colors.terra500} strokeWidth={2.5} />
    </View>
  );
}

function StatusPill({ status }: { status: PossessionDocStatus }) {
  const { label, color, bg } =
    status === 'received' ? { label: 'Received', color: Colors.green500, bg: Colors.green100 } :
    status === 'na'       ? { label: 'N/A',      color: Colors.textTertiary, bg: Colors.warm100 } :
                             { label: 'Pending',  color: Colors.terra500, bg: Colors.terra50 };
  return (
    <View style={[styles.statusPill, { backgroundColor: bg }]}>
      <Text style={[styles.statusPillText, { color }]}>{label}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// Doc detail sheet
// ═══════════════════════════════════════════════════════════════

function DocDetailSheet({
  docKey, status, onClose, propertyId,
}: {
  docKey: PossessionDocKey;
  status: PossessionDocStatus;
  onClose: () => void;
  propertyId: string | null;
}) {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const setPossessionDocument = useOnboardingStore((s) => s.setPossessionDocument);
  const doc = POSSESSION_DOCUMENT_MAP[docKey];

  const setStatus = (next: PossessionDocStatus) => {
    if (!propertyId) return;
    haptics.success();
    setPossessionDocument(propertyId, docKey, next);
    onClose();
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={sheet.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[sheet.panel, { paddingBottom: insets.bottom + 16 }]}>
          <View style={sheet.handle} />

          <View style={sheet.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={sheet.title}>{doc.label}</Text>
              <Text style={sheet.source}>Issued by: {doc.source}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={sheet.closeBtn} activeOpacity={0.7}>
              <X size={18} color={Colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={sheet.body}>
            <View style={sheet.section}>
              <Text style={sheet.sectionLabel}>WHY IT MATTERS</Text>
              <Text style={sheet.sectionText}>{doc.whyItMatters}</Text>
            </View>

            {doc.redFlag && (
              <View style={sheet.redFlagCard}>
                <AlertTriangle size={13} color="#C2410C" strokeWidth={2} />
                <Text style={sheet.redFlagText}>{doc.redFlag}</Text>
              </View>
            )}

            <Text style={sheet.sectionLabel}>STATUS</Text>
            <View style={sheet.statusBtnRow}>
              <StatusActionBtn
                label="Mark received"
                active={status === 'received'}
                color={Colors.green500}
                bg={Colors.green100}
                onPress={() => setStatus('received')}
              />
              <StatusActionBtn
                label="Pending"
                active={status === 'pending'}
                color={Colors.terra500}
                bg={Colors.terra50}
                onPress={() => setStatus('pending')}
              />
              <StatusActionBtn
                label="N/A"
                active={status === 'na'}
                color={Colors.textTertiary}
                bg={Colors.warm100}
                onPress={() => setStatus('na')}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function StatusActionBtn({
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
      style={[sheet.statusActionBtn, active && { backgroundColor: bg, borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[sheet.statusActionText, active && { color, fontFamily: 'DMSans-SemiBold' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.warm100,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 17, fontFamily: 'DMSans-Bold', color: Colors.textPrimary },

  content: { paddingTop: Spacing.lg },

  summaryCard: {
    marginHorizontal: Spacing.xxl, padding: 14,
    backgroundColor: Colors.cream, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200,
  },
  summaryTitle: { fontFamily: 'DMSerifDisplay', fontSize: 20, color: Colors.textPrimary },
  summarySub: {
    fontFamily: 'DMSans-Regular', fontSize: 12, color: Colors.textSecondary,
    marginTop: 4, marginBottom: 10, lineHeight: 17,
  },
  summaryBarTrack: {
    height: 4, borderRadius: 2,
    backgroundColor: Colors.warm200, overflow: 'hidden',
  },
  summaryBarFill: {
    height: '100%', backgroundColor: Colors.terra500,
  },

  ocWarn: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: Spacing.xxl, marginTop: 12,
    padding: 12, borderRadius: 10,
    backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA',
  },
  ocWarnText: {
    flex: 1, fontFamily: 'DMSans-Regular', fontSize: 12,
    color: '#991B1B', lineHeight: 17,
  },
  ocWarnBold: { fontFamily: 'DMSans-SemiBold' },

  sectionLabel: {
    fontSize: 10, fontFamily: 'DMSans-SemiBold', color: Colors.textTertiary,
    letterSpacing: 0.8, marginHorizontal: Spacing.xxl, marginTop: 20, marginBottom: 10,
  },

  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: Spacing.xxl, marginBottom: 8,
    padding: 12, backgroundColor: Colors.white, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.warm200,
  },
  statusIcon: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  docLabel: {
    fontFamily: 'DMSans-SemiBold', fontSize: 13, color: Colors.textPrimary,
  },
  docSource: {
    fontFamily: 'DMSans-Regular', fontSize: 11, color: Colors.textTertiary, marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  statusPillText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 10, letterSpacing: 0.3,
  },
});

const sheet = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(13,31,74,0.4)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 8,
    shadowColor: '#0D1F4A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08, shadowRadius: 20,
    elevation: 12,
  },
  handle: {
    alignSelf: 'center', width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.warm200, marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: Spacing.xxl, gap: 12, paddingBottom: 4,
  },
  title: {
    fontFamily: 'DMSerifDisplay', fontSize: 20, color: Colors.textPrimary, lineHeight: 24,
  },
  source: {
    fontFamily: 'DMSans-Regular', fontSize: 12, color: Colors.textSecondary,
    marginTop: 4,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.warm100,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  body: {
    paddingHorizontal: Spacing.xxl, paddingTop: 14,
  },
  section: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontFamily: 'DMSans-SemiBold', fontSize: 10, color: Colors.textTertiary,
    letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase',
  },
  sectionText: {
    fontFamily: 'DMSans-Regular', fontSize: 13,
    color: Colors.textPrimary, lineHeight: 19,
  },
  redFlagCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 12, borderRadius: 10, marginBottom: 14,
    backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA',
  },
  redFlagText: {
    flex: 1, fontFamily: 'DMSans-Medium', fontSize: 12,
    color: '#991B1B', lineHeight: 17,
  },
  statusBtnRow: {
    flexDirection: 'row', gap: 8, marginTop: 4,
  },
  statusActionBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.warm200, backgroundColor: Colors.white,
    alignItems: 'center',
  },
  statusActionText: {
    fontFamily: 'DMSans-Medium', fontSize: 12, color: Colors.textSecondary,
  },
});
