import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar,
  Modal, TextInput, Alert, RefreshControl, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Avatar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { orderAPI, productRequestAPI } from '../services/api';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, deleteAccount } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [orderCount, setOrderCount] = useState(0);
  const [langModal, setLangModal] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const slideAnim = useState(new Animated.Value(300))[0];

  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      const res = await orderAPI.getOrders();
      setOrderCount(res.data?.length || 0);
    } catch {}
  }, [user]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  const openRequestModal = () => {
    setSubmitted(false);
    setProductName('');
    setProductDesc('');
    setRequestModal(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  };

  const closeRequestModal = () => {
    Animated.timing(slideAnim, { toValue: 300, duration: 220, useNativeDriver: true }).start(() => setRequestModal(false));
  };

  const submitProductRequest = async () => {
    if (!productName.trim()) return;
    setSubmitting(true);
    try {
      await productRequestAPI.submit({ productName: productName.trim(), description: productDesc.trim() });
      setSubmitted(true);
    } catch {
      Alert.alert(t.error, 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = () => {
    if (confirmText.trim().toLowerCase() !== 'delete') return;
    setDeleteModal(false);
    setConfirmText('');
    deleteAccount();
  };

  const menuItems = [
    { title: t.myOrders, icon: 'receipt-outline', badge: null, onPress: () => navigation.navigate('Orders') },
    { title: t.myWallet, icon: 'wallet-outline', badge: null, onPress: () => navigation.navigate('Wallet') },
    { title: t.savedAddresses, icon: 'location-outline', badge: null, onPress: () => navigation.navigate('SavedAddresses') },
    { title: t.notifications, icon: 'notifications-outline', badge: null, onPress: () => navigation.navigate('Notifications') },
    // { title: t.language, icon: 'language-outline', badge: language === 'hi' ? 'हि' : 'EN', onPress: () => setLangModal(true) },
    { title: t.helpSupport, icon: 'help-circle-outline', badge: null, onPress: () => navigation.navigate('HelpSupport') },
    { title: t.termsConditions, icon: 'document-text-outline', badge: null, onPress: () => navigation.navigate('TermsConditions') },
    { title: t.requestProduct, icon: 'add-circle-outline', badge: null, onPress: openRequestModal },
  ];

  const MenuItem = ({ item }) => (
    <TouchableOpacity style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
      <View style={styles.menuIconWrap}>
        <Ionicons name={item.icon} size={rs(20)} color={colors.primary} />
      </View>
      <Text style={styles.menuText}>{item.title}</Text>
      {item.badge && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{item.badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={rs(16)} color={colors.placeholder} />
    </TouchableOpacity>
  );

  const headerContent = (
    <LinearGradient
      colors={[colors.primaryDark, colors.primary, colors.primaryLight]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + vs(12) }]}
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Explore')} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={rs(22)} color="#fff" />
      </TouchableOpacity>
      <View style={styles.avatarWrap}>
        {user
          ? <Avatar.Text size={rs(56)} label={user.name?.charAt(0) || 'U'} style={styles.avatar} color={colors.primary} />
          : <Avatar.Icon size={rs(56)} icon="account" style={styles.avatar} color={colors.primary} />
        }
      </View>
      <View style={styles.headerInfo}>
        <Text style={styles.userName} numberOfLines={1}>{user?.name || 'Welcome, Guest!'}</Text>
        <Text style={styles.userSub} numberOfLines={1}>{user?.email || user?.phone || 'Sign in to access your profile'}</Text>
      </View>
    </LinearGradient>
  );

  if (!user) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <StatusBar barStyle="light-content" />
        {headerContent}
        <View style={styles.content}>
          <TouchableOpacity style={styles.signInBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.88}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.signInGradient, { borderRadius: borderRadius.xs }]}
            >
              <Text style={styles.signInBtnText}>{t.signIn}</Text>
              <Ionicons name="arrow-forward" size={rs(18)} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          <View style={[styles.menuCard, shadows.small]}>
            {menuItems.slice(4).map((item, i) => <MenuItem key={i} item={item} />)}
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      <StatusBar barStyle="light-content" />
      {headerContent}

      <View style={styles.content}>
        <View style={[styles.menuCard, shadows.small]}>
          {menuItems.map((item, i) => <MenuItem key={i} item={item} />)}
        </View>

        <View style={[styles.dangerCard, shadows.small]}>
          <TouchableOpacity style={styles.dangerRow} onPress={logout} activeOpacity={0.7}>
            <LinearGradient colors={['#FFF0F0', '#FFE4E4']} style={styles.dangerIconWrap}>
              <Ionicons name="log-out-outline" size={rs(20)} color={colors.error} />
            </LinearGradient>
            <View style={styles.dangerText}>
              <Text style={styles.dangerTitle}>{t.signOut}</Text>
              <Text style={styles.dangerSub}>Sign out of your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={rs(16)} color={colors.error} />
          </TouchableOpacity>

          <View style={styles.dangerDivider} />

          <TouchableOpacity style={styles.dangerRow} onPress={() => setDeleteModal(true)} activeOpacity={0.7}>
            <LinearGradient colors={['#FFF0F0', '#FFE4E4']} style={styles.dangerIconWrap}>
              <Ionicons name="trash-outline" size={rs(20)} color={colors.error} />
            </LinearGradient>
            <View style={styles.dangerText}>
              <Text style={styles.dangerTitle}>Delete Account</Text>
              <Text style={styles.dangerSub}>Permanently remove your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={rs(16)} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Delete Account Modal */}
      <Modal visible={deleteModal} transparent animationType="fade" onRequestClose={() => setDeleteModal(false)}>
        <View style={styles.deleteModalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.deleteIconWrap}>
              <Ionicons name="warning" size={rs(32)} color={colors.error} />
            </View>
            <Text style={styles.modalTitle}>Delete Account?</Text>
            <Text style={styles.deleteModalSub}>
              This will permanently delete your account and all data. This action cannot be undone.
            </Text>
            <Text style={styles.deleteModalLabel}>Type <Text style={{ fontWeight: '700', color: colors.error }}>delete</Text> to confirm</Text>
            <TextInput
              style={styles.deleteModalInput}
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="Type delete here"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
            />
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.deleteModalCancelBtn}
                onPress={() => { setDeleteModal(false); setConfirmText(''); }}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalConfirmBtn, confirmText.trim().toLowerCase() !== 'delete' && styles.deleteModalConfirmDisabled]}
                onPress={handleDeleteAccount}
                disabled={confirmText.trim().toLowerCase() !== 'delete'}
              >
                <Text style={styles.deleteModalConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal visible={langModal} transparent animationType="fade" onRequestClose={() => setLangModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLangModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t.selectLanguage}</Text>
            {[{ code: 'en', label: t.english }, { code: 'hi', label: t.hindi }].map(({ code, label }) => (
              <TouchableOpacity
                key={code}
                style={[styles.langOption, language === code && styles.langOptionActive]}
                onPress={() => { changeLanguage(code); setLangModal(false); }}
              >
                <Text style={[styles.langOptionText, language === code && styles.langOptionTextActive]}>{label}</Text>
                {language === code && <Ionicons name="checkmark" size={rs(18)} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Request New Product Modal — bottom sheet */}
      <Modal visible={requestModal} transparent animationType="none" onRequestClose={closeRequestModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeRequestModal}>
            <Animated.View
              style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}
              onStartShouldSetResponder={() => true}
            >
              {/* Handle bar */}
              <View style={styles.sheetHandle} />

              {submitted ? (
                /* Success state */
                <View style={styles.successWrap}>
                  <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.successIcon}>
                    <Ionicons name="checkmark-circle" size={rs(48)} color={colors.primary} />
                  </LinearGradient>
                  <Text style={styles.successTitle}>Request Submitted!</Text>
                  <Text style={styles.successSub}>We'll review your request and try to add it soon.</Text>
                  <TouchableOpacity style={styles.doneBtn} onPress={closeRequestModal}>
                    <Text style={styles.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Form state */
                <>
                  <View style={styles.sheetHeader}>
                    <View style={styles.sheetTitleRow}>
                      <View style={styles.sheetIconWrap}>
                        <Ionicons name="leaf-outline" size={rs(20)} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.sheetTitle}>{t.requestProductTitle}</Text>
                        <Text style={styles.sheetSub}>Tell us what you'd like to see</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={closeRequestModal} style={styles.sheetCloseBtn}>
                      <Ionicons name="close" size={rs(20)} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.sheetBody}>
                    <Text style={styles.inputLabel}>Product Name <Text style={{ color: colors.error }}>*</Text></Text>
                    <View style={styles.inputWrap}>
                      <Ionicons name="basket-outline" size={rs(18)} color={colors.primary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.sheetInput}
                        placeholder={t.requestProductName}
                        placeholderTextColor={colors.placeholder}
                        value={productName}
                        onChangeText={setProductName}
                        maxLength={100}
                        returnKeyType="next"
                      />
                    </View>

                    <Text style={[styles.inputLabel, { marginTop: vs(14) }]}>Description</Text>
                    <View style={[styles.inputWrap, styles.inputWrapMulti]}>
                      <Ionicons name="chatbubble-outline" size={rs(18)} color={colors.primary} style={[styles.inputIcon, { alignSelf: 'flex-start', marginTop: vs(10) }]} />
                      <TextInput
                        style={[styles.sheetInput, styles.sheetInputMulti]}
                        placeholder={t.requestProductDesc}
                        placeholderTextColor={colors.placeholder}
                        value={productDesc}
                        onChangeText={setProductDesc}
                        multiline
                        numberOfLines={3}
                        maxLength={300}
                      />
                    </View>
                    <Text style={styles.charCount}>{productDesc.length}/300</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, (!productName.trim() || submitting) && styles.submitBtnDisabled]}
                    onPress={submitProductRequest}
                    disabled={!productName.trim() || submitting}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={!productName.trim() || submitting ? ['#d1d5db', '#d1d5db'] : [colors.gradientStart, colors.gradientEnd]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.submitGradient}
                    >
                      {submitting
                        ? <Ionicons name="hourglass-outline" size={rs(18)} color="#fff" />
                        : <Ionicons name="send-outline" size={rs(18)} color="#fff" />}
                      <Text style={styles.submitBtnText}>{submitting ? t.loading : t.requestProductSubmit}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(16),
    paddingBottom: vs(20),
    gap: rs(12),
  },
  backBtn: { padding: rs(4) },
  headerInfo: { flex: 1, justifyContent: 'center' },
  avatarWrap: {},
  avatar: { backgroundColor: '#FFFFFF' },
  onlineDot: {
    position: 'absolute',
    bottom: rs(4),
    right: rs(4),
    width: rs(16),
    height: rs(16),
    borderRadius: rs(8),
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: { fontSize: ms(20), fontWeight: '800', color: '#FFFFFF', marginBottom: vs(4), fontFamily: 'Poppins_800ExtraBold', textAlign: 'left' },
  userSub: { fontSize: ms(14), color: 'rgba(255,255,255,0.85)', fontFamily: 'Poppins_400Regular', textAlign: 'left' },

  content: { padding: rs(16) },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: vs(18),
    marginBottom: vs(16),
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: vs(-24),
    marginHorizontal: rs(4),
    ...shadows.medium,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: ms(17), fontWeight: '800', color: colors.primary, marginBottom: vs(2), fontFamily: 'Poppins_800ExtraBold' },
  statLabel: { fontSize: ms(12), color: colors.placeholder, fontWeight: '500', fontFamily: 'Poppins_500Medium' },
  statDivider: { width: 1, height: rs(40), backgroundColor: colors.divider },

  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: vs(16),
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(14),
    paddingHorizontal: rs(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuIconWrap: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(10),
    backgroundColor: colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rs(12),
  },
  menuText: { flex: 1, fontSize: ms(15), color: colors.text, fontWeight: '500', fontFamily: 'Poppins_500Medium' },
  menuBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: rs(8),
    paddingVertical: vs(3),
    borderRadius: borderRadius.full,
    marginRight: rs(8),
  },
  menuBadgeText: { fontSize: ms(11), fontWeight: '700', color: colors.warning },

  signInBtn: { borderRadius: borderRadius.md, overflow: 'hidden', marginBottom: vs(16) },
  signInGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(15),
    gap: rs(8),
  },
  signInBtnText: { color: '#fff', fontSize: ms(16), fontWeight: '700' },

  dangerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: vs(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFDADA',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(13),
    paddingHorizontal: rs(16),
    gap: rs(12),
  },
  dangerIconWrap: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerText: { flex: 1 },
  dangerTitle: {
    fontSize: ms(14),
    fontWeight: '700',
    color: colors.error,
    fontFamily: 'Poppins_700Bold',
  },
  dangerSub: {
    fontSize: ms(12),
    color: colors.placeholder,
    marginTop: vs(1),
    fontFamily: 'Poppins_400Regular',
  },
  dangerDivider: {
    height: 1,
    backgroundColor: '#FFDADA',
    marginHorizontal: rs(16),
  },
  deleteModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: rs(24),
  },
  deleteIconWrap: {
    width: rs(64), height: rs(64), borderRadius: rs(32),
    backgroundColor: colors.errorLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: vs(12),
  },
  deleteModalSub: {
    fontSize: ms(13), color: colors.textSecondary, textAlign: 'center',
    lineHeight: ms(19), marginBottom: vs(16),
  },
  deleteModalLabel: { fontSize: ms(13), color: colors.textSecondary, alignSelf: 'flex-start', marginBottom: vs(6) },
  deleteModalInput: {
    width: '100%', height: vs(46),
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: borderRadius.sm, paddingHorizontal: rs(12),
    fontSize: ms(14), color: colors.text, marginBottom: vs(20),
  },
  deleteModalActions: { flexDirection: 'row', gap: rs(12), width: '100%' },
  deleteModalCancelBtn: {
    flex: 1, paddingVertical: vs(13), borderRadius: borderRadius.sm,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center',
  },
  deleteModalCancelText: { fontSize: ms(15), fontWeight: '600', color: colors.textSecondary },
  deleteModalConfirmBtn: {
    flex: 1, paddingVertical: vs(13), borderRadius: borderRadius.sm,
    backgroundColor: colors.error, alignItems: 'center',
  },
  deleteModalConfirmDisabled: { backgroundColor: colors.placeholder },
  deleteModalConfirmText: { fontSize: ms(15), fontWeight: '700', color: '#fff' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl || 24,
    borderTopRightRadius: borderRadius.xl || 24,
    paddingBottom: vs(32),
    ...shadows.large || shadows.medium,
  },
  sheetHandle: {
    width: rs(40), height: rs(4),
    backgroundColor: colors.divider,
    borderRadius: 99,
    alignSelf: 'center',
    marginTop: vs(10),
    marginBottom: vs(6),
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: rs(20), paddingVertical: vs(12),
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  sheetIconWrap: {
    width: rs(40), height: rs(40), borderRadius: rs(12),
    backgroundColor: colors.primarySurface,
    justifyContent: 'center', alignItems: 'center',
  },
  sheetTitle: { fontSize: ms(16), fontWeight: '800', color: colors.text },
  sheetSub: { fontSize: ms(12), color: colors.placeholder, marginTop: vs(1) },
  sheetCloseBtn: {
    width: rs(34), height: rs(34), borderRadius: rs(10),
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
  },
  sheetBody: { paddingHorizontal: rs(20), paddingTop: vs(18), paddingBottom: vs(6) },
  inputLabel: { fontSize: ms(12), fontWeight: '700', color: colors.textSecondary, marginBottom: vs(6) },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: rs(12),
  },
  inputWrapMulti: { alignItems: 'flex-start' },
  inputIcon: { marginRight: rs(10) },
  sheetInput: { flex: 1, fontSize: ms(14), color: colors.text, height: vs(46) },
  sheetInputMulti: { height: vs(80), textAlignVertical: 'top', paddingVertical: vs(10) },
  charCount: { fontSize: ms(11), color: colors.placeholder, textAlign: 'right', marginTop: vs(4) },
  submitBtn: { marginHorizontal: rs(20), marginTop: vs(10), borderRadius: borderRadius.md, overflow: 'hidden' },
  submitBtnDisabled: { opacity: 0.7 },
  submitGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: vs(15), gap: rs(8),
  },
  submitBtnText: { color: '#fff', fontSize: ms(15), fontWeight: '700' },
  // success
  successWrap: { alignItems: 'center', paddingHorizontal: rs(24), paddingVertical: vs(32) },
  successIcon: {
    width: rs(88), height: rs(88), borderRadius: rs(44),
    justifyContent: 'center', alignItems: 'center', marginBottom: vs(16),
  },
  successTitle: { fontSize: ms(20), fontWeight: '800', color: colors.text, marginBottom: vs(8) },
  successSub: { fontSize: ms(13), color: colors.placeholder, textAlign: 'center', lineHeight: ms(20), marginBottom: vs(24) },
  doneBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    paddingVertical: vs(13), paddingHorizontal: rs(40),
  },
  doneBtnText: { color: '#fff', fontSize: ms(15), fontWeight: '700' },
  langOption: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(12),
    paddingHorizontal: rs(12),
    borderRadius: borderRadius.sm,
    marginBottom: vs(6),
    backgroundColor: colors.background,
  },
  langOptionActive: { backgroundColor: colors.primarySurface },
  langOptionText: { fontSize: ms(15), color: colors.text, fontFamily: 'Poppins_500Medium' },
  langOptionTextActive: { color: colors.primary, fontWeight: '700' },
});

export default ProfileScreen;
