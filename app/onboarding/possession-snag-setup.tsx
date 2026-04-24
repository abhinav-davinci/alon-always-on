import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Building,
  Home,
  Building2,
  Check,
  BookOpen,
  Sparkles,
  User,
  Wrench,
  Droplet,
  Sun,
  Plus,
  Minus,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboarding';
import { useHaptics } from '../../hooks/useHaptics';
import {
  generateRooms,
  defaultBalconies,
  totalChecksForConfig,
  type PropertyConfig,
  type PropertyType,
  type BHK,
} from '../../constants/rooms';

// ═══════════════════════════════════════════════════════════════════
// Snag-Inspection Setup — the wizard that turns a generic checklist
// into *your* checklist. Four steps, one decision per screen. Saves
// the config to the property's possession record; the room-list
// screen reads it and generates the walking path.
//
// Step 1 — property type (apartment / row-house / penthouse)
// Step 2 — bhk configuration
// Step 3 — extras (study, puja, servant, utility, powder, balconies)
// Step 4 — preview: room count, checks count, confirm & build
// ═══════════════════════════════════════════════════════════════════

const STEP_COUNT = 4;
const SCREEN_H = Dimensions.get('window').height;

type SetupExtras = PropertyConfig['extras'];

export default function PossessionSnagSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ propertyId?: string; mode?: 'new' | 'edit' }>();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const { activeLegalPropertyId, possessions, setSnagConfig } = useOnboardingStore();
  const propertyId = params.propertyId ?? activeLegalPropertyId;
  const isEditMode = params.mode === 'edit';

  // If we're editing, hydrate from the existing config. Otherwise
  // defaults below are sensible "blank slate" starting points.
  const existing = propertyId ? possessions[propertyId]?.snagConfig : undefined;

  const [step, setStep] = useState(0);
  const [type, setType] = useState<PropertyType | null>(existing?.type ?? null);
  const [bhk, setBhk] = useState<BHK | null>(existing?.bhk ?? null);
  const [balconyCount, setBalconyCount] = useState<number>(
    existing ? existing.extras.balconies.length : 1,
  );
  const [extras, setExtras] = useState<Omit<SetupExtras, 'balconies'>>({
    study: existing?.extras.study ?? false,
    pujaRoom: existing?.extras.pujaRoom ?? false,
    servantRoom: existing?.extras.servantRoom ?? false,
    utility: existing?.extras.utility ?? false,
    powderRoom: existing?.extras.powderRoom ?? false,
  });

  // Build the draft config for preview + save. `balconies` is derived
  // from `balconyCount` + current `bhk` to keep the wizard minimal —
  // user can re-attach balconies semantically later (v2 feature).
  const draftConfig: PropertyConfig | null = useMemo(() => {
    if (!type || !bhk) return null;
    return {
      type,
      bhk,
      extras: {
        ...extras,
        balconies: defaultBalconies(balconyCount, bhk),
      },
    };
  }, [type, bhk, extras, balconyCount]);

  const canAdvance = (() => {
    if (step === 0) return type !== null;
    if (step === 1) return bhk !== null;
    return true; // step 2 (extras) and step 3 (preview) always OK
  })();

  const onNext = () => {
    haptics.light();
    if (step < STEP_COUNT - 1) {
      setStep(step + 1);
      return;
    }
    // Final step → save and navigate to room list. Wizard save is the
    // ownership-transfer moment: whatever the user committed here is
    // their truth, not ALON's inference — clear the `autoConfigured`
    // flag so the "Built from X" banner disappears.
    if (!draftConfig || !propertyId) return;
    setSnagConfig(propertyId, { ...draftConfig, autoConfigured: false });
    haptics.success();
    router.replace('/onboarding/possession-snag');
  };

  const onBack = () => {
    haptics.light();
    if (step === 0) {
      router.back();
      return;
    }
    setStep(step - 1);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header + progress dots */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.dots}>
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]}
            />
          ))}
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <StepType value={type} onChange={setType} />
        )}
        {step === 1 && (
          <StepBHK value={bhk} onChange={setBhk} />
        )}
        {step === 2 && (
          <StepExtras
            extras={extras}
            onChange={setExtras}
            balconyCount={balconyCount}
            onBalconyCount={setBalconyCount}
          />
        )}
        {step === 3 && draftConfig && (
          <StepPreview config={draftConfig} />
        )}
      </ScrollView>

      {/* Primary CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.primaryBtn, !canAdvance && styles.primaryBtnDisabled]}
          onPress={onNext}
          disabled={!canAdvance}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryBtnText}>
            {step === STEP_COUNT - 1
              ? (isEditMode ? 'Update my checklist' : 'Build my checklist')
              : 'Continue'}
          </Text>
          {step < STEP_COUNT - 1 && (
            <ChevronRight size={16} color={Colors.white} strokeWidth={2.2} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Step 1 — Property type
// ═══════════════════════════════════════════════════════════════════

function StepType({
  value,
  onChange,
}: {
  value: PropertyType | null;
  onChange: (v: PropertyType) => void;
}) {
  return (
    <View>
      <Animated.Text entering={FadeIn.duration(260)} style={styles.stepEyebrow}>STEP 1 OF 4</Animated.Text>
      <Animated.Text entering={FadeInDown.duration(280)} style={styles.stepTitle}>
        What kind of home is it?
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(60).duration(280)} style={styles.stepSubtitle}>
        This tells me which rooms your flat is likely to have.
      </Animated.Text>

      <View style={{ marginTop: 20, gap: 10 }}>
        <TypeCard
          active={value === 'apartment'}
          icon={<Building size={22} color={value === 'apartment' ? Colors.white : Colors.terra500} strokeWidth={2} />}
          title="Apartment"
          subtitle="Flat in a multi-storey building"
          onPress={() => onChange('apartment')}
        />
        <TypeCard
          active={value === 'row-house'}
          icon={<Home size={22} color={value === 'row-house' ? Colors.white : Colors.terra500} strokeWidth={2} />}
          title="Row House"
          subtitle="Independent unit with private terrace"
          onPress={() => onChange('row-house')}
        />
        <TypeCard
          active={value === 'penthouse'}
          icon={<Building2 size={22} color={value === 'penthouse' ? Colors.white : Colors.terra500} strokeWidth={2} />}
          title="Penthouse"
          subtitle="Top-floor unit, usually with a terrace"
          onPress={() => onChange('penthouse')}
        />
      </View>
    </View>
  );
}

function TypeCard({
  active, icon, title, subtitle, onPress,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.typeCard, active && styles.typeCardActive]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.typeIcon, active && styles.typeIconActive]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.typeTitle, active && styles.typeTitleActive]}>{title}</Text>
        <Text style={[styles.typeSubtitle, active && styles.typeSubtitleActive]}>{subtitle}</Text>
      </View>
      {active && (
        <View style={styles.checkCircle}>
          <Check size={14} color={Colors.white} strokeWidth={3} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Step 2 — BHK configuration
// ═══════════════════════════════════════════════════════════════════

function StepBHK({
  value,
  onChange,
}: {
  value: BHK | null;
  onChange: (v: BHK) => void;
}) {
  const opts: { value: BHK; desc: string }[] = [
    { value: '1BHK', desc: '1 bedroom · 1 bathroom' },
    { value: '2BHK', desc: '2 bedrooms · 2 bathrooms' },
    { value: '3BHK', desc: '3 bedrooms · 3 bathrooms' },
    { value: '4BHK+', desc: '4+ bedrooms · 4+ bathrooms' },
  ];
  return (
    <View>
      <Animated.Text entering={FadeIn.duration(260)} style={styles.stepEyebrow}>STEP 2 OF 4</Animated.Text>
      <Animated.Text entering={FadeInDown.duration(280)} style={styles.stepTitle}>
        How many bedrooms?
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(60).duration(280)} style={styles.stepSubtitle}>
        Pick the configuration closest to yours — you can tweak extras in the next step.
      </Animated.Text>

      <View style={{ marginTop: 20, gap: 10 }}>
        {opts.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.bhkCard, value === opt.value && styles.bhkCardActive]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.9}
          >
            <Text style={[styles.bhkTitle, value === opt.value && styles.bhkTitleActive]}>
              {opt.value}
            </Text>
            <Text style={[styles.bhkDesc, value === opt.value && styles.bhkDescActive]}>
              {opt.desc}
            </Text>
            {value === opt.value && (
              <View style={styles.checkCircle}>
                <Check size={14} color={Colors.white} strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Step 3 — Extras (non-standard rooms + balcony count)
// ═══════════════════════════════════════════════════════════════════

function StepExtras({
  extras, onChange, balconyCount, onBalconyCount,
}: {
  extras: Omit<SetupExtras, 'balconies'>;
  onChange: (e: Omit<SetupExtras, 'balconies'>) => void;
  balconyCount: number;
  onBalconyCount: (n: number) => void;
}) {
  const toggle = (k: keyof typeof extras) => onChange({ ...extras, [k]: !extras[k] });

  return (
    <View>
      <Animated.Text entering={FadeIn.duration(260)} style={styles.stepEyebrow}>STEP 3 OF 4</Animated.Text>
      <Animated.Text entering={FadeInDown.duration(280)} style={styles.stepTitle}>
        Any extras?
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(60).duration(280)} style={styles.stepSubtitle}>
        Add rooms your flat has. Skip anything that doesn't apply.
      </Animated.Text>

      <Text style={styles.sectionLabel}>ROOMS</Text>
      <ExtraToggle
        active={extras.study}
        icon={<BookOpen size={16} color={extras.study ? Colors.white : Colors.terra500} strokeWidth={2} />}
        label="Study"
        sublabel="Home office / reading room"
        onPress={() => toggle('study')}
      />
      <ExtraToggle
        active={extras.pujaRoom}
        icon={<Sparkles size={16} color={extras.pujaRoom ? Colors.white : Colors.terra500} strokeWidth={2} />}
        label="Puja Room"
        sublabel="Prayer / meditation space"
        onPress={() => toggle('pujaRoom')}
      />
      <ExtraToggle
        active={extras.servantRoom}
        icon={<User size={16} color={extras.servantRoom ? Colors.white : Colors.terra500} strokeWidth={2} />}
        label="Servant Room"
        sublabel="Staff quarters"
        onPress={() => toggle('servantRoom')}
      />
      <ExtraToggle
        active={extras.utility}
        icon={<Wrench size={16} color={extras.utility ? Colors.white : Colors.terra500} strokeWidth={2} />}
        label="Utility Area"
        sublabel="Washing machine / dry balcony"
        onPress={() => toggle('utility')}
      />
      <ExtraToggle
        active={extras.powderRoom}
        icon={<Droplet size={16} color={extras.powderRoom ? Colors.white : Colors.terra500} strokeWidth={2} />}
        label="Powder Room"
        sublabel="Extra half-bath near the living room"
        onPress={() => toggle('powderRoom')}
      />

      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>BALCONIES</Text>
      <View style={styles.stepper}>
        <View style={styles.stepperIcon}>
          <Sun size={16} color={Colors.terra500} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.stepperLabel}>How many?</Text>
          <Text style={styles.stepperSubtle}>
            {balconyCount === 0 ? 'No balconies' : `${balconyCount} balcon${balconyCount === 1 ? 'y' : 'ies'} — we'll name them based on attachment`}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.stepBtn, balconyCount === 0 && styles.stepBtnDisabled]}
          onPress={() => balconyCount > 0 && onBalconyCount(balconyCount - 1)}
          disabled={balconyCount === 0}
          activeOpacity={0.7}
        >
          <Minus size={14} color={balconyCount === 0 ? Colors.warm300 : Colors.terra500} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{balconyCount}</Text>
        <TouchableOpacity
          style={[styles.stepBtn, balconyCount >= 4 && styles.stepBtnDisabled]}
          onPress={() => balconyCount < 4 && onBalconyCount(balconyCount + 1)}
          disabled={balconyCount >= 4}
          activeOpacity={0.7}
        >
          <Plus size={14} color={balconyCount >= 4 ? Colors.warm300 : Colors.terra500} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ExtraToggle({
  active, icon, label, sublabel, onPress,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.extraCard, active && styles.extraCardActive]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.extraIcon, active && styles.extraIconActive]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.extraLabel, active && styles.extraLabelActive]}>{label}</Text>
        <Text style={[styles.extraSublabel, active && styles.extraSublabelActive]}>{sublabel}</Text>
      </View>
      <View style={[styles.checkbox, active && styles.checkboxActive]}>
        {active && <Check size={12} color={Colors.terra500} strokeWidth={3} />}
      </View>
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Step 4 — Preview: "Here's what I'll build."
// ═══════════════════════════════════════════════════════════════════

function StepPreview({ config }: { config: PropertyConfig }) {
  const rooms = useMemo(() => generateRooms(config), [config]);
  const totalChecks = useMemo(() => totalChecksForConfig(config), [config]);

  return (
    <View>
      <Animated.Text entering={FadeIn.duration(260)} style={styles.stepEyebrow}>STEP 4 OF 4</Animated.Text>
      <Animated.Text entering={FadeInDown.duration(280)} style={styles.stepTitle}>
        Here's your walkthrough.
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(60).duration(280)} style={styles.stepSubtitle}>
        {totalChecks} checks across {rooms.length} areas. You'll walk them in this order.
      </Animated.Text>

      <View style={styles.previewCard}>
        {rooms.map((room, i) => (
          <View key={room.id} style={styles.previewRow}>
            <Text style={styles.previewNum}>{i + 1}</Text>
            <Text style={styles.previewName}>{room.label}</Text>
            <Text style={styles.previewCount}>
              {room.subCategories.reduce((s, sc) => s + sc.checks.length, 0)}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.previewFooter}>
        You can rename rooms, mark one as N/A, or re-run this setup anytime.
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  // ── Header ────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center',
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.warm200,
  },
  dotActive: { backgroundColor: Colors.terra500, width: 18 },
  dotDone: { backgroundColor: Colors.terra300 },

  // ── Content ───────────────────────────────────────────────────────
  content: {
    paddingHorizontal: Spacing.xxl, paddingTop: Spacing.lg,
    minHeight: SCREEN_H * 0.7,
  },
  stepEyebrow: {
    fontSize: 10, fontFamily: 'DMSans-SemiBold', color: Colors.terra500,
    letterSpacing: 1, marginBottom: 8,
  },
  stepTitle: {
    fontFamily: 'DMSerifDisplay', fontSize: 28, color: Colors.textPrimary, lineHeight: 34,
  },
  stepSubtitle: {
    fontFamily: 'DMSans-Regular', fontSize: 14, color: Colors.textSecondary,
    marginTop: 6, lineHeight: 20,
  },

  sectionLabel: {
    fontFamily: 'DMSans-SemiBold', fontSize: 10, color: Colors.textTertiary,
    letterSpacing: 0.8, marginTop: 20, marginBottom: 10,
  },

  // ── Type cards (Step 1) ───────────────────────────────────────────
  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200, backgroundColor: Colors.white,
  },
  typeCardActive: {
    backgroundColor: Colors.terra500, borderColor: Colors.terra500,
  },
  typeIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.terra50, alignItems: 'center', justifyContent: 'center',
  },
  typeIconActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  typeTitle: { fontFamily: 'DMSans-SemiBold', fontSize: 15, color: Colors.textPrimary },
  typeTitleActive: { color: Colors.white },
  typeSubtitle: { fontFamily: 'DMSans-Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  typeSubtitleActive: { color: 'rgba(255,255,255,0.8)' },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── BHK cards (Step 2) ────────────────────────────────────────────
  bhkCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200, backgroundColor: Colors.white,
  },
  bhkCardActive: {
    backgroundColor: Colors.terra500, borderColor: Colors.terra500,
  },
  bhkTitle: { fontFamily: 'DMSans-Bold', fontSize: 20, color: Colors.textPrimary, minWidth: 76, letterSpacing: 0.2 },
  bhkTitleActive: { color: Colors.white },
  bhkDesc: { flex: 1, fontFamily: 'DMSans-Regular', fontSize: 13, color: Colors.textSecondary },
  bhkDescActive: { color: 'rgba(255,255,255,0.85)' },

  // ── Extras (Step 3) ───────────────────────────────────────────────
  extraCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, marginBottom: 8, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.warm200, backgroundColor: Colors.white,
  },
  extraCardActive: {
    backgroundColor: Colors.terra500, borderColor: Colors.terra500,
  },
  extraIcon: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: Colors.terra50, alignItems: 'center', justifyContent: 'center',
  },
  extraIconActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  extraLabel: { fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.textPrimary },
  extraLabelActive: { color: Colors.white },
  extraSublabel: { fontFamily: 'DMSans-Regular', fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  extraSublabelActive: { color: 'rgba(255,255,255,0.8)' },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: Colors.warm300,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.white, borderColor: Colors.white,
  },

  // ── Balcony stepper ───────────────────────────────────────────────
  stepper: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.warm200, backgroundColor: Colors.white,
  },
  stepperIcon: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: Colors.terra50, alignItems: 'center', justifyContent: 'center',
  },
  stepperLabel: { fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.textPrimary },
  stepperSubtle: { fontFamily: 'DMSans-Regular', fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  stepBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.terra50, alignItems: 'center', justifyContent: 'center',
  },
  stepBtnDisabled: { backgroundColor: Colors.warm100 },
  stepperValue: {
    fontFamily: 'DMSans-SemiBold', fontSize: 16, color: Colors.textPrimary, minWidth: 18, textAlign: 'center',
  },

  // ── Preview (Step 4) ──────────────────────────────────────────────
  previewCard: {
    marginTop: 20, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200, backgroundColor: Colors.cream,
    paddingVertical: 4, paddingHorizontal: 14,
  },
  previewRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.warm200,
  },
  previewNum: {
    fontFamily: 'DMSans-SemiBold', fontSize: 12, color: Colors.terra500,
    width: 22,
  },
  previewName: { flex: 1, fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.textPrimary },
  previewCount: { fontFamily: 'DMSans-Regular', fontSize: 11, color: Colors.textTertiary },
  previewFooter: {
    marginTop: 14, fontFamily: 'DMSans-Regular', fontSize: 11,
    color: Colors.textTertiary, lineHeight: 16,
  },

  // ── Footer ────────────────────────────────────────────────────────
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: Spacing.xxl, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: Colors.warm100, backgroundColor: Colors.white,
  },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 15, borderRadius: 14,
    backgroundColor: Colors.terra500,
  },
  primaryBtnDisabled: { backgroundColor: Colors.warm300 },
  primaryBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: 15, color: Colors.white },
});
