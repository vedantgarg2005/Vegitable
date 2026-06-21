import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Alert, Modal,
} from 'react-native';
import { Avatar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';

const Field = ({ label, icon, value, onChangeText, keyboardType, editable = true }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.fieldRow, !editable && styles.fieldRowDisabled]}>
      <Ionicons name={icon} size={rs(18)} color={colors.primary} style={styles.fieldIcon} />
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        editable={editable}
        placeholderTextColor={colors.placeholder}
      />
    </View>
  </View>
);

const MyProfileScreen = ({ navigation }) => {
  const { user, deleteAccount } = useAuth();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleSave = async () => {
    try {
      await authAPI.updateProfile({ name, email, phone });
      Alert.alert('Profile Updated', 'Your profile has been saved successfully.');
    } catch {
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleDeleteAccount = () => {
    if (confirmText.trim().toLowerCase() !== 'delete') return;
    setShowDeleteModal(false);
    setConfirmText('');
    deleteAccount();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} translucent />

      <View
        style={[styles.header, { paddingTop: insets.top + vs(12) }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={rs(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: rs(38) }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {user
              ? <Avatar.Text size={rs(88)} label={user.name?.charAt(0) || 'U'} style={styles.avatar} color={colors.primary} />
              : <Avatar.Icon size={rs(88)} icon="account" style={styles.avatar} color={colors.primary} />
            }
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Ionicons name="camera" size={rs(16)} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarName}>{user?.name || 'Guest User'}</Text>
          <Text style={styles.avatarSub}>{user?.email || user?.phone || ''}</Text>
        </View>

        {/* Form */}
        <View style={[styles.card, shadows.small]}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Field label="Full Name" icon="person-outline" value={name} onChangeText={setName} />
          <Field label="Email" icon="mail-outline" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Field label="Phone" icon="call-outline" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>

        {/* Account Info */}
        <View style={[styles.card, shadows.small]}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="calendar-outline" size={rs(18)} color={colors.primary} />
            <Text style={styles.infoText}>Member Since</Text>
            <Text style={styles.infoValue}>2024</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.88}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.saveGradient}
          >
            <Ionicons name="checkmark-circle-outline" size={rs(20)} color="#fff" />
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => setShowDeleteModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={rs(18)} color={colors.error} />
          <Text style={styles.deleteBtnText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="warning" size={rs(32)} color={colors.error} />
            </View>
            <Text style={styles.modalTitle}>Delete Account?</Text>
            <Text style={styles.modalSubtitle}>
              This will permanently delete your account and all data. This action cannot be undone.
            </Text>
            <Text style={styles.modalLabel}>Type <Text style={styles.modalKeyword}>delete</Text> to confirm</Text>
            <TextInput
              style={styles.modalInput}
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="Type delete here"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setShowDeleteModal(false); setConfirmText(''); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalDeleteBtn, confirmText.trim().toLowerCase() !== 'delete' && styles.modalDeleteBtnDisabled]}
                onPress={handleDeleteAccount}
                disabled={confirmText.trim().toLowerCase() !== 'delete'}
              >
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(16),
    paddingBottom: vs(16),
  },
  backBtn: { padding: rs(4) },
  headerTitle: { fontSize: ms(18), fontWeight: '700', color: '#fff' },

  avatarSection: { alignItems: 'center', marginBottom: vs(20), marginTop: vs(8) },
  avatarWrap: { position: 'relative', marginBottom: vs(10) },
  avatar: { backgroundColor: colors.primarySurface },
  editAvatarBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: rs(30), height: rs(30), borderRadius: rs(15),
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarName: { fontSize: ms(18), fontWeight: '800', color: colors.text },
  avatarSub: { fontSize: ms(13), color: colors.placeholder, marginTop: vs(2) },

  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: rs(16),
    marginBottom: vs(14),
  },
  sectionTitle: { fontSize: ms(14), fontWeight: '700', color: colors.textSecondary, marginBottom: vs(12), textTransform: 'uppercase', letterSpacing: 0.5 },

  fieldWrap: { marginBottom: vs(12) },
  fieldLabel: { fontSize: ms(12), fontWeight: '600', color: colors.textSecondary, marginBottom: vs(5) },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: rs(12), height: vs(46),
  },
  fieldRowDisabled: { opacity: 0.6 },
  fieldIcon: { marginRight: rs(10) },
  fieldInput: { flex: 1, fontSize: ms(14), color: colors.text },

  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(10),
    paddingVertical: vs(12),
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  infoText: { flex: 1, fontSize: ms(14), color: colors.text, fontWeight: '500' },
  infoValue: { fontSize: ms(13), color: colors.placeholder },
  verifiedBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: rs(8), paddingVertical: vs(3),
    borderRadius: borderRadius.full,
  },
  verifiedText: { fontSize: ms(11), fontWeight: '700', color: colors.success },

  saveBtn: { borderRadius: borderRadius.md, overflow: 'hidden', marginTop: vs(4) },
  saveGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: vs(15), gap: rs(8),
  },
  saveBtnText: { color: '#fff', fontSize: ms(16), fontWeight: '700' },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: rs(8), marginTop: vs(12), paddingVertical: vs(14),
    borderRadius: borderRadius.md,
    borderWidth: 1.5, borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  deleteBtnText: { color: colors.error, fontSize: ms(15), fontWeight: '700' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: rs(24),
  },
  modalCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: rs(24), width: '100%', alignItems: 'center',
  },
  modalIconWrap: {
    width: rs(64), height: rs(64), borderRadius: rs(32),
    backgroundColor: colors.errorLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: vs(12),
  },
  modalTitle: { fontSize: ms(18), fontWeight: '800', color: colors.text, marginBottom: vs(8) },
  modalSubtitle: {
    fontSize: ms(13), color: colors.textSecondary, textAlign: 'center',
    lineHeight: ms(19), marginBottom: vs(16),
  },
  modalLabel: { fontSize: ms(13), color: colors.textSecondary, alignSelf: 'flex-start', marginBottom: vs(6) },
  modalKeyword: { fontWeight: '700', color: colors.error },
  modalInput: {
    width: '100%', height: vs(46),
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: borderRadius.sm, paddingHorizontal: rs(12),
    fontSize: ms(14), color: colors.text, marginBottom: vs(20),
  },
  modalActions: { flexDirection: 'row', gap: rs(12), width: '100%' },
  modalCancelBtn: {
    flex: 1, paddingVertical: vs(13), borderRadius: borderRadius.sm,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center',
  },
  modalCancelText: { fontSize: ms(15), fontWeight: '600', color: colors.textSecondary },
  modalDeleteBtn: {
    flex: 1, paddingVertical: vs(13), borderRadius: borderRadius.sm,
    backgroundColor: colors.error, alignItems: 'center',
  },
  modalDeleteBtnDisabled: { backgroundColor: colors.placeholder },
  modalDeleteText: { fontSize: ms(15), fontWeight: '700', color: '#fff' },
});

export default MyProfileScreen;
