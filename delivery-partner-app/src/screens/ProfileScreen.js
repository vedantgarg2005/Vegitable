import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../services/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const fields = [
    { label: 'Name', value: user?.name },
    { label: 'Email', value: user?.email },
    { label: 'Phone', value: user?.phone },
    { label: 'Role', value: user?.role?.replace(/_/g, ' ') },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user?.name?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
      <Text style={styles.name}>{user?.name}</Text>

      <View style={styles.section}>
        {fields.map(({ label, value }) => (
          <View key={label} style={styles.row}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <Text style={styles.fieldValue}>{value || '—'}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#FF6B35',
    alignSelf: 'center', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#333', marginBottom: 24 },
  section: {
    backgroundColor: '#fff', borderRadius: 10, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, marginBottom: 24,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  fieldLabel: { color: '#666', fontSize: 15 },
  fieldValue: { color: '#333', fontSize: 15, fontWeight: '500' },
  logoutBtn: {
    backgroundColor: '#FF3B30', padding: 15, borderRadius: 10, alignItems: 'center',
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
