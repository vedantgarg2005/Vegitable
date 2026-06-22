import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, KeyboardAvoidingView, Platform, Linking,
  StatusBar, ScrollView, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';

// ─── Data ────────────────────────────────────────────────────────────────────

const TABS = ['Chat', 'FAQ'];

const FAQ = [
  {
    category: '📦 Orders',
    items: [
      { q: 'How do I track my order?', a: 'Go to the Orders tab → tap your active order → you\'ll see live tracking on the map with real-time updates.' },
      { q: 'Can I cancel my order?', a: 'You can cancel within 2 minutes of placing. Go to Orders → tap the order → Cancel Order. After that, please contact support.' },
      { q: 'What if I received a wrong item?', a: 'We\'re sorry! Contact us within 30 minutes of delivery with a photo. We\'ll arrange a replacement or full refund instantly.' },
      { q: 'Can I modify my order after placing?', a: 'Orders can be modified within 1 minute of placing. After that, please cancel and reorder, or contact support.' },
    ],
  },
  {
    category: '🚚 Delivery',
    items: [
      { q: 'What are the delivery charges?', a: 'Orders above ₹299 get FREE delivery. Below that, a small fee of ₹20–₹40 applies depending on distance.' },
      { q: 'What are the delivery timings?', a: 'We deliver from 7 AM to 10 PM every day, including weekends and holidays.' },
      { q: 'Can I schedule a delivery?', a: 'Yes! At checkout, tap "Schedule Delivery" to pick your preferred time slot.' },
    ],
  },
  {
    category: '💰 Payments & Wallet',
    items: [
      { q: 'How does the wallet work?', a: 'Add money to your wallet and use it at checkout. Refunds are also credited to your wallet automatically within 24 hours.' },
      { q: 'How do I apply a promo code?', a: 'At the Cart screen, tap "View All Offers" and apply your code. Valid codes are applied instantly to your bill.' },
      { q: 'Is my payment information secure?', a: 'Yes. We use industry-standard encryption. We never store your card details on our servers.' },
    ],
  },
  {
    category: '👤 Account',
    items: [
      { q: 'How do I change my delivery address?', a: 'Go to Profile → Saved Addresses to add, edit or set a default address.' },
      { q: 'How do I update my profile?', a: 'Go to Profile and tap Edit. You can update your name and contact details.' },
      { q: 'How do I delete my account?', a: 'Go to Profile → Delete Account. This will permanently remove all your data. This action cannot be undone.' },
    ],
  },
];

const QUICK = [
  { label: '📦 Track order', reply: 'Go to the Orders tab → tap your active order → you\'ll see live tracking on the map.' },
  { label: '❌ Cancel order', reply: 'You can cancel within 2 minutes of placing. Go to Orders → tap the order → Cancel Order.' },
  { label: '💰 Wallet help', reply: 'Add money to your wallet and use it at checkout. Refunds are credited automatically within 24 hours.' },
  { label: '🔄 Wrong item', reply: 'So sorry! Contact us within 30 minutes of delivery with a photo. We\'ll arrange a replacement or full refund.' },
  { label: '🎟️ Promo code', reply: 'At Cart screen, tap "View All Offers" and apply your code. Valid codes are applied instantly.' },
  { label: '🚚 Delivery charges', reply: 'Orders above ₹299 get FREE delivery. Below that, a small fee of ₹20–₹40 applies based on distance.' },
];

const CONTACT = [
  { icon: 'call', label: 'Call Us', sub: '+91 98765 43210', color: '#1A4D2E', bg: '#E8F5E9', action: () => Linking.openURL('tel:+919876543210') },
  { icon: 'logo-whatsapp', label: 'WhatsApp', sub: 'Chat with us', color: '#25D366', bg: '#E8FFF0', action: () => Linking.openURL('https://wa.me/919876543210') },
  { icon: 'mail', label: 'Email Us', sub: 'support@freshbasket.in', color: '#0277BD', bg: '#E1F5FE', action: () => Linking.openURL('mailto:support@freshbasket.in') },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

let msgId = 0;
const mkMsg = (text, fromUser) => ({ id: String(++msgId), text, fromUser, time: new Date() });

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.timing(anim, {
      toValue: open ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    setOpen(!open);
  };

  return (
    <TouchableOpacity style={styles.faqItem} onPress={toggle} activeOpacity={0.7}>
      <View style={styles.faqRow}>
        <Text style={styles.faqQ}>{q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={rs(16)} color={colors.primary} />
      </View>
      {open && <Text style={styles.faqA}>{a}</Text>}
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HelpSupportScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const [activeTab, setActiveTab] = useState(0);
  const [messages, setMessages] = useState([
    mkMsg('👋 Hi! I\'m your FreshBasket support assistant.\n\nHow can I help you today? Tap a quick option or type your question below.', false),
  ]);
  const [input, setInput] = useState('');
  const [showQuick, setShowQuick] = useState(true);
  const [typing, setTyping] = useState(false);

  const addMsg = (text, fromUser) => {
    setMessages(prev => [...prev, mkMsg(text, fromUser)]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const send = (text) => {
    if (!text.trim()) return;
    addMsg(text, true);
    setInput('');
    setShowQuick(false);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      addMsg('Thanks for reaching out! Our support team will get back to you shortly.\n\nFor urgent help, use the contact options in the FAQ tab.', false);
    }, 1200);
  };

  const pickQuick = (item) => {
    addMsg(item.label, true);
    setShowQuick(false);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      addMsg(item.reply, false);
    }, 800);
  };

  const renderMsg = ({ item }) => (
    <View style={[styles.msgRow, item.fromUser && styles.msgRowUser]}>
      {!item.fromUser && (
        <LinearGradient colors={[colors.primarySurface, '#C8E6C9']} style={styles.botAvatar}>
          <Text style={{ fontSize: ms(14) }}>🌿</Text>
        </LinearGradient>
      )}
      <View style={[styles.bubble, item.fromUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.bubbleText, item.fromUser && styles.bubbleTextUser]}>{item.text}</Text>
        <Text style={[styles.bubbleTime, item.fromUser && styles.bubbleTimeUser]}>
          {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Header */}
      <LinearGradient
        colors={[colors.primaryDark, colors.primary, colors.primaryLight]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + vs(12) }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs(22)} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Typically replies instantly</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={i === 0 ? 'chatbubble-ellipses-outline' : 'help-circle-outline'}
              size={rs(16)}
              color={activeTab === i ? colors.primary : colors.placeholder}
            />
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Chat Tab ── */}
      {activeTab === 0 && (
        <>
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderMsg}
            keyExtractor={m => m.id}
            contentContainerStyle={styles.msgList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={
              <>
                {typing && (
                  <View style={styles.msgRow}>
                    <LinearGradient colors={[colors.primarySurface, '#C8E6C9']} style={styles.botAvatar}>
                      <Text style={{ fontSize: ms(14) }}>🌿</Text>
                    </LinearGradient>
                    <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
                      <Text style={styles.typingDots}>● ● ●</Text>
                    </View>
                  </View>
                )}
                {showQuick && (
                  <View style={styles.quickWrap}>
                    <Text style={styles.quickLabel}>Quick Questions</Text>
                    <View style={styles.quickGrid}>
                      {QUICK.map((q, i) => (
                        <TouchableOpacity key={i} style={styles.quickChip} onPress={() => pickQuick(q)} activeOpacity={0.75}>
                          <Text style={styles.quickChipText}>{q.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
            }
          />

          {/* Input */}
          <View style={[styles.inputRow, { paddingBottom: insets.bottom + vs(8) }]}>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              placeholderTextColor={colors.placeholder}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => send(input)}
              returnKeyType="send"
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
              onPress={() => send(input)}
              disabled={!input.trim()}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={input.trim() ? [colors.gradientStart, colors.gradientEnd] : [colors.border, colors.border]}
                style={styles.sendGradient}
              >
                <Ionicons name="send" size={rs(17)} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── FAQ Tab ── */}
      {activeTab === 1 && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.faqScroll}>

          {/* Contact Cards */}
          <Text style={styles.sectionLabel}>Contact Us</Text>
          <View style={styles.contactGrid}>
            {CONTACT.map((c, i) => (
              <TouchableOpacity key={i} style={[styles.contactCard, shadows.small]} onPress={c.action} activeOpacity={0.8}>
                <View style={[styles.contactIconWrap, { backgroundColor: c.bg }]}>
                  <Ionicons name={c.icon} size={rs(22)} color={c.color} />
                </View>
                <Text style={styles.contactLabel}>{c.label}</Text>
                <Text style={styles.contactSub} numberOfLines={1}>{c.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* FAQ Accordion */}
          <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>
          {FAQ.map((section, si) => (
            <View key={si} style={styles.faqSection}>
              <Text style={styles.faqCategory}>{section.category}</Text>
              <View style={[styles.faqCard, shadows.small]}>
                {section.items.map((item, ii) => (
                  <View key={ii}>
                    <FaqItem q={item.q} a={item.a} />
                    {ii < section.items.length - 1 && <View style={styles.faqDivider} />}
                  </View>
                ))}
              </View>
            </View>
          ))}

          <View style={{ height: vs(24) }} />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(16), paddingBottom: vs(16), gap: rs(12),
  },
  backBtn: { padding: rs(4) },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: ms(17), fontWeight: '700', color: '#fff', fontFamily: 'Poppins_700Bold' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: rs(5), marginTop: vs(2) },
  onlineDot: { width: rs(7), height: rs(7), borderRadius: rs(4), backgroundColor: '#4CAF50' },
  onlineText: { fontSize: ms(11), color: 'rgba(255,255,255,0.8)' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: vs(12), gap: rs(6),
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: ms(13), fontWeight: '600', color: colors.placeholder },
  tabTextActive: { color: colors.primary, fontWeight: '700' },

  // Chat
  msgList: { padding: rs(16), paddingBottom: vs(8) },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: rs(8), marginBottom: vs(10) },
  msgRowUser: { flexDirection: 'row-reverse' },
  botAvatar: {
    width: rs(34), height: rs(34), borderRadius: rs(17),
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  bubble: { maxWidth: '75%', borderRadius: borderRadius.md, padding: rs(12), ...shadows.small },
  bubbleBot: { backgroundColor: colors.surface, borderBottomLeftRadius: rs(4) },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: rs(4) },
  bubbleText: { fontSize: ms(14), color: colors.text, lineHeight: ms(21) },
  bubbleTextUser: { color: '#fff' },
  bubbleTime: { fontSize: ms(10), color: colors.placeholder, marginTop: vs(4), alignSelf: 'flex-end' },
  bubbleTimeUser: { color: 'rgba(255,255,255,0.65)' },
  typingBubble: { paddingVertical: vs(10), paddingHorizontal: rs(14) },
  typingDots: { fontSize: ms(12), color: colors.placeholder, letterSpacing: 2 },

  quickWrap: { marginTop: vs(10) },
  quickLabel: { fontSize: ms(11), fontWeight: '700', color: colors.textSecondary, marginBottom: vs(8), letterSpacing: 0.5, textTransform: 'uppercase' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  quickChip: {
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: borderRadius.full, paddingHorizontal: rs(14), paddingVertical: vs(7),
    backgroundColor: colors.primarySurface,
  },
  quickChipText: { fontSize: ms(12), color: colors.primary, fontWeight: '600' },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: rs(10),
    paddingHorizontal: rs(16), paddingTop: vs(10),
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider,
  },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: borderRadius.md, paddingHorizontal: rs(14), paddingVertical: vs(10),
    fontSize: ms(14), color: colors.text, backgroundColor: colors.background, maxHeight: vs(100),
  },
  sendBtn: { borderRadius: rs(22), overflow: 'hidden' },
  sendBtnDisabled: { opacity: 0.6 },
  sendGradient: { width: rs(44), height: rs(44), justifyContent: 'center', alignItems: 'center' },

  // FAQ
  faqScroll: { padding: rs(16) },
  sectionLabel: {
    fontSize: ms(11), fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: vs(10), marginTop: vs(4),
  },
  contactGrid: { flexDirection: 'row', gap: rs(10), marginBottom: vs(24) },
  contactCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: rs(14), alignItems: 'center', gap: vs(6),
  },
  contactIconWrap: {
    width: rs(46), height: rs(46), borderRadius: borderRadius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  contactLabel: { fontSize: ms(12), fontWeight: '700', color: colors.text, textAlign: 'center' },
  contactSub: { fontSize: ms(10), color: colors.placeholder, textAlign: 'center' },

  faqSection: { marginBottom: vs(16) },
  faqCategory: { fontSize: ms(13), fontWeight: '700', color: colors.text, marginBottom: vs(8) },
  faqCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, overflow: 'hidden' },
  faqItem: { paddingHorizontal: rs(16), paddingVertical: vs(14) },
  faqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: rs(10) },
  faqQ: { flex: 1, fontSize: ms(14), fontWeight: '600', color: colors.text },
  faqA: { fontSize: ms(13), color: colors.textSecondary, marginTop: vs(8), lineHeight: ms(20) },
  faqDivider: { height: 1, backgroundColor: colors.divider, marginHorizontal: rs(16) },
});
