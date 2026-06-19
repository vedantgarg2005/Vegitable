import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deliveryAPI } from '../services/api';
import { colors } from '../utils/theme';

function StatCard({ icon, label, value, color }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.iconBox, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const { data } = await deliveryAPI.getPerformance();
      setStats(data);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} colors={[colors.primary]} />
      }
    >
      <Text style={styles.heading}>My Earnings</Text>

      {/* Today summary */}
      <View style={styles.todayCard}>
        <Text style={styles.todayLabel}>Today's Earnings</Text>
        <Text style={styles.todayAmount}>₹{stats?.todayEarnings ?? 0}</Text>
        <Text style={styles.todaySub}>{stats?.todayDeliveries ?? 0} deliveries today</Text>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="bicycle"
          label="Total Deliveries"
          value={stats?.totalDeliveries ?? 0}
          color={colors.primary}
        />
        <StatCard
          icon="cash"
          label="Total Earned"
          value={`₹${stats?.totalEarnings ?? 0}`}
          color={colors.success}
        />
        <StatCard
          icon="star"
          label="Avg Rating"
          value={stats?.rating ? stats.rating.toFixed(1) : 'N/A'}
          color="#F59E0B"
        />
        <StatCard
          icon="checkmark-circle"
          label="Acceptance"
          value={`${stats?.acceptanceRate ?? 0}%`}
          color={colors.primaryLight}
        />
      </View>

      {/* Per delivery rate note */}
      <View style={styles.rateCard}>
        <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
        <Text style={styles.rateText}>You earn ₹50 per successful delivery</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '800', color: colors.text },
  todayCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  todayLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  todayAmount: { fontSize: 40, fontWeight: '900', color: '#fff' },
  todaySub: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
  },
  iconBox: { padding: 10, borderRadius: 12 },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  rateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primarySurface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rateText: { fontSize: 13, color: colors.primary, fontWeight: '600', flex: 1 },
});
