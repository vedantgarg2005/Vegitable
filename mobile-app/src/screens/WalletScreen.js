import React from 'react';
import { View, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallet } from '../context/WalletContext';
import { colors, spacing, shadows, borderRadius, ms, rs, vs } from '../utils/theme';

export default function WalletScreen() {
  const { balance, transactions, loading } = useWallet();
  const insets = useSafeAreaInsets();

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header + Balance */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + vs(12) }]}
      >
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={styles.balanceWrap}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Transactions */}
        <View style={[styles.card, shadows.small]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="receipt-outline" size={rs(18)} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Recent Transactions</Text>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💳</Text>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtitle}>Your transaction history will appear here</Text>
            </View>
          ) : (
            transactions.map((txn, i) => {
              const isCredit = txn.type === 'credit';
              return (
                <View
                  key={i}
                  style={[styles.txnItem, i < transactions.length - 1 && styles.txnItemBorder]}
                >
                  <View style={[styles.txnIconWrap, { backgroundColor: isCredit ? colors.successLight : colors.errorLight }]}>
                    <Ionicons
                      name={isCredit ? 'arrow-down-outline' : 'arrow-up-outline'}
                      size={rs(18)}
                      color={isCredit ? colors.success : colors.error}
                    />
                  </View>
                  <View style={styles.txnInfo}>
                    <Text style={styles.txnType}>{isCredit ? 'Refund' : 'Payment'}</Text>
                    <Text style={styles.txnDate}>{formatDate(txn.createdAt)}</Text>
                  </View>
                  <Text style={[styles.txnAmount, { color: isCredit ? colors.success : colors.error }]}>
                    {isCredit ? '+' : '-'}₹{txn.amount.toFixed(2)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: vs(24) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: vs(28),
    borderBottomLeftRadius: rs(28),
    borderBottomRightRadius: rs(28),
    alignItems: 'center',
  },
  headerTitle: { fontSize: ms(22), fontWeight: '800', color: '#fff', letterSpacing: -0.3, marginBottom: vs(16) },
  balanceWrap: { alignItems: 'center' },
  balanceLabel: { fontSize: ms(13), color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: vs(4) },
  balanceAmount: { fontSize: ms(40), fontWeight: '800', color: '#fff', letterSpacing: -1 },

  scrollContent: { padding: spacing.md },

  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: rs(16),
    marginBottom: vs(12),
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginBottom: vs(16) },
  cardIconWrap: {
    width: rs(36), height: rs(36), borderRadius: rs(10),
    backgroundColor: colors.primarySurface,
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: { fontSize: ms(15), fontWeight: '700', color: colors.text },

  txnItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: vs(12), gap: rs(12) },
  txnItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  txnIconWrap: {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    justifyContent: 'center', alignItems: 'center',
  },
  txnInfo: { flex: 1 },
  txnType: { fontSize: ms(14), fontWeight: '600', color: colors.text, marginBottom: vs(2) },
  txnDate: { fontSize: ms(12), color: colors.placeholder },
  txnAmount: { fontSize: ms(15), fontWeight: '800' },

  emptyContainer: { alignItems: 'center', paddingVertical: vs(32) },
  emptyEmoji: { fontSize: ms(40), marginBottom: vs(10) },
  emptyTitle: { fontSize: ms(15), fontWeight: '700', color: colors.text, marginBottom: vs(4) },
  emptySubtitle: { fontSize: ms(13), color: colors.placeholder, textAlign: 'center' },
});
