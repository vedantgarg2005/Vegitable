import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';
import { orderService, SOCKET_URL } from '../services/api';

const STATUS_FLOW = {
  assigned: { next: 'picked_up', label: 'Mark Picked Up' },
  picked_up: { next: 'out_for_delivery', label: 'Out for Delivery' },
  out_for_delivery: { next: 'delivered', label: 'Mark Delivered' },
};

export default function OrderDetailsScreen({ route }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const socketRef = useRef(null);
  const locationWatchRef = useRef(null);

  useEffect(() => {
    orderService.getOrderDetails(orderId)
      .then(res => setOrder(res.data))
      .catch(() => Alert.alert('Error', 'Failed to load order details'))
      .finally(() => setLoading(false));

    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current.emit('join-room', orderId);

    return () => {
      stopLocationTracking();
      socketRef.current?.disconnect();
    };
  }, [orderId]);

  useEffect(() => {
    if (order?.status?.current === 'out_for_delivery') {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
  }, [order?.status?.current]);

  const startLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required for delivery tracking.');
      return;
    }

    locationWatchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
      (loc) => {
        socketRef.current?.emit('partner_location', {
          orderId,
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        });
      }
    );
  };

  const stopLocationTracking = () => {
    locationWatchRef.current?.remove();
    locationWatchRef.current = null;
  };

  const handleStatusUpdate = async () => {
    const current = order?.status?.current;
    const next = STATUS_FLOW[current]?.next;
    if (!next) return;

    setUpdating(true);
    try {
      const res = await orderService.updateOrderStatus(orderId, next);
      setOrder(res.data);
    } catch {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const current = order.status?.current;
  const nextAction = STATUS_FLOW[current];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.orderNum}>Order #{order.orderNumber}</Text>
        <Text style={styles.status}>{current?.replace(/_/g, ' ')}</Text>
        {current === 'out_for_delivery' && (
          <Text style={styles.trackingBadge}>📡 Broadcasting live location</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Customer</Text>
        <Text style={styles.text}>{order.customer?.name}</Text>
        <Text style={styles.text}>{order.customer?.phone}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <Text style={styles.text}>{order.delivery?.address?.street}</Text>
        {order.delivery?.address?.landmark && (
          <Text style={styles.subText}>Near: {order.delivery.address.landmark}</Text>
        )}
        <Text style={styles.text}>{order.delivery?.address?.city} - {order.delivery?.address?.pincode}</Text>
        {order.delivery?.instructions && (
          <Text style={styles.subText}>Note: {order.delivery.instructions}</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items?.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.text}>{item.menuItem?.name} × {item.quantity}</Text>
            <Text style={styles.text}>₹{item.price * item.quantity}</Text>
          </View>
        ))}
        <View style={[styles.itemRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{order.pricing?.total}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <Text style={styles.text}>Method: {order.payment?.method?.toUpperCase()}</Text>
        <Text style={styles.text}>Status: {order.payment?.status}</Text>
      </View>

      {nextAction && (
        <TouchableOpacity
          style={[styles.actionBtn, updating && styles.disabled]}
          onPress={handleStatusUpdate}
          disabled={updating}
        >
          <Text style={styles.actionBtnText}>
            {updating ? 'Updating...' : nextAction.label}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#999', fontSize: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 10, padding: 15,
    marginBottom: 12, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  orderNum: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  status: {
    marginTop: 4, fontSize: 14, color: '#FF6B35',
    fontWeight: '600', textTransform: 'capitalize',
  },
  trackingBadge: { marginTop: 8, fontSize: 13, color: '#2e7d32', fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  text: { fontSize: 14, color: '#444', marginBottom: 2 },
  subText: { fontSize: 13, color: '#888', marginBottom: 2 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#eee', marginTop: 8, paddingTop: 8 },
  totalLabel: { fontWeight: 'bold', fontSize: 15, color: '#333' },
  totalValue: { fontWeight: 'bold', fontSize: 15, color: '#FF6B35' },
  actionBtn: {
    backgroundColor: '#FF6B35', padding: 16, borderRadius: 10,
    alignItems: 'center', marginBottom: 30,
  },
  disabled: { opacity: 0.6 },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
