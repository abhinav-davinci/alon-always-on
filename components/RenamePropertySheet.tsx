import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Colors, Spacing } from '../constants/theme';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';

/**
 * Shared rename-property sheet. Used on Possession home (to name a
 * placeholder external property) and on the Snag Report preview (to
 * add missing details before sharing). Parent owns the draft state and
 * the commit logic; this component is a dumb form.
 *
 * The builder field is optional — explicitly labelled so and softened
 * with a helper line that explains why it's useful (makes the shared
 * report feel official). Never required.
 */
export function RenamePropertySheet({
  visible,
  name,
  location,
  builder,
  onName,
  onLocation,
  onBuilder,
  onSave,
  onClose,
  requireAll = false,
  reason,
}: {
  visible: boolean;
  name: string;
  location: string;
  builder: string;
  onName: (v: string) => void;
  onLocation: (v: string) => void;
  onBuilder: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
  /** When true, all three fields (name, location, builder) are
   *  required — Save stays disabled until each has non-empty content.
   *  Used by the snag-inspection gate so every saved snag has
   *  proper attribution. Default behavior keeps builder optional. */
  requireAll?: boolean;
  /** Optional copy explaining *why* the user is being asked. Shown
   *  inline above the fields when set. */
  reason?: string;
}) {
  const insets = useSafeAreaInsets();
  // KeyboardAvoidingView is unreliable inside Modals on Android; track
  // the keyboard height directly and pad the panel by it so the inputs
  // always sit above the keyboard.
  const kbHeight = useKeyboardHeight();
  const allFilled =
    name.trim().length > 0 &&
    location.trim().length > 0 &&
    builder.trim().length > 0;
  const canSave = requireAll ? allFilled : name.trim().length > 0;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.panel,
            // When the keyboard is up the keyboard height replaces the
            // safe-area inset; when it's down we sit on the safe area.
            { paddingBottom: kbHeight > 0 ? kbHeight + 16 : insets.bottom + 16 },
          ]}
        >
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {requireAll ? 'Tell me about your home' : 'Name this property'}
                </Text>
                <Text style={styles.subtitle}>
                  {reason ?? 'So your snag notes, documents, and checklist all save against the right place.'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <X size={18} color={Colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.body}>
              <Text style={styles.fieldLabel}>Project name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Kumar Pebble Bay"
                placeholderTextColor={Colors.textTertiary}
                value={name}
                onChangeText={onName}
                autoCapitalize="words"
                returnKeyType="next"
              />

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Area, City"
                placeholderTextColor={Colors.textTertiary}
                value={location}
                onChangeText={onLocation}
                autoCapitalize="words"
                returnKeyType="next"
              />

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
                Builder
                {!requireAll && <Text style={styles.fieldLabelMuted}>  (optional)</Text>}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Godrej Properties, Kumar Properties"
                placeholderTextColor={Colors.textTertiary}
                value={builder}
                onChangeText={onBuilder}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={() => { if (canSave) onSave(); }}
              />
              <Text style={styles.fieldHelp}>
                {requireAll
                  ? 'Snag notes and the builder report use these details.'
                  : 'Adding this makes your snag report official when shared.'}
              </Text>

              <TouchableOpacity
                style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                onPress={canSave ? onSave : undefined}
                disabled={!canSave}
                activeOpacity={0.88}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(13,31,74,0.4)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 8,
    shadowColor: '#0D1F4A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08, shadowRadius: 20,
    elevation: 12,
  },
  handle: {
    alignSelf: 'center', width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.warm200, marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: Spacing.xxl, gap: 12, paddingBottom: 4,
  },
  title: {
    fontFamily: 'DMSerifDisplay', fontSize: 20, color: Colors.textPrimary, lineHeight: 24,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular', fontSize: 12, color: Colors.textSecondary,
    marginTop: 4, lineHeight: 17,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.warm100,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  body: {
    paddingHorizontal: Spacing.xxl, paddingTop: 14,
  },
  fieldLabel: {
    fontFamily: 'DMSans-SemiBold', fontSize: 11, color: Colors.textSecondary,
    letterSpacing: 0.4, marginBottom: 6,
  },
  fieldLabelMuted: {
    fontFamily: 'DMSans-Regular', fontSize: 10, color: Colors.textTertiary,
    letterSpacing: 0.2,
  },
  fieldHelp: {
    fontFamily: 'DMSans-Regular', fontSize: 10, color: Colors.textTertiary,
    lineHeight: 14, marginTop: 5, fontStyle: 'italic',
  },
  input: {
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.warm200, backgroundColor: Colors.warm50,
    fontFamily: 'DMSans-Regular', fontSize: 14, color: Colors.textPrimary,
  },
  saveBtn: {
    marginTop: 18, paddingVertical: 13, borderRadius: 12,
    backgroundColor: Colors.terra500, alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: Colors.warm300,
  },
  saveBtnText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.white,
  },
});
