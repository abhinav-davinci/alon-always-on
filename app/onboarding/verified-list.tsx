import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  ChevronRight,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import AlonAvatar from '../../components/AlonAvatar';
import { Colors, Spacing } from '../../constants/theme';
import { useHaptics } from '../../hooks/useHaptics';

interface Property {
  id: string;
  name: string;
  area: string;
  price: string;
  size: string;
  image: string;
  rera: string;
  builderScore: number;
  hasConflict: boolean;
  conflictType?: string;
}

const PROPERTIES: Property[] = [
  { id: 'godrej-hillside', name: 'Godrej Hillside', area: 'Baner, Pune', price: '₹1.35 Cr', size: '3 BHK · 1,450 sq.ft', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=250&fit=crop', rera: 'P52100012345', builderScore: 4.5, hasConflict: false },
  { id: 'pride-world-city', name: 'Pride World City', area: 'Balewadi, Pune', price: '₹1.18 Cr', size: '3 BHK · 1,320 sq.ft', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=250&fit=crop', rera: 'P52100067890', builderScore: 4.2, hasConflict: false },
  { id: 'kolte-patil-24k', name: 'Kolte Patil 24K', area: 'Wakad, Pune', price: '₹98 L', size: '2 BHK · 1,050 sq.ft', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=250&fit=crop', rera: 'P52100034567', builderScore: 4.0, hasConflict: true, conflictType: 'Pending land title clarification' },
  { id: 'sobha-dream-acres', name: 'Sobha Dream Acres', area: 'Hinjewadi, Pune', price: '₹1.05 Cr', size: '2 BHK · 1,180 sq.ft', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop', rera: 'P52100045678', builderScore: 4.3, hasConflict: false },
  { id: 'panchshil-towers', name: 'Panchshil Towers', area: 'Kharadi, Pune', price: '₹1.42 Cr', size: '3 BHK · 1,520 sq.ft', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=250&fit=crop', rera: 'P52100056789', builderScore: 4.6, hasConflict: false },
];

type Phase = 'scanning' | 'summary' | 'list';

export default function VerifiedListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const [phase, setPhase] = useState<Phase>('scanning');
  const [checkedCount, setCheckedCount] = useState(0);

  // Sequential verification
  useEffect(() => {
    if (phase !== 'scanning') return;

    PROPERTIES.forEach((_, i) => {
      setTimeout(() => {
        setCheckedCount(i + 1);
        haptics.light();
      }, 800 + i * 700);
    });

    // Move to summary after all checked
    setTimeout(() => {
      haptics.success();
      setPhase('summary');
    }, 800 + PROPERTIES.length * 700 + 400);
  }, [phase]);

  const cleanCount = PROPERTIES.filter((p) => !p.hasConflict).length;
  const flaggedCount = PROPERTIES.filter((p) => p.hasConflict).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>ALON's verified list</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── PHASE 1: SCANNING ── */}
        {phase === 'scanning' && (
          <View>
            <View style={styles.scanHeader}>
              <View style={styles.avatarClip}>
                <AlonAvatar size={36} showRings={false} showBlink />
              </View>
              <Text style={styles.scanTitle}>Running safety checks...</Text>
              <Text style={styles.scanSubtitle}>
                Verifying RERA, court records & builder history
              </Text>
            </View>

            <View style={styles.checkList}>
              {PROPERTIES.map((p, i) => {
                const isChecked = i < checkedCount;
                const isChecking = i === checkedCount - 1 && checkedCount <= PROPERTIES.length;
                const isPending = i >= checkedCount;

                return (
                  <Animated.View
                    key={p.id}
                    style={styles.checkRow}
                    entering={FadeIn.delay(i * 100).duration(200)}
                  >
                    {/* Status icon */}
                    <View style={styles.checkIconWrap}>
                      {isChecked ? (
                        p.hasConflict ? (
                          <View style={styles.checkIconAlert}>
                            <AlertTriangle size={12} color="#D97706" strokeWidth={2.5} />
                          </View>
                        ) : (
                          <View style={styles.checkIconClean}>
                            <CheckCircle2 size={12} color="#16A34A" strokeWidth={2.5} />
                          </View>
                        )
                      ) : isPending ? (
                        <View style={styles.checkIconPending}>
                          <View style={styles.pendingDot} />
                        </View>
                      ) : (
                        <View style={styles.checkIconPending}>
                          <View style={styles.pulsingDot} />
                        </View>
                      )}
                    </View>

                    {/* Property name */}
                    <Text style={[
                      styles.checkName,
                      isPending && styles.checkNamePending,
                    ]}>{p.name}</Text>

                    {/* Status text */}
                    {isChecked && !p.hasConflict && (
                      <Text style={styles.checkStatusClean}>RERA ✓ Clean</Text>
                    )}
                    {isChecked && p.hasConflict && (
                      <Text style={styles.checkStatusAlert}>⚠ Flagged</Text>
                    )}
                    {isPending && (
                      <Text style={styles.checkStatusPending}>Pending</Text>
                    )}
                  </Animated.View>
                );
              })}
            </View>

            {/* Progress */}
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                {checkedCount} of {PROPERTIES.length} checked
              </Text>
            </View>
          </View>
        )}

        {/* ── PHASE 2: SUMMARY ── */}
        {phase === 'summary' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIcon}>
                <ShieldCheck size={28} color="#16A34A" strokeWidth={1.8} />
              </View>
              <Text style={styles.summaryTitle}>Verification complete</Text>
            </View>

            <View style={styles.summaryCards}>
              <View style={styles.summaryCardClean}>
                <Text style={styles.summaryCardNum}>{cleanCount}</Text>
                <Text style={styles.summaryCardLabel}>Clean{'\n'}properties</Text>
              </View>
              {flaggedCount > 0 && (
                <View style={styles.summaryCardAlert}>
                  <Text style={styles.summaryCardNumAlert}>{flaggedCount}</Text>
                  <Text style={styles.summaryCardLabelAlert}>Flagged{'\n'}issue</Text>
                </View>
              )}
            </View>

            <Text style={styles.summaryNote}>
              ALON checked all {PROPERTIES.length} properties against RERA database, court records, and builder history.
              {flaggedCount > 0 ? ` ${flaggedCount} property needs attention.` : ' All clear to proceed.'}
            </Text>

            <TouchableOpacity
              style={styles.viewListBtn}
              onPress={() => setPhase('list')}
              activeOpacity={0.85}
            >
              <Text style={styles.viewListBtnText}>View verified properties →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── PHASE 3: VERIFIED LIST ── */}
        {phase === 'list' && (
          <View>
            <Text style={styles.listSubtitle}>
              {cleanCount} clean · {flaggedCount} flagged
            </Text>

            {PROPERTIES.map((p, i) => (
              <Animated.View
                key={p.id}
                entering={FadeInDown.delay(i * 80).duration(300)}
              >
                <TouchableOpacity
                  style={styles.propertyCard}
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: '/onboarding/property-detail', params: { id: p.id } })}
                >
                  {/* Image + badge */}
                  <View style={styles.cardImage}>
                    <Image source={{ uri: p.image }} style={styles.cardImg} resizeMode="cover" />
                    <View style={[styles.verifiedBadge, p.hasConflict && styles.verifiedBadgeAlert]}>
                      {p.hasConflict ? (
                        <AlertTriangle size={10} color="#D97706" strokeWidth={2} />
                      ) : (
                        <ShieldCheck size={10} color="#16A34A" strokeWidth={2} />
                      )}
                      <Text style={[styles.verifiedBadgeText, p.hasConflict && styles.verifiedBadgeTextAlert]}>
                        {p.hasConflict ? 'Flagged' : 'Verified'}
                      </Text>
                    </View>
                  </View>

                  {/* Content */}
                  <View style={styles.cardContent}>
                    <View style={styles.cardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardName}>{p.name}</Text>
                        <View style={styles.cardLocationRow}>
                          <MapPin size={11} color={Colors.textTertiary} strokeWidth={1.5} />
                          <Text style={styles.cardArea}>{p.area}</Text>
                        </View>
                      </View>
                      <Text style={styles.cardPrice}>{p.price}</Text>
                    </View>

                    <Text style={styles.cardSize}>{p.size}</Text>

                    {/* Verification details */}
                    <View style={styles.verifyRow}>
                      {p.hasConflict ? (
                        <View style={styles.verifyAlertRow}>
                          <AlertTriangle size={12} color="#D97706" strokeWidth={1.8} />
                          <Text style={styles.verifyAlertText}>{p.conflictType}</Text>
                        </View>
                      ) : (
                        <>
                          <View style={styles.verifyItem}>
                            <CheckCircle2 size={11} color="#16A34A" strokeWidth={2} />
                            <Text style={styles.verifyItemText}>RERA ✓</Text>
                          </View>
                          <View style={styles.verifyItem}>
                            <CheckCircle2 size={11} color="#16A34A" strokeWidth={2} />
                            <Text style={styles.verifyItemText}>No disputes</Text>
                          </View>
                          <View style={styles.verifyItem}>
                            <CheckCircle2 size={11} color="#16A34A" strokeWidth={2} />
                            <Text style={styles.verifyItemText}>{p.builderScore}/5</Text>
                          </View>
                        </>
                      )}
                      <ChevronRight size={14} color={Colors.warm300} strokeWidth={1.5} />
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.warm100 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.warm200, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 16, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  content: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl },

  // ── Scanning ──
  scanHeader: { alignItems: 'center', marginBottom: Spacing.xxl },
  avatarClip: { width: 36, height: 36, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  scanTitle: { fontFamily: 'DMSerifDisplay', fontSize: 20, color: Colors.textPrimary, marginBottom: 4 },
  scanSubtitle: { fontSize: 12, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, textAlign: 'center' },

  checkList: { gap: 0 },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.warm100, gap: 10 },
  checkIconWrap: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  checkIconClean: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.green100, alignItems: 'center', justifyContent: 'center' },
  checkIconAlert: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  checkIconPending: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.warm100, alignItems: 'center', justifyContent: 'center' },
  pendingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.warm300 },
  pulsingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.terra400 },
  checkName: { flex: 1, fontSize: 14, fontFamily: 'DMSans-Medium', color: Colors.textPrimary },
  checkNamePending: { color: Colors.textTertiary },
  checkStatusClean: { fontSize: 11, fontFamily: 'DMSans-Medium', color: '#16A34A' },
  checkStatusAlert: { fontSize: 11, fontFamily: 'DMSans-Medium', color: '#D97706' },
  checkStatusPending: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary },

  progressRow: { alignItems: 'center', marginTop: Spacing.lg },
  progressText: { fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textTertiary },

  // ── Summary ──
  summaryHeader: { alignItems: 'center', marginBottom: Spacing.xxl },
  summaryIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.green100, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  summaryTitle: { fontFamily: 'DMSerifDisplay', fontSize: 22, color: Colors.textPrimary },

  summaryCards: { flexDirection: 'row', gap: 12, marginBottom: Spacing.xl },
  summaryCardClean: { flex: 1, backgroundColor: Colors.green100, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryCardNum: { fontSize: 28, fontFamily: 'DMSans-Bold', color: '#16A34A' },
  summaryCardLabel: { fontSize: 12, fontFamily: 'DMSans-Medium', color: '#166534', lineHeight: 16 },
  summaryCardAlert: { flex: 1, backgroundColor: '#FEF3C7', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryCardNumAlert: { fontSize: 28, fontFamily: 'DMSans-Bold', color: '#D97706' },
  summaryCardLabelAlert: { fontSize: 12, fontFamily: 'DMSans-Medium', color: '#92400E', lineHeight: 16 },

  summaryNote: { fontSize: 13, fontFamily: 'DMSans-Regular', color: Colors.textSecondary, lineHeight: 19, textAlign: 'center', marginBottom: Spacing.xxl },

  viewListBtn: { backgroundColor: Colors.terra500, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  viewListBtnText: { fontSize: 15, fontFamily: 'DMSans-SemiBold', color: '#fff' },

  // ── List ──
  listSubtitle: { fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textTertiary, marginBottom: Spacing.lg },

  propertyCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.warm200, overflow: 'hidden', marginBottom: 12 },
  cardImage: { height: 140, position: 'relative' },
  cardImg: { width: '100%', height: '100%' },
  verifiedBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  verifiedBadgeAlert: { backgroundColor: '#FEF3C7' },
  verifiedBadgeText: { fontSize: 10, fontFamily: 'DMSans-SemiBold', color: '#16A34A' },
  verifiedBadgeTextAlert: { color: '#D97706' },
  cardContent: { padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  cardName: { fontSize: 15, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  cardLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  cardArea: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary },
  cardPrice: { fontSize: 16, fontFamily: 'DMSans-Bold', color: Colors.terra600 },
  cardSize: { fontSize: 12, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, marginBottom: 10 },

  verifyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  verifyItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  verifyItemText: { fontSize: 10, fontFamily: 'DMSans-Medium', color: '#16A34A' },
  verifyAlertRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  verifyAlertText: { fontSize: 11, fontFamily: 'DMSans-Medium', color: '#D97706' },
});
