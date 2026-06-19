import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showMessage } from 'react-native-flash-message';
import { deliveryAPI } from '../services/api';
import { colors } from '../utils/theme';
import { STATUS_NEXT, STATUS_LABELS } from '../utils/constants';

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data } = await deliveryAPI.getAssignedOrders();
      const found = data.find((o) => o._id === orderId);
      setOrder(found || null);
    } catch {
      showMessage({ message: 'Failed to load order', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order) return;
    const currentStatus = order.status?.current;
    const nextStatus = STATUS_NEXT[currentStatus];
    if (!nextStatus) return;

    setUpdating(true);
    try {
      const { data } = await deliveryAPI.updateOrderStatus(order._id, nextStatus);
      setOrder(data);
      showMessage({ message: `Status updated to ${nextStatus.replace(/_/g, ' ')}`, type: 'success' });
      if (nextStatus === 'delivered') navigation.goBack();
    } catch {
      showMessage({ message: 'Failed to update status', type: 'danger' });
    } finally {
      setUpdating(false);
    }
  };

  const callCustomer = () => {
    const phone = order?.delivery?.phone || order?.customer?.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const openMaps = () => {
    const addr = order?.delivery?.address;
    if (!addr) return;
    const query = encodeURIComponent(`${addr.street}, ${addr.city}`);
    Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Order not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStatus = order.status?.current;
  const nextStatus = STATUS_NEXT[currentStatus];
  const addr = order.delivery?.address;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.orderNumber}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.addressText}>{addr?.street || 'N/A'}</Text>
              {addr?.landmark ? <Text style={styles.addressSub}>{addr.landmark}</Text> : null}
              <Text style={styles.addressSub}>{addr?.city} {addr?.pincode}</Text>
            </View>
            <TouchableOpacity style={styles.mapBtn} onPress={openMaps}>
              <Ionicons name="navigate" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          {order.delivery?.instructions ? (
            <Text style={styles.instructions}>📝 {order.delivery.instructions}</Text>
          ) : null}
        </View>

        {/* Customer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.customerRow}>
            <Ionicons name="person-circle-outline" size={36} color={colors.primary} />
            <Text style={styles.customerName}>{order.customer?.name || 'Customer'}</Text>
            <TouchableOpacity style={styles.callBtn} onPress={callCustomer}>
              <Ionicons name="call" size={16} color="#fff" />
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({order.items?.length})</Text>
          {order.items?.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
              <Text style={styles.itemName} numberOfLines={1}>{item.name || item.menuItem?.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={[styles.itemName, { fontWeight: '700' }]}>Total</Text>
            <Text style={[styles.itemPrice, { color: colors.primary, fontWeight: '800' }]}>
              ₹{order.pricing?.total}
            </Text>
          </View>
          <View style={[styles.itemRow, { marginTop: 4 }]}>
            <Text style={styles.payLabel}>
              Payment: {order.payment?.method?.toUpperCase()}
            </Text>
            <View style={[
              styles.payBadge,
              { backgroundColor: order.payment?.method === 'cash' ? '#FFF3E0' : '#E8F5E9' }
            ]}>
              <Text style={[
                styles.payBadgeText,
                { color: order.payment?.method === 'cash' ? colors.warning : colors.success }
              ]}>
                {order.payment?.method === 'cash' ? 'Collect Cash' : 'Paid Online'}
              </Text>
            </View>
          </View>
        </View>

        {/* Status History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Timeline</Text>
          {order.status?.history?.slice().reverse().map((h, i) => (
            <View key={i} style={styles.historyRow}>
              <View style={[styles.dot, i === 0 && styles.dotActive]} />
              <View>
                <Text style={styles.historyStatus}>{h.status?.replace(/_/g, ' ')}</Text>
                {h.note ? <Text style={styles.historyNote}>{h.note}</Text> : null}
                <Text style={styles.historyTime}>
                  {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Action Button */}
      {nextStatus && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.actionBtn, updating && styles.btnDisabled]}
            onPress={handleStatusUpdate}
            disabled={updating}
          >
            {updating
              ? <ActivityIndicator color="#fff" />
              : (
                <>
                  <Ionicons
                    name={nextStatus === 'delivered' ? 'checkmark-circle' : 'arrow-forward-circle'}
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.actionBtnText}>{STATUS_LABELS[currentStatus]}</Text>
                </>
              )
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  notFound: { fontSize: 16, color: colors.textSecondary },
  back: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  content: { padding: 16, gap: 12, paddingBottom: 100 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  addressText: { fontSize: 15, fontWeight: '600', color: colors.text },
  addressSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  mapBtn: { backgroundColor: colors.primary, padding: 10, borderRadius: 10 },
  instructions: { fontSize: 13, color: colors.textSecondary, backgroundColor: '#FFFDE7', padding: 10, borderRadius: 8 },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  customerName: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  callBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemQty: { fontSize: 13, color: colors.textSecondary, width: 28 },
  itemName: { flex: 1, fontSize: 14, color: colors.text },
  itemPrice: { fontSize: 14, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 4 },
  payLabel: { flex: 1, fontSize: 13, color: colors.textSecondary },
  payBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  payBadgeText: { fontSize: 11, fontWeight: '700' },
  historyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border, marginTop: 4 },
  dotActive: { backgroundColor: colors.primary },
  historyStatus: { fontSize: 13, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
  historyNote: { fontSize: 12, color: colors.textSecondary },
  historyTime: { fontSize: 11, color: colors.textSecondary },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    padding: 16,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnDisabled: { opacity: 0.6 },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
