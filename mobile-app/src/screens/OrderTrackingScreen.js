import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Animated, Linking, Modal, Alert, RefreshControl,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { orderAPI } from '../services/api';
import { getSocket } from '../services/socket';
import { useCart } from '../context/CartContext';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';
import { ORDER_STATUS } from '../utils/constants';

const STATUS_STEPS = [
  { key: 'placed',           label: 'Order Placed',       emoji: '📋', desc: 'We have received your order' },
  { key: 'confirmed',        label: 'Confirmed',          emoji: '✅', desc: 'Your order has been confirmed' },
  { key: 'processing',       label: 'Processing',         emoji: '📦', desc: 'Your order is being packed' },
  { key: 'packed',           label: 'Packed',             emoji: '🛍️', desc: 'Order packed and ready to ship' },
  { key: 'out_for_delivery', label: 'Out for Delivery',   emoji: '🚴', desc: 'Delivery partner is on the way' },
  { key: 'delivered',        label: 'Delivered',          emoji: '🎉', desc: 'Order delivered successfully!' },
];

export default function OrderTrackingScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [partnerLocation, setPartnerLocation] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { addToCart, clearCart } = useCart();
  const insets = useSafeAreaInsets();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrder();
    setRefreshing(false);
  }, []);

  const handleReorder = useCallback(() => {
    if (!order?.items?.length) return;
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
              const menuItem = i.menuItem && typeof i.menuItem === 'object'
                ? i.menuItem
                : { _id: i.menuItem, name: i.name, price: i.price };
              for (let q = 0; q < (i.quantity || 1); q++) addToCart(menuItem);
            });
            navigation.navigate('Cart');
          },
        },
      ]
    );
  }, [order, addToCart, clearCart, navigation]);
  const mapRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for active step
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    loadOrder();
    const socket = getSocket();
    socket.emit('join-room', orderId);

    socket.on('order-status-update', ({ status }) => {
      setOrder(prev => prev ? { ...prev, status: { ...prev.status, current: status } } : prev);
      if (status === ORDER_STATUS.DELIVERED) {
        setTimeout(() => setShowRatingModal(true), 1200);
      }
    });

    socket.on('partner_location', ({ lat, lng }) => {
      const coords = { latitude: lat, longitude: lng };
      setPartnerLocation(coords);
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500);
    });

    return () => {
      socket.off('order-status-update');
      socket.off('partner_location');
    };
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const response = await orderAPI.getOrder(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusSteps = () => {
    const currentIndex = STATUS_STEPS.findIndex(s => s.key === order?.status?.current);
    const history = order?.status?.history || [];
    return STATUS_STEPS.map((step, i) => {
      const historyEntry = history.find(h => h.status === step.key);
      return {
        ...step,
        completed: i < currentIndex,
        active: i === currentIndex,
        pending: i > currentIndex,
        timestamp: historyEntry?.timestamp || null,
      };
    });
  };

  const callPartner = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const getETA = () => {
    if (!order?.estimatedDeliveryTime) return null;
    const eta = new Date(order.estimatedDeliveryTime);
    const now = new Date();
    const diffMs = eta - now;
    if (diffMs <= 0) return null;
    const mins = Math.round(diffMs / 60000);
    return mins;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading order...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorTitle}>Order not found</Text>
        <TouchableOpacity style={styles.backBtnAlt} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnAltText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const steps = getStatusSteps();
  const activeStep = steps.find(s => s.active);
  const isDelivered = order?.status?.current === ORDER_STATUS.DELIVERED;
  const isOutForDelivery = order?.status?.current === ORDER_STATUS.OUT_FOR_DELIVERY;
  const customerCoords = order.delivery?.address?.coordinates;
  const etaMins = getETA();

  const mapRegion = partnerLocation
    ? { ...partnerLocation, latitudeDelta: 0.015, longitudeDelta: 0.015 }
    : customerCoords
    ? { latitude: customerCoords.lat, longitude: customerCoords.lng, latitudeDelta: 0.015, longitudeDelta: 0.015 }
    : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View
        style={[styles.header, { paddingTop: insets.top + vs(8) }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <View style={{ width: rs(40) }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >

        {/* ETA Banner */}
        {!isDelivered && (
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.etaBanner}
          >
            <View style={styles.etaTop}>
              <View style={styles.etaLeft}>
                <Text style={styles.etaMins}>
                  {etaMins ? `${etaMins} mins` : activeStep?.label || 'Processing'}
                </Text>
                <Text style={styles.etaSubtext}>
                  {etaMins ? 'Estimated delivery time' : activeStep?.desc || ''}
                </Text>
              </View>
              <View style={styles.etaEmojiWrap}>
                <Text style={styles.etaEmoji}>{activeStep?.emoji || '📦'}</Text>
              </View>
            </View>
            {/* Mini step progress pills */}
            <View style={styles.etaProgress}>
              {STATUS_STEPS.map((s, i) => {
                const currentIndex = STATUS_STEPS.findIndex(x => x.key === order?.status?.current);
                const done = i <= currentIndex;
                return (
                  <View
                    key={s.key}
                    style={[styles.etaPill, done && styles.etaPillDone, i === currentIndex && styles.etaPillActive]}
                  />
                );
              })}
            </View>
          </LinearGradient>
        )}

        {isDelivered && (
          <View style={[styles.deliveredBanner, shadows.medium]}>
            <Text style={styles.deliveredEmoji}>🎉</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.deliveredTitle}>Order Delivered!</Text>
              <Text style={styles.deliveredSub}>Thank you for your order!</Text>
            </View>
            <TouchableOpacity style={styles.reorderBtn} onPress={handleReorder} activeOpacity={0.85}>
              <Ionicons name="refresh-outline" size={rs(14)} color="#fff" />
              <Text style={styles.reorderBtnText}>Reorder</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Order Info */}
        <View style={[styles.card, shadows.medium]}>
          <View style={styles.orderIdRow}>
            <View style={styles.orderIdBadge}>
              <Ionicons name="receipt-outline" size={rs(13)} color={colors.primary} />
              <Text style={styles.orderIdText}>#{order._id?.slice(-6)?.toUpperCase()}</Text>
            </View>
            <View style={styles.orderDateWrap}>
              <Ionicons name="calendar-outline" size={rs(12)} color={colors.placeholder} />
              <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
            </View>
          </View>
          <View style={styles.orderInfoDivider} />
          <View style={styles.orderTotalRow}>
            <Text style={styles.orderTotalLabel}>Order Total</Text>
            <Text style={styles.orderTotalValue}>₹{order.pricing?.total ?? order.totalAmount}</Text>
          </View>
        </View>

        {/* Map — always visible when coordinates available */}
        {mapRegion && (
          <View style={[styles.card, shadows.small, styles.mapCard]}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={mapRegion}
            >
              {partnerLocation && (
                <Marker coordinate={partnerLocation} title="Delivery Partner">
                  <View style={styles.partnerMarker}>
                    <Text style={styles.partnerMarkerEmoji}>🚴</Text>
                  </View>
                </Marker>
              )}
              {customerCoords && (
                <Marker
                  coordinate={{ latitude: customerCoords.lat, longitude: customerCoords.lng }}
                  title="Your Location"
                  pinColor={colors.primary}
                />
              )}
            </MapView>

            {/* Delivery Partner Row inside map card */}
            {order.delivery?.partner && (
              <View style={styles.partnerRow}>
                <View style={styles.partnerIconWrap}>
                  <Ionicons name="person" size={rs(20)} color={colors.primary} />
                </View>
                <View style={styles.partnerInfo}>
                  <Text style={styles.partnerName}>{order.delivery.partner.name}</Text>
                  <Text style={styles.partnerPhone}>{order.delivery.partner.phone}</Text>
                </View>
                {isOutForDelivery && order.delivery.partner.phone && (
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => callPartner(order.delivery.partner.phone)}
                  >
                    <Ionicons name="call" size={rs(18)} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* Tracking Stepper */}
        <View style={[styles.card, shadows.small]}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          {steps.map((step, index) => (
            <View key={step.key} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                {/* Pulse ring behind active dot */}
                {step.active && (
                  <Animated.View
                    style={[styles.stepPulseRing, { transform: [{ scale: pulseAnim }] }]}
                  />
                )}
                <View style={[
                  styles.stepDot,
                  step.completed && styles.stepDotCompleted,
                  step.active && styles.stepDotActive,
                ]}>
                  {step.completed
                    ? <Ionicons name="checkmark" size={rs(14)} color="#fff" />
                    : step.active
                      ? <View style={styles.stepDotInner} />
                      : null
                  }
                </View>
                {index < steps.length - 1 && (
                  <View style={[styles.stepLine, step.completed && styles.stepLineCompleted]} />
                )}
              </View>
              <View style={styles.stepContent}>
                <Text style={[
                  styles.stepLabel,
                  step.completed && styles.stepLabelCompleted,
                  step.active && styles.stepLabelActive,
                  step.pending && styles.stepLabelPending,
                ]}>
                  {step.emoji} {step.label}
                </Text>
                {step.active && (
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                )}
                {step.timestamp && (
                  <Text style={styles.stepTime}>
                    {new Date(step.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Order Items */}
        <View style={[styles.card, shadows.small]}>
          <Text style={styles.sectionTitle}>Items Ordered</Text>
          {order.items?.map((item, i) => (
            <View key={i} style={[styles.orderItem, i < order.items.length - 1 && styles.orderItemBorder]}>
              <View style={styles.orderItemLeft}>
                <View style={styles.vegDotWrap}>
                  <View style={[styles.vegDot, { backgroundColor: colors.tagVeg }]} />
                </View>
                <Text style={styles.itemName}>{item.name || (typeof item.menuItem === 'object' ? item.menuItem?.name : null) || 'Item'}</Text>
              </View>
              <View style={styles.orderItemRight}>
                <View style={styles.qtyBadge}>
                  <Text style={styles.itemQty}>×{item.quantity}</Text>
                </View>
                <Text style={styles.itemTotal}>₹{item.quantity * item.price}</Text>
              </View>
            </View>
          ))}
          {/* Pricing summary */}
          {(order.pricing?.deliveryFee != null || order.pricing?.discount != null) && (
            <>
              <View style={styles.pricingDivider} />
              {order.pricing?.deliveryFee != null && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Delivery Fee</Text>
                  <Text style={styles.pricingValue}>
                    {order.pricing.deliveryFee === 0 ? 'FREE' : `₹${order.pricing.deliveryFee}`}
                  </Text>
                </View>
              )}
              {order.pricing?.discount > 0 && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Discount</Text>
                  <Text style={[styles.pricingValue, { color: colors.success }]}>−₹{order.pricing.discount}</Text>
                </View>
              )}
              <View style={[styles.pricingRow, styles.pricingTotalRow]}>
                <Text style={styles.pricingTotalLabel}>Total Paid</Text>
                <Text style={styles.pricingTotalValue}>₹{order.pricing?.total ?? order.totalAmount}</Text>
              </View>
            </>
          )}
        </View>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <View style={[styles.card, shadows.small]}>
            <View style={styles.addressHeader}>
              <View style={styles.addressIconWrap}>
                <Ionicons name="location" size={rs(18)} color={colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
            </View>
            <Text style={styles.addressText}>{order.deliveryAddress}</Text>
          </View>
        )}

        <View style={{ height: vs(24) }} />
      </ScrollView>

      {/* Auto Rating Modal */}
      <Modal visible={showRatingModal} transparent animationType="slide" onRequestClose={() => setShowRatingModal(false)}>
        <View style={styles.ratingOverlay}>
          <View style={styles.ratingSheet}>
            <Text style={styles.ratingEmoji}>🎉</Text>
            <Text style={styles.ratingTitle}>Order Delivered!</Text>
            <Text style={styles.ratingSub}>How was your experience?</Text>
            <TouchableOpacity
              style={styles.ratingBtn}
              onPress={() => {
                setShowRatingModal(false);
                navigation.navigate('Review', { orderId: order?._id, items: order?.items });
              }}
            >
              <Ionicons name="star" size={rs(16)} color="#fff" />
              <Text style={styles.ratingBtnText}>Rate Your Order</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowRatingModal(false)} style={styles.ratingSkip}>
              <Text style={styles.ratingSkipText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: rs(24) },
  loadingText: { marginTop: vs(12), fontSize: ms(14), color: colors.textSecondary },
  errorEmoji: { fontSize: ms(56), marginBottom: vs(12) },
  errorTitle: { fontSize: ms(18), fontWeight: '700', color: colors.text, marginBottom: vs(20) },
  backBtnAlt: {
    backgroundColor: colors.primary,
    paddingHorizontal: rs(24),
    paddingVertical: vs(12),
    borderRadius: borderRadius.full,
  },
  backBtnAltText: { color: '#fff', fontWeight: '700', fontSize: ms(15) },

  header: {
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(16),
    paddingBottom: vs(14),
  },
  backBtn: {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: ms(18), fontWeight: '700', color: '#fff' },

  scrollContent: { padding: rs(16) },

  // ETA Banner
  etaBanner: {
    borderRadius: borderRadius.md,
    padding: rs(20),
    marginBottom: vs(12),
  },
  etaTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: vs(14) },
  etaLeft: { flex: 1 },
  etaMins: { fontSize: ms(30), fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  etaSubtext: { fontSize: ms(13), color: 'rgba(255,255,255,0.85)', marginTop: vs(3) },
  etaEmojiWrap: {
    width: rs(60), height: rs(60), borderRadius: rs(30),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  etaEmoji: { fontSize: ms(32) },
  etaProgress: { flexDirection: 'row', gap: rs(4) },
  etaPill: {
    flex: 1, height: vs(4), borderRadius: rs(4),
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  etaPillDone: { backgroundColor: 'rgba(255,255,255,0.7)' },
  etaPillActive: { backgroundColor: '#fff' },

  // Delivered Banner
  deliveredBanner: {
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.md,
    padding: rs(20),
    marginBottom: vs(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(14),
  },
  deliveredEmoji: { fontSize: ms(36) },
  deliveredTitle: { fontSize: ms(18), fontWeight: '800', color: colors.success },
  deliveredSub: { fontSize: ms(13), color: colors.textSecondary, marginTop: vs(2) },
  reorderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: rs(12), paddingVertical: vs(8),
  },
  reorderBtnText: { color: '#fff', fontSize: ms(12), fontWeight: '800' },

  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: rs(16),
    marginBottom: vs(12),
  },
  mapCard: { padding: 0, overflow: 'hidden' },
  sectionTitle: { fontSize: ms(15), fontWeight: '700', color: colors.text, marginBottom: vs(14) },

  orderIdRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(12) },
  orderIdBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    backgroundColor: colors.primarySurface,
    paddingHorizontal: rs(12), paddingVertical: vs(5),
    borderRadius: borderRadius.full,
  },
  orderIdText: { fontSize: ms(13), fontWeight: '700', color: colors.primary },
  orderDateWrap: { flexDirection: 'row', alignItems: 'center', gap: rs(4) },
  orderDate: { fontSize: ms(12), color: colors.placeholder },
  orderInfoDivider: { height: 1, backgroundColor: colors.divider, marginBottom: vs(12) },
  orderTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTotalLabel: { fontSize: ms(14), color: colors.textSecondary },
  orderTotalValue: { fontSize: ms(18), fontWeight: '800', color: colors.primary },

  map: { width: '100%', height: vs(200) },
  partnerMarker: {
    backgroundColor: '#fff', borderRadius: rs(20), padding: rs(4),
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 3,
  },
  partnerMarkerEmoji: { fontSize: ms(22) },
  partnerRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: rs(14), gap: rs(10),
    borderTopWidth: 1, borderTopColor: colors.divider,
  },
  partnerIconWrap: {
    width: rs(42), height: rs(42), borderRadius: rs(21),
    backgroundColor: colors.primarySurface,
    justifyContent: 'center', alignItems: 'center',
  },
  partnerInfo: { flex: 1 },
  partnerName: { fontSize: ms(14), fontWeight: '700', color: colors.text },
  partnerPhone: { fontSize: ms(12), color: colors.textSecondary, marginTop: vs(2) },
  callBtn: {
    width: rs(42), height: rs(42), borderRadius: rs(21),
    backgroundColor: colors.success,
    justifyContent: 'center', alignItems: 'center',
  },

  // Stepper
  stepRow: { flexDirection: 'row', minHeight: vs(56) },
  stepLeft: { alignItems: 'center', marginRight: rs(16), width: rs(28) },
  stepPulseRing: {
    position: 'absolute',
    width: rs(28), height: rs(28), borderRadius: rs(14),
    backgroundColor: colors.primarySurface,
    top: 0,
  },
  stepDot: {
    width: rs(28), height: rs(28), borderRadius: rs(14),
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 1,
  },
  stepDotCompleted: { backgroundColor: colors.success, borderColor: colors.success },
  stepDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepDotInner: { width: rs(10), height: rs(10), borderRadius: rs(5), backgroundColor: '#fff' },
  stepLine: { width: 2, flex: 1, backgroundColor: colors.border, marginTop: rs(2) },
  stepLineCompleted: { backgroundColor: colors.success },
  stepContent: { flex: 1, paddingTop: vs(4), paddingBottom: vs(14) },
  stepLabel: { fontSize: ms(14), color: colors.placeholder },
  stepLabelCompleted: { color: colors.success, fontWeight: '600' },
  stepLabelActive: { color: colors.primary, fontWeight: '700', fontSize: ms(15) },
  stepLabelPending: { color: colors.placeholder },
  stepDesc: { fontSize: ms(12), color: colors.textSecondary, marginTop: vs(3) },
  stepTime: { fontSize: ms(11), color: colors.placeholder, marginTop: vs(3) },

  orderItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: vs(10) },
  orderItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  orderItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: rs(8) },
  vegDotWrap: {
    width: rs(16), height: rs(16), borderRadius: rs(2),
    borderWidth: 1.5, borderColor: colors.tagVeg,
    justifyContent: 'center', alignItems: 'center',
  },
  vegDot: { width: rs(7), height: rs(7), borderRadius: rs(4) },
  itemName: { fontSize: ms(14), fontWeight: '500', color: colors.text, flex: 1 },
  orderItemRight: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  qtyBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
    paddingHorizontal: rs(8), paddingVertical: vs(2),
    borderWidth: 1, borderColor: colors.divider,
  },
  itemQty: { fontSize: ms(12), color: colors.textSecondary, fontWeight: '600' },
  itemTotal: { fontSize: ms(14), fontWeight: '700', color: colors.text, minWidth: rs(50), textAlign: 'right' },

  pricingDivider: { height: 1, backgroundColor: colors.divider, marginVertical: vs(10) },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: vs(4) },
  pricingLabel: { fontSize: ms(13), color: colors.textSecondary },
  pricingValue: { fontSize: ms(13), fontWeight: '600', color: colors.text },
  pricingTotalRow: { marginTop: vs(4) },
  pricingTotalLabel: { fontSize: ms(14), fontWeight: '700', color: colors.text },
  pricingTotalValue: { fontSize: ms(15), fontWeight: '900', color: colors.primary },

  addressHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginBottom: vs(10) },
  addressIconWrap: {
    width: rs(36), height: rs(36), borderRadius: rs(10),
    backgroundColor: colors.primarySurface,
    justifyContent: 'center', alignItems: 'center',
  },
  addressText: { fontSize: ms(14), color: colors.text, lineHeight: ms(22) },

  // Rating Modal
  ratingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  ratingSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: rs(28), borderTopRightRadius: rs(28),
    padding: rs(28), alignItems: 'center', paddingBottom: vs(40),
  },
  ratingEmoji: { fontSize: ms(52), marginBottom: vs(10) },
  ratingTitle: { fontSize: ms(22), fontWeight: '900', color: colors.text, marginBottom: vs(6) },
  ratingSub: { fontSize: ms(14), color: colors.placeholder, marginBottom: vs(24) },
  ratingBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    backgroundColor: colors.primary, borderRadius: borderRadius.sm,
    paddingVertical: vs(14), paddingHorizontal: rs(36), marginBottom: vs(12),
  },
  ratingBtnText: { color: '#fff', fontSize: ms(15), fontWeight: '800' },
  ratingSkip: { paddingVertical: vs(8) },
  ratingSkipText: { fontSize: ms(14), color: colors.placeholder, fontWeight: '600' },
});
