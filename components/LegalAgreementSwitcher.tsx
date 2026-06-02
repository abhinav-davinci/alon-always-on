import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { Plus, Check, ShieldCheck } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { Colors, Spacing } from '../constants/theme';
import { useOnboardingStore } from '../store/onboarding';
import { useHaptics } from '../hooks/useHaptics';
import { resolveLegalProperty, type ResolvedLegalProperty } from '../utils/legalProperty';
import { riskCountsForProperty } from '../constants/legalData';

// Beyond this many agreements the list scrolls in place instead of growing.
// VISIBLE_ROWS is intentionally a half-row so the cut-off row peeks — the
// clearest "there's more, scroll me" affordance.
const SCROLL_AFTER = 4;
const ROW_HEIGHT = 63;
const VISIBLE_ROWS = 3.5;
const LIST_MAX_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS;
const FADE_H = 28;

interface Props {
  /** Property ids that have a completed analysis, in display order. */
  analyzedIds: string[];
  /** Currently-selected agreement. */
  activeId: string | null;
  /** Switch to another analyzed agreement. */
  onSelect: (id: string) => void;
  /** Start analyzing a brand-new agreement (direct upload). */
  onAdd: () => void;
}

/**
 * LegalAgreementSwitcher — the persistent "Your agreements" list that shows
 * once at least one agreement has been analyzed. Each row is one analyzed
 * agreement; tapping it switches the analysis below. The header carries an
 * "Add" action that kicks off a fresh upload (unlimited).
 *
 * By design there is NO remove affordance — once an agreement is analyzed it
 * stays in the list. Users only ever add and switch.
 */
export default function LegalAgreementSwitcher({
  analyzedIds,
  activeId,
  onSelect,
  onAdd,
}: Props) {
  const haptics = useHaptics();
  const { userProperties, externalProperties } = useOnboardingStore();

  const agreements = useMemo<ResolvedLegalProperty[]>(
    () =>
      analyzedIds
        .map((id) => resolveLegalProperty({ userProperties, externalProperties }, id))
        .filter((p): p is ResolvedLegalProperty => p !== null),
    [analyzedIds, userProperties, externalProperties],
  );

  const handleSelect = (id: string) => {
    if (id === activeId) return;
    haptics.selection();
    onSelect(id);
  };

  const handleAdd = () => {
    haptics.medium();
    onAdd();
  };

  // ── Scroll-in-place when the list is long ──
  const scrollable = agreements.length > SCROLL_AFTER;
  const listRef = useRef<ScrollView>(null);
  const [atEnd, setAtEnd] = useState(false);

  // On mount (and whenever it becomes scrollable), bring the active row into
  // view so the user never opens to a list that hides their selection. Not
  // re-run on every tap — a tapped row is already visible, so no jump.
  useEffect(() => {
    if (!scrollable) return;
    const idx = agreements.findIndex((p) => p.id === activeId);
    if (idx < 0) return;
    const y = Math.max(0, idx * ROW_HEIGHT - LIST_MAX_HEIGHT / 2 + ROW_HEIGHT / 2);
    const t = setTimeout(() => listRef.current?.scrollTo({ y, animated: false }), 0);
    return () => clearTimeout(t);
  }, [scrollable]); // eslint-disable-line react-hooks/exhaustive-deps

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    setAtEnd(contentOffset.y + layoutMeasurement.height >= contentSize.height - 6);
  };

  return (
    <Animated.View entering={FadeIn.duration(260)} style={styles.wrap}>
      {/* Header: count + add */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>
          YOUR AGREEMENTS <Text style={styles.headerCount}>({agreements.length})</Text>
        </Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.85}>
          <Plus size={13} color={Colors.terra500} strokeWidth={2.4} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* List card — scrolls in place once past SCROLL_AFTER rows */}
      <View style={styles.card}>
        <ScrollView
          ref={listRef}
          style={scrollable ? { maxHeight: LIST_MAX_HEIGHT } : undefined}
          scrollEnabled={scrollable}
          nestedScrollEnabled
          showsVerticalScrollIndicator={scrollable}
          onScroll={scrollable ? onScroll : undefined}
          scrollEventThrottle={16}
        >
        {agreements.map((p, i) => {
          const isActive = p.id === activeId;
          const { high } = riskCountsForProperty(p.id);
          return (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.85}
              onPress={() => handleSelect(p.id)}
              style={[
                styles.row,
                i > 0 && styles.rowBorder,
                isActive && styles.rowActive,
              ]}
            >
              {/* Active accent rail */}
              {isActive && <View style={styles.activeRail} />}

              {/* Avatar */}
              {p.image ? (
                <Image source={{ uri: p.image }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>{p.name.charAt(0)}</Text>
                </View>
              )}

              {/* Name + meta */}
              <View style={styles.info}>
                <Text style={[styles.name, isActive && styles.nameActive]} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {p.location}{p.price ? ` · ${p.price}` : ''}
                </Text>
              </View>

              {/* Risk badge */}
              {high > 0 ? (
                <View style={styles.riskBadge}>
                  <Text style={styles.riskBadgeText}>{high} high</Text>
                </View>
              ) : (
                <View style={styles.cleanBadge}>
                  <ShieldCheck size={11} color="#16A34A" strokeWidth={2.2} />
                  <Text style={styles.cleanBadgeText}>Clean</Text>
                </View>
              )}

              {/* Active check */}
              {isActive && (
                <View style={styles.checkBadge}>
                  <Check size={11} color={Colors.white} strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        </ScrollView>

        {/* Bottom fade — reinforces "scroll for more"; hidden at the end. */}
        {scrollable && !atEnd && (
          <View pointerEvents="none" style={styles.fade}>
            <Svg width="100%" height={FADE_H}>
              <Defs>
                <SvgLinearGradient id="agFade" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={Colors.white} stopOpacity={0} />
                  <Stop offset="1" stopColor={Colors.white} stopOpacity={1} />
                </SvgLinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height={FADE_H} fill="url(#agFade)" />
            </Svg>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.xxl,
    marginBottom: 10,
  },
  headerTitle: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 10,
    color: Colors.textTertiary,
    letterSpacing: 0.8,
  },
  headerCount: {
    color: Colors.terra500,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.terra50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.terra200,
  },
  addBtnText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 12,
    color: Colors.terra500,
  },

  card: {
    marginHorizontal: Spacing.xxl,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warm200,
    overflow: 'hidden',
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: FADE_H,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.warm100,
  },
  rowActive: {
    backgroundColor: Colors.terra50,
  },
  activeRail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: Colors.terra500,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.warm100,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 17,
    fontFamily: 'DMSerifDisplay',
    color: Colors.terra500,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  nameActive: {
    color: Colors.terra600,
  },
  meta: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  riskBadgeText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 10,
    color: '#DC2626',
  },
  cleanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  cleanBadgeText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 10,
    color: '#16A34A',
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.terra500,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
