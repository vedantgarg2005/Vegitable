import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';

const TYPE_CONFIG = {
  order_update: { icon: 'receipt-outline', color: colors.info, bg: colors.infoLight },
  promo: { icon: 'pricetag-outline', color: colors.accent, bg: colors.accentLight },
  wallet: { icon: 'wallet-outline', color: colors.success, bg: colors.successLight },
  general: { icon: 'notifications-outline', color: colors.primary, bg: colors.primarySurface },
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/notifications/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch { setNotifications([]); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const markRead = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderItem = ({ item }) => {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.general;
    return (
      <TouchableOpacity
        style={[styles.card, shadows.small, !item.isRead && styles.cardUnread]}
        onPress={() => markRead(item._id)}
        activeOpacity={0.75}
      >
        <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={rs(20)} color={cfg.color} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
          </View>
          <Text style={styles.cardMsg} numberOfLines={2}>{item.message}</Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + vs(12) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0
          ? <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>
          : <View style={{ width: rs(30) }} />}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: vs(40) }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={rs(56)} color={colors.border} />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.navy,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: rs(16), paddingBottom: vs(16),
  },
  backBtn: { padding: rs(4) },
  headerTitle: { fontSize: ms(18), fontWeight: '700', color: '#fff' },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: borderRadius.full,
    minWidth: rs(26), height: rs(26), justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: rs(6),
  },
  badgeText: { color: '#fff', fontSize: ms(12), fontWeight: '700' },

  list: { padding: rs(16), gap: vs(10), paddingBottom: vs(32) },

  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: rs(14), flexDirection: 'row', alignItems: 'flex-start', gap: rs(12),
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  iconWrap: {
    width: rs(42), height: rs(42), borderRadius: rs(12),
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(3) },
  cardTitle: { fontSize: ms(14), fontWeight: '700', color: colors.text, flex: 1, marginRight: rs(8) },
  cardTime: { fontSize: ms(11), color: colors.placeholder },
  cardMsg: { fontSize: ms(13), color: colors.textSecondary, lineHeight: ms(19) },
  unreadDot: {
    width: rs(8), height: rs(8), borderRadius: rs(4),
    backgroundColor: colors.primary, marginTop: rs(4), flexShrink: 0,
  },

  empty: { alignItems: 'center', marginTop: vs(60), gap: vs(12) },
  emptyText: { fontSize: ms(15), color: colors.placeholder },
});
