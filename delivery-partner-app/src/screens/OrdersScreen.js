import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, RefreshControl,
} from 'react-native';
import { orderService } from '../services/api';

const STATUS_COLORS = {
  picked_up: '#FF6B35',
  out_for_delivery: '#2196F3',
  delivered: '#4CAF50',
};

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      const res = await orderService.getAssignedOrders();
      setOrders(res.data);
    } catch {
      Alert.alert('Error', 'Failed to load orders');
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const updateStatus = async (orderId, status) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      loadOrders();
    } catch {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const renderOrder = ({ item }) => {
    const current = item.status?.current;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
      >
        <View style={styles.row}>
          <Text style={styles.orderNum}>#{item.orderNumber}</Text>
          <Text style={[styles.badge, { backgroundColor: STATUS_COLORS[current] || '#999' }]}>
            {current?.replace(/_/g, ' ')}
          </Text>
        </View>
        <Text style={styles.address}>
          {item.delivery?.address?.street}, {item.delivery?.address?.city}
        </Text>
        <Text style={styles.amount}>₹{item.pricing?.total}</Text>
        <View style={styles.actions}>
          {current === 'assigned' && (
            <TouchableOpacity style={styles.btn} onPress={() => updateStatus(item._id, 'picked_up')}>
              <Text style={styles.btnText}>Picked Up</Text>
            </TouchableOpacity>
          )}
          {current === 'picked_up' && (
            <TouchableOpacity style={styles.btn} onPress={() => updateStatus(item._id, 'out_for_delivery')}>
              <Text style={styles.btnText}>Out for Delivery</Text>
            </TouchableOpacity>
          )}
          {current === 'out_for_delivery' && (
            <TouchableOpacity style={styles.btn} onPress={() => updateStatus(item._id, 'delivered')}>
              <Text style={styles.btnText}>Mark Delivered</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrder}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No assigned orders</Text>}
        contentContainerStyle={orders.length === 0 && styles.emptyContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
  card: {
    backgroundColor: '#fff', borderRadius: 10, padding: 15,
    marginBottom: 12, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderNum: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12,
    fontSize: 12, color: '#fff', overflow: 'hidden',
  },
  address: { color: '#666', marginBottom: 4 },
  amount: { fontWeight: 'bold', color: '#FF6B35', fontSize: 15, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { backgroundColor: '#FF6B35', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  empty: { textAlign: 'center', color: '#999', fontSize: 16 },
});
