import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { orderAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, shadows, borderRadius, ms, rs, vs } from '../../utils/theme';
import { OrderCardSkeleton } from '../../components/SkeletonLoader';

const STATUS_CONFIG = {
  pending:    { color: colors.warning,  bg: colors.warningLight,  icon: 'time-outline' },
  confirmed:  { color: colors.info,     bg: colors.infoLight,     icon: 'checkmark-circle-outline' },
  preparing:  { color: colors.primary,  bg: colors.primarySurface,icon: 'restaurant-outline' },
  delivered:  { color: colors.success,  bg: colors.successLight,  icon: 'checkmark-done-outline' },
  cancelled:  { color: colors.error,    bg: colors.errorLight,    icon: 'close-circle-outline' },
};

export default function OrdersScreen({ navigation }) {
  const { user } = useAuth();
  const { fetchWallet } = useWallet();
  const { addToCart, clearCart } = useCart();
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const FILTERS = [
    { key: 'all',    label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'past',   label: 'Past' },
  ];

  const filteredOrders = orders.filter(o => {
    const s = o.status?.current ?? o.status;
    if (activeFilter === 'active') return !['delivered', 'cancelled'].includes(s);
    if (activeFilter === 'past')   return ['delivered', 'cancelled'].includes(s);
    return true;
  });
  const insets = useSafeAreaInsets();

  const fetchOrders = useCallback(() => {
    return orderAPI.getOrders()
      .then(res => setOrders(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrders().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const handleTrack = useCallback((orderId) => {
    navigation.navigate('OrderTracking', { orderId });
  }, [navigation]);

  const handleRate = useCallback((order) => {
    navigation.navigate('Review', { orderId: order._id, items: order.items });
  }, [navigation]);

  const handleReorder = useCallback((order) => {
    Alert.alert(
      'Reorder',
      'This will clear your current cart and add these items. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Reorder',
          onPress: () => {
            clearCart();
            order.items.forEach(i => {
              const menuItem = i.menuItem && typeof i.menuItem === 'object' ? i.menuItem : { _id: i.menuItem, name: i.name, price: i.price };
              for (let q = 0; q < (i.quantity || 1); q++) addToCart(menuItem);
            });
            navigation.navigate('Cart');
          },
        },
      ]
    );
  }, [addToCart, clearCart, navigation]);

  const renderOrder = useCallback(({ item }) => {
    const status = item.status?.current ?? item.status;
    const cfg = STATUS_CONFIG[status] ?? { color: colors.placeholder, bg: colors.surfaceAlt, icon: 'ellipse-outline' };
    const isDelivered = status === 'delivered';
    const isCancelled = status === 'cancelled';
    const itemNames = item.items?.map(i => i.name || (typeof i.menuItem === 'object' ? i.menuItem?.name : null) || 'Item') || [];
    const etaLabel = status === 'pending' ? '30–45 min' : status === 'confirmed' ? '25–35 min' : status === 'preparing' ? '15–20 min' : status === 'out_for_delivery' ? 'Almost there!' : null;

    return (
      <View style={[styles.orderCard, shadows.medium]}>
        {/* Colored left accent strip */}
        <View style={[styles.cardStrip, { backgroundColor: cfg.color }]} />

        <View style={styles.cardInner}>
          {/* Header row */}
          <View style={styles.orderHeader}>
            <View style={styles.orderIdBadge}>
              <Text style={styles.orderIdText}>#{item._id.slice(-6).toUpperCase()}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
              <Ionicons name={cfg.icon} size={rs(12)} color={cfg.color} />
              <Text style={[styles.statusText, { color: cfg.color }]}>{String(status).replace('_', ' ').toUpperCase()}</Text>
            </View>
          </View>

          {/* Date + item count + ETA */}
          <View style={styles.orderMeta}>
            <Ionicons name="calendar-outline" size={rs(13)} color={colors.placeholder} />
            <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
            <View style={styles.metaDivider} />
            <Ionicons name="bag-outline" size={rs(13)} color={colors.placeholder} />
            <Text style={styles.orderDate}>{item.items?.length || 0} {t.items}</Text>
            {etaLabel && !isCancelled && (
              <>
                <View style={styles.metaDivider} />
                <Ionicons name="time-outline" size={rs(13)} color={colors.primary} />
                <Text style={[styles.orderDate, { color: colors.primary, fontWeight: '700' }]}>{etaLabel}</Text>
              </>
            )}
          </View>

          {/* Item name chips */}
          {itemNames.length > 0 && (
            <View style={styles.itemChipsRow}>
              {itemNames.slice(0, 3).map((name, i) => (
                <View key={i} style={styles.itemChip}>
                  <Text style={styles.itemChipText} numberOfLines={1}>{name}</Text>
                </View>
              ))}
              {itemNames.length > 3 && (
                <View style={styles.itemChip}>
                  <Text style={styles.itemChipText}>+{itemNames.length - 3}</Text>
                </View>
              )}
            </View>
          )}

          {/* Total row with divider */}
          <View style={styles.totalDivider} />
          <View style={styles.orderTotalRow}>
            <View style={styles.totalLabelWrap}>
              <Ionicons name="receipt-outline" size={rs(14)} color={colors.textSecondary} />
              <Text style={styles.orderTotalLabel}>Order Total</Text>
            </View>
            <Text style={styles.orderTotalValue}>₹{item.pricing?.total ?? item.totalAmount ?? 0}</Text>
          </View>

          {/* Actions */}
          {isDelivered ? (
            <View style={styles.deliveredActions}>
              <TouchableOpacity style={styles.actionBtnOutline} onPress={() => handleTrack(item._id)} activeOpacity={0.8}>
                <Ionicons name="receipt-outline" size={rs(14)} color={colors.accent} />
                <Text style={[styles.actionBtnText, { color: colors.accent }]}>{t.view}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnOutline} onPress={() => handleRate(item)} activeOpacity={0.8}>
                <Ionicons name="star-outline" size={rs(14)} color="#FFB800" />
                <Text style={[styles.actionBtnText, { color: '#FFB800' }]}>{t.rate}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnFilled} onPress={() => handleReorder(item)} activeOpacity={0.85}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.actionBtnGrad}
                >
                  <Ionicons name="refresh-outline" size={rs(14)} color="#fff" />
                  <Text style={styles.actionBtnFilledText}>{t.reorder}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : !isCancelled ? (
            <TouchableOpacity style={styles.trackBtn} onPress={() => handleTrack(item._id)} activeOpacity={0.85}>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.trackBtnGradient}
              >
                <Ionicons name="navigate-outline" size={rs(15)} color="#fff" />
                <Text style={styles.trackBtnText}>{t.trackOrder}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }, [handleTrack, handleRate, handleReorder]);

  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.header, { paddingTop: insets.top + vs(12), backgroundColor: colors.navy }]}>
          <Text style={styles.headerTitle}>{t.myOrders}</Text>
          <View style={{ flex: 1 }} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🧾</Text>
          <Text style={styles.emptyTitle}>{t.signIn}</Text>
          <Text style={styles.emptySubtitle}>{t.yourOrderHistoryHere}</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.88}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.signInGradient}
            >
              <Text style={styles.signInText}>{t.signIn}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + vs(12), backgroundColor: colors.navy }]}>
        <Text style={styles.headerTitle}>{t.myOrders}</Text>
        {orders.length > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{orders.length}</Text>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, activeFilter === f.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(f.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, activeFilter === f.key && styles.filterTabTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={i => String(i)}
          contentContainerStyle={styles.list}
          renderItem={() => <OrderCardSkeleton />}
        />
      ) : null}

      {!loading && <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyEmoji}>🧾</Text>
            <Text style={styles.emptyTitle}>{t.noOrders}</Text>
            <Text style={styles.emptySubtitle}>{t.startShopping}</Text>
          </View>
        }
      />}
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

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: vs(10),
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: rs(8),
  },
  filterTab: {
    paddingHorizontal: rs(18), paddingVertical: vs(7),
    borderRadius: borderRadius.full,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterTabText: { fontSize: ms(13), fontWeight: '700', color: colors.textSecondary },
  filterTabTextActive: { color: '#fff' },

  list: { padding: spacing.md },

  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: vs(12),
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardStrip: { width: rs(4), borderRadius: rs(4) },
  cardInner: { flex: 1, padding: rs(16) },

  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(8) },
  orderIdBadge: {
    backgroundColor: colors.primarySurface,
    paddingHorizontal: rs(10), paddingVertical: vs(3),
    borderRadius: borderRadius.full,
  },
  orderIdText: { fontSize: ms(12), fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(4),
    paddingHorizontal: rs(9), paddingVertical: vs(3),
    borderRadius: borderRadius.full,
  },
  statusText: { fontSize: ms(10), fontWeight: '800', letterSpacing: 0.3 },

  orderMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: rs(5), marginBottom: vs(10) },
  orderDate: { fontSize: ms(12), color: colors.placeholder },
  metaDivider: { width: 1, height: vs(11), backgroundColor: colors.border, marginHorizontal: rs(2) },

  itemChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(6), marginBottom: vs(12) },
  itemChip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
    paddingHorizontal: rs(10), paddingVertical: vs(3),
    borderWidth: 1, borderColor: colors.divider,
  },
  itemChipText: { fontSize: ms(11), color: colors.textSecondary, fontWeight: '500' },

  totalDivider: { height: 1, backgroundColor: colors.divider, marginBottom: vs(12) },
  orderTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(14) },
  totalLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  orderTotalLabel: { fontSize: ms(13), color: colors.textSecondary },
  orderTotalValue: { fontSize: ms(18), fontWeight: '900', color: colors.primary },

  // Delivered: 3-button row
  deliveredActions: { flexDirection: 'row', gap: rs(8) },
  actionBtnOutline: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(4),
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: borderRadius.sm, paddingVertical: vs(9),
    backgroundColor: colors.background,
  },
  actionBtnText: { fontSize: ms(12), fontWeight: '700' },
  actionBtnFilled: { flex: 1, borderRadius: borderRadius.sm, overflow: 'hidden' },
  actionBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: vs(9), gap: rs(4),
  },
  actionBtnFilledText: { color: '#fff', fontSize: ms(12), fontWeight: '700' },

  // Active order: track button
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
