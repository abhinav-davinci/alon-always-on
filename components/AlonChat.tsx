import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Mic, ArrowUp } from 'lucide-react-native';
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
import AlonAvatar from './AlonAvatar';
import { Colors, Spacing } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';

interface ChatMessage {
  id: string;
  type: 'user' | 'alon' | 'card';
  text?: string;
  card?: { title: string; items: string[] };
  timestamp: number;
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
  Finance: ['Best loan options', 'Check my eligibility', 'EMI calculator'],
  Legal: ['Review agreement', 'RERA compliance check', 'Red flag checklist'],
  Negotiate: ['Fair price analysis', 'Negotiation strategy', 'Market leverage data'],
  Possession: ['Possession checklist', 'Document list', 'Transfer process'],
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
  'Is this property safe?': {
    text: 'I ran a full safety check. 4 of 5 shortlisted properties are clean — no disputes, valid RERA, strong builder track record. Kolte Patil 24K has a pending land title clarification filed Jan 2025. I recommend waiting for resolution before proceeding with that one.',
  },
  'Schedule a visit': {
    text: 'I can book visits for your shortlisted properties. Your number stays hidden — the builder only gets a reference ID. Which property would you like to visit first?',
    card: {
      title: 'Available slots',
      items: ['Godrej Hillside · Sat 10am–1pm', 'Pride World City · Sun 11am–2pm', 'Sobha Dream Acres · Mon 4pm–6pm'],
    },
  },
  'Compare top 3': {
    text: 'Here\'s a side-by-side comparison based on real transaction data, not listed prices:',
    card: {
      title: 'Property comparison',
      items: ['Godrej Hillside · ₹9,310/sqft · +12% YoY', 'Pride World City · ₹8,940/sqft · +15.7% YoY', 'Sobha Dream · ₹8,900/sqft · +10.2% YoY'],
    },
  },
  'Best loan options': {
    text: 'Based on a ₹1 Cr loan amount at 80% LTV, here are the best rates I found:',
    card: {
      title: 'Top loan offers',
      items: ['SBI · 8.40% · ₹76,500/mo EMI', 'HDFC · 8.55% · ₹77,200/mo EMI', 'ICICI · 8.60% · ₹77,400/mo EMI'],
    },
  },
};

const DEFAULT_RESPONSE = {
  text: "I'm looking into that for you. Based on your preferences for properties in West Pune, I'll analyze the data and get back with specific insights.",
};

export default function AlonChat({ stage, insetBottom }: AlonChatProps) {
  const haptics = useHaptics();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'alon',
      text: "I'm actively scanning for your perfect property. Tap a suggestion below or ask me anything.",
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [statusText, setStatusText] = useState('');
  const [usedPrompts, setUsedPrompts] = useState<Set<string>>(new Set());

  const prompts = STAGE_PROMPTS[stage] || STAGE_PROMPTS.Search;

  // Send button animation
  const sendScale = useSharedValue(1);
  const sendAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: sendScale.value }] }));

  useEffect(() => {
    sendScale.value = withTiming(inputText.trim() ? 1.05 : 0.95, { duration: 150 });
  }, [!!inputText.trim()]);

  // Typing indicator animation
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

      const response = DEMO_RESPONSES[text] || DEFAULT_RESPONSE;

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
      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
                  <AlonAvatar size={22} showRings={false} showBlink={false} variant="default" />
                </View>
                <View style={styles.alonBubble}>
                  <Text style={styles.alonText}>{msg.text}</Text>
                </View>
              </Animated.View>
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
          return null;
        })}

        {/* Generating indicator */}
        {isGenerating && (
          <Animated.View style={styles.alonRow} entering={FadeIn.duration(200)}>
            <View style={styles.alonAvatarWrap}>
              <AlonAvatar size={22} showRings={false} showBlink={false} variant="default" />
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

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insetBottom, 8) }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  messagesScroll: { flex: 1 },
  messagesContent: { flexGrow: 1, justifyContent: 'flex-end' as const, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.md, paddingBottom: Spacing.md },

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

  // Card bubble
  cardBubble: {
    marginLeft: 32,
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
});
