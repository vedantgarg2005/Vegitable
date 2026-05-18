import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { Avatar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    if (user) {
      orderAPI.getOrders()
        .then(res => setOrderCount(res.data?.length || 0))
        .catch(() => {});
    }
  }, [user]);

  const menuItems = [
    { title: 'My Profile', icon: 'person-circle-outline', badge: null, onPress: () => navigation.navigate('MyProfile') },
    { title: 'My Orders', icon: 'receipt-outline', badge: null, onPress: () => navigation.navigate('Orders') },
    { title: 'My Wallet', icon: 'wallet-outline', badge: null, onPress: () => navigation.navigate('Wallet') },
    { title: 'Refer & Earn ₹75', icon: 'gift-outline', badge: '₹75', onPress: () => navigation.navigate('Referral') },
    { title: 'Saved Addresses', icon: 'location-outline', badge: null, onPress: () => navigation.navigate('SavedAddresses') },
    { title: 'Notifications', icon: 'notifications-outline', badge: null, onPress: () => navigation.navigate('Notifications') },
    { title: 'Help & Support', icon: 'help-circle-outline', badge: null, onPress: () => navigation.navigate('HelpSupport') },
    { title: 'Terms & Conditions', icon: 'document-text-outline', badge: null, onPress: () => navigation.navigate('TermsConditions') },
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
    <View
      style={[styles.header, { paddingTop: insets.top + vs(8), backgroundColor: colors.navy }]}
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Explore')} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={rs(22)} color="#fff" />
      </TouchableOpacity>
      <View style={styles.headerRow}>
        <View style={styles.avatarWrap}>
          {user
            ? <Avatar.Text size={rs(54)} label={user.name?.charAt(0) || 'U'} style={styles.avatar} color={colors.primary} />
            : <Avatar.Icon size={rs(54)} icon="account" style={styles.avatar} color={colors.primary} />
          }
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{user?.name || 'Welcome, Guest!'}</Text>
          <Text style={styles.userSub}>{user?.email || user?.phone || 'Sign in to access your profile'}</Text>
        </View>
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
              <Text style={styles.signInBtnText}>Sign In to Continue</Text>
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />
      {headerContent}

      <View style={styles.content}>
        {/* Menu */}
        <View style={[styles.menuCard, shadows.small]}>
          {menuItems.map((item, i) => <MenuItem key={i} item={item} />)}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={rs(20)} color={colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingBottom: vs(20),
    paddingHorizontal: rs(16),
    borderBottomLeftRadius: rs(32),
    borderBottomRightRadius: rs(32),
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    marginTop: vs(12),
  },
  backBtn: {
    padding: rs(6),
    alignSelf: 'flex-start',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  avatarWrap: { position: 'relative' },
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
});

export default ProfileScreen;
