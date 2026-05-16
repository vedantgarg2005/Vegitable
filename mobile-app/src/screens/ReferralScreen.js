import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { colors, shadows, borderRadius } from '../utils/theme';

export default function ReferralScreen({ navigation }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authAPI.getProfile()
      .then((r) => setProfile(r.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const referralCode = profile?.myReferralCode || user?.myReferralCode || '—';
  const referralCount = profile?.referralCount ?? 0;
  const walletBalance = profile?.wallet?.balance ?? user?.wallet?.balance ?? 0;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🍔 Order delicious food on FoodDelivery! Use my referral code *${referralCode}* and we both get ₹75 off on our next order. Download now!`,
      });
    } catch (e) {
      Alert.alert('Error', 'Could not share referral code');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Ionicons name="gift" size={48} color="#fff" style={{ marginBottom: 12 }} />
        <Text style={styles.headerTitle}>Refer & Earn</Text>
        <Text style={styles.headerSub}>You and your friend both get ₹75 off!</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* How it works */}
        <View style={[styles.card, shadows.small]}>
          <Text style={styles.sectionTitle}>How it works</Text>
          {[
            { icon: 'share-social-outline', text: 'Share your unique referral code with friends' },
            { icon: 'person-add-outline', text: 'Friend signs up using your code' },
            { icon: 'wallet-outline', text: 'Both of you get ₹75 added to your wallet instantly' },
          ].map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepIcon}>
                <Ionicons name={step.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>

        {/* Referral Code */}
        <View style={[styles.card, shadows.small]}>
          <Text style={styles.sectionTitle}>Your Referral Code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.code}>{referralCode}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={copied ? colors.success : colors.primary} />
              <Text style={[styles.copyText, copied && { color: colors.success }]}>{copied ? 'Copied!' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, shadows.small]}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{referralCount}</Text>
            <Text style={styles.statLabel}>Friends Referred</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>₹{referralCount * 75}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>₹{walletBalance}</Text>
            <Text style={styles.statLabel}>Wallet Balance</Text>
          </View>
        </View>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-social" size={20} color="#fff" />
          <Text style={styles.shareBtnText}>Share with Friends</Text>
        </TouchableOpacity>

        <Text style={styles.tnc}>*₹75 reward is credited to wallet upon friend's first successful sign-up. No expiry.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingTop: 56,
    paddingBottom: 36,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: { position: 'absolute', top: 52, left: 16, padding: 4 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 6 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.88)' },

  content: { padding: 16, gap: 14 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },

  step: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stepIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FFF0EB', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  stepText: { flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },

  codeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF0EB', borderRadius: borderRadius.sm, padding: 14,
  },
  code: { fontSize: 22, fontWeight: '800', color: colors.primary, letterSpacing: 2 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  copyText: { fontSize: 13, fontWeight: '600', color: colors.primary },

  statsRow: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: borderRadius.md, paddingVertical: 18,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: colors.primary, marginBottom: 2 },
  statLabel: { fontSize: 11, color: colors.placeholder, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: colors.divider },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 15,
  },
  shareBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  tnc: { fontSize: 11, color: colors.placeholder, textAlign: 'center', paddingBottom: 16 },
});
