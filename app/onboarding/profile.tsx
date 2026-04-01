import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  LayoutTemplate,
  Mic,
  MessageSquare,
  Sparkles,
  MapPin,
  Building2,
  Maximize2,
  Wallet,
  Target,
  ArrowUp,
  Check,
  Pencil,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import AlonAvatar from '../../components/AlonAvatar';
import LocationPicker from '../../components/LocationPicker';
import BottomSheet from '../../components/BottomSheet';
import PillSelector from '../../components/PillSelector';
import BudgetSlider from '../../components/BudgetSlider';
import PurposeGrid from '../../components/PurposeGrid';
import Button from '../../components/Button';
import { Colors, Spacing } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboarding';
import { useHaptics } from '../../hooks/useHaptics';
import {
  PUNE_LOCATIONS,
  PROPERTY_SIZES,
  TIMELINE_OPTIONS,
  formatBudget,
} from '../../constants/locations';

// ── Chat step definitions ──
type StepKey = 'mode' | 'prediction' | 'location' | 'type' | 'size' | 'budget' | 'purpose' | 'timeline' | 'brief' | 'done' | 'chat';

interface ChatMsg {
  id: string;
  from: 'alon' | 'user';
  text: string;
  step?: StepKey;
}

const ALON_QUESTIONS: Record<StepKey, string> = {
  mode: "I've already been thinking about what might work for you. How would you like to get started?",
  prediction: "Based on what I know about you, I've prepared a starting point. Tap any field to adjust it.",
  location: "Where in Pune are you looking? Pick one or more areas that interest you.",
  type: "What kind of property works best for you?",
  size: "What size are you thinking? You can pick more than one.",
  budget: "What's your comfortable budget range? I'll focus my search within this.",
  purpose: "What's the primary purpose?",
  timeline: "When do you need it by?",
  brief: "Anything else I should know? Builders to trust or avoid, must-haves, deal-breakers — your direct brief to me.",
  done: "Got it — I have everything I need. Let me start working on this for you.",
  chat: "Go ahead — tell me your preferred location, property type, size, budget, purpose, and any deal-breakers. I'll parse it all.",
};

const MODE_OPTIONS = [
  { key: 'prediction', icon: Sparkles, label: 'ALON\'s pick for you', sub: 'I\'ve anticipated your needs', highlight: true },
  { key: 'template', icon: LayoutTemplate, label: 'Quick template', sub: 'I\'ll guide you step by step', highlight: false },
  { key: 'voice', icon: Mic, label: 'Voice brief', sub: 'Tell me in your own words', highlight: false },
  { key: 'chat', icon: MessageSquare, label: 'Write it out', sub: 'Type your requirements freely', highlight: false },
];

const TYPE_RESIDENTIAL = ['Apartment', 'Villa', 'Penthouse', 'Row House', 'Duplex'];
const TYPE_COMMERCIAL = ['Office', 'Shop', 'Showroom', 'Coworking'];

const PURPOSE_OPTIONS = [
  { id: 'self', label: 'Self use' },
  { id: 'invest', label: 'Investment' },
  { id: 'family', label: 'Family' },
  { id: 'work', label: 'Work hub' },
];

// Step flow order
const STEP_FLOW: StepKey[] = ['location', 'type', 'size', 'budget', 'purpose', 'timeline', 'brief', 'done'];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const store = useOnboardingStore();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: '0', from: 'alon', text: ALON_QUESTIONS.mode, step: 'mode' },
  ]);
  const [currentStep, setCurrentStep] = useState<StepKey>('mode');
  const [flowStarted, setFlowStarted] = useState(false);
  const [briefText, setBriefText] = useState('');
  const [sheetField, setSheetFieldRaw] = useState<string | null>(null);
  const [tempLocations, setTempLocations] = useState<string[]>(store.locations);
  const [tempBudget, setTempBudget] = useState(store.budget);
  const [tempNeedsLoan, setTempNeedsLoan] = useState(store.needsLoan);

  // Sync temp state from store when opening a sheet
  const setSheetField = useCallback((field: string | null) => {
    if (field) {
      setTempLocations(store.locations);
      setTempBudget(store.budget);
      setTempNeedsLoan(store.needsLoan);
    }
    setSheetFieldRaw(field);
  }, [store.locations, store.budget, store.needsLoan]);

  // Status pill animation
  const dotScale = useSharedValue(1);
  const pillOpacity = useSharedValue(1);

  useEffect(() => {
    dotScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    pillOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1, true
    );
  }, []);

  const dotAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: dotScale.value }] }));
  const pillAnimStyle = useAnimatedStyle(() => ({ opacity: pillOpacity.value }));

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }, []);

  const addMessage = useCallback((msg: ChatMsg) => {
    setMessages(prev => [...prev, msg]);
    scrollToBottom();
  }, [scrollToBottom]);

  const advanceToStep = useCallback((step: StepKey) => {
    setCurrentStep(step);
    const alonMsg: ChatMsg = {
      id: `alon-${step}-${Date.now()}`,
      from: 'alon',
      text: ALON_QUESTIONS[step],
      step,
    };
    // Small delay to feel conversational
    setTimeout(() => {
      addMessage(alonMsg);
    }, 400);
  }, [addMessage]);

  const getNextStep = useCallback((current: StepKey): StepKey | null => {
    const idx = STEP_FLOW.indexOf(current);
    if (idx === -1 || idx >= STEP_FLOW.length - 1) return null;
    return STEP_FLOW[idx + 1];
  }, []);

  const handleUserAnswer = useCallback((step: StepKey, displayText: string) => {
    haptics.selection();
    const userMsg: ChatMsg = { id: `user-${step}-${Date.now()}`, from: 'user', text: displayText };
    addMessage(userMsg);

    const next = getNextStep(step);
    if (next) {
      advanceToStep(next);
    }
  }, [addMessage, getNextStep, advanceToStep]);

  // Mode selection
  // Prediction mode helpers
  const ROW_ICONS: Record<string, typeof MapPin> = {
    Location: MapPin, Type: Building2, Size: Maximize2, Budget: Wallet, Purpose: Target,
  };
  const PURPOSE_ITEMS_MAP: Record<string, string> = {
    self: 'Live in it', invest: 'Invest', family: 'Family', work: 'Work hub',
  };
  const predictionRows = [
    { label: 'Location', value: store.locations.join(', ') || 'West Pune', field: 'Location' },
    { label: 'Type', value: store.propertyType || 'Apartment', field: 'Type' },
    { label: 'Size', value: store.propertySize.join(', ') || '2 BHK, 3 BHK', field: 'Size' },
    { label: 'Budget', value: `${formatBudget(store.budget.min)} – ${formatBudget(store.budget.max)}`, field: 'Budget' },
    { label: 'Purpose', value: `${store.purpose || 'Self use'} · ${store.timeline || 'Ready to move'}`, field: 'Purpose' },
  ];
  const contextLabel =
    store.persona === 'first' ? 'Curated for your first home in Pune'
    : store.persona === 'upgrade' ? 'Tailored for your next move in Pune'
    : store.persona === 'invest' ? 'Optimized for your investment goals in Pune'
    : store.persona === 'rent_new' ? 'Picked for your first office in Pune'
    : store.persona === 'rent_change' ? 'Matched to your relocation needs in Pune'
    : store.persona === 'rent_sublease' ? 'Set up for your sub-lease in Pune'
    : 'Personalized for you';

  const handleModeSelect = useCallback((mode: string) => {
    haptics.medium();
    if (mode === 'prediction') {
      addMessage({ id: `user-mode-prediction-${Date.now()}`, from: 'user', text: 'Show me ALON\'s pick' });
      setFlowStarted(true);
      advanceToStep('prediction');
    } else if (mode === 'template') {
      addMessage({ id: `user-mode-template-${Date.now()}`, from: 'user', text: 'Quick template — guide me step by step' });
      setFlowStarted(true);
      advanceToStep('location');
    } else if (mode === 'voice') {
      addMessage({ id: `user-mode-voice-${Date.now()}`, from: 'user', text: 'Voice brief' });
      setTimeout(() => router.push('/onboarding/voice'), 300);
    } else {
      addMessage({ id: `user-mode-chat-${Date.now()}`, from: 'user', text: 'I\'ll write it out' });
      setFlowStarted(true);
      setCurrentStep('chat');
      setTimeout(() => {
        addMessage({
          id: 'alon-chat-hint',
          from: 'alon',
          text: "Go ahead — tell me your preferred location, property type, size, budget, purpose, and any deal-breakers. I'll parse it all.",
          step: 'chat',
        });
      }, 400);
    }
  }, [addMessage, advanceToStep, router]);

  // Location: open bottom sheet
  const handleLocationDone = useCallback(() => {
    store.setLocations(tempLocations);
    setSheetField(null);
    if (currentStep !== 'prediction') {
      handleUserAnswer('location', tempLocations.join(', ') || 'No preference');
    }
  }, [tempLocations, store, handleUserAnswer, currentStep]);

  // Type selection
  const handleTypeSelect = useCallback((type: string) => {
    store.setPropertyType(type);
    handleUserAnswer('type', type);
  }, [store, handleUserAnswer]);

  // Size selection (multi-select, confirm with done)
  const [tempSizes, setTempSizes] = useState<string[]>(store.propertySize);
  const handleSizeToggle = useCallback((size: string) => {
    haptics.light();
    setTempSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  }, []);
  const handleSizeDone = useCallback(() => {
    store.setPropertySize(tempSizes);
    handleUserAnswer('size', tempSizes.join(', ') || 'Flexible');
  }, [tempSizes, store, handleUserAnswer]);

  // Budget: open bottom sheet
  const handleBudgetDone = useCallback(() => {
    store.setBudget(tempBudget);
    store.setNeedsLoan(tempNeedsLoan);
    setSheetField(null);
    if (currentStep !== 'prediction') {
      handleUserAnswer('budget', `${formatBudget(tempBudget.min)} – ${formatBudget(tempBudget.max)}`);
    }
  }, [tempBudget, tempNeedsLoan, store, handleUserAnswer, currentStep]);

  // Purpose
  const handlePurposeSelect = useCallback((purpose: string) => {
    store.setPurpose(purpose);
    handleUserAnswer('purpose', purpose);
  }, [store, handleUserAnswer]);

  // Timeline
  const handleTimelineSelect = useCallback((timeline: string) => {
    store.setTimeline(timeline);
    handleUserAnswer('timeline', timeline);
  }, [store, handleUserAnswer]);

  // Brief
  const handleBriefSubmit = useCallback(() => {
    store.setBriefText(briefText);
    handleUserAnswer('brief', briefText || 'Nothing specific — surprise me');
  }, [briefText, store, handleUserAnswer]);

  // Free-form chat submit
  const [freeText, setFreeText] = useState('');
  const handleFreeSubmit = useCallback(() => {
    if (!freeText.trim()) return;
    haptics.selection();
    addMessage({ id: `user-free-${Date.now()}`, from: 'user', text: freeText.trim() });
    store.setBriefText(freeText.trim());
    setFreeText('');
    // Simulate ALON parsing
    setTimeout(() => {
      addMessage({
        id: `alon-parsed-${Date.now()}`,
        from: 'alon',
        text: "Got it — I've noted your requirements. Let me start searching for the perfect match.",
        step: 'done',
      });
      setCurrentStep('done');
    }, 800);
  }, [freeText, store, addMessage]);

  // ── Render option chips for current step ──
  const renderOptions = () => {
    if (currentStep === 'mode') {
      return (
        <Animated.View style={styles.modeCards} entering={FadeInUp.delay(200).duration(250)}>
          {MODE_OPTIONS.map((mode) => {
            const Icon = mode.icon;
            return (
              <TouchableOpacity
                key={mode.key}
                style={[styles.modeCard, mode.highlight && styles.modeCardHighlight]}
                onPress={() => handleModeSelect(mode.key)}
                activeOpacity={0.75}
              >
                <View style={[styles.modeIconWrap, mode.highlight && styles.modeIconWrapHighlight]}>
                  <Icon size={18} color={mode.highlight ? '#fff' : Colors.terra500} strokeWidth={1.8} />
                </View>
                <View style={styles.modeTextWrap}>
                  <Text style={styles.modeLabel}>{mode.label}</Text>
                  <Text style={styles.modeSub}>{mode.sub}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      );
    }

    if (currentStep === 'prediction') {
      return (
        <Animated.View style={styles.optionArea} entering={FadeInUp.delay(100).duration(250)}>
          {/* Prediction card */}
          <View style={styles.predictionCard}>
            <View style={styles.predictionHeader}>
              <Text style={styles.predictionHeaderText}>{contextLabel}</Text>
            </View>
            {predictionRows.map((row, index) => {
              const Icon = ROW_ICONS[row.label] || Target;
              return (
                <TouchableOpacity
                  key={row.label}
                  style={[styles.predictionRow, index > 0 && styles.predictionRowBorder]}
                  onPress={() => setSheetField(row.field)}
                  activeOpacity={0.6}
                >
                  <Icon size={16} color={Colors.terra500} strokeWidth={1.8} />
                  <View style={styles.predictionRowContent}>
                    <Text style={styles.predictionRowValue}>{row.value}</Text>
                    <Text style={styles.predictionRowLabel}>{row.label}</Text>
                  </View>
                  <Pencil size={14} color={Colors.warm300} strokeWidth={1.8} />
                </TouchableOpacity>
              );
            })}
            {/* Brief section */}
            <View style={styles.predictionBrief}>
              <Text style={styles.predictionBriefTitle}>Anything ALON must know?</Text>
              <Text style={styles.predictionBriefSub}>
                Builders you trust or avoid, must-haves —{' '}
                <Text style={{ color: Colors.terra500, fontFamily: 'DMSans-Medium' }}>your direct brief.</Text>
              </Text>
              <TextInput
                style={styles.briefInput}
                placeholder="e.g. Only established builders, need parking, avoid ground floor..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={briefText}
                onChangeText={setBriefText}
              />
            </View>
          </View>
          <Button
            title="Yes, this feels right →"
            onPress={() => {
              store.setBriefText(briefText);
              addMessage({ id: `user-predict-confirm-${Date.now()}`, from: 'user', text: 'Looks perfect — let\'s go' });
              advanceToStep('done');
            }}
            variant="primary"
          />
        </Animated.View>
      );
    }

    if (currentStep === 'location') {
      return (
        <Animated.View style={styles.optionArea} entering={FadeInUp.delay(100).duration(200)}>
          <View style={styles.chipGrid}>
            {PUNE_LOCATIONS.slice(0, 10).map((loc) => (
              <Pressable
                key={loc}
                style={[styles.chip, tempLocations.includes(loc) && styles.chipSelected]}
                onPress={() => {
                  haptics.light();
                  setTempLocations(prev =>
                    prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
                  );
                }}
              >
                <Text style={[styles.chipText, tempLocations.includes(loc) && styles.chipTextSelected]}>
                  {loc}
                </Text>
              </Pressable>
            ))}
          </View>
          <TouchableOpacity style={styles.moreBtn} onPress={() => setSheetField('Location')} activeOpacity={0.7}>
            <MapPin size={12} color={Colors.terra500} strokeWidth={2} />
            <Text style={styles.moreBtnText}>Browse all areas</Text>
          </TouchableOpacity>
          {tempLocations.length > 0 && (
            <TouchableOpacity style={styles.confirmBtn} onPress={handleLocationDone} activeOpacity={0.85}>
              <Check size={14} color="#fff" strokeWidth={2.5} />
              <Text style={styles.confirmBtnText}>Confirm {tempLocations.length} area{tempLocations.length > 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      );
    }

    if (currentStep === 'type') {
      return (
        <Animated.View style={styles.optionArea} entering={FadeInUp.delay(100).duration(200)}>
          <Text style={styles.chipGroupLabel}>Residential</Text>
          <View style={styles.chipGrid}>
            {TYPE_RESIDENTIAL.map((t) => (
              <Pressable key={t} style={styles.chip} onPress={() => handleTypeSelect(t)}>
                <Text style={styles.chipText}>{t}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.chipGroupLabel, { marginTop: 10 }]}>Commercial</Text>
          <View style={styles.chipGrid}>
            {TYPE_COMMERCIAL.map((t) => (
              <Pressable key={t} style={styles.chip} onPress={() => handleTypeSelect(t)}>
                <Text style={styles.chipText}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      );
    }

    if (currentStep === 'size') {
      return (
        <Animated.View style={styles.optionArea} entering={FadeInUp.delay(100).duration(200)}>
          <View style={styles.chipGrid}>
            {PROPERTY_SIZES.map((s) => (
              <Pressable
                key={s}
                style={[styles.chip, tempSizes.includes(s) && styles.chipSelected]}
                onPress={() => handleSizeToggle(s)}
              >
                <Text style={[styles.chipText, tempSizes.includes(s) && styles.chipTextSelected]}>{s}</Text>
              </Pressable>
            ))}
          </View>
          {tempSizes.length > 0 && (
            <TouchableOpacity style={styles.confirmBtn} onPress={handleSizeDone} activeOpacity={0.85}>
              <Check size={14} color="#fff" strokeWidth={2.5} />
              <Text style={styles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      );
    }

    if (currentStep === 'budget') {
      return (
        <Animated.View style={styles.optionArea} entering={FadeInUp.delay(100).duration(200)}>
          <TouchableOpacity style={styles.budgetTapCard} onPress={() => setSheetField('Budget')} activeOpacity={0.75}>
            <Wallet size={16} color={Colors.terra500} strokeWidth={1.8} />
            <View style={{ flex: 1 }}>
              <Text style={styles.budgetTapValue}>{formatBudget(tempBudget.min)} – {formatBudget(tempBudget.max)}</Text>
              <Text style={styles.budgetTapHint}>Tap to adjust with slider</Text>
            </View>
            <Pencil size={14} color={Colors.warm300} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleBudgetDone} activeOpacity={0.85}>
            <Check size={14} color="#fff" strokeWidth={2.5} />
            <Text style={styles.confirmBtnText}>Confirm budget</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    if (currentStep === 'purpose') {
      return (
        <Animated.View style={styles.optionArea} entering={FadeInUp.delay(100).duration(200)}>
          <View style={styles.chipGrid}>
            {PURPOSE_OPTIONS.map((p) => (
              <Pressable key={p.id} style={styles.chip} onPress={() => handlePurposeSelect(p.label)}>
                <Text style={styles.chipText}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      );
    }

    if (currentStep === 'timeline') {
      return (
        <Animated.View style={styles.optionArea} entering={FadeInUp.delay(100).duration(200)}>
          <View style={styles.chipGrid}>
            {TIMELINE_OPTIONS.map((t) => (
              <Pressable key={t} style={styles.chip} onPress={() => handleTimelineSelect(t)}>
                <Text style={styles.chipText}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      );
    }

    if (currentStep === 'brief') {
      return (
        <Animated.View style={styles.optionArea} entering={FadeInUp.delay(100).duration(200)}>
          <TextInput
            style={styles.briefInput}
            placeholder="e.g. Only established builders, need parking, avoid ground floor..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={briefText}
            onChangeText={setBriefText}
          />
          <TouchableOpacity style={styles.confirmBtn} onPress={handleBriefSubmit} activeOpacity={0.85}>
            <Text style={styles.confirmBtnText}>{briefText.trim() ? 'Submit brief' : 'Skip — nothing specific'}</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    if (currentStep === 'chat') {
      return (
        <Animated.View style={styles.freeInputWrap} entering={FadeInUp.delay(100).duration(200)}>
          <TextInput
            style={styles.freeInput}
            placeholder="e.g. 3 BHK in Baner under 1.2Cr, ready to move, established builder..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            value={freeText}
            onChangeText={setFreeText}
          />
          <TouchableOpacity
            style={[styles.freeSendBtn, !freeText.trim() && { opacity: 0.35 }]}
            onPress={handleFreeSubmit}
            disabled={!freeText.trim()}
            activeOpacity={0.85}
          >
            <ArrowUp size={16} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </Animated.View>
      );
    }

    if (currentStep === 'done') {
      return (
        <Animated.View style={styles.doneCta} entering={FadeInUp.delay(300).duration(250)}>
          <Button
            title="Let's go →"
            onPress={() => router.push('/onboarding/signup')}
            variant="primary"
          />
        </Animated.View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>ALON</Text>
          <Animated.View style={[styles.statusPill, pillAnimStyle]}>
            <Animated.View style={[styles.statusDot, dotAnimStyle]} />
            <Text style={styles.statusText}>listening</Text>
          </Animated.View>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 50}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messagesScroll}
          contentContainerStyle={[styles.messagesContent, { paddingBottom: 16 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollToBottom()}
        >
          {messages.map((msg) => (
            <Animated.View
              key={msg.id}
              style={msg.from === 'alon' ? styles.alonRow : styles.userRow}
              entering={FadeIn.duration(200)}
            >
              {msg.from === 'alon' && (
                <AlonAvatar size={26} showRings={false} showBlink />
              )}
              <View style={msg.from === 'alon' ? styles.alonBubble : styles.userBubble}>
                <Text style={msg.from === 'alon' ? styles.alonText : styles.userText}>
                  {msg.text}
                </Text>
              </View>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Interactive options area */}
        <View style={[styles.optionsContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {renderOptions()}
        </View>
      </KeyboardAvoidingView>

      {/* ── Bottom Sheets ── */}
      <BottomSheet
        visible={sheetField === 'Location'}
        title="Where in Pune?"
        onClose={() => setSheetField(null)}
      >
        <LocationPicker
          selected={tempLocations}
          onSelect={setTempLocations}
        />
        <View style={{ marginTop: 20 }}>
          <Button title="Done" onPress={handleLocationDone} variant="primary" />
        </View>
      </BottomSheet>

      <BottomSheet
        visible={sheetField === 'Type'}
        title="Property type"
        onClose={() => setSheetField(null)}
      >
        <Text style={styles.sheetSectionLabel}>Residential</Text>
        <PillSelector
          options={['Apartment', 'Villa', 'Penthouse', 'Row House', 'Duplex']}
          selected={[store.propertyType]}
          onSelect={(sel) => { store.setPropertyType(sel[0]); setSheetField(null); }}
        />
        <Text style={[styles.sheetSectionLabel, { marginTop: 20 }]}>Commercial</Text>
        <PillSelector
          options={['Office', 'Shop', 'Showroom', 'Coworking']}
          selected={[store.propertyType]}
          onSelect={(sel) => { store.setPropertyType(sel[0]); setSheetField(null); }}
        />
      </BottomSheet>

      <BottomSheet
        visible={sheetField === 'Size'}
        title="Property size"
        onClose={() => setSheetField(null)}
      >
        <PillSelector
          options={PROPERTY_SIZES}
          selected={store.propertySize}
          onSelect={store.setPropertySize}
          multiSelect
        />
        <View style={{ marginTop: 20 }}>
          <Button title="Done" onPress={() => setSheetField(null)} variant="primary" />
        </View>
      </BottomSheet>

      <BottomSheet
        visible={sheetField === 'Budget'}
        title="Budget range"
        onClose={() => setSheetField(null)}
      >
        <BudgetSlider
          min={tempBudget.min}
          max={tempBudget.max}
          onChangeMin={(min) => setTempBudget(prev => ({ ...prev, min }))}
          onChangeMax={(max) => setTempBudget(prev => ({ ...prev, max }))}
          showLoanToggle
          needsLoan={tempNeedsLoan}
          onToggleLoan={setTempNeedsLoan}
        />
        <View style={{ marginTop: 20 }}>
          <Button title="Done" onPress={handleBudgetDone} variant="primary" />
        </View>
      </BottomSheet>

      <BottomSheet
        visible={sheetField === 'Purpose'}
        title="What's this for?"
        onClose={() => setSheetField(null)}
      >
        <PurposeGrid
          selected={
            store.purpose === 'Self use' || store.purpose === 'Live in it' ? 'self'
            : store.purpose === 'Investment' || store.purpose === 'Invest' ? 'invest'
            : store.purpose === 'Family' ? 'family'
            : store.purpose === 'Work hub' ? 'work'
            : store.purpose
          }
          onSelect={(id) => {
            const label = PURPOSE_ITEMS_MAP[id] || id;
            store.setPurpose(label);
          }}
        />
        <Text style={[styles.sheetSectionLabel, { marginTop: 20 }]}>Possession timeline</Text>
        <PillSelector
          options={TIMELINE_OPTIONS}
          selected={[store.timeline]}
          onSelect={(sel) => store.setTimeline(sel[0])}
        />
        <View style={{ marginTop: 20 }}>
          <Button title="Done" onPress={() => setSheetField(null)} variant="primary" />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.warm100,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.warm200,
    alignItems: 'center', justifyContent: 'center',
  },
  topBarCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarTitle: { fontFamily: 'DMSerifDisplay', fontSize: 18, color: Colors.textPrimary },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1, borderColor: '#D1FAE5',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  statusText: { fontSize: 11, fontFamily: 'DMSans-Medium', color: '#16A34A' },

  // Messages
  messagesScroll: { flex: 1 },
  messagesContent: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.lg },

  alonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 14 },
  alonBubble: {
    flex: 1, backgroundColor: Colors.cream, borderRadius: 16, borderTopLeftRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10, maxWidth: '85%',
  },
  alonText: { fontSize: 14, fontFamily: 'DMSans-Regular', color: Colors.textPrimary, lineHeight: 21 },

  userRow: { alignItems: 'flex-end', marginBottom: 14 },
  userBubble: {
    backgroundColor: Colors.terra500, borderRadius: 16, borderBottomRightRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10, maxWidth: '80%',
  },
  userText: { fontSize: 14, fontFamily: 'DMSans-Regular', color: '#fff', lineHeight: 21 },

  // Options container
  optionsContainer: {
    paddingHorizontal: Spacing.xxl, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: Colors.warm100, backgroundColor: Colors.white,
  },

  // Mode cards
  modeCards: { gap: 8 },
  modeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.warm200,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
  },
  modeIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: Colors.terra50, borderWidth: 1, borderColor: Colors.terra200,
    alignItems: 'center', justifyContent: 'center',
  },
  modeTextWrap: { flex: 1 },
  modeLabel: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  modeSub: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, marginTop: 1 },
  modeCardHighlight: {
    backgroundColor: Colors.terra50, borderColor: Colors.terra200,
  },
  modeIconWrapHighlight: {
    backgroundColor: Colors.terra500, borderColor: Colors.terra500,
  },

  // Prediction card
  predictionCard: {
    backgroundColor: Colors.white, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.warm200, overflow: 'hidden',
  },
  predictionHeader: {
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.cream,
  },
  predictionHeaderText: {
    fontSize: 10, fontFamily: 'DMSans-Medium', color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  predictionRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
    paddingVertical: 12, gap: 10,
  },
  predictionRowBorder: {
    borderTopWidth: 1, borderTopColor: Colors.warm100,
  },
  predictionRowContent: { flex: 1 },
  predictionRowValue: {
    fontSize: 15, fontFamily: 'DMSans-Medium', color: Colors.textPrimary,
  },
  predictionRowLabel: {
    fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, marginTop: 1,
  },
  predictionBrief: {
    borderTopWidth: 1, borderTopColor: Colors.warm100,
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 14,
  },
  predictionBriefTitle: {
    fontSize: 15, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary, marginBottom: 4,
  },
  predictionBriefSub: {
    fontSize: 12, fontFamily: 'DMSans-Regular', color: Colors.textTertiary,
    lineHeight: 18, marginBottom: 10,
  },
  sheetSectionLabel: {
    fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10,
  },

  // Option area
  optionArea: { gap: 10 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipGroupLabel: {
    fontSize: 10, fontFamily: 'DMSans-Medium', color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
    backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.warm200,
  },
  chipSelected: {
    backgroundColor: Colors.terra50, borderColor: Colors.terra400,
  },
  chipText: { fontSize: 13, fontFamily: 'DMSans-Medium', color: Colors.textSecondary },
  chipTextSelected: { color: Colors.terra600 },

  moreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', paddingVertical: 4,
  },
  moreBtnText: { fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.terra500 },

  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.terra500, borderRadius: 12, paddingVertical: 12, marginTop: 4,
  },
  confirmBtnText: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: '#fff' },

  // Budget tap card
  budgetTapCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.warm200,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  budgetTapValue: { fontSize: 15, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  budgetTapHint: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, marginTop: 1 },

  // Brief input
  briefInput: {
    fontSize: 13, fontFamily: 'DMSans-Regular', color: Colors.textPrimary, lineHeight: 20,
    minHeight: 80, paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.warm200, borderRadius: 12,
  },

  // Free-form chat input
  freeInputWrap: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
  },
  freeInput: {
    flex: 1, fontSize: 14, fontFamily: 'DMSans-Regular', color: Colors.textPrimary,
    minHeight: 44, maxHeight: 100, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.warm200, borderRadius: 14,
  },
  freeSendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.terra500, alignItems: 'center', justifyContent: 'center',
  },

  // Done CTA
  doneCta: { paddingTop: 4 },
});
