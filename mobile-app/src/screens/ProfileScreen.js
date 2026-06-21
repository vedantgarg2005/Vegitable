import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Modal, TextInput, Alert, RefreshControl } from 'react-native';
import { Avatar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { orderAPI, productRequestAPI } from '../services/api';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [orderCount, setOrderCount] = useState(0);
  const [langModal, setLangModal] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const submitProductRequest = async () => {
    if (!productName.trim()) return;
    setSubmitting(true);
    try {
      await productRequestAPI.submit({ productName: productName.trim(), description: productDesc.trim() });
      setRequestModal(false);
      setProductName('');
      setProductDesc('');
      Alert.alert('', t.requestProductSuccess);
    } catch {
      Alert.alert(t.error, 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const menuItems = [
    { title: t.myProfile, icon: 'person-circle-outline', badge: null, onPress: () => navigation.navigate('MyProfile') },
    { title: t.myOrders, icon: 'receipt-outline', badge: null, onPress: () => navigation.navigate('Orders') },
    { title: t.myWallet, icon: 'wallet-outline', badge: null, onPress: () => navigation.navigate('Wallet') },
    { title: t.savedAddresses, icon: 'location-outline', badge: null, onPress: () => navigation.navigate('SavedAddresses') },
    { title: t.notifications, icon: 'notifications-outline', badge: null, onPress: () => navigation.navigate('Notifications') },
    { title: t.language, icon: 'language-outline', badge: language === 'hi' ? 'हि' : 'EN', onPress: () => setLangModal(true) },
    { title: t.helpSupport, icon: 'help-circle-outline', badge: null, onPress: () => navigation.navigate('HelpSupport') },
    { title: t.termsConditions, icon: 'document-text-outline', badge: null, onPress: () => navigation.navigate('TermsConditions') },
    { title: t.requestProduct, icon: 'add-circle-outline', badge: null, onPress: () => setRequestModal(true) },
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
    <View style={[styles.header, { paddingTop: insets.top + vs(12) }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Explore')} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={rs(22)} color="#fff" />
      </TouchableOpacity>
      <View style={styles.avatarWrap}>
        {user
          ? <Avatar.Text size={rs(44)} label={user.name?.charAt(0) || 'U'} style={styles.avatar} color={colors.primary} />
          : <Avatar.Icon size={rs(44)} icon="account" style={styles.avatar} color={colors.primary} />
        }
      </View>
      <View style={styles.headerInfo}>
        <Text style={styles.userName} numberOfLines={1}>{user?.name || 'Welcome, Guest!'}</Text>
        <Text style={styles.userSub} numberOfLines={1}>{user?.email || user?.phone || 'Sign in to access your profile'}</Text>
      </View>
    </View>
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

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={rs(20)} color={colors.error} />
          <Text style={styles.logoutText}>{t.signOut}</Text>
        </TouchableOpacity>
      </View>

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

      {/* Request New Product Modal */}
      <Modal visible={requestModal} transparent animationType="slide" onRequestClose={() => setRequestModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setRequestModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t.requestProductTitle}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.requestProductName}
              placeholderTextColor={colors.placeholder}
              value={productName}
              onChangeText={setProductName}
              maxLength={100}
            />
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder={t.requestProductDesc}
              placeholderTextColor={colors.placeholder}
              value={productDesc}
              onChangeText={setProductDesc}
              multiline
              numberOfLines={3}
              maxLength={300}
            />
            <TouchableOpacity
              style={[styles.submitBtn, (!productName.trim() || submitting) && styles.submitBtnDisabled]}
              onPress={submitProductRequest}
              disabled={!productName.trim() || submitting}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>{submitting ? t.loading : t.requestProductSubmit}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(16),
    paddingBottom: vs(16),
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

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    paddingVertical: vs(14),
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  logoutText: { color: colors.error, fontSize: ms(15), fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: rs(20),
    width: '80%',
    ...shadows.medium,
  },
  modalTitle: {
    fontSize: ms(16),
    fontWeight: '700',
    color: colors.text,
    marginBottom: vs(12),
    fontFamily: 'Poppins_700Bold',
  },
  langOption: {
    flexDirection: 'row',
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
