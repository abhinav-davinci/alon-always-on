import React from 'react';
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
import { useOnboardingStore } from '../store/onboarding';
import { SHORTLIST_PROPERTIES } from '../constants/properties';
import { useHaptics } from '../hooks/useHaptics';

interface StagePinnedContentProps {
  stage: string;
}

const STAGE_INTROS: Record<string, { icon: typeof Search; text: string }> = {
  Compare: { icon: GitCompare, text: 'ALON will compare your shortlisted properties with real transaction data when you\'re ready.' },
  Finance: { icon: Landmark, text: 'ALON will find the best loan rates from 10+ banks based on your eligibility.' },
  Legal: { icon: Scale, text: 'ALON will review your agreement, flag risky clauses, and verify RERA compliance.' },
  Negotiate: { icon: Handshake, text: 'ALON will provide market leverage data from recent sales to help you negotiate.' },
  'Deal Closure': { icon: ClipboardCheck, text: 'ALON will track your deal timeline, send reminders for deadlines, and organize all documentation.' },
  Possession: { icon: Key, text: 'ALON will guide you through the full possession checklist — documents to key handover.' },
};

export default function StagePinnedContent({ stage }: StagePinnedContentProps) {
  const router = useRouter();
  const haptics = useHaptics();
  const { likedPropertyIds, scheduledVisits } = useOnboardingStore();

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

  // ── Site Visits: show scheduled visits ──
  if (stage === 'Site Visits') {
    if (scheduledVisits.length === 0) {
      return (
        <Animated.View style={styles.pinnedWrap} entering={FadeIn.duration(200)}>
          <View style={styles.emptyHint}>
            <Calendar size={14} color={Colors.warm300} strokeWidth={1.8} />
            <Text style={styles.emptyHintText}>Schedule your first site visit from a property page</Text>
          </View>
        </Animated.View>
      );
    }
    return (
      <Animated.View style={styles.pinnedWrap} entering={FadeIn.duration(200)}>
        {scheduledVisits.map((v) => (
          <View key={v.propertyId} style={styles.visitCard}>
            <View style={styles.visitIconWrap}>
              <MapPin size={14} color={Colors.terra500} strokeWidth={2} />
            </View>
            <View style={styles.visitInfo}>
              <Text style={styles.visitName}>{v.propertyName}</Text>
              <View style={styles.visitTimeRow}>
                <Calendar size={10} color={Colors.textTertiary} strokeWidth={2} />
                <Text style={styles.visitTime}>{v.date} at {v.time}</Text>
              </View>
            </View>
          </View>
        ))}
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
