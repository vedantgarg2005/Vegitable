import React, { useState, useRef, useEffect } from 'react';
import {
  View, StyleSheet, TouchableOpacity, FlatList,
  TextInput, KeyboardAvoidingView, Platform, Linking, StatusBar,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';

const BOT_NAME = 'FreshBasket Support';

const QUICK = [
  { label: '📦 Track my order', reply: 'Go to the Orders tab → tap your active order → you\'ll see live tracking on the map.' },
  { label: '❌ Cancel order', reply: 'You can cancel within 2 minutes of placing. Go to Orders → tap the order → Cancel Order.' },
  { label: '💰 Wallet help', reply: 'Add money to your wallet and use it at checkout. Refunds are also credited to your wallet automatically.' },
  { label: '🔄 Wrong item', reply: 'So sorry to hear that! Please contact us within 30 minutes of delivery. We\'ll arrange a replacement or full refund.' },
  { label: '🎟️ Promo code', reply: 'At Cart screen, tap "View All Offers" and apply your code. Valid codes are applied instantly.' },
  { label: '🚚 Delivery charges', reply: 'Orders above ₹299 get FREE delivery. Below that, a small delivery fee applies based on distance.' },
];

const CONTACT = [
  { icon: 'call-outline', label: 'Call Us', action: () => Linking.openURL('tel:+919876543210') },
  { icon: 'logo-whatsapp', label: 'WhatsApp', action: () => Linking.openURL('https://wa.me/919876543210') },
  { icon: 'mail-outline', label: 'Email', action: () => Linking.openURL('mailto:support@freshbasket.in') },
];

let msgId = 0;
const msg = (text, fromUser) => ({ id: String(++msgId), text, fromUser, time: new Date() });

export default function HelpSupportScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const [messages, setMessages] = useState([
    msg('👋 Hi! I\'m your FreshBasket support assistant. How can I help you today?\n\nTap a quick option below or type your question.', false),
  ]);
  const [input, setInput] = useState('');
  const [showQuick, setShowQuick] = useState(true);

  const addMsg = (text, fromUser) => {
    setMessages(prev => [...prev, msg(text, fromUser)]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const send = (text) => {
    if (!text.trim()) return;
    addMsg(text, true);
    setInput('');
    setShowQuick(false);
    setTimeout(() => {
      addMsg('Thanks for reaching out! Our team will get back to you shortly. For urgent help, use the contact options below.', false);
    }, 800);
  };

  const pickQuick = (item) => {
    addMsg(item.label, true);
    setShowQuick(false);
    setTimeout(() => addMsg(item.reply, false), 600);
  };

  const renderMsg = ({ item }) => (
    <View style={[styles.msgRow, item.fromUser && styles.msgRowUser]}>
      {!item.fromUser && (
        <View style={styles.botAvatar}>
          <Text style={styles.botAvatarText}>🌿</Text>
        </View>
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
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + vs(12) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs(22)} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{BOT_NAME}</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online • Typically replies instantly</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {CONTACT.map((c, i) => (
            <TouchableOpacity key={i} style={styles.headerIconBtn} onPress={c.action} activeOpacity={0.7}>
              <Ionicons name={c.icon} size={rs(20)} color="#fff" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderMsg}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.msgList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          showQuick ? (
            <View style={styles.quickWrap}>
              {QUICK.map((q, i) => (
                <TouchableOpacity key={i} style={styles.quickChip} onPress={() => pickQuick(q)} activeOpacity={0.75}>
                  <Text style={styles.quickChipText}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null
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
          <Ionicons name="send" size={rs(18)} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(16), paddingBottom: vs(16), gap: rs(10),
  },
  backBtn: { padding: rs(4) },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: ms(16), fontWeight: '700', color: '#fff' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: rs(5), marginTop: vs(2) },
  onlineDot: { width: rs(7), height: rs(7), borderRadius: rs(4), backgroundColor: '#4CAF50' },
  onlineText: { fontSize: ms(11), color: 'rgba(255,255,255,0.75)' },
  headerActions: { flexDirection: 'row', gap: rs(4) },
  headerIconBtn: {
    width: rs(34), height: rs(34), borderRadius: rs(17),
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  msgList: { padding: rs(16), gap: vs(10), paddingBottom: vs(8) },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: rs(8), marginBottom: vs(6) },
  msgRowUser: { flexDirection: 'row-reverse' },
  botAvatar: {
    width: rs(32), height: rs(32), borderRadius: rs(16),
    backgroundColor: colors.primarySurface, justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  botAvatarText: { fontSize: ms(16) },
  bubble: {
    maxWidth: '75%', borderRadius: borderRadius.md, padding: rs(12),
    ...shadows.small,
  },
  bubbleBot: { backgroundColor: colors.surface, borderBottomLeftRadius: rs(4) },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: rs(4) },
  bubbleText: { fontSize: ms(14), color: colors.text, lineHeight: ms(21) },
  bubbleTextUser: { color: '#fff' },
  bubbleTime: { fontSize: ms(10), color: colors.placeholder, marginTop: vs(4), alignSelf: 'flex-end' },
  bubbleTimeUser: { color: 'rgba(255,255,255,0.7)' },
  quickWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8), marginTop: vs(8), paddingHorizontal: rs(4) },
  quickChip: {
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: borderRadius.full, paddingHorizontal: rs(14), paddingVertical: vs(8),
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
  sendBtn: {
    width: rs(44), height: rs(44), borderRadius: rs(22),
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.border },
});
