import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  Search,
  ListChecks,
  MapPin,
  GitCompare,
  Landmark,
  Scale,
  Handshake,
  Key,
  Check,
  Phone,
  PhoneOff,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Shield,
  TrendingUp,
  Clock,
  Bell,
  MessageCircle,
  Mail,
} from 'lucide-react-native';
import AlonAvatar from '../../components/AlonAvatar';
import { Colors, Spacing } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboarding';
import { formatBudget } from '../../constants/locations';

const JOURNEY_STAGES = [
  { key: 'search', label: 'Search', icon: Search, status: 'active' },
  { key: 'shortlist', label: 'Shortlist', icon: ListChecks, status: 'pending' },
  { key: 'visit', label: 'Visit', icon: MapPin, status: 'pending' },
  { key: 'compare', label: 'Compare', icon: GitCompare, status: 'pending' },
  { key: 'finance', label: 'Finance', icon: Landmark, status: 'pending' },
  { key: 'legal', label: 'Legal', icon: Scale, status: 'pending' },
  { key: 'negotiate', label: 'Negotiate', icon: Handshake, status: 'pending' },
  { key: 'possess', label: 'Possess', icon: Key, status: 'pending' },
] as Array<{ key: string; label: string; icon: typeof Search; status: 'done' | 'active' | 'pending' }>;

const DEMO_PROPERTIES = [
  { name: 'Godrej Hillside', area: 'Baner', price: '₹1.35 Cr', size: '3 BHK · 1,450 sq.ft', tags: ['RERA ✓', 'Premium'], isNew: true, image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=250&fit=crop' },
  { name: 'Pride World City', area: 'Balewadi', price: '₹1.18 Cr', size: '3 BHK · 1,320 sq.ft', tags: ['RERA ✓', 'Ready'], isNew: true, image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=250&fit=crop' },
  { name: 'Kolte Patil 24K', area: 'Wakad', price: '₹98 L', size: '2 BHK · 1,050 sq.ft', tags: ['RERA ✓'], isNew: false, image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=250&fit=crop' },
];

function isBusinessHours(): boolean {
  const now = new Date();
  const h = now.getHours();
  const d = now.getDay();
  return d >= 1 && d <= 6 && h >= 10 && h < 19;
}

function Counter({ target, delay = 0 }: { target: number; delay?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = Date.now();
      const frame = () => {
        const p = Math.min((Date.now() - start) / 1500, 1);
        setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }, delay);
    return () => clearTimeout(t);
  }, []);
  return <Text style={styles.statNumber}>{count.toLocaleString()}</Text>;
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locations, propertySize, budget, propertyType, notifyVia, toggleNotifyVia } = useOnboardingStore();
  const bizHours = isBusinessHours();
  const [journeyExpanded, setJourneyExpanded] = useState(false);

  const dotPulse = useSharedValue(1);
  const scanPos = useSharedValue(0);

  useEffect(() => {
    dotPulse.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) })
      ),
      -1, true
    );
    scanPos.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1, true
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotPulse.value }],
  }));
  const scanStyle = useAnimatedStyle(() => ({
    left: `${scanPos.value * 100}%`,
  }));

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const criteriaText = [locations.join(', '), propertyType, propertySize.join(', '), `${formatBudget(budget.min)}–${formatBudget(budget.max)}`].filter(Boolean).join(' · ');
  const currentStage = JOURNEY_STAGES.find((s) => s.status === 'active');
  const currentIndex = JOURNEY_STAGES.findIndex((s) => s.status === 'active');

  const notifyOptions: Array<{ key: string; label: string; icon: typeof Bell }> = [
    { key: 'push', label: 'Push', icon: Bell },
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { key: 'email', label: 'Email', icon: Mail },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.statusBarBg, { height: insets.top }]} />
      <View style={{ height: insets.top }} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Header + Stats ── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <View style={styles.statusRow}>
                <Animated.View style={[styles.activeDot, dotStyle]} />
                <Text style={styles.statusLabel}>ALON is active</Text>
              </View>
            </View>
            <AlonAvatar size={36} showRings={false} showBlink variant="light" />
          </View>
          <Animated.View style={styles.statsCard} entering={FadeInDown.delay(300).duration(400)}>
            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Counter target={12847} delay={400} />
                <Text style={styles.statLabel}>scanned</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBlock}>
                <Counter target={342} delay={600} />
                <Text style={styles.statLabel}>matches</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBlock}>
                <Counter target={23} delay={800} />
                <Text style={styles.statLabel}>new today</Text>
              </View>
            </View>
            <Text style={styles.criteriaText}>{criteriaText}</Text>
          </Animated.View>
        </View>

        {/* ── 2. Relationship Manager ── */}
        <Animated.View style={styles.section} entering={FadeIn.delay(500).duration(400)}>
          <Text style={styles.sectionLabel}>YOUR ADVISOR</Text>
          <View style={styles.rmCard}>
            <View style={styles.rmAvatar}>
              <Text style={styles.rmInitials}>PS</Text>
            </View>
            <View style={styles.rmInfo}>
              <Text style={styles.rmName}>Priya Sharma</Text>
              <Text style={styles.rmRole}>Property Advisor · Pune</Text>
            </View>
            <TouchableOpacity
              style={[styles.callChip, !bizHours && styles.callChipOff]}
              onPress={() => bizHours && Linking.openURL('tel:+919876543210')}
              activeOpacity={bizHours ? 0.7 : 1}
            >
              {bizHours ? (
                <Phone size={12} color="#fff" strokeWidth={2} />
              ) : (
                <PhoneOff size={12} color={Colors.gray400} strokeWidth={2} />
              )}
              <Text style={[styles.callChipText, !bizHours && styles.callChipTextOff]}>
                {bizHours ? 'Call' : '10–7pm'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── 3. Journey — collapsible ── */}
        <Animated.View style={styles.section} entering={FadeIn.delay(600).duration(400)}>
          <TouchableOpacity
            style={styles.journeyHeader}
            onPress={() => setJourneyExpanded(!journeyExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.journeyHeaderLeft}>
              <Text style={styles.sectionTitleInline}>Your home journey</Text>
              <View style={styles.journeyBadge}>
                <Text style={styles.journeyBadgeText}>{currentIndex + 1} of 8</Text>
              </View>
            </View>
            {journeyExpanded ? (
              <ChevronUp size={18} color={Colors.gray400} strokeWidth={2} />
            ) : (
              <ChevronDown size={18} color={Colors.gray400} strokeWidth={2} />
            )}
          </TouchableOpacity>

          {!journeyExpanded && currentStage && (
            <View style={styles.journeyCollapsed}>
              <View style={styles.journeyActiveDotWrap}>
                <Animated.View style={[styles.journeyPulseRing, dotStyle]} />
                <View style={styles.journeyDotActive}>
                  <View style={styles.journeyDotInner} />
                </View>
              </View>
              <View style={styles.journeyCollapsedContent}>
                <Text style={styles.journeyCollapsedBold}>Searching...</Text>
                <Text style={styles.journeyCollapsedSub}>ALON is scanning properties for you</Text>
              </View>
              <View style={styles.miniScanTrack}>
                <Animated.View style={[styles.miniScanDot, scanStyle]} />
              </View>
            </View>
          )}

          {journeyExpanded && (
            <View style={styles.journeyCard}>
              {JOURNEY_STAGES.map((stage, i) => {
                const Icon = stage.icon;
                const isActive = stage.status === 'active';
                const isDone = stage.status === 'done';
                const isLast = i === JOURNEY_STAGES.length - 1;
                return (
                  <View key={stage.key} style={styles.journeyRow}>
                    {!isLast && (
                      <View style={[styles.journeyLine, (isActive || isDone) && styles.journeyLineActive]} />
                    )}
                    <View style={[styles.journeyDot, isActive && styles.journeyDotActive, isDone && styles.journeyDotDone]}>
                      {isDone ? (
                        <Check size={10} color="#fff" strokeWidth={3} />
                      ) : (
                        <Icon size={11} color={isActive ? '#fff' : Colors.gray400} strokeWidth={1.8} />
                      )}
                    </View>
                    <Text style={[styles.journeyLabel, isActive && styles.journeyLabelActive, isDone && styles.journeyLabelDone]}>
                      {stage.label}
                    </Text>
                    {isActive && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Current</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* ── 4. Top Matches ── */}
        <Animated.View style={styles.section} entering={FadeIn.delay(700).duration(400)}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Top matches</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/onboarding/properties')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.propertiesScroll}>
            {DEMO_PROPERTIES.map((p) => (
              <View key={p.name} style={styles.propertyCard}>
                <View style={styles.propertyImage}>
                  <Image
                    source={{ uri: p.image }}
                    style={styles.propertyImg}
                    resizeMode="cover"
                  />
                  {p.isNew && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                  )}
                </View>
                <View style={styles.propertyContent}>
                  <Text style={styles.propertyName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.propertyArea}>{p.area}, Pune</Text>
                  <View style={styles.propertyMeta}>
                    <Text style={styles.propertyPrice}>{p.price}</Text>
                    <Text style={styles.propertySize}>{p.size}</Text>
                  </View>
                  <View style={styles.propertyTags}>
                    {p.tags.map((tag) => (
                      <View key={tag} style={styles.propertyTag}>
                        <Text style={styles.propertyTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── 5. Alerts ── */}
        <Animated.View style={styles.section} entering={FadeIn.delay(800).duration(400)}>
          <Text style={styles.sectionTitle}>ALON alerts</Text>
          {[
            { title: '5 new matches found', sub: 'Godrej Hillside + 4 more', icon: TrendingUp, bg: Colors.terra50, color: Colors.terra500 },
            { title: 'Site visit available', sub: 'Godrej Hillside · Sat 10am–1pm', icon: Clock, bg: '#FEF3C7', color: '#D97706' },
            { title: 'RERA check complete', sub: '3 of 5 are RERA-verified', icon: Shield, bg: '#DCFCE7', color: '#16A34A' },
          ].map((alert) => (
            <TouchableOpacity key={alert.title} style={styles.alertCard} activeOpacity={0.7}>
              <View style={[styles.alertIcon, { backgroundColor: alert.bg }]}>
                <alert.icon size={15} color={alert.color} strokeWidth={1.8} />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertSub}>{alert.sub}</Text>
              </View>
              <ChevronRight size={15} color={Colors.gray300} strokeWidth={1.8} />
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Footer */}
        <View style={styles.footerBadge}>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>ALON stays on until you find your home</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  statusBarBg: { backgroundColor: Colors.navy800, position: 'absolute' as const, top: 0, left: 0, right: 0, zIndex: 10 },
  scroll: {},

  header: {
    backgroundColor: Colors.navy800,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
  greeting: { fontFamily: 'DMSerifDisplay', fontSize: 26, color: '#fff', marginBottom: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' },
  statusLabel: { fontSize: 12, fontFamily: 'DMSans-Medium', color: '#22C55E' },
  statsCard: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  statBlock: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontFamily: 'DMSans-Bold', color: '#fff' },
  statLabel: { fontSize: 10, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' },
  criteriaText: { fontSize: 11, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.35)', textAlign: 'center' },

  section: { paddingHorizontal: Spacing.xxl, marginTop: Spacing.xl },
  sectionTitle: { fontSize: 16, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary, marginBottom: Spacing.md },
  sectionTitleInline: { fontSize: 15, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  seeAll: { fontSize: 13, fontFamily: 'DMSans-Medium', color: Colors.terra500 },
  sectionLabel: { fontSize: 10, fontFamily: 'DMSans-Medium', color: Colors.textTertiary, textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 8 },

  // RM
  rmCard: { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.warm200, padding: 12, gap: 10 },
  rmAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.terra500, alignItems: 'center' as const, justifyContent: 'center' as const },
  rmInitials: { fontSize: 13, fontFamily: 'DMSans-Bold', color: '#fff' },
  rmInfo: { flex: 1 },
  rmName: { fontSize: 13, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  rmRole: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary },
  callChip: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, backgroundColor: Colors.terra500, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  callChipOff: { backgroundColor: Colors.gray100 },
  callChipText: { fontSize: 12, fontFamily: 'DMSans-Medium', color: '#fff' },
  callChipTextOff: { color: Colors.gray400 },

  // Journey
  journeyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.warm200, borderRadius: 14, padding: 14 },
  journeyHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  journeyBadge: { backgroundColor: Colors.terra50, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: Colors.terra200 },
  journeyBadgeText: { fontSize: 10, fontFamily: 'DMSans-Medium', color: Colors.terra500 },

  journeyCollapsed: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, backgroundColor: Colors.terra50, borderRadius: 12, borderWidth: 1, borderColor: Colors.terra100, padding: 10 },
  journeyActiveDotWrap: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  journeyPulseRing: { position: 'absolute', width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.terra300 },
  journeyCollapsedContent: { flex: 1 },
  journeyCollapsedBold: { fontSize: 13, fontFamily: 'DMSans-SemiBold', color: Colors.navy700 },
  journeyCollapsedSub: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.terra400, marginTop: 1 },
  miniScanTrack: { width: 32, height: 3, backgroundColor: Colors.terra100, borderRadius: 2, overflow: 'hidden' as const },
  miniScanDot: { position: 'absolute' as const, width: 10, height: 3, borderRadius: 2, backgroundColor: Colors.terra400 },

  journeyCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.warm200, padding: 14, marginTop: 8 },
  journeyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, position: 'relative' as const },
  journeyLine: { position: 'absolute' as const, left: 12, top: 30, width: 1, height: 16, backgroundColor: Colors.warm200 },
  journeyLineActive: { backgroundColor: Colors.terra400 },
  journeyDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.warm100, borderWidth: 1, borderColor: Colors.warm200, alignItems: 'center' as const, justifyContent: 'center' as const },
  journeyDotActive: { backgroundColor: Colors.terra500, borderColor: Colors.terra500 },
  journeyDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  journeyDotDone: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  journeyLabel: { flex: 1, fontSize: 13, fontFamily: 'DMSans-Regular', color: Colors.textTertiary },
  journeyLabelActive: { fontFamily: 'DMSans-Medium', color: Colors.textPrimary },
  journeyLabelDone: { color: Colors.textSecondary },
  currentBadge: { backgroundColor: Colors.terra50, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: Colors.terra200 },
  currentBadgeText: { fontSize: 10, fontFamily: 'DMSans-Medium', color: Colors.terra500 },

  // Properties
  propertiesScroll: { marginHorizontal: -Spacing.xxl, paddingHorizontal: Spacing.xxl },
  propertyCard: { width: 220, backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.warm200, marginRight: 12, overflow: 'hidden' as const },
  propertyImage: { height: 120, backgroundColor: Colors.gray100, position: 'relative' as const },
  propertyImg: { width: '100%', height: '100%' },
  newBadge: { position: 'absolute' as const, top: 8, left: 8, backgroundColor: Colors.terra500, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, zIndex: 2 },
  newBadgeText: { fontSize: 9, fontFamily: 'DMSans-Bold', color: '#fff', letterSpacing: 0.5 },
  propertyContent: { padding: 12 },
  propertyName: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  propertyArea: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, marginTop: 1 },
  propertyMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  propertyPrice: { fontSize: 15, fontFamily: 'DMSans-Bold', color: Colors.terra600 },
  propertySize: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary },
  propertyTags: { flexDirection: 'row', gap: 4, marginTop: 8 },
  propertyTag: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  propertyTagText: { fontSize: 10, fontFamily: 'DMSans-Medium', color: '#16A34A' },

  // Alerts
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.warm200, borderRadius: 12, padding: 12, marginBottom: 8 },
  alertIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center' as const, justifyContent: 'center' as const },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 13, fontFamily: 'DMSans-Medium', color: Colors.textPrimary },
  alertSub: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, marginTop: 1 },

  // Footer
  footerBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.lg, paddingVertical: Spacing.sm },
  footerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  footerText: { fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textTertiary },
});
