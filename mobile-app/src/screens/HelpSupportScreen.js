import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';

const FAQS = [
  { q: 'How do I track my order?', a: 'Go to Orders tab → tap your active order → you will see live tracking on the map.' },
  { q: 'Can I cancel my order?', a: 'You can cancel within 2 minutes of placing the order. Go to Orders → tap the order → Cancel Order.' },
  { q: 'How does the wallet work?', a: 'Add money to your wallet and use it at checkout. Referral rewards and refunds are also credited to your wallet.' },
  { q: 'What if I received a wrong item?', a: 'Contact us within 30 minutes of delivery via the chat or call option below. We will arrange a replacement or refund.' },
  { q: 'How do I apply a promo code?', a: 'At checkout, tap "Apply Promo Code" and enter your code. Valid codes will be applied automatically.' },
  { q: 'How do referrals work?', a: 'Share your referral code from the Profile → Refer & Earn section. When a friend signs up using your code, both of you get ₹75 in your wallets.' },
  { q: 'What are the delivery charges?', a: 'Delivery charges depend on your distance from the restaurant. Orders above ₹299 get free delivery.' },
];

const CONTACT = [
  { icon: 'call-outline', label: 'Call Us', sub: '+91 98765 43210', action: () => Linking.openURL('tel:+919876543210') },
  { icon: 'mail-outline', label: 'Email Support', sub: 'support@fooddelivery.in', action: () => Linking.openURL('mailto:support@fooddelivery.in') },
  { icon: 'logo-whatsapp', label: 'WhatsApp', sub: 'Chat with us', action: () => Linking.openURL('https://wa.me/919876543210') },
];

function FAQItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity style={styles.faqItem} onPress={() => setOpen(o => !o)} activeOpacity={0.75}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQ}>{item.q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={rs(18)} color={colors.placeholder} />
      </View>
      {open && <Text style={styles.faqA}>{item.a}</Text>}
    </TouchableOpacity>
  );
}

export default function HelpSupportScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={[styles.header, { paddingTop: insets.top + vs(12) }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: rs(30) }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.heroCard, shadows.medium]}>
          <Ionicons name="headset-outline" size={rs(40)} color={colors.primary} />
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>We're here 24/7 to assist you</Text>
        </View>

        {/* Contact options */}
        <Text style={styles.sectionLabel}>Contact Us</Text>
        <View style={[styles.card, shadows.small]}>
          {CONTACT.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.contactRow, i < CONTACT.length - 1 && styles.contactDivider]}
              onPress={item.action}
              activeOpacity={0.7}
            >
              <View style={styles.contactIcon}>
                <Ionicons name={item.icon} size={rs(20)} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactLabel}>{item.label}</Text>
                <Text style={styles.contactSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={rs(16)} color={colors.placeholder} />
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ */}
        <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>
        <View style={[styles.card, shadows.small]}>
          {FAQS.map((item, i) => (
            <View key={i}>
              <FAQItem item={item} />
              {i < FAQS.length - 1 && <View style={styles.faqDivider} />}
            </View>
          ))}
        </View>

        {/* Policies */}
        <Text style={styles.sectionLabel}>Policies</Text>
        <View style={[styles.card, shadows.small]}>
          {[
            { label: 'Terms & Conditions', screen: 'TermsConditions' },
            { label: 'Refund Policy', screen: 'RefundPolicy' },
            { label: 'Shipping Policy', screen: 'ShippingPolicy' },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={i}
              style={[styles.policyRow, i < arr.length - 1 && styles.contactDivider]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text-outline" size={rs(18)} color={colors.primary} />
              <Text style={styles.policyLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={rs(16)} color={colors.placeholder} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: rs(16), paddingBottom: vs(16),
  },
  backBtn: { padding: rs(4) },
  headerTitle: { fontSize: ms(18), fontWeight: '700', color: '#fff' },

  content: { padding: rs(16), gap: vs(14), paddingBottom: vs(40) },

  heroCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: rs(24), alignItems: 'center', gap: vs(6),
  },
  heroTitle: { fontSize: ms(18), fontWeight: '800', color: colors.text },
  heroSub: { fontSize: ms(13), color: colors.textSecondary },

  sectionLabel: { fontSize: ms(13), fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5 },

  card: { backgroundColor: colors.surface, borderRadius: borderRadius.md, overflow: 'hidden' },

  contactRow: { flexDirection: 'row', alignItems: 'center', padding: rs(14), gap: rs(12) },
  contactDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  contactIcon: {
    width: rs(40), height: rs(40), borderRadius: rs(12),
    backgroundColor: colors.primarySurface, justifyContent: 'center', alignItems: 'center',
  },
  contactLabel: { fontSize: ms(14), fontWeight: '600', color: colors.text },
  contactSub: { fontSize: ms(12), color: colors.textSecondary, marginTop: vs(1) },

  faqItem: { padding: rs(14) },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: rs(8) },
  faqQ: { flex: 1, fontSize: ms(14), fontWeight: '600', color: colors.text, lineHeight: ms(20) },
  faqA: { fontSize: ms(13), color: colors.textSecondary, lineHeight: ms(20), marginTop: vs(8) },
  faqDivider: { height: 1, backgroundColor: colors.divider, marginHorizontal: rs(14) },

  policyRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    padding: rs(14),
  },
  policyLabel: { flex: 1, fontSize: ms(14), fontWeight: '500', color: colors.text },
});
