import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { fleetService } from '../services/api';

export default function EarningsScreen() {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fleetService.getPerformance()
      .then(res => setPerformance(res.data))
      .catch(() => Alert.alert('Error', 'Failed to load earnings'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  const stats = [
    { label: "Today's Earnings", value: `₹${performance?.todayEarnings ?? 0}` },
    { label: 'Total Earnings', value: `₹${performance?.totalEarnings ?? 0}` },
    { label: "Today's Deliveries", value: performance?.todayDeliveries ?? 0 },
    { label: 'Total Deliveries', value: performance?.totalDeliveries ?? 0 },
    { label: 'Rating', value: (performance?.rating ?? 0).toFixed(1) },
    { label: 'Acceptance Rate', value: `${performance?.acceptanceRate ?? 0}%` },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Earnings Overview</Text>
      <FlatList
        data={stats}
        keyExtractor={(item) => item.label}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        )}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  card: {
    flex: 0.48, backgroundColor: '#fff', padding: 20,
    borderRadius: 10, alignItems: 'center', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  value: { fontSize: 22, fontWeight: 'bold', color: '#FF6B35' },
  label: { fontSize: 13, color: '#666', marginTop: 6, textAlign: 'center' },
});
