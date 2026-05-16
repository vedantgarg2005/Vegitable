import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { orderAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, shadows, borderRadius, ms, rs, vs } from '../../utils/theme';

const STATUS_CONFIG = {
  pending:    { color: colors.warning,  bg: colors.warningLight,  icon: 'time-outline' },
  confirmed:  { color: colors.info,     bg: colors.infoLight,     icon: 'checkmark-circle-outline' },
  preparing:  { color: colors.primary,  bg: colors.primarySurface,icon: 'restaurant-outline' },
  delivered:  { color: colors.success,  bg: colors.successLight,  icon: 'checkmark-done-outline' },
  cancelled:  { color: colors.error,    bg: colors.errorLight,    icon: 'close-circle-outline' },
};

export default function OrdersScreen({ navigation }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user) {
      orderAPI.getOrders()
        .then(res => setOrders(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleTrack = useCallback((orderId) => {
    navigation.navigate('OrderTracking', { orderId });
  }, [navigation]);

  const renderOrder = useCallback(({ item }) => {
    const cfg = STATUS_CONFIG[item.status] ?? { color: colors.placeholder, bg: colors.surfaceAlt, icon: 'ellipse-outline' };
    return (
      <View style={[styles.orderCard, shadows.medium]}>
        <View style={styles.orderHeader}>
          <View style={styles.orderIdBadge}>
            <Text style={styles.orderIdText}>#{item._id.slice(-6).toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={rs(13)} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.orderMeta}>
          <Ionicons name="calendar-outline" size={rs(13)} color={colors.placeholder} />
          <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString('en-IN')}</Text>
        </View>

        <View style={styles.orderTotalRow}>
          <Text style={styles.orderTotalLabel}>Order Total</Text>
          <Text style={styles.orderTotalValue}>₹{item.totalAmount}</Text>
        </View>

        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => handleTrack(item._id)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.trackBtnGradient}
          >
            <Ionicons name="navigate-outline" size={rs(16)} color="#fff" />
            <Text style={styles.trackBtnText}>Track Order</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }, [handleTrack]);

  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + vs(12) }]}
        >
          <Text style={styles.headerTitle}>My Orders</Text>
        </LinearGradient>
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🧾</Text>
          <Text style={styles.emptyTitle}>Sign in to view orders</Text>
          <Text style={styles.emptySubtitle}>Your order history will appear here after signing in</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => navigation.navigate('Auth')} activeOpacity={0.88}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.signInGradient}
            >
              <Text style={styles.signInText}>Sign In</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + vs(12) }]}
      >
        <Text style={styles.headerTitle}>My Orders</Text>
        {orders.length > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{orders.length}</Text>
          </View>
        )}
      </LinearGradient>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading && (
            <View style={styles.centered}>
              <Text style={styles.emptyEmoji}>🧾</Text>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>Your past orders will show up here</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: vs(18),
    borderBottomLeftRadius: rs(28),
    borderBottomRightRadius: rs(28),
    gap: rs(10),
  },
  headerTitle: { fontSize: ms(22), fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: rs(10), paddingVertical: vs(3),
    borderRadius: borderRadius.full,
  },
  headerBadgeText: { color: '#fff', fontWeight: '800', fontSize: ms(13) },

  list: { padding: spacing.md },

  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: rs(16),
    marginBottom: vs(12),
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(10) },
  orderIdBadge: {
    backgroundColor: colors.primarySurface,
    paddingHorizontal: rs(10), paddingVertical: vs(4),
    borderRadius: borderRadius.full,
  },
  orderIdText: { fontSize: ms(13), fontWeight: '700', color: colors.primary },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(4),
    paddingHorizontal: rs(10), paddingVertical: vs(4),
    borderRadius: borderRadius.full,
  },
  statusText: { fontSize: ms(11), fontWeight: '700' },

  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: rs(5), marginBottom: vs(10) },
  orderDate: { fontSize: ms(13), color: colors.placeholder },

  orderTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(14) },
  orderTotalLabel: { fontSize: ms(14), color: colors.textSecondary },
  orderTotalValue: { fontSize: ms(17), fontWeight: '800', color: colors.primary },

  trackBtn: { borderRadius: borderRadius.sm, overflow: 'hidden' },
  trackBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: vs(11), gap: rs(6),
  },
  trackBtnText: { color: '#fff', fontSize: ms(14), fontWeight: '700' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: rs(32), marginTop: vs(60) },
  emptyEmoji: { fontSize: ms(56), marginBottom: vs(12) },
  emptyTitle: { fontSize: ms(18), fontWeight: '700', color: colors.text, marginBottom: vs(6) },
  emptySubtitle: { fontSize: ms(14), color: colors.placeholder, textAlign: 'center', marginBottom: vs(24) },
  signInBtn: { borderRadius: borderRadius.md, overflow: 'hidden', width: '100%' },
  signInGradient: { paddingVertical: vs(14), alignItems: 'center' },
  signInText: { color: '#fff', fontSize: ms(16), fontWeight: '700' },
});
