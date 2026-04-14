import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Linking, Alert } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Link2, Download, Mail } from 'lucide-react-native';
import BottomSheet from './BottomSheet';
import { Colors, Spacing } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';
import { SHORTLIST_PROPERTIES } from '../constants/properties';

interface CompareShareSheetProps {
  visible: boolean;
  onClose: () => void;
  propertyIds: string[];
}

// ── Brand icons as small SVGs ──
function WhatsAppIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
        fill="#25D366"
      />
      <Path
        d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.963 7.963 0 01-4.11-1.14L4 20l1.14-3.89A7.963 7.963 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"
        fill="#25D366"
      />
    </Svg>
  );
}

function MessagesIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
        fill="#34C759"
      />
      <Circle cx={8} cy={10} r={1.2} fill="#fff" />
      <Circle cx={12} cy={10} r={1.2} fill="#fff" />
      <Circle cx={16} cy={10} r={1.2} fill="#fff" />
    </Svg>
  );
}

function FacebookIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
        fill="#1877F2"
      />
    </Svg>
  );
}

function buildShareText(propertyIds: string[]): string {
  const props = propertyIds
    .map((id) => SHORTLIST_PROPERTIES.find((p) => p.id === id))
    .filter(Boolean);

  const lines = props.map((p) => `${p!.name} — ${p!.area} — ${p!.price}`);
  return `Property Comparison from ALON\n\n${lines.join('\n')}\n\nCompared on ALON — your AI property assistant by TryThat.ai`;
}

export default function CompareShareSheet({ visible, onClose, propertyIds }: CompareShareSheetProps) {
  const haptics = useHaptics();
  const shareText = buildShareText(propertyIds);

  const shareVia = async (channel: 'whatsapp' | 'messages' | 'facebook' | 'mail') => {
    haptics.light();
    const encoded = encodeURIComponent(shareText);

    const urls: Record<string, string> = {
      whatsapp: `whatsapp://send?text=${encoded}`,
      messages: `sms:&body=${encoded}`,
      facebook: `fb://share?text=${encoded}`,
      mail: `mailto:?subject=${encodeURIComponent('Property Comparison — ALON')}&body=${encoded}`,
    };

    try {
      const supported = await Linking.canOpenURL(urls[channel]);
      if (supported) {
        await Linking.openURL(urls[channel]);
      } else {
        // Fallback to native share sheet
        await Share.share({ message: shareText });
      }
    } catch {
      await Share.share({ message: shareText });
    }
    onClose();
  };

  const copyLink = async () => {
    haptics.medium();
    // In production, this would copy a deep link. For now, copy the share text.
    try {
      await Share.share({ message: shareText });
    } catch {
      // silent
    }
    onClose();
  };

  const downloadPdf = () => {
    haptics.medium();
    // Requires expo-print + expo-sharing (not installed yet)
    Alert.alert(
      'Coming soon',
      'PDF download will be available in the next update. Your comparison data is saved.',
      [{ text: 'OK' }]
    );
    onClose();
  };

  return (
    <BottomSheet visible={visible} title="Share Comparison" onClose={onClose}>
      <View style={styles.grid}>
        <ShareOption icon={<WhatsAppIcon />} label="WhatsApp" onPress={() => shareVia('whatsapp')} />
        <ShareOption icon={<MessagesIcon />} label="Messages" onPress={() => shareVia('messages')} />
        <ShareOption icon={<FacebookIcon />} label="Facebook" onPress={() => shareVia('facebook')} />
        <ShareOption icon={<Mail size={22} color="#EA4335" strokeWidth={1.8} />} label="Mail" onPress={() => shareVia('mail')} />
      </View>

      <View style={styles.divider} />

      {/* Utility actions */}
      <TouchableOpacity style={styles.actionRow} onPress={copyLink} activeOpacity={0.7}>
        <View style={styles.actionIcon}>
          <Link2 size={18} color={Colors.terra500} strokeWidth={1.8} />
        </View>
        <Text style={styles.actionLabel}>Copy link</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionRow} onPress={downloadPdf} activeOpacity={0.7}>
        <View style={styles.actionIcon}>
          <Download size={18} color={Colors.terra500} strokeWidth={1.8} />
        </View>
        <Text style={styles.actionLabel}>Download as PDF</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}

function ShareOption({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.option} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.optionIcon}>{icon}</View>
      <Text style={styles.optionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
  },
  option: {
    alignItems: 'center',
    gap: 8,
    width: 70,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.warm50,
    borderWidth: 1,
    borderColor: Colors.warm100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
    color: Colors.textSecondary,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.warm100,
    marginVertical: Spacing.md,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.terra50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontFamily: 'DMSans-Medium',
    color: Colors.textPrimary,
  },
});
