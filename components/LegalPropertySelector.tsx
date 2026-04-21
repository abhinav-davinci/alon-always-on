import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Pressable,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  FilePlus,
  Check,
  X,
  Building2,
} from 'lucide-react-native';
import { Colors, Spacing } from '../constants/theme';
import { useOnboardingStore } from '../store/onboarding';
import { useHaptics } from '../hooks/useHaptics';
import { resolveLegalProperty, type ResolvedLegalProperty } from '../utils/legalProperty';

interface Props {
  /** Current selection. `null` is a valid state (empty — user hasn't picked). */
  activePropertyId: string | null;
  /** Fires with the newly-selected property's id (shortlist, user, or external). */
  onChange: (id: string) => void;
  /**
   * Fires when the user picks "Analyze a different property" in the sheet.
   * Parent is expected to create a placeholder external property (empty
   * name/location), set it active, and enter the upload-ready state.
   * Details will be auto-extracted from the uploaded agreement.
   */
  onStartExternalUpload: () => void;
}

/**
 * LegalPropertySelector — the selector card + bottom sheet that replaces
 * the old "locked property" card on the Legal Analysis screen.
 *
 * Philosophy (see project_legal_plan / Legal-as-independent-step design):
 * Legal is a standalone service. The user picks a property (from any
 * source, including one ALON has never seen), uploads an agreement, and
 * gets analysis. The selector is the entry point to all three sources.
 *
 * Note: For "different" (external) properties, we do NOT ask the user to
 * type project details — the agreement they're about to upload already
 * contains everything we need. The parser fills those fields post-upload.
 */
export default function LegalPropertySelector({
  activePropertyId,
  onChange,
  onStartExternalUpload,
}: Props) {
  const haptics = useHaptics();
  const {
    negotiatePropertyId,
    likedPropertyIds,
    userProperties,
    externalProperties,
  } = useOnboardingStore();

  const [sheetOpen, setSheetOpen] = useState(false);

  const active = useMemo(
    () => resolveLegalProperty({ userProperties, externalProperties }, activePropertyId),
    [activePropertyId, userProperties, externalProperties],
  );

  // Pending-external: user picked "Analyze a different property" but hasn't
  // uploaded yet, so the record exists but has no name/location. Render a
  // specific placeholder state — not the empty "choose a property" card.
  const isPendingExternal = active?.source === 'external' && !active.name;

  const openSheet = useCallback(() => {
    haptics.light();
    setSheetOpen(true);
  }, [haptics]);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
  }, []);

  const handlePick = useCallback(
    (id: string) => {
      haptics.selection();
      onChange(id);
      setSheetOpen(false);
    },
    [haptics, onChange],
  );

  const handleStartExternal = useCallback(() => {
    haptics.selection();
    setSheetOpen(false);
    onStartExternalUpload();
  }, [haptics, onStartExternalUpload]);

  return (
    <>
      {/* ── Selector card ── */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={openSheet}
        style={[styles.card, (!active || isPendingExternal) && styles.cardEmpty]}
      >
        {isPendingExternal ? (
          <>
            <View style={[styles.image, styles.imagePlaceholder]}>
              <FilePlus size={22} color={Colors.terra500} strokeWidth={1.8} />
            </View>
            <View style={styles.info}>
              <Text style={styles.label}>ANALYZING FOR</Text>
              <Text style={styles.name}>New property</Text>
              <Text style={styles.meta} numberOfLines={1}>
                Details will be pulled from your agreement
              </Text>
            </View>
            <View style={styles.changeChip}>
              <Text style={styles.changeChipText}>Change</Text>
              <ChevronRight size={12} color={Colors.terra500} strokeWidth={2.2} />
            </View>
          </>
        ) : active ? (
          <>
            {active.image ? (
              <Image source={{ uri: active.image }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <Text style={styles.imageInitial}>{active.name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.label}>ANALYZING FOR</Text>
              <Text style={styles.name} numberOfLines={1}>{active.name}</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {active.location}{active.price ? ` · ${active.price}` : ''}
              </Text>
            </View>
            <View style={styles.changeChip}>
              <Text style={styles.changeChipText}>Change</Text>
              <ChevronRight size={12} color={Colors.terra500} strokeWidth={2.2} />
            </View>
          </>
        ) : (
          <>
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Building2 size={22} color={Colors.terra500} strokeWidth={1.8} />
            </View>
            <View style={styles.info}>
              <Text style={styles.label}>SELECT A PROPERTY</Text>
              <Text style={styles.name}>Choose a property to analyze</Text>
              <Text style={styles.meta} numberOfLines={1}>
                Pick from your shortlist or add a new one
              </Text>
            </View>
            <View style={styles.changeChip}>
              <ChevronRight size={12} color={Colors.terra500} strokeWidth={2.2} />
            </View>
          </>
        )}
      </TouchableOpacity>

      {/* ── Picker sheet ── */}
      <PropertyPickerSheet
        visible={sheetOpen}
        onClose={closeSheet}
        activePropertyId={activePropertyId}
        negotiatePropertyId={negotiatePropertyId}
        likedPropertyIds={likedPropertyIds}
        userProperties={userProperties}
        externalProperties={externalProperties}
        onPick={handlePick}
        onStartExternal={handleStartExternal}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Bottom sheet: 3 sources (Negotiate, Shortlist, Your added, External)
// ═══════════════════════════════════════════════════════════════════════

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  activePropertyId: string | null;
  negotiatePropertyId: string | null;
  likedPropertyIds: string[];
  userProperties: ReturnType<typeof useOnboardingStore.getState>['userProperties'];
  externalProperties: ReturnType<typeof useOnboardingStore.getState>['externalProperties'];
  onPick: (id: string) => void;
  onStartExternal: () => void;
}

function PropertyPickerSheet({
  visible,
  onClose,
  activePropertyId,
  negotiatePropertyId,
  likedPropertyIds,
  userProperties,
  externalProperties,
  onPick,
  onStartExternal,
}: SheetProps) {
  const insets = useSafeAreaInsets();

  // Resolve list sources.
  const negotiateProperty = useMemo(() => {
    if (!negotiatePropertyId) return null;
    return resolveLegalProperty({ userProperties, externalProperties }, negotiatePropertyId);
  }, [negotiatePropertyId, userProperties, externalProperties]);

  const shortlistItems = useMemo<ResolvedLegalProperty[]>(() => {
    return likedPropertyIds
      .filter((id) => id !== negotiatePropertyId) // don't duplicate the negotiate row
      .map((id) => resolveLegalProperty({ userProperties, externalProperties }, id))
      .filter((p): p is ResolvedLegalProperty => p !== null);
  }, [likedPropertyIds, negotiatePropertyId, userProperties, externalProperties]);

  const userAddedItems = useMemo<ResolvedLegalProperty[]>(() => {
    return userProperties
      .filter((p) => p.id !== negotiatePropertyId)
      .map((p) => resolveLegalProperty({ userProperties, externalProperties }, p.id))
      .filter((p): p is ResolvedLegalProperty => p !== null);
  }, [userProperties, negotiatePropertyId, externalProperties]);

  // Only show "previously analyzed" external properties that have been
  // populated (name !== empty). The pending placeholder shouldn't appear
  // as a pickable row — it IS the current selection.
  const externalItems = useMemo<ResolvedLegalProperty[]>(() => {
    return Object.keys(externalProperties)
      .map((id) => resolveLegalProperty({ userProperties, externalProperties }, id))
      .filter((p): p is ResolvedLegalProperty => p !== null && p.name.length > 0);
  }, [externalProperties, userProperties]);

  const panelMaxHeight = Dimensions.get('window').height * 0.82;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Panel sits directly inside the backdrop so its maxHeight (px)
          resolves against the full-screen backdrop. */}
      <View style={sheet.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[sheet.panel, { maxHeight: panelMaxHeight }]}>
          {/* Drag handle */}
          <View style={sheet.handle} />

          {/* Title + close */}
          <View style={sheet.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={sheet.title}>Choose a property</Text>
              <Text style={sheet.subtitle}>
                Which property is this agreement for?
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={sheet.closeBtn} activeOpacity={0.7}>
              <X size={18} color={Colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={[
              sheet.scrollContent,
              { paddingBottom: insets.bottom + 16 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* In Negotiate */}
            {negotiateProperty && (
              <SheetSection title="In Negotiate">
                <PropertyRow
                  property={negotiateProperty}
                  selected={negotiateProperty.id === activePropertyId}
                  onPress={() => onPick(negotiateProperty.id)}
                />
              </SheetSection>
            )}

            {/* From your shortlist */}
            {shortlistItems.length > 0 && (
              <SheetSection title="From your shortlist">
                {shortlistItems.map((p) => (
                  <PropertyRow
                    key={p.id}
                    property={p}
                    selected={p.id === activePropertyId}
                    onPress={() => onPick(p.id)}
                  />
                ))}
              </SheetSection>
            )}

            {/* Your added properties */}
            {userAddedItems.length > 0 && (
              <SheetSection title="Your added properties">
                {userAddedItems.map((p) => (
                  <PropertyRow
                    key={p.id}
                    property={p}
                    selected={p.id === activePropertyId}
                    onPress={() => onPick(p.id)}
                  />
                ))}
              </SheetSection>
            )}

            {/* External — previously analyzed agreements */}
            {externalItems.length > 0 && (
              <SheetSection title="Previously analyzed">
                {externalItems.map((p) => (
                  <PropertyRow
                    key={p.id}
                    property={p}
                    selected={p.id === activePropertyId}
                    onPress={() => onPick(p.id)}
                  />
                ))}
              </SheetSection>
            )}

            {/* Divider */}
            <View style={sheet.orRow}>
              <View style={sheet.orLine} />
              <Text style={sheet.orText}>or</Text>
              <View style={sheet.orLine} />
            </View>

            {/* Analyze a different property — auto-extract flow.
                No manual form: parser fills details from the uploaded agreement. */}
            <TouchableOpacity
              style={sheet.externalCta}
              onPress={onStartExternal}
              activeOpacity={0.85}
            >
              <View style={sheet.externalCtaIcon}>
                <FilePlus size={16} color={Colors.terra500} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sheet.externalCtaTitle}>Analyze a different property</Text>
                <Text style={sheet.externalCtaSub}>
                  Got a property outside ALON? Upload the agreement — I'll pull the details for you.
                </Text>
              </View>
              <ChevronRight size={16} color={Colors.terra500} strokeWidth={2} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Sheet subcomponents
// ═══════════════════════════════════════════════════════════════════════

function SheetSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={sheet.section}>
      <Text style={sheet.sectionTitle}>{title}</Text>
      <View style={sheet.sectionBody}>{children}</View>
    </View>
  );
}

function PropertyRow({
  property,
  selected,
  onPress,
}: {
  property: ResolvedLegalProperty;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[sheet.row, selected && sheet.rowSelected]}
    >
      {property.image ? (
        <Image source={{ uri: property.image }} style={sheet.rowImage} />
      ) : (
        <View style={[sheet.rowImage, sheet.rowImagePlaceholder]}>
          <Text style={sheet.rowImageInitial}>{property.name.charAt(0)}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={sheet.rowName} numberOfLines={1}>{property.name}</Text>
        <Text style={sheet.rowMeta} numberOfLines={1}>
          {property.location}{property.price ? ` · ${property.price}` : ''}
        </Text>
      </View>
      {selected ? (
        <View style={sheet.checkBadge}>
          <Check size={12} color={Colors.white} strokeWidth={3} />
        </View>
      ) : (
        <ChevronRight size={14} color={Colors.warm400} strokeWidth={2} />
      )}
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: Spacing.xxl,
    padding: 12,
    backgroundColor: Colors.cream,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warm200,
  },
  cardEmpty: {
    backgroundColor: Colors.terra50,
    borderColor: Colors.terra200,
    borderStyle: 'dashed',
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: Colors.warm100,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageInitial: {
    fontSize: 22,
    fontFamily: 'DMSerifDisplay',
    color: Colors.terra500,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textTertiary,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textPrimary,
  },
  meta: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: Colors.textSecondary,
    marginTop: 1,
  },
  changeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.terra200,
  },
  changeChipText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 11,
    color: Colors.terra500,
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    // Soft top shadow so the sheet reads as elevated above the dimmed page.
    shadowColor: '#0D1F4A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.warm200,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xxl,
    gap: 12,
    paddingBottom: 4,
  },
  title: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 22,
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.warm100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: 12,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 10,
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionBody: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: Colors.warm50,
    borderWidth: 1,
    borderColor: Colors.warm100,
  },
  rowSelected: {
    backgroundColor: Colors.terra50,
    borderColor: Colors.terra300,
  },
  rowImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.warm100,
  },
  rowImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowImageInitial: {
    fontSize: 18,
    fontFamily: 'DMSerifDisplay',
    color: Colors.terra500,
  },
  rowName: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  rowMeta: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.terra500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    marginBottom: 14,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.warm200,
  },
  orText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 11,
    color: Colors.textTertiary,
    letterSpacing: 0.4,
  },
  externalCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.terra50,
    borderWidth: 1,
    borderColor: Colors.terra200,
  },
  externalCtaIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  externalCtaTitle: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  externalCtaSub: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
