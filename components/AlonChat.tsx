import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, ArrowUp, Layers, ChevronRight, Maximize2, Paperclip, Image, FileText, X, GitCompareArrows, Search as SearchIcon, Heart, MapPin } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import AlonAvatar from './AlonAvatar';
import ChatPropertyCarousel from './ChatPropertyCarousel';
import StagePinnedContent from './StagePinnedContent';
import FinanceEMICard from './FinanceEMICard';
import CostBreakdownCard from './CostBreakdownCard';
import EligibilityResultCard from './EligibilityResultCard';
import CibilSliderCard from './CibilSliderCard';
import { Colors, Spacing } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';
import { SHORTLIST_PROPERTIES, Property } from '../constants/properties';
import { useOnboardingStore } from '../store/onboarding';
import { computeMatchScore, getRecommended, computePricePerSqft, getAppreciationYoY, parsePriceToNumber } from '../utils/compareScore';
import { calculateEMI, calculateEligibility, getInterestRate, getLoanAmount, formatINR } from '../utils/financeCalc';
import { Landmark, IndianRupee, Handshake } from 'lucide-react-native';

interface ChatMessage {
  id: string;
  type: 'user' | 'alon' | 'card' | 'property-carousel' | 'finance-emi' | 'finance-cost' | 'finance-eligibility' | 'cibil-prompt' | 'cibil-slider';
  text?: string;
  card?: { title: string; items: string[] };
  properties?: Property[];
  isScanning?: boolean;
  timestamp: number;
  // Finance-specific data
  financeData?: {
    propertyPrice?: number;
    propertyName?: string;
    cibilScore?: number | null;
    eligibilityResult?: import('../utils/financeCalc').EligibilityResult;
    likedPropertyIds?: string[];
  };
}

interface AlonChatProps {
  stage: string;
  insetBottom: number;
}

// Stage-specific prompts
const STAGE_PROMPTS: Record<string, string[]> = {
  Search: ['Why these matches?', 'Baner options', 'Change budget'],
  Shortlist: ['Is this property safe?', 'Compare my shortlist', 'Check for conflicts'],
  'Site Visits': ['Schedule a visit', 'Site visit checklist', 'What to inspect?'],
  Compare: ['Compare top 3', 'Which has best ROI?', 'Price vs market data'],
  Finance: ['How home loans work', 'What CIBIL score do I need?', 'Hidden charges to watch'],
  Legal: ['Review agreement', 'RERA compliance check', 'Red flag checklist'],
  Negotiate: ['How to negotiate', 'Which one should I negotiate on?', 'Help me pick from my shortlist'],
  'Deal Closure': ['Deal timeline', 'Pending documents', 'Upcoming deadlines'],
  Possession: ['Possession checklist', 'Document list', 'Transfer process'],
};

// Stage-specific pill labels
const STAGE_PILL_LABELS: Record<string, string> = {
  Search: 'matches',
  Shortlist: 'shortlisted',
  'Site Visits': 'visits planned',
  Compare: 'comparing',
  Finance: 'in review',
  Legal: 'under legal check',
  Negotiate: 'negotiating',
  'Deal Closure': 'closing',
  Possession: 'in process',
};

// Demo responses
const DEMO_RESPONSES: Record<string, { text: string; card?: { title: string; items: string[] } }> = {
  'Why these matches?': {
    text: 'I selected these 5 properties based on your criteria — 2-3 BHK in West Pune, ₹80L–₹1.2Cr. Each has verified RERA compliance and a builder trust score above 4.0. Godrej Hillside stands out with 12% annual appreciation in Baner.',
  },
  'Baner options': {
    text: 'Here are 3 RERA-verified properties in Baner matching your budget:',
    card: {
      title: 'Baner matches',
      items: ['Godrej Hillside · ₹1.35 Cr · 3 BHK', 'Kumar Meridian · ₹98L · 2 BHK', 'Rohan Leela · ₹1.12 Cr · 3 BHK'],
    },
  },
  'Change budget': {
    text: "Sure! You can adjust your budget anytime. I'll re-scan listings with your new range. Tap the settings icon in the header or tell me your new budget here.",
  },
  'Schedule a visit': {
    text: 'I can book visits for your shortlisted properties. Your number stays hidden — the builder only gets a reference ID. Which property would you like to visit first?',
    card: {
      title: 'Available slots',
      items: ['Godrej Hillside · Sat 10am–1pm', 'Pride World City · Sun 11am–2pm', 'Sobha Dream Acres · Mon 4pm–6pm'],
    },
  },
  'How to compare properties?': {
    text: 'To start comparing, head to your Shortlist and tap ♡ on at least 2 properties you like. Once shortlisted, tap the "Compare" button and I\'ll build a detailed side-by-side analysis with match scores, market data, and my recommendation.',
  },
  'How to negotiate': {
    text: "Here's how ALON helps you negotiate smarter:\n\n📊 Fair-price benchmark — I'll pull recent registered transactions (Index II) from the Sub-Registrar's office for your property's micro-market. This is government data that builders can't argue with.\n\n🏘️ Comparable deals — Side-by-side view of what other buyers actually paid for similar properties in the last 6 months. No broker quotes — real sale deed data.\n\n✅ Negotiation checklist — A step-by-step checklist tailored to your property: what to ask, when to push, and what's non-negotiable.\n\nTo get started, tap \"Pick a Property to Negotiate\" below — I need to know which property you're going in for. You can also request Index II data or any specific market data you need from the Negotiate screen.",
  },
};

const DEFAULT_RESPONSE = {
  text: "I'm looking into that for you. Based on your preferences for properties in West Pune, I'll analyze the data and get back with specific insights.",
};

function formatIncomeINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function AlonChat({ stage, insetBottom }: AlonChatProps) {
  const router = useRouter();
  const haptics = useHaptics();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'alon',
      text: "I'm actively scanning for your perfect property. Sit tight — I'm checking RERA records, builder trust scores, and price trends across 12L+ listings.",
      isScanning: true,
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [usedPrompts, setUsedPrompts] = useState<Set<string>>(new Set());
  const [showShortlistPill, setShowShortlistPill] = useState(false);
  const [attachments, setAttachments] = useState<{ id: string; name: string; type: 'image' | 'document' }[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const scanFlowDone = useRef(false);
  const { likedPropertyIds, scheduledVisits, chatExpanded, setChatExpanded, budget, locations, propertySize } = useOnboardingStore();
  const preferences = { budget, locations, propertySize };
  const scrollOffsetY = useRef(0);

  // Pull-down gesture to collapse full-screen chat
  const pullDownGesture = Gesture.Pan()
    .activeOffsetY(10)
    .failOffsetY(-5)
    .enabled(chatExpanded)
    .onEnd((e) => {
      // Only collapse if scrolled near top and dragged down enough
      if (scrollOffsetY.current < 10 && e.translationY > 80) {
        setChatExpanded(false);
        haptics.light();
      }
    })
    .runOnJS(true);

  const onScrollChat = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetY.current = e.nativeEvent.contentOffset.y;
  };
  const lastVisitCount = useRef(scheduledVisits.length);
  const lastLikedCount = useRef(likedPropertyIds.length);

  const prompts = (() => {
    if (stage === 'Compare' && likedPropertyIds.length < 2) {
      return ['How to compare properties?', 'Browse top matches', 'What is ALON\'s Pick?'];
    }
    // Dynamic Finance prompts based on user state
    if (stage === 'Finance') {
      const fs = useOnboardingStore.getState();
      const hasCibil = !!fs.cibilScore || fs.cibilSkipped;
      const hasIncome = !!fs.monthlyIncome;
      const hasLiked = likedPropertyIds.length > 0;
      const cibilPoor = fs.cibilScore !== null && fs.cibilScore < 650;

      if (!hasCibil) {
        return ['How home loans work', 'What CIBIL score do I need?', 'Plan Your Loan'];
      }
      if (cibilPoor) {
        return ['How to improve my CIBIL', 'Can I still get a loan?', 'Plan Your Loan'];
      }
      if (hasCibil && !hasIncome) {
        return ['Am I eligible for a home loan?', 'How to improve my rate?', 'Hidden charges to watch'];
      }
      if (hasIncome && hasLiked) {
        const propName = SHORTLIST_PROPERTIES.find(p => p.id === likedPropertyIds[0])?.name;
        return [
          propName ? `Can I afford ${propName}?` : 'Can I afford my shortlist?',
          'Fixed vs floating rate?',
          'How to reduce my EMI?',
        ];
      }
      if (hasIncome) {
        return ['Which bank is best for me?', 'Fixed vs floating rate?', 'How to reduce my EMI?'];
      }
      return STAGE_PROMPTS.Finance;
    }
    return STAGE_PROMPTS[stage] || STAGE_PROMPTS.Search;
  })();
  const pillLabel = STAGE_PILL_LABELS[stage] || 'matches';

  // Attachment handlers
  const pickImage = useCallback(() => {
    setShowAttachMenu(false);
    haptics.selection();
    // Simulate picking an image — in production, use expo-image-picker
    const id = Date.now().toString();
    setAttachments(prev => [...prev, { id, name: 'Photo.jpg', type: 'image' }]);
  }, []);

  const pickDocument = useCallback(() => {
    setShowAttachMenu(false);
    haptics.selection();
    // Simulate picking a document — in production, use expo-document-picker
    const id = Date.now().toString();
    setAttachments(prev => [...prev, { id, name: 'Agreement.pdf', type: 'document' }]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    haptics.light();
    setAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  // Reset used prompts when stage changes
  useEffect(() => {
    setUsedPrompts(new Set());
  }, [stage]);

  // ── Scanning pulse animation (for initial message) ──
  const scanPulse = useSharedValue(1);
  const scanBarPos = useSharedValue(0);

  useEffect(() => {
    scanPulse.value = withRepeat(
      withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1, true
    );
    scanBarPos.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
  }, []);

  const scanPulseStyle = useAnimatedStyle(() => ({ opacity: scanPulse.value }));
  const SCAN_TRACK_WIDTH = 140;
  const SCAN_BAR_WIDTH = 24;
  const scanBarStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ translateX: scanBarPos.value * (SCAN_TRACK_WIDTH - SCAN_BAR_WIDTH) }] };
  });

  // ── Auto scanning flow: show properties after 3.5s ──
  useEffect(() => {
    if (scanFlowDone.current) return;
    scanFlowDone.current = true;

    const timer = setTimeout(() => {
      // Stop scanning on the initial message
      setMessages((prev) =>
        prev.map((m) => (m.id === '1' ? { ...m, isScanning: false } : m))
      );

      // Add the "found" message
      const foundMsg: ChatMessage = {
        id: 'scan-result-text',
        type: 'alon',
        text: `Found ${SHORTLIST_PROPERTIES.length} properties matching your criteria. Swipe through — I've added my take on each one.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, foundMsg]);

      // Add the carousel after a short delay
      setTimeout(() => {
        const carouselMsg: ChatMessage = {
          id: 'scan-result-carousel',
          type: 'property-carousel',
          properties: SHORTLIST_PROPERTIES,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, carouselMsg]);
        setShowShortlistPill(true);
        haptics.success();

        // After carousel, add "still scanning" message
        setTimeout(() => {
          const stillScanningMsg: ChatMessage = {
            id: 'still-scanning',
            type: 'alon',
            text: "I'm still scanning — these are your best matches so far. I'll check for new listings, price drops, and freshly verified properties. Expect an updated list in about 2 hours.",
            isScanning: true,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, stillScanningMsg]);
        }, 1200);
      }, 400);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  // ── React to new scheduled visits ──
  useEffect(() => {
    if (scheduledVisits.length > lastVisitCount.current) {
      const latest = scheduledVisits[scheduledVisits.length - 1];
      const visitMsg: ChatMessage = {
        id: `visit-${Date.now()}`,
        type: 'alon',
        text: `Got it! I've scheduled your visit to ${latest.propertyName} for ${latest.date} at ${latest.time}. Your number stays hidden — the builder will only see a reference ID. I'll send you a reminder before the visit.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, visitMsg]);
      haptics.success();
    }
    lastVisitCount.current = scheduledVisits.length;
  }, [scheduledVisits.length]);

  // ── React to new liked properties ──
  useEffect(() => {
    if (likedPropertyIds.length > lastLikedCount.current) {
      const newId = likedPropertyIds[likedPropertyIds.length - 1];
      const property = SHORTLIST_PROPERTIES.find((p) => p.id === newId);
      if (property) {
        const likeMsg: ChatMessage = {
          id: `like-${Date.now()}`,
          type: 'alon',
          text: `Nice pick! ${property.name} has been added to your shortlist. You now have ${likedPropertyIds.length} shortlisted propert${likedPropertyIds.length > 1 ? 'ies' : 'y'}.`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, likeMsg]);
      }
    }
    lastLikedCount.current = likedPropertyIds.length;
  }, [likedPropertyIds.length]);

  // ── Finance: welcoming message when entering Finance stage ──
  const financePrompted = useRef(false);
  useEffect(() => {
    if (stage === 'Finance' && !financePrompted.current) {
      financePrompted.current = true;
      const state = useOnboardingStore.getState();
      if (state.cibilScore) {
        const rate = getInterestRate(state.cibilScore);
        setMessages(prev => [...prev, {
          id: `finance-welcome-${Date.now()}`, type: 'alon',
          text: `Welcome to Finance! With your CIBIL score of ${state.cibilScore}, you can expect rates around ${rate.toFixed(1)}%. Let's calculate your EMI, check eligibility, or see the total acquisition cost.`,
          timestamp: Date.now(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: `finance-welcome-${Date.now()}`, type: 'alon',
          text: 'Let\'s plan your home loan. I can calculate your EMI, check eligibility, and show you the real cost of buying. Tap "Plan Your Loan" below to get started!',
          timestamp: Date.now(),
        }]);
      }
    }
  }, [stage]);

  // ── Negotiate: guiding message when entering Negotiate stage ──
  const negotiatePrompted = useRef(false);
  useEffect(() => {
    if (stage === 'Negotiate' && !negotiatePrompted.current) {
      negotiatePrompted.current = true;
      const state = useOnboardingStore.getState();
      const likedPool = SHORTLIST_PROPERTIES.filter(p => state.likedPropertyIds.includes(p.id));
      const poolCount = likedPool.length + state.userProperties.length;
      const selected =
        likedPool.find(p => p.id === state.negotiatePropertyId) ||
        state.userProperties.find(p => p.id === state.negotiatePropertyId);

      let text: string;
      if (poolCount === 0) {
        text = "Before we negotiate, you need a shortlisted property. Browse your matches and tap ♡ on at least one you're serious about — then I can build your negotiation case.";
      } else if (!selected) {
        text = `You have ${poolCount} shortlisted propert${poolCount > 1 ? 'ies' : 'y'}. Negotiation works on one at a time — tap "Pick a Property to Negotiate" below to choose the one you want to focus on. I'll build your case with market data, comparable sales, and a checklist.`;
      } else {
        text = `Continuing your negotiation on ${selected.name}. I'm preparing market data and your negotiation checklist.`;
      }

      setMessages(prev => [...prev, {
        id: `negotiate-welcome-${Date.now()}`,
        type: 'alon',
        text,
        timestamp: Date.now(),
      }]);
    }
  }, [stage]);

  // ── Send button animation ──
  const sendScale = useSharedValue(1);
  const sendAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: sendScale.value }] }));

  useEffect(() => {
    sendScale.value = withTiming(inputText.trim() ? 1.05 : 0.95, { duration: 150 });
  }, [!!inputText.trim()]);

  // ── Typing indicator animation ──
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  useEffect(() => {
    if (isGenerating) {
      dot1.value = withRepeat(withSequence(
        withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 })
      ), -1, true);
      dot2.value = withRepeat(withSequence(
        withTiming(0.3, { duration: 150 }),
        withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 })
      ), -1, true);
      dot3.value = withRepeat(withSequence(
        withTiming(0.3, { duration: 300 }),
        withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 })
      ), -1, true);
    }
  }, [isGenerating]);

  const d1Style = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const d2Style = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const d3Style = useAnimatedStyle(() => ({ opacity: dot3.value }));

  // ── Pill pulse for new properties ──
  const pillPulse = useSharedValue(1);
  useEffect(() => {
    if (showShortlistPill) {
      pillPulse.value = withSequence(
        withTiming(1.06, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );
    }
  }, [showShortlistPill]);
  const pillAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: pillPulse.value }] }));

  // ── Bottom section bounce on stage change ──
  const bottomBounce = useSharedValue(0);
  const bottomHighlight = useSharedValue(0);
  const prevStageRef = useRef(stage);

  useEffect(() => {
    if (prevStageRef.current !== stage) {
      prevStageRef.current = stage;
      haptics.selection();
      // Subtle upward bounce
      bottomBounce.value = withSequence(
        withSpring(-6, { damping: 12, stiffness: 300, mass: 0.4 }),
        withSpring(0, { damping: 14, stiffness: 200, mass: 0.5 })
      );
      // Brief background highlight pulse
      bottomHighlight.value = withSequence(
        withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
      );
    }
  }, [stage]);

  const bottomBounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomBounce.value }],
  }));
  const bottomHighlightStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(201, 120, 83, ${bottomHighlight.value * 0.06})`,
    borderRadius: 16,
  }));

  const sendMessage = useCallback((text: string) => {
    if (isGenerating) return;
    haptics.light();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setUsedPrompts((prev) => new Set(prev).add(text));
    setIsGenerating(true);

    // Simulate agent working
    const statuses = ['Analyzing your query...', 'Searching database...', 'Preparing response...'];
    let si = 0;
    setStatusText(statuses[0]);
    const statusInterval = setInterval(() => {
      si = (si + 1) % statuses.length;
      setStatusText(statuses[si]);
    }, 800);

    // Simulate response after delay
    setTimeout(() => {
      clearInterval(statusInterval);
      setIsGenerating(false);
      setStatusText('');

      // --- Dynamic response builder ---
      // Read fresh from store (not stale closure)
      const currentState = useOnboardingStore.getState();
      const currentLikedIds = currentState.likedPropertyIds;
      const currentPrefs = { budget: currentState.budget, locations: currentState.locations, propertySize: currentState.propertySize };

      let response = DEMO_RESPONSES[text] || DEFAULT_RESPONSE;
      const liked = currentLikedIds.length;
      const likedProps = currentLikedIds
        .map((id) => SHORTLIST_PROPERTIES.find((p) => p.id === id))
        .filter(Boolean) as Property[];

      // "Browse top matches" — always show discovery, adapt context
      if (text === 'Browse top matches') {
        if (liked === 0) {
          response = {
            text: 'Here are your top matches based on your criteria. Tap ♡ on properties that interest you — once you have 2 or more shortlisted, I\'ll build a detailed comparison.',
          };
        } else if (liked === 1) {
          response = {
            text: `You've shortlisted ${likedProps[0]?.name || '1 property'}. Here are more matches — like one more and I'll compare them for you.`,
          };
        } else {
          const notLiked = SHORTLIST_PROPERTIES.filter((p) => !currentLikedIds.includes(p.id));
          response = {
            text: `You have ${liked} shortlisted. Want me to compare them? Or browse ${notLiked.length} more ${notLiked.length === 1 ? 'match' : 'matches'} to add to your list.`,
          };
        }
      }

      // "What is ALON's Pick?" — explain concept or compute real pick
      if (text === 'What is ALON\'s Pick?') {
        if (liked === 0) {
          response = {
            text: 'ALON\'s Pick is my recommendation based on 7 factors: budget fit, location match, size preference, builder trust score, conflict status, RERA compliance, and value for money. Shortlist 2 or more properties and I\'ll tell you which one scores highest.',
          };
        } else if (liked === 1) {
          response = {
            text: `I need at least 2 properties to compare before I can make a Pick. You've shortlisted ${likedProps[0]?.name} — add one more and I'll run the analysis.`,
          };
        } else {
          const pick = getRecommended(currentLikedIds, currentPrefs);
          const pickProp = SHORTLIST_PROPERTIES.find((p) => p.id === pick?.id);
          if (pickProp && pick) {
            const result = computeMatchScore(pickProp, currentPrefs);
            const otherScores = likedProps
              .filter((p) => p.id !== pick.id)
              .map((p) => `${p.name}: ${computeMatchScore(p, currentPrefs).score}%`);
            response = {
              text: `My Pick is ${pickProp.name} with a ${pick.score}% match score. ${result.pros[0] || ''}\n\nOther scores: ${otherScores.join(', ')}.\n\nThis is AI-generated guidance — please consult professionals before deciding.`,
              card: {
                title: `ALON's Pick: ${pickProp.name}`,
                items: [
                  `Match score: ${pick.score}%`,
                  ...result.pros.slice(0, 2).map((p) => `✓ ${p}`),
                  ...result.cons.slice(0, 1).map((c) => `⚠ ${c}`),
                ],
              },
            };
          }
        }
      }

      // "Compare top 3" / "Which has best ROI?" / "Price vs market data" — need 2+ shortlisted
      if ((text === 'Compare top 3' || text === 'Which has best ROI?' || text === 'Price vs market data') && liked < 2) {
        response = {
          text: `You don't have enough properties shortlisted yet. Tap ♡ on at least 2 properties from your matches, and I'll build a detailed comparison with match scores and my recommendation.`,
        };
      }

      // "Which has best ROI?" with 2+ shortlisted — show appreciation data
      if (text === 'Which has best ROI?' && liked >= 2) {
        const roiData = likedProps
          .map((p) => ({ name: p.name, yoy: getAppreciationYoY(p.id) }))
          .sort((a, b) => b.yoy - a.yoy);
        response = {
          text: `Based on year-over-year price appreciation, here's how your shortlisted properties rank:`,
          card: {
            title: 'ROI Comparison (YoY Growth)',
            items: roiData.map((d, i) => `${i === 0 ? '🏆 ' : ''}${d.name} · ${d.yoy}% YoY`),
          },
        };
      }

      // "Price vs market data" with 2+ shortlisted — show price/sqft vs area avg
      if (text === 'Price vs market data' && liked >= 2) {
        const priceData = likedProps.map((p) => {
          const ppsf = computePricePerSqft(p.price, p.size);
          return `${p.name} · ₹${ppsf.toLocaleString()}/sqft`;
        });
        response = {
          text: `Here's how your shortlisted properties compare on price per sq.ft against real transaction data:`,
          card: {
            title: 'Price vs Market Data',
            items: priceData,
          },
        };
      }

      // "Compare top 3" with 2+ shortlisted — show real comparison
      if (text === 'Compare top 3' && liked >= 2) {
        const compData = likedProps.slice(0, 3).map((p) => {
          const ppsf = computePricePerSqft(p.price, p.size);
          const yoy = getAppreciationYoY(p.id);
          return `${p.name} · ₹${ppsf.toLocaleString()}/sqft · +${yoy}% YoY`;
        });
        response = {
          text: 'Here\'s a side-by-side comparison based on real transaction data:',
          card: {
            title: 'Property comparison',
            items: compData,
          },
        };
      }

      // --- Dynamic response builder for Shortlist stage ---
      const userProps = currentState.userProperties;
      const hasUserProps = userProps.length > 0;

      // "Is this property safe?" — quick safety summary
      if (text === 'Is this property safe?') {
        if (liked === 0 && !hasUserProps) {
          response = {
            text: 'You haven\'t shortlisted any properties yet. Like properties from your matches or add your own — I\'ll run RERA verification, builder trust checks, and conflict scans on each one.',
          };
        } else if (liked > 0) {
          const clean = likedProps.filter((p) => !p.hasConflict);
          const flagged = likedProps.filter((p) => p.hasConflict);
          const items = likedProps.map((p) =>
            p.hasConflict
              ? `⚠ ${p.name} — ${p.conflictType || 'Flagged'}`
              : `✓ ${p.name} — RERA verified, builder ${p.builderScore}/5`
          );

          if (flagged.length === 0) {
            response = {
              text: `I've checked all ${liked} of your shortlisted properties. Good news — all are clean. RERA verified, no title disputes, builder scores above 4.0.${hasUserProps ? `\n\nNote: I have limited data on your ${userProps.length} manually added ${userProps.length === 1 ? 'property' : 'properties'} — consider running a manual check.` : ''}`,
              card: { title: 'Safety Check — All Clear', items },
            };
          } else {
            response = {
              text: `I've checked all ${liked} shortlisted properties. ${clean.length} ${clean.length === 1 ? 'is' : 'are'} clean, but ${flagged.length} ${flagged.length === 1 ? 'needs' : 'need'} attention. I recommend resolving flagged issues before proceeding.${hasUserProps ? `\n\nFor your ${userProps.length} manually added ${userProps.length === 1 ? 'property' : 'properties'}, I have limited data — consider a manual conflict check.` : ''}`,
              card: { title: `Safety Check — ${flagged.length} Flagged`, items },
            };
          }
        } else if (hasUserProps) {
          response = {
            text: `You have ${userProps.length} manually added ${userProps.length === 1 ? 'property' : 'properties'}, but I have limited data to verify ${userProps.length === 1 ? 'it' : 'them'}. I can check builder reputation and title history if you run a manual check.\n\nAlso try liking properties from my matches — I can fully verify those.`,
          };
        }
      }

      // "Compare my shortlist" — bridge to Compare stage
      if (text === 'Compare my shortlist') {
        if (liked === 0) {
          response = {
            text: 'You haven\'t shortlisted any properties yet. Browse your matches and tap ♡ on properties you like — once you have 2 or more, I\'ll compare them side-by-side with match scores and my recommendation.',
          };
        } else if (liked === 1) {
          response = {
            text: `You've shortlisted ${likedProps[0]?.name}. Add one more and I'll build a detailed comparison with match scores, market data, and my Pick.`,
          };
        } else {
          const pick = getRecommended(currentLikedIds, currentPrefs);
          const summaryItems = likedProps.slice(0, 3).map((p) => {
            const score = computeMatchScore(p, currentPrefs).score;
            return `${p.name} — ${score}% match${p.id === pick?.id ? ' ⭐' : ''}`;
          });
          response = {
            text: `You have ${liked} shortlisted${liked > 3 ? ' — I can compare up to 3 at a time. Pick your top 3 for a detailed comparison.' : ' — ready to compare! Here\'s a quick preview:'}`,
            card: {
              title: 'Shortlist Summary',
              items: [
                ...summaryItems,
                liked > 3 ? `+ ${liked - 3} more` : '',
              ].filter(Boolean),
            },
          };
        }
      }

      // "Check for conflicts" — detailed per-property breakdown
      if (text === 'Check for conflicts') {
        if (liked === 0 && !hasUserProps) {
          response = {
            text: 'No properties to check yet. Shortlist some from your matches or add your own — I\'ll scan for title disputes, RERA compliance issues, and builder reputation flags.',
          };
        } else if (liked > 0) {
          const clean = likedProps.filter((p) => !p.hasConflict);
          const flagged = likedProps.filter((p) => p.hasConflict);
          const items: string[] = [];

          likedProps.forEach((p) => {
            if (p.hasConflict) {
              items.push(`⚠ ${p.name}`);
              items.push(`   Issue: ${p.conflictType || 'Under review'}`);
              items.push(`   Action: Proceed with caution`);
            } else {
              items.push(`✓ ${p.name} — RERA: ${p.rera ? 'Verified' : 'N/A'} · Builder: ${p.builderScore}/5 · Title: Clear`);
            }
          });

          if (hasUserProps) {
            items.push('');
            items.push(`ℹ ${userProps.length} user-added — limited data, manual check recommended`);
          }

          if (flagged.length === 0) {
            response = {
              text: `All clear! Every shortlisted property passed my checks — RERA verified, no title disputes, builder scores strong.${hasUserProps ? ' For your manually added properties, I have limited data — run a manual conflict check for full coverage.' : ' You can proceed with confidence.'}`,
              card: { title: 'Conflict Check — All Clear ✓', items },
            };
          } else {
            response = {
              text: `I found ${flagged.length} ${flagged.length === 1 ? 'issue' : 'issues'} that ${flagged.length === 1 ? 'needs' : 'need'} your attention. ${clean.length} ${clean.length === 1 ? 'property is' : 'properties are'} clean.\n\nAI-generated insight — verify with professionals before deciding.`,
              card: { title: `Conflict Check — ${flagged.length} Flagged`, items },
            };
          }
        } else if (hasUserProps) {
          response = {
            text: `You have ${userProps.length} manually added ${userProps.length === 1 ? 'property' : 'properties'}. I have limited data on ${userProps.length === 1 ? 'this — builder' : 'these — builder'} trust scores and RERA verification aren't available for manually added properties.\n\nYou can run a manual conflict check by entering the builder name or RERA ID.`,
          };
        }
      }

      // ── Finance: "Plan Your Loan" navigates to dedicated screen ──
      if (text === 'Plan Your Loan') {
        router.push('/onboarding/loan-planner');
        return;
      }

      // ── Finance: Redirect tool prompts to Loan Planner ──
      if (['EMI calculator', 'Total cost breakdown', 'Check my eligibility'].includes(text)) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), type: 'alon',
          text: 'I\'ve built a Loan Planner with all of that — EMI calculator, cost breakdown, and eligibility check in one place. Let me take you there.',
          timestamp: Date.now(),
        }]);
        setTimeout(() => router.push('/onboarding/loan-planner'), 800);
        return;
      }

      // ── Finance: Advisor responses ──
      if (text === 'How home loans work') {
        response = {
          text: 'Here\'s the basics:\n\n1. You pay 20% as down payment, bank funds the rest\n2. EMI = principal + interest, paid monthly for 15-30 years\n3. Interest rate depends on your CIBIL score (higher score = lower rate)\n4. Banks check your FOIR — they won\'t let EMIs exceed ~50% of your income\n5. You\'ll also pay stamp duty (5%), registration (1%), and legal fees on top\n\nTap "Plan Your Loan" to see real numbers for your situation.',
        };
      }
      if (text === 'What CIBIL score do I need?') {
        response = {
          text: 'For home loans in India:\n\n• 750+ — Excellent. Best rates (~8.5%), instant approvals\n• 700-749 — Good. Slightly higher rates (~8.75%), most banks approve\n• 650-699 — Fair. Rates jump (~9.25%), fewer bank options\n• Below 650 — Tough. High rates, may need co-applicant or larger down payment\n\nMost banks need minimum 650 for home loans. You can check your score free on Paisabazaar or CRED.',
        };
      }
      if (text === 'Hidden charges to watch') {
        response = {
          text: 'Beyond the listed price, expect these:\n\n• Stamp duty — 5% in Maharashtra (non-negotiable)\n• Registration — 1%\n• GST — 5% if under-construction (1% for affordable housing)\n• Processing fee — 0.25-0.50% of loan amount\n• Legal charges — ₹15,000-30,000\n• Society transfer — ₹25,000-50,000 (resale only)\n• Parking — often ₹3-5L extra, not included in listed price\n\nA ₹1Cr property typically costs ₹1.08-1.12Cr all-in. Use the Loan Planner to see your exact numbers.',
        };
      }
      if (text === 'How to improve my rate?') {
        const cibil = currentState.cibilScore;
        response = {
          text: `Here\'s how to get a better rate${cibil ? ` (you\'re at ${cibil} now)` : ''}:\n\n• Improve CIBIL to 750+ — clear pending credit card dues, avoid new credit\n• Add a co-applicant (spouse/parent) — banks see combined income + best score\n• Choose a bank where you have a salary account — 0.05-0.10% discount\n• Opt for floating rate — usually 0.15-0.25% lower than fixed\n• Negotiate — banks have wiggle room, especially for 750+ scores\n• Compare at least 3 banks — rates vary significantly`,
        };
      }
      if (text === 'How to improve my CIBIL') {
        response = {
          text: 'To improve your CIBIL score:\n\n• Pay all credit card bills in full before due date\n• Keep credit utilization below 30% of limit\n• Don\'t apply for multiple loans/cards at once (each inquiry drops score)\n• Keep old credit cards active (length of credit history matters)\n• Check your CIBIL report for errors — dispute any incorrect entries\n\nTypically takes 3-6 months to see improvement. If you need a loan sooner, a co-applicant with a higher score is the fastest workaround.',
        };
      }
      if (text === 'Can I still get a loan?') {
        const cibil = currentState.cibilScore;
        response = {
          text: `Yes, but with conditions${cibil ? ` (at CIBIL ${cibil})` : ''}:\n\n• Interest rates will be 1-2% higher than the best rates\n• You may need a larger down payment (25-30% instead of 20%)\n• Adding a co-applicant with a good score helps significantly\n• Some NBFCs (Bajaj, Tata Capital) are more flexible than traditional banks\n• Consider a smaller loan amount to improve approval chances\n\nI\'d recommend improving your score to 700+ before applying. Open the Loan Planner to see what you qualify for today.`,
        };
      }
      if (text === 'Am I eligible for a home loan?' || text.startsWith('Am I eligible')) {
        if (!currentState.monthlyIncome) {
          response = { text: 'I need your income details to check eligibility. Open the Loan Planner — the Eligibility tab has a quick form where you can enter your income and existing EMIs, and I\'ll calculate your max loan amount instantly.' };
        } else {
          const result = calculateEligibility(currentState.monthlyIncome, currentState.existingEMIs || 0, currentState.cibilScore);
          response = { text: `Based on your income of ${formatIncomeINR(currentState.monthlyIncome)}/month, you're eligible for up to ${formatINR(result.maxLoanAmount)} in home loans (max property ~${formatINR(result.maxPropertyPrice)}). Open the Loan Planner to see how this compares against your shortlisted properties.` };
        }
      }
      if (text === 'Fixed vs floating rate?') {
        response = {
          text: 'For most home buyers, floating rate is better:\n\n• Floating — starts lower, moves with RBI repo rate. You benefit when rates drop.\n• Fixed — locked rate for 2-5 years, then usually resets to floating anyway.\n\nHistorically, floating rates have been cheaper over 15-20 year horizons. The "safety" of fixed rate is largely an illusion since banks reset it after the lock-in period.\n\nMy recommendation: Go floating, but keep some buffer in your budget for rate hikes.',
        };
      }
      if (text === 'How to reduce my EMI?' || text === 'Can I reduce my EMI?') {
        response = {
          text: 'Several ways to lower your monthly EMI:\n\n1. Increase tenure — 25 years instead of 20 drops EMI ~8%, but you pay more interest overall\n2. Larger down payment — every extra ₹1L down saves ~₹900/month on EMI\n3. Improve CIBIL — going from 700 to 770 can save ₹1,500-2,000/month on a ₹1Cr loan\n4. Add a co-applicant — boosts eligible loan amount + may get better rate\n5. Negotiate the property price — even a 2-3% discount saves ₹2,000-3,000/month\n\nUse the Loan Planner sliders to see exactly how each change affects your EMI.',
        };
      }
      if (text === 'Which bank is best for me?') {
        const cibil = currentState.cibilScore;
        const rate = getInterestRate(cibil);
        response = {
          text: `Based on ${cibil ? `your CIBIL score of ${cibil}` : 'an estimated CIBIL of 750'} (rate ~${rate.toFixed(1)}%):\n\n• SBI — Usually the lowest rate for salaried employees. Best if you have a salary account.\n• HDFC Bank — Fast processing, good for premium properties. Slightly higher rate.\n• ICICI — Competitive rates, good digital experience. Strong for 750+ scores.\n• Kotak — Aggressive rates for high-CIBIL customers.\n• LIC Housing — Good for longer tenures (up to 30 years).\n\nI\'d recommend applying to your salary account bank + one competitor for negotiation leverage.`,
        };
      }
      // "Can I afford [property]?" — dynamic
      if (text.startsWith('Can I afford') && likedProps.length > 0) {
        const targetProp = likedProps[0];
        const propPrice = parsePriceToNumber(targetProp.price);
        if (currentState.monthlyIncome) {
          const result = calculateEligibility(currentState.monthlyIncome, currentState.existingEMIs || 0, currentState.cibilScore);
          const affordable = propPrice <= result.maxPropertyPrice;
          const emiForProp = calculateEMI(getLoanAmount(propPrice), getInterestRate(currentState.cibilScore), 20);
          const emiPercent = Math.round((emiForProp / currentState.monthlyIncome) * 100);
          response = {
            text: affordable
              ? `Yes! ${targetProp.name} at ${targetProp.price} is within your eligibility. Your EMI would be ~${formatINR(emiForProp)}/month — that's ${emiPercent}% of your income. ${emiPercent > 45 ? 'It\'s on the tighter side — consider a longer tenure to ease the monthly burden.' : 'That\'s comfortable — well within the recommended 40-45% range.'}`
              : `${targetProp.name} at ${targetProp.price} is above your current eligibility of ${formatINR(result.maxPropertyPrice)}. Options:\n\n• Increase down payment to reduce loan needed\n• Add a co-applicant to boost eligible amount\n• Consider ${likedProps.length > 1 ? likedProps[1].name + ' at ' + likedProps[1].price : 'a property in a lower price range'}\n\nOpen the Loan Planner to explore scenarios.`,
          };
        } else {
          response = { text: `To check if you can afford ${targetProp.name}, I need your income details. Open the Loan Planner and fill in the Eligibility tab — I'll calculate it instantly.` };
        }
      }

      const alonMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'alon',
        text: response.text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, alonMsg]);

      if (response.card) {
        const cardMsg: ChatMessage = {
          id: (Date.now() + 2).toString(),
          type: 'card',
          card: response.card,
          timestamp: Date.now(),
        };
        setTimeout(() => {
          setMessages((prev) => [...prev, cardMsg]);
        }, 300);
      }

      haptics.success();
    }, 2200);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [isGenerating]);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  }, [messages, isGenerating]);

  return (
    <View style={styles.container}>
      {/* Expand bar — only in normal (non-expanded) mode */}
      {!chatExpanded && (
        <TouchableOpacity
          style={styles.expandBar}
          onPress={() => setChatExpanded(true)}
          activeOpacity={0.7}
        >
          <View style={styles.expandBarLeft}>
            <View style={styles.expandBarDot} />
            <Text style={styles.expandBarText}>Chat with ALON</Text>
          </View>
          <Maximize2 size={14} color={Colors.textTertiary} strokeWidth={2} />
        </TouchableOpacity>
      )}

      {/* Messages */}
      <GestureDetector gesture={pullDownGesture}>
      <ScrollView
        ref={scrollRef}
        style={styles.messagesScroll}
        contentContainerStyle={[styles.messagesContent, chatExpanded && styles.messagesContentExpanded]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={onScrollChat}
        scrollEventThrottle={16}
      >
        {/* Pinned content for current stage (full-screen only) */}
        {chatExpanded && <StagePinnedContent stage={stage} />}

        {messages.map((msg) => {
          if (msg.type === 'user') {
            return (
              <Animated.View key={msg.id} style={styles.userBubble} entering={FadeInUp.duration(200)}>
                <Text style={styles.userText}>{msg.text}</Text>
              </Animated.View>
            );
          }
          if (msg.type === 'alon') {
            return (
              <Animated.View key={msg.id} style={styles.alonRow} entering={FadeIn.duration(250)}>
                <View style={styles.alonAvatarWrap}>
                  <AlonAvatar size={28} showRings={false} showBlink={false} variant="default" />
                </View>
                <View style={styles.alonBubble}>
                  <Text style={styles.alonText}>{msg.text}</Text>
                  {/* Scanning indicator */}
                  {msg.isScanning && (
                    <View style={styles.scanIndicator}>
                      <View style={styles.scanRow}>
                        <Animated.View style={[styles.scanDot, scanPulseStyle]} />
                        <Text style={styles.scanStatusText}>Scanning 12L+ listings...</Text>
                      </View>
                      <View style={styles.scanTrack}>
                        <Animated.View style={[styles.scanBar, scanBarStyle]} />
                      </View>
                    </View>
                  )}
                </View>
              </Animated.View>
            );
          }
          if (msg.type === 'property-carousel' && msg.properties) {
            return (
              <ChatPropertyCarousel
                key={msg.id}
                properties={msg.properties}
                onViewAll={() => router.push('/onboarding/shortlist')}
              />
            );
          }
          if (msg.type === 'card' && msg.card) {
            return (
              <Animated.View key={msg.id} style={styles.cardBubble} entering={FadeInUp.duration(300)}>
                <Text style={styles.cardTitle}>{msg.card.title}</Text>
                {msg.card.items.map((item, i) => (
                  <View key={i} style={styles.cardItem}>
                    <View style={styles.cardDot} />
                    <Text style={styles.cardItemText}>{item}</Text>
                  </View>
                ))}
              </Animated.View>
            );
          }
          if (msg.type === 'cibil-prompt') {
            return (
              <Animated.View key={msg.id} style={styles.alonRow} entering={FadeInUp.duration(300)}>
                <View style={styles.alonAvatarWrap}>
                  <AlonAvatar size={28} showRings={false} showBlink={false} variant="default" />
                </View>
                <View style={[styles.alonBubble, styles.cibilPromptBubble]}>
                  <Landmark size={16} color={Colors.terra500} strokeWidth={2} />
                  <Text style={styles.alonText}>{msg.text}</Text>
                </View>
              </Animated.View>
            );
          }
          if (msg.type === 'cibil-slider') {
            return (
              <CibilSliderCard
                key={msg.id}
                onConfirm={(score) => {
                  const { setCibilScore } = useOnboardingStore.getState();
                  setCibilScore(score);
                  haptics.success();
                  const rate = getInterestRate(score);
                  const bracket = score >= 750 ? 'Excellent' : score >= 700 ? 'Good' : score >= 650 ? 'Fair' : 'Below average';
                  setMessages(prev => [...prev, {
                    id: `cibil-confirmed-${Date.now()}`, type: 'alon',
                    text: `CIBIL ${score} — ${bracket}. Your expected rate is ${rate.toFixed(1)}% p.a. Now let's plan your loan. What would you like to explore first?`,
                    timestamp: Date.now(),
                  }]);
                }}
                onSkip={() => {
                  const { setCibilSkipped } = useOnboardingStore.getState();
                  setCibilSkipped(true);
                  haptics.light();
                  setMessages(prev => [...prev, {
                    id: `cibil-skipped-${Date.now()}`, type: 'alon',
                    text: 'No worries — I\'ll use an estimated CIBIL of 750. All calculations will note this is an estimate. You can update anytime.\n\nWhat would you like to explore?',
                    timestamp: Date.now(),
                  }]);
                }}
              />
            );
          }
          if (msg.type === 'finance-emi' && msg.financeData) {
            return (
              <FinanceEMICard
                key={msg.id}
                propertyPrice={msg.financeData.propertyPrice!}
                cibilScore={msg.financeData.cibilScore ?? null}
                propertyName={msg.financeData.propertyName}
              />
            );
          }
          if (msg.type === 'finance-cost' && msg.financeData) {
            return (
              <CostBreakdownCard
                key={msg.id}
                propertyPrice={msg.financeData.propertyPrice!}
                propertyName={msg.financeData.propertyName}
              />
            );
          }
          if (msg.type === 'finance-eligibility' && msg.financeData) {
            return (
              <EligibilityResultCard
                key={msg.id}
                result={msg.financeData.eligibilityResult!}
                cibilScore={msg.financeData.cibilScore ?? null}
                likedPropertyIds={msg.financeData.likedPropertyIds || []}
              />
            );
          }
          return null;
        })}

        {/* Generating indicator */}
        {isGenerating && (
          <Animated.View style={styles.alonRow} entering={FadeIn.duration(200)}>
            <View style={styles.alonAvatarWrap}>
              <AlonAvatar size={28} showRings={false} showBlink={false} variant="default" />
            </View>
            <View style={styles.generatingBubble}>
              <View style={styles.typingDots}>
                <Animated.View style={[styles.typingDot, d1Style]} />
                <Animated.View style={[styles.typingDot, d2Style]} />
                <Animated.View style={[styles.typingDot, d3Style]} />
              </View>
              <Text style={styles.generatingStatus}>{statusText}</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
      </GestureDetector>

      {/* ── Bottom section: bounces on stage change ── */}
      <Animated.View style={bottomBounceStyle}>
      <Animated.View style={bottomHighlightStyle}>

      {/* ── Stage-aware CTA pill ── */}
      {showShortlistPill && (() => {
        const state = useOnboardingStore.getState();
        const liked = state.likedPropertyIds;
        const visits = state.scheduledVisits;

        // ── Search stage: "Browse Matches" ──
        if (stage === 'Search') {
          return (
            <Animated.View entering={FadeIn.duration(250)}>
              <Pressable
                onPress={() => {
                  haptics.light();
                  router.push({ pathname: '/onboarding/shortlist', params: { tab: 'all' } });
                }}
                style={({ pressed }) => [styles.stageCta, pressed && styles.shortlistPillPressed]}
              >
                <Animated.View style={[styles.stageCtaInner, pillAnimStyle]}>
                  <SearchIcon size={14} color={Colors.white} strokeWidth={2} />
                  <Text style={styles.stageCtaText}>Browse Matches</Text>
                </Animated.View>
              </Pressable>
            </Animated.View>
          );
        }

        // ── Shortlist stage: "View Shortlist" ──
        if (stage === 'Shortlist') {
          return (
            <Animated.View entering={FadeIn.duration(250)}>
              <Pressable
                onPress={() => {
                  haptics.light();
                  if (liked.length === 0) {
                    // No shortlisted → go to All tab with nudge
                    router.push({ pathname: '/onboarding/shortlist', params: { tab: 'all', nudge: 'shortlist' } });
                  } else {
                    // Has shortlisted → go to Shortlisted tab
                    router.push({ pathname: '/onboarding/shortlist', params: { tab: 'shortlisted' } });
                  }
                }}
                style={({ pressed }) => [styles.stageCta, pressed && styles.shortlistPillPressed]}
              >
                <Animated.View style={[styles.stageCtaInner, pillAnimStyle]}>
                  <Heart size={14} color={Colors.white} strokeWidth={2} />
                  <Text style={styles.stageCtaText}>
                    {liked.length === 0 ? 'Start Shortlisting' : `View Shortlist (${liked.length})`}
                  </Text>
                </Animated.View>
              </Pressable>
            </Animated.View>
          );
        }

        // ── Site Visits stage: routes to dedicated screen ──
        if (stage === 'Site Visits') {
          return (
            <Animated.View entering={FadeIn.duration(250)}>
              <Pressable
                onPress={() => {
                  haptics.light();
                  router.push('/onboarding/site-visits');
                }}
                style={({ pressed }) => [styles.stageCta, pressed && styles.shortlistPillPressed]}
              >
                <Animated.View style={[styles.stageCtaInner, pillAnimStyle]}>
                  <MapPin size={14} color={Colors.white} strokeWidth={2} />
                  <Text style={styles.stageCtaText}>
                    {visits.length === 0 ? 'Schedule Visit' : `${visits.length} Visit${visits.length > 1 ? 's' : ''} Scheduled`}
                  </Text>
                </Animated.View>
              </Pressable>
            </Animated.View>
          );
        }

        // ── Compare stage: "Compare Now" ──
        if (stage === 'Compare') {
          return (
            <Animated.View entering={FadeIn.duration(250)}>
              <Pressable
                onPress={() => {
                  haptics.light();
                  if (liked.length === 0) {
                    router.push({ pathname: '/onboarding/shortlist', params: { tab: 'all', nudge: 'shortlist' } });
                  } else if (liked.length === 1) {
                    const prop = SHORTLIST_PROPERTIES.find(p => p.id === liked[0]);
                    setMessages(prev => [...prev, {
                      id: Date.now().toString(),
                      type: 'alon',
                      text: `You've shortlisted ${prop?.name || '1 property'} so far. Add at least one more to your shortlist, then we can compare them side by side.`,
                      timestamp: Date.now(),
                    }]);
                  } else {
                    router.push({ pathname: '/onboarding/shortlist', params: { tab: 'shortlisted', selectMode: '1' } });
                  }
                }}
                style={({ pressed }) => [styles.stageCta, pressed && styles.shortlistPillPressed]}
              >
                <Animated.View style={[styles.stageCtaInner, pillAnimStyle]}>
                  <GitCompareArrows size={14} color={Colors.white} strokeWidth={2} />
                  <Text style={styles.stageCtaText}>Compare Now</Text>
                </Animated.View>
              </Pressable>
            </Animated.View>
          );
        }

        // ── Finance stage: "Plan Your Loan" ──
        if (stage === 'Finance') {
          return (
            <Animated.View entering={FadeIn.duration(250)}>
              <Pressable
                onPress={() => {
                  haptics.light();
                  router.push('/onboarding/loan-planner');
                }}
                style={({ pressed }) => [styles.stageCta, pressed && styles.shortlistPillPressed]}
              >
                <Animated.View style={[styles.stageCtaInner, pillAnimStyle]}>
                  <IndianRupee size={14} color={Colors.white} strokeWidth={2} />
                  <Text style={styles.stageCtaText}>Plan Your Loan</Text>
                </Animated.View>
              </Pressable>
            </Animated.View>
          );
        }

        // ── Negotiate stage: "Pick a Property" / "Continue" ──
        if (stage === 'Negotiate') {
          const userProps = state.userProperties;
          const negotiateId = state.negotiatePropertyId;
          const likedPool = SHORTLIST_PROPERTIES.filter(p => liked.includes(p.id));
          const poolCount = likedPool.length + userProps.length;
          const selected =
            likedPool.find(p => p.id === negotiateId) ||
            userProps.find(p => p.id === negotiateId);

          const label =
            poolCount === 0 ? 'Start Shortlisting' :
            selected ? `Continue — ${selected.name}` :
            'Pick a Property to Negotiate';

          return (
            <Animated.View entering={FadeIn.duration(250)}>
              <Pressable
                onPress={() => {
                  haptics.light();
                  if (poolCount === 0) {
                    router.push({ pathname: '/onboarding/shortlist', params: { nudge: 'negotiate' } });
                  } else {
                    router.push('/onboarding/negotiate');
                  }
                }}
                style={({ pressed }) => [styles.stageCta, pressed && styles.shortlistPillPressed]}
              >
                <Animated.View style={[styles.stageCtaInner, pillAnimStyle]}>
                  <Handshake size={14} color={Colors.white} strokeWidth={2} />
                  <Text style={styles.stageCtaText} numberOfLines={1}>{label}</Text>
                </Animated.View>
              </Pressable>
            </Animated.View>
          );
        }

        // ── All other stages: generic pill ──
        return (
          <Animated.View entering={FadeIn.duration(250)}>
            <Pressable
              onPress={() => { haptics.light(); router.push('/onboarding/shortlist'); }}
              style={({ pressed }) => [styles.shortlistPill, pressed && styles.shortlistPillPressed]}
            >
              <Animated.View style={[styles.shortlistPillInner, pillAnimStyle]}>
                <Layers size={13} color={Colors.terra500} strokeWidth={2} />
                <Text style={styles.shortlistPillText}>
                  {SHORTLIST_PROPERTIES.length} {pillLabel}
                  {likedPropertyIds.length > 0 ? ` · ${likedPropertyIds.length} liked` : ''}
                </Text>
                <View style={styles.shortlistPillDivider} />
                <Text style={styles.shortlistPillAction}>View all</Text>
                <ChevronRight size={12} color={Colors.terra500} strokeWidth={2.5} />
              </Animated.View>
            </Pressable>
          </Animated.View>
        );
      })()}

      {/* Suggestive prompts */}
      {!isGenerating && prompts.some(p => !usedPrompts.has(p)) && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.promptsScroll}
          contentContainerStyle={styles.promptsContent}
        >
          {prompts.filter(p => !usedPrompts.has(p)).map((prompt) => (
            <Pressable
              key={prompt}
              style={({ pressed }) => [styles.promptChip, pressed && styles.promptChipPressed]}
              onPress={() => sendMessage(prompt)}
            >
              <Text style={styles.promptText}>{prompt}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Attachment preview */}
      {attachments.length > 0 && (
        <View style={styles.attachPreview}>
          {attachments.map((att) => (
            <Animated.View key={att.id} style={styles.attachChip} entering={FadeIn.duration(150)}>
              {att.type === 'image' ? (
                <Image size={12} color={Colors.terra500} strokeWidth={2} />
              ) : (
                <FileText size={12} color={Colors.terra500} strokeWidth={2} />
              )}
              <Text style={styles.attachChipText} numberOfLines={1}>{att.name}</Text>
              <TouchableOpacity onPress={() => removeAttachment(att.id)} hitSlop={8}>
                <X size={12} color={Colors.textTertiary} strokeWidth={2.5} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      )}

      {/* Attach menu popover */}
      {showAttachMenu && (
        <Animated.View style={styles.attachMenu} entering={FadeInUp.duration(150)}>
          <TouchableOpacity style={styles.attachMenuItem} onPress={pickImage} activeOpacity={0.7}>
            <View style={styles.attachMenuIcon}>
              <Image size={16} color={Colors.terra500} strokeWidth={1.8} />
            </View>
            <Text style={styles.attachMenuText}>Photo or image</Text>
          </TouchableOpacity>
          <View style={styles.attachMenuDivider} />
          <TouchableOpacity style={styles.attachMenuItem} onPress={pickDocument} activeOpacity={0.7}>
            <View style={styles.attachMenuIcon}>
              <FileText size={16} color={Colors.terra500} strokeWidth={1.8} />
            </View>
            <Text style={styles.attachMenuText}>Document or PDF</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insetBottom, 8) }]}>
        <TouchableOpacity
          style={styles.attachBtn}
          onPress={() => { setShowAttachMenu(!showAttachMenu); haptics.light(); }}
          activeOpacity={0.7}
        >
          <Paperclip size={18} color={showAttachMenu ? Colors.terra500 : Colors.textTertiary} strokeWidth={1.8} />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask ALON anything..."
            placeholderTextColor={Colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={() => inputText.trim() && sendMessage(inputText.trim())}
            onFocus={() => setShowAttachMenu(false)}
          />
          <TouchableOpacity style={styles.micBtn} activeOpacity={0.7}>
            <Mic size={18} color={Colors.textTertiary} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
        <Animated.View style={sendAnimStyle}>
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isGenerating) && styles.sendBtnDisabled]}
            onPress={() => inputText.trim() && sendMessage(inputText.trim())}
            activeOpacity={0.85}
            disabled={!inputText.trim() || isGenerating}
          >
            <ArrowUp size={18} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      </Animated.View>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Expand bar
  expandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warm100,
    backgroundColor: Colors.warm50,
  },
  expandBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  expandBarDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  expandBarText: { fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textSecondary },

  messagesScroll: { flex: 1 },
  messagesContent: { flexGrow: 1, justifyContent: 'flex-end' as const, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.md, paddingBottom: Spacing.md },
  messagesContentExpanded: { justifyContent: 'flex-start' as const },

  // User bubble
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.terra500,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '80%',
    marginBottom: 12,
  },
  userText: { fontSize: 14, fontFamily: 'DMSans-Regular', color: '#fff', lineHeight: 20 },

  // ALON bubble
  alonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
  alonAvatarWrap: { marginTop: 2 },
  alonBubble: {
    flex: 1,
    backgroundColor: Colors.cream,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  alonText: { fontSize: 14, fontFamily: 'DMSans-Regular', color: Colors.textPrimary, lineHeight: 20 },
  cibilPromptBubble: {
    borderColor: Colors.terra200, borderWidth: 1, backgroundColor: Colors.terra50, gap: 8,
  },

  // Scanning indicator inside ALON bubble
  scanIndicator: { marginTop: 8, gap: 6 },
  scanRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  scanDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.terra500 },
  scanStatusText: { fontSize: 11, fontFamily: 'DMSans-Medium', color: Colors.terra400, fontStyle: 'italic' },
  scanTrack: {
    height: 3, backgroundColor: Colors.terra100, borderRadius: 2,
    overflow: 'hidden', width: 140,
  },
  scanBar: {
    width: 24, height: 3, borderRadius: 2,
    backgroundColor: Colors.terra400,
  },

  // Card bubble
  cardBubble: {
    marginLeft: 30,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warm200,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 11, fontFamily: 'DMSans-SemiBold', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  cardItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  cardDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.terra400, marginTop: 5 },
  cardItemText: { flex: 1, fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textSecondary, lineHeight: 17 },

  // Generating
  generatingBubble: {
    flex: 1,
    backgroundColor: Colors.cream,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  typingDots: { flexDirection: 'row', gap: 4 },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.terra500 },
  generatingStatus: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, fontStyle: 'italic' },

  // ── Shortlist pill ──
  shortlistPill: {
    alignSelf: 'center',
    marginVertical: 4,
  },
  shortlistPillPressed: { opacity: 0.8 },
  shortlistPillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.terra50,
    borderWidth: 1,
    borderColor: Colors.terra200,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  shortlistPillText: {
    fontSize: 12,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textPrimary,
  },
  shortlistPillDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.terra200,
  },
  shortlistPillAction: {
    fontSize: 12,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.terra500,
  },
  stageCta: {
    alignSelf: 'center',
    marginVertical: 4,
  },
  stageCtaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Colors.terra500,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  stageCtaText: {
    fontSize: 13,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.white,
  },

  // Prompts
  promptsScroll: { maxHeight: 48, borderTopWidth: 1, borderTopColor: Colors.warm100 },
  promptsContent: { paddingHorizontal: Spacing.xxl, paddingRight: Spacing.xxxxl, paddingVertical: 8, gap: 6 },
  promptChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 16, backgroundColor: Colors.terra50,
    borderWidth: 1, borderColor: Colors.terra200,
  },
  promptChipPressed: { backgroundColor: Colors.terra100 },
  promptText: { fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.terra600 },

  // Input
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: Spacing.xxl, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: Colors.warm100,
    backgroundColor: Colors.white,
  },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cream, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.warm200,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  textInput: { flex: 1, fontSize: 14, fontFamily: 'DMSans-Regular', color: Colors.textPrimary, padding: 0, maxHeight: 80 },
  micBtn: { marginLeft: 8 },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.terra500, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },

  // Attach button
  attachBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },

  // Attach menu
  attachMenu: {
    marginHorizontal: Spacing.xxl,
    marginBottom: 4,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warm200,
    shadowColor: '#0D1F4A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  attachMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  attachMenuIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.terra50,
    alignItems: 'center', justifyContent: 'center',
  },
  attachMenuText: {
    fontSize: 13, fontFamily: 'DMSans-Medium', color: Colors.textPrimary,
  },
  attachMenuDivider: {
    height: 1, backgroundColor: Colors.warm100, marginHorizontal: 14,
  },

  // Attachment preview chips
  attachPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.warm100,
    backgroundColor: Colors.white,
  },
  attachChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.terra50,
    borderWidth: 1,
    borderColor: Colors.terra200,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    maxWidth: 160,
  },
  attachChipText: {
    fontSize: 11, fontFamily: 'DMSans-Medium', color: Colors.terra600, flex: 1,
  },
});
