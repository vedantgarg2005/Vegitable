import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { orderAPI } from '../services/api';
import { getSocket } from '../services/socket';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';
import { ORDER_STATUS } from '../utils/constants';

const STATUS_STEPS = [
  { key: ORDER_STATUS?.PLACED || 'placed', label: 'Order Placed', emoji: '📋' },
  { key: ORDER_STATUS?.CONFIRMED || 'confirmed', label: 'Confirmed', emoji: '✅' },
  { key: ORDER_STATUS?.PREPARING || 'preparing', label: 'Preparing', emoji: '👨‍🍳' },
  { key: ORDER_STATUS?.READY || 'ready', label: 'Ready', emoji: '📦' },
  { key: ORDER_STATUS?.OUT_FOR_DELIVERY || 'out_for_delivery', label: 'Out for Delivery', emoji: '🚴' },
  { key: ORDER_STATUS?.DELIVERED || 'delivered', label: 'Delivered', emoji: '🎉' },
];

export default function OrderTrackingScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [partnerLocation, setPartnerLocation] = useState(null);
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);

  useEffect(() => {
    loadOrder();

    const socket = getSocket();
    socket.emit('join-room', orderId);

    socket.on('order-status-update', ({ status }) => {
      setOrder(prev => prev ? { ...prev, status: { ...prev.status, current: status } } : prev);
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
    return STATUS_STEPS.map((step, i) => ({
      ...step,
      completed: i < currentIndex,
      active: i === currentIndex,
      pending: i > currentIndex,
    }));
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
  const isOutForDelivery = order?.status?.current === 'out_for_delivery';
  const customerCoords = order.delivery?.address?.coordinates;

  const mapRegion = partnerLocation
    ? { ...partnerLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : customerCoords
    ? { latitude: customerCoords.lat, longitude: customerCoords.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + vs(8) }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <View style={{ width: rs(40) }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Order Info */}
        <View style={[styles.card, shadows.medium]}>
          <View style={styles.orderIdRow}>
            <View style={styles.orderIdBadge}>
              <Text style={styles.orderIdText}>#{order._id?.slice(-6)?.toUpperCase()}</Text>
            </View>
            <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.orderTotalRow}>
            <Text style={styles.orderTotalLabel}>Order Total</Text>
            <Text style={styles.orderTotalValue}>₹{order.pricing?.total ?? order.totalAmount}</Text>
          </View>
          {activeStep && (
            <View style={styles.statusBanner}>
              <Text style={styles.statusBannerEmoji}>{activeStep.emoji}</Text>
              <Text style={styles.statusBannerText}>{activeStep.label}</Text>
            </View>
          )}
        </View>

        {/* Live Map — shown when out for delivery */}
        {isOutForDelivery && mapRegion && (
          <View style={[styles.card, shadows.small, styles.mapCard]}>
            <Text style={styles.sectionTitle}>Live Location</Text>
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
            {order.delivery?.partner && (
              <View style={styles.partnerRow}>
                <Ionicons name="person-circle-outline" size={rs(36)} color={colors.primary} />
                <View style={styles.partnerInfo}>
                  <Text style={styles.partnerName}>{order.delivery.partner.name}</Text>
                  <Text style={styles.partnerPhone}>{order.delivery.partner.phone}</Text>
                </View>
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
                <Text style={styles.itemName}>{item.name ?? item.menuItem?.name}</Text>
              </View>
              <View style={styles.orderItemRight}>
                <Text style={styles.itemQty}>×{item.quantity}</Text>
                <Text style={styles.itemTotal}>₹{item.quantity * item.price}</Text>
              </View>
            </View>
          ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(16),
    paddingBottom: vs(14),
  },
  backBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: ms(18), fontWeight: '700', color: '#fff' },

  scrollContent: { padding: rs(16) },

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
    backgroundColor: colors.primarySurface,
    paddingHorizontal: rs(12),
    paddingVertical: vs(5),
    borderRadius: borderRadius.full,
  },
  orderIdText: { fontSize: ms(13), fontWeight: '700', color: colors.primary },
  orderDate: { fontSize: ms(12), color: colors.placeholder },
  orderTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(12) },
  orderTotalLabel: { fontSize: ms(14), color: colors.textSecondary },
  orderTotalValue: { fontSize: ms(18), fontWeight: '800', color: colors.primary },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    borderRadius: borderRadius.sm,
    padding: rs(12),
    gap: rs(8),
  },
  statusBannerEmoji: { fontSize: ms(20) },
  statusBannerText: { fontSize: ms(14), fontWeight: '700', color: colors.primary },

  map: { width: '100%', height: vs(200) },
  partnerMarker: {
    backgroundColor: '#fff',
    borderRadius: rs(20),
    padding: rs(4),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  partnerMarkerEmoji: { fontSize: ms(22) },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: rs(12),
    gap: rs(10),
  },
  partnerInfo: { flex: 1 },
  partnerName: { fontSize: ms(14), fontWeight: '700', color: colors.text },
  partnerPhone: { fontSize: ms(13), color: colors.textSecondary },

  stepRow: { flexDirection: 'row', minHeight: vs(52) },
  stepLeft: { alignItems: 'center', marginRight: rs(16), width: rs(28) },
  stepDot: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(14),
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotCompleted: { backgroundColor: colors.success, borderColor: colors.success },
  stepDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepDotInner: { width: rs(10), height: rs(10), borderRadius: rs(5), backgroundColor: '#fff' },
  stepLine: { width: 2, flex: 1, backgroundColor: colors.border, marginTop: rs(2) },
  stepLineCompleted: { backgroundColor: colors.success },
  stepContent: { flex: 1, paddingTop: vs(4), paddingBottom: vs(12) },
  stepLabel: { fontSize: ms(14), color: colors.placeholder },
  stepLabelCompleted: { color: colors.success, fontWeight: '500' },
  stepLabelActive: { color: colors.primary, fontWeight: '700' },
  stepLabelPending: { color: colors.placeholder },

  orderItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: vs(10) },
  orderItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  orderItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: rs(8) },
  vegDotWrap: {
    width: rs(16),
    height: rs(16),
    borderRadius: rs(2),
    borderWidth: 1.5,
    borderColor: colors.tagVeg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegDot: { width: rs(7), height: rs(7), borderRadius: rs(4) },
  itemName: { fontSize: ms(14), fontWeight: '500', color: colors.text, flex: 1 },
  orderItemRight: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  itemQty: { fontSize: ms(13), color: colors.placeholder },
  itemTotal: { fontSize: ms(14), fontWeight: '700', color: colors.text },

  addressHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginBottom: vs(10) },
  addressIconWrap: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(10),
    backgroundColor: colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressText: { fontSize: ms(14), color: colors.text, lineHeight: ms(22) },
});
