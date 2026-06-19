import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Switch, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { showMessage } from 'react-native-flash-message';
import { deliveryAPI } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/theme';
import OrderCard from './OrderCard';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [online, setOnline] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await deliveryAPI.getAssignedOrders();
      setOrders(data);
    } catch {
      // silently fail on refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const socket = getSocket(user?._id);
    socket.on('new-assignment', (order) => {
      showMessage({ message: `New order assigned: #${order.orderNumber}`, type: 'success' });
      setOrders((prev) => [order, ...prev]);
    });
    socket.on('order-status-update', ({ orderId, status }) => {
      if (status === 'delivered') {
        setOrders((prev) => prev.filter((o) => o._id !== orderId));
      }
    });

    return () => {
      socket.off('new-assignment');
      socket.off('order-status-update');
    };
  }, [user]);

  const toggleOnline = async (val) => {
    try {
      if (val) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          showMessage({ message: 'Location permission required to go online', type: 'danger' });
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        await deliveryAPI.updateLocation(loc.coords.latitude, loc.coords.longitude);
      }
      await deliveryAPI.updateStatus(val ? 'available' : 'offline');
      setOnline(val);
      showMessage({ message: val ? 'You are now Online' : 'You are now Offline', type: val ? 'success' : 'info' });
    } catch {
      showMessage({ message: 'Failed to update status', type: 'danger' });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subGreeting}>{online ? 'You are Online' : 'You are Offline'}</Text>
        </View>
        <View style={styles.headerRight}>
          <Switch
            value={online}
            onValueChange={toggleOnline}
            trackColor={{ false: '#ccc', true: colors.primaryLight }}
            thumbColor={online ? colors.primary : '#f4f3f4'}
          />
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status banner */}
      <View style={[styles.statusBanner, { backgroundColor: online ? colors.primarySurface : '#F3F3F3' }]}>
        <Ionicons
          name={online ? 'radio-button-on' : 'radio-button-off'}
          size={14}
          color={online ? colors.primary : '#999'}
        />
        <Text style={[styles.statusText, { color: online ? colors.primary : '#999' }]}>
          {online ? `${orders.length} active order${orders.length !== 1 ? 's' : ''}` : 'Go online to receive orders'}
        </Text>
      </View>

      {/* Orders */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bicycle-outline" size={60} color={colors.border} />
              <Text style={styles.emptyText}>No active orders</Text>
            </View>
          }
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.primaryDark,
  },
  greeting: { fontSize: 18, fontWeight: '700', color: '#fff' },
  subGreeting: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoutBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8 },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  statusText: { fontSize: 13, fontWeight: '600' },
  list: { padding: 16, gap: 12 },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
});
