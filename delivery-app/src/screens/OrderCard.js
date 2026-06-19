import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

const STATUS_COLOR = {
  confirmed: colors.warning,
  picked_up: colors.primary,
  out_for_delivery: colors.primaryLight,
  delivered: colors.success,
};

const STATUS_LABEL = {
  confirmed: 'Confirmed',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
};

export default function OrderCard({ order, onPress }) {
  const status = order.status?.current;
  const statusColor = STATUS_COLOR[status] || colors.textSecondary;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.row}>
        <Text style={styles.orderNum}>#{order.orderNumber}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>{STATUS_LABEL[status] || status}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.address} numberOfLines={1}>
          {order.delivery?.address?.street || 'Address not set'}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.items}>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</Text>
        <Text style={styles.amount}>₹{order.pricing?.total}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderNum: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  address: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  items: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  amount: { fontSize: 15, fontWeight: '700', color: colors.primary, marginRight: 4 },
});
