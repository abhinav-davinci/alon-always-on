import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  MapPin, Calendar, Heart, Search, GitCompare,
  Landmark, Scale, Handshake, ClipboardCheck, Key, ChevronRight,
} from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Spacing } from '../constants/theme';
import { useOnboardingStore, hasAnyLegalAnalysis } from '../store/onboarding';
import { resolveLegalProperty } from '../utils/legalProperty';
import { SHORTLIST_PROPERTIES } from '../constants/properties';
import { useHaptics } from '../hooks/useHaptics';
import SkeletonStagePinned from './skeleton/SkeletonStagePinned';

interface StagePinnedContentProps {
  stage: string;
}

const STAGE_INTROS: Record<string, { icon: typeof Search; text: string }> = {
  Compare: { icon: GitCompare, text: 'ALON will compare your shortlisted properties with real transaction data when you\'re ready.' },
  Finance: { icon: Landmark, text: 'ALON will find the best loan rates from 10+ banks based on your eligibility.' },
  Possession: { icon: Key, text: 'ALON will guide you through the full possession checklist — documents to key handover.' },
};

export default function StagePinnedContent({ stage }: StagePinnedContentProps) {
  const router = useRouter();
  const haptics = useHaptics();
  const {
    likedPropertyIds, scheduledVisits, negotiatePropertyId, userProperties,
    cibilScore, cibilSkipped, monthlyIncome,
    legalAnalyses, externalProperties, activeLegalPropertyId,
  } = useOnboardingStore();

  // Broad gate: has the user completed any legal analysis at all? Used
  // for stage-level CTAs that don't need to know which property.
  const legalAnalysisDone = hasAnyLegalAnalysis({ legalAnalyses });
  // Prefer the currently-active property's doc name if we have one.
  const legalDocName = activeLegalPropertyId
    ? legalAnalyses[activeLegalPropertyId]?.docName ?? null
    : null;

  // Skeleton on initial mount only — stage toggles use the bottom bounce instead
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SkeletonStagePinned stage={stage} />;
  }

  // ── Search: show match count ──
  if (stage === 'Search') {
    return (
      <Animated.View style={styles.pinnedWrap} entering={FadeIn.duration(200)}>
        <View style={styles.searchBanner}>
          <Search size={13} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.searchBannerText}>
            {SHORTLIST_PROPERTIES.length} properties matched your criteria
          </Text>
        </View>
      </Animated.View>
    );
  }

  // ── Shortlist: show liked properties ──
  if (stage === 'Shortlist') {
    const liked = SHORTLIST_PROPERTIES.filter((p) => likedPropertyIds.includes(p.id));
    if (liked.length === 0) {
      return (
        <Animated.View style={styles.pinnedWrap} entering={FadeIn.duration(200)}>
          <View style={styles.emptyHint}>
            <Heart size={14} color={Colors.warm300} strokeWidth={1.8} />
            <Text style={styles.emptyHintText}>Like properties from Search to see them here</Text>
          </View>
        </Animated.View>
      );
    }
    return (
      <Animated.View style={styles.pinnedWrap} entering={FadeIn.duration(200)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardScroll}>
          {liked.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.miniCard}
              activeOpacity={0.7}
              onPress={() => {
                haptics.light();
                router.push({ pathname: '/onboarding/property-detail', params: { id: p.id } });
              }}
            >
              <Image source={{ uri: p.image }} style={styles.miniCardImg} />
              <View style={styles.miniCardInfo}>
                <Text style={styles.miniCardName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.miniCardPrice}>{p.price}</Text>
              </View>
              <ChevronRight size={12} color={Colors.warm300} strokeWidth={2} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    );
  }

  // ── Site Visits: nudge or summary with CTA to dedicated screen ──
  if (stage === 'Site Visits') {
    const visitCount = scheduledVisits.length;
    const likedCount = likedPropertyIds.length + userProperties.length;

    let text = '';
    let ctaLabel = '';
    let ctaRoute: any = '/onboarding/site-visits';

    if (likedCount === 0) {
      text = 'Shortlist some properties first — then you can schedule site visits.';
      ctaLabel = 'Browse Properties';
      ctaRoute = '/onboarding/shortlist';
    } else if (visitCount === 0) {
      text = `You have ${likedCount} shortlisted. Schedule your first visit — your number stays hidden.`;
      ctaLabel = 'Schedule a Visit →';
    } else {
      const names = scheduledVisits.map((v) => v.propertyName).join(', ');
      text = `${visitCount} visit${visitCount > 1 ? 's' : ''} scheduled — ${names}. Tap to manage or schedule more.`;
      ctaLabel = 'View All Visits →';
    }

    return (
      <Animated.View style={styles.pinnedWrap} entering={FadeIn.duration(200)}>
        <View style={styles.introCard}>
          <MapPin size={16} color={Colors.terra400} strokeWidth={1.8} />
          <Text style={styles.introText}>{text}</Text>
        </View>
        <TouchableOpacity
          style={styles.pinnedCta}
          onPress={() => { haptics.light(); router.push(ctaRoute); }}
          activeOpacity={0.8}
        >
          <Text style={styles.pinnedCtaText}>{ctaLabel}</Text>
          <ChevronRight size={14} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ── Compare: smart nudge based on shortlist count ──
  if (stage === 'Compare') {
    const count = likedPropertyIds.length;
    let text = '';
    let ctaLabel = '';
    let ctaRoute = '';

    if (count === 0) {
      text = 'Like some properties first — ALON will compare them when you\'re ready.';
      ctaLabel = 'Browse Properties';
      ctaRoute = '/onboarding/properties';
    } else if (count === 1) {
      text = 'One more! Add another property to your shortlist to unlock comparison.';
      ctaLabel = 'View Shortlist';
      ctaRoute = '/onboarding/shortlist';
    } else {
      text = `You have ${count} shortlisted. Tap below to see how they stack up.`;
      ctaLabel = 'Compare Now →';
      ctaRoute = '/onboarding/shortlist';
    }

    return (
      <Animated.View style={styles.pinnedWrap} entering={FadeIn.duration(200)}>
        <View style={styles.introCard}>
          <GitCompare size={16} color={Colors.terra400} strokeWidth={1.8} />
          <Text style={styles.introText}>{text}</Text>
        </View>
        <TouchableOpacity
          style={styles.pinnedCta}
          onPress={() => { haptics.light(); router.push(ctaRoute as any); }}
          activeOpacity={0.8}
        >
          <Text style={styles.pinnedCtaText}>{ctaLabel}</Text>
          <ChevronRight size={14} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ── Finance: CIBIL status + quick stats ──
  if (stage === 'Finance') {
    const hasCibil = !!cibilScore || cibilSkipped;
    const displayScore = cibilScore || (cibilSkipped ? '~750' : null);

    return (
      <Animated.View style={styles.pinnedWrap} entering={FadeIn.duration(200)}>
        <View style={styles.introCard}>
          <Landmark size={16} color={Colors.terra400} strokeWidth={1.8} />
          <Text style={styles.introText}>
            {!hasCibil
              ? 'Enter your CIBIL score to get personalized loan rates and eligibility.'
              : cibilScore
                ? `CIBIL ${cibilScore} · Rate ~${(8.5 + (cibilScore >= 750 ? 0 : cibilScore >= 700 ? 0.25 : 0.75)).toFixed(1)}% · ${monthlyIncome ? 'Eligibility checked' : 'Check eligibility next'}`
                : 'Using estimated CIBIL 750 · Update your score for better accuracy'}
          </Text>
        </View>
      </Animated.View>
    );
  }

  // ── Negotiate: smart nudge based on pool + selection state ──
  if (stage === 'Negotiate') {
    const likedPool = SHORTLIST_PROPERTIES.filter((p) => likedPropertyIds.includes(p.id));
    const count = likedPool.length + userProperties.length;
    const selectedLiked = likedPool.find((p) => p.id === negotiatePropertyId);
    const selectedUser = userProperties.find((p) => p.id === negotiatePropertyId);
    const selectedName = selectedLiked?.name || selectedUser?.name || null;

    let text = '';
    let ctaLabel = '';
    let ctaRoute: any = '';

    if (count === 0) {
      text = 'Negotiation works on one property. Let me show you your matches first.';
      ctaLabel = 'Browse Properties';
      ctaRoute = { pathname: '/onboarding/shortlist', params: { nudge: 'negotiate' } };
    } else if (!selectedName) {
      text = `You have ${count} shortlisted. Pick one — ALON will build your negotiation case.`;
      ctaLabel = 'Pick a Property →';
      ctaRoute = '/onboarding/negotiate';
    } else {
      text = `Negotiating on ${selectedName}. Continue to see market data and your checklist.`;
      ctaLabel = 'Continue →';
      ctaRoute = '/onboarding/negotiate';
    }

    return (
      <Animated.View style={styles.pinnedWrap} entering={FadeIn.duration(200)}>
        <View style={styles.introCard}>
          <Handshake size={16} color={Colors.terra400} strokeWidth={1.8} />
          <Text style={styles.introText}>{text}</Text>
        </View>
        <TouchableOpacity
          style={styles.pinnedCta}
          onPress={() => { haptics.light(); router.push(ctaRoute); }}
          activeOpacity={0.8}
        >
          <Text style={styles.pinnedCtaText}>{ctaLabel}</Text>
          <ChevronRight size={14} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ── Legal: independent step — no shortlist/negotiate prerequisites ──
  if (stage === 'Legal') {
    // Prefer the active property's name (it's what the user's looking
    // at in the Legal screen). Fall back to the most recently analyzed
    // one, so the pinned card stays contextual even if the user
    // selected a different property in the selector.
    const activeName = activeLegalPropertyId
      ? resolveLegalProperty({ userProperties, externalProperties }, activeLegalPropertyId)?.name
      : null;
    const recentRecord = Object.values(legalAnalyses)
      .sort((a, b) => b.uploadedAt - a.uploadedAt)[0];
    const recentName = recentRecord
      ? resolveLegalProperty({ userProperties, externalProperties }, recentRecord.propertyId)?.name
      : null;
    const displayName = activeName || recentName || 'your property';

    let text = '';
    let ctaLabel = '';
    const ctaRoute = '/onboarding/legal-analysis';

    if (legalAnalysisDone) {
      text = `Your agreement for ${displayName} is analyzed (${legalDocName || 'document'}). Review findings or re-upload.`;
      ctaLabel = 'View Analysis →';
    } else {
      text =
        "Upload your builder agreement — I'll flag risky clauses, check affordability, and benchmark every term. Works for shortlisted and external properties alike.";
      ctaLabel = 'Upload Agreement →';
    }

    return (
      <Animated.View style={styles.pinnedWrap} entering={FadeIn.duration(200)}>
        <View style={styles.introCard}>
          <Scale size={16} color={Colors.terra400} strokeWidth={1.8} />
          <Text style={styles.introText}>{text}</Text>
        </View>
        <TouchableOpacity
          style={styles.pinnedCta}
          onPress={() => { haptics.light(); router.push(ctaRoute); }}
          activeOpacity={0.8}
        >
          <Text style={styles.pinnedCtaText}>{ctaLabel}</Text>
          <ChevronRight size={14} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ── Deal Closure: only gate is the parsed agreement — don't cascade ──
  if (stage === 'Deal Closure') {
    let text = '';
    let ctaLabel = '';
    let ctaRoute: any = '';

    if (!legalAnalysisDone) {
      text =
        'Deal Closure needs your Builder–Buyer Agreement parsed in Legal. Upload it there — I extract every key date, set reminders, and unlock your deal hub.';
      ctaLabel = 'Upload in Legal →';
      ctaRoute = '/onboarding/legal-analysis';
    } else {
      const likedPool = SHORTLIST_PROPERTIES.filter((p) => likedPropertyIds.includes(p.id));
      const selectedName =
        likedPool.find((p) => p.id === negotiatePropertyId)?.name ||
        userProperties.find((p) => p.id === negotiatePropertyId)?.name ||
        'your property';
      text = `Your ${legalDocName || 'agreement'} is parsed. Timeline and reminders are ready for ${selectedName}.`;
      ctaLabel = 'Track Deal Timeline →';
      ctaRoute = '/onboarding/deal-closure';
    }

    return (
      <Animated.View style={styles.pinnedWrap} entering={FadeIn.duration(200)}>
        <View style={styles.introCard}>
          <ClipboardCheck size={16} color={Colors.terra400} strokeWidth={1.8} />
          <Text style={styles.introText}>{text}</Text>
        </View>
        <TouchableOpacity
          style={styles.pinnedCta}
          onPress={() => { haptics.light(); router.push(ctaRoute); }}
          activeOpacity={0.8}
        >
          <Text style={styles.pinnedCtaText}>{ctaLabel}</Text>
          <ChevronRight size={14} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ── Possession: snag checklist, docs, handover-day micro-checklist ──
  // Gate is soft — if user has any agreement analyzed, they can go to
  // Possession and pick their active property there. No analysis yet
  // means they route to Legal (same unlock as Deal Closure).
  if (stage === 'Possession') {
    const activeName = activeLegalPropertyId
      ? resolveLegalProperty({ userProperties, externalProperties }, activeLegalPropertyId)?.name
      : null;

    let text: string;
    let ctaLabel: string;
    let ctaRoute: any;

    if (!legalAnalysisDone) {
      text =
        "Possession needs the agreement in Legal first — that way your snag checklist, document vault, and handover playbook all line up against the right property.";
      ctaLabel = 'Start in Legal →';
      ctaRoute = '/onboarding/legal-analysis';
    } else {
      const name = activeName ?? 'your property';
      text = `Ready for possession of ${name}. Pune-specific snag checklist (9 categories), 12-doc handover vault, and a handover-day micro-checklist — all lined up.`;
      ctaLabel = 'Open Possession →';
      ctaRoute = '/onboarding/possession';
    }

    return (
      <Animated.View style={styles.pinnedWrap} entering={FadeIn.duration(200)}>
        <View style={styles.introCard}>
          <Key size={16} color={Colors.terra400} strokeWidth={1.8} />
          <Text style={styles.introText}>{text}</Text>
        </View>
        <TouchableOpacity
          style={styles.pinnedCta}
          onPress={() => { haptics.light(); router.push(ctaRoute); }}
          activeOpacity={0.8}
        >
          <Text style={styles.pinnedCtaText}>{ctaLabel}</Text>
          <ChevronRight size={14} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ── Other stages: intro message ──
  const intro = STAGE_INTROS[stage];
  if (intro) {
    const Icon = intro.icon;
    return (
      <Animated.View style={styles.pinnedWrap} entering={FadeIn.duration(200)}>
        <View style={styles.introCard}>
          <Icon size={16} color={Colors.terra400} strokeWidth={1.8} />
          <Text style={styles.introText}>{intro.text}</Text>
        </View>
      </Animated.View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  pinnedWrap: {
    marginBottom: 12,
  },

  // Search banner
  searchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.terra50,
    borderWidth: 1,
    borderColor: Colors.terra200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchBannerText: { fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.terra600 },

  // Empty hints
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warm50,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  emptyHintText: { fontSize: 12, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, flex: 1 },

  // Shortlist mini cards
  cardScroll: { gap: 8, paddingRight: 4 },
  miniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.warm200,
    borderRadius: 12,
    paddingRight: 10,
    paddingVertical: 0,
    overflow: 'hidden',
    width: 210,
  },
  miniCardImg: { width: 44, height: 44, backgroundColor: Colors.warm100 },
  miniCardInfo: { flex: 1, paddingVertical: 8 },
  miniCardName: { fontSize: 12, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  miniCardPrice: { fontSize: 11, fontFamily: 'DMSans-Medium', color: Colors.terra500, marginTop: 1 },

  // Visit cards
  visitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.terra50,
    borderWidth: 1,
    borderColor: Colors.terra200,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  visitIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitInfo: { flex: 1 },
  visitName: { fontSize: 13, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  visitTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  visitTime: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary },

  // Intro cards for future stages
  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.cream,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  introText: { flex: 1, fontSize: 12, fontFamily: 'DMSans-Regular', color: Colors.textSecondary, lineHeight: 17 },

  // Compare CTA
  pinnedCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: Colors.terra50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.terra200,
  },
  pinnedCtaText: { fontSize: 12, fontFamily: 'DMSans-SemiBold', color: Colors.terra500 },
});
