import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Modal, Pressable, Image } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, ms, rs, vs, shadows } from '../../utils/theme';
import { menuAPI, API_BASE_URL } from '../../services/api';
import { useCart } from '../../context/CartContext';

const CATEGORIES = ['All', 'Pizza', 'Burgers', 'Pasta', 'Sides', 'Beverages', 'Desserts'];

const CATEGORY_ICONS = {
  All: '🍽️',
  Pizza: '🍕',
  Burgers: '🍔',
  Pasta: '🍝',
  Sides: '🍟',
  Beverages: '🥤',
  Desserts: '🍰',
};

export default function MenuScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuItems, setMenuItems] = useState([]);
  const [menuPopupVisible, setMenuPopupVisible] = useState(false);
  const { addToCart, items: cartItems, updateQuantity, total, itemCount } = useCart();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    menuAPI.getItems()
      .then(res => setMenuItems(res.data))
      .catch(() => {});
  }, []);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setMenuPopupVisible(false);
  };

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={[styles.card, shadows.small]}
      onPress={() => navigation.navigate('MenuItemDetail', { item })}
      activeOpacity={0.9}
    >
      <View style={styles.vegIndicatorTop}>
        <View style={[styles.vegBox, { borderColor: item.isVeg !== false ? colors.tagVeg : colors.tagNonVeg }]}>
          <View style={[styles.vegDot, { backgroundColor: item.isVeg !== false ? colors.tagVeg : colors.tagNonVeg }]} />
        </View>
      </View>
      <View style={styles.emojiBox}>
        {item.image && item.image.startsWith('/uploads') ? (
          <Image source={{ uri: `${API_BASE_URL.replace('/api', '')}${item.image}` }} style={styles.itemImage} resizeMode="cover" />
        ) : (
          <Text style={styles.emoji}>{item.image || '🍕'}</Text>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        {item.ratings?.average != null && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={rs(11)} color={colors.warning} />
            <Text style={styles.ratingText}>{item.ratings.average.toFixed(1)}</Text>
          </View>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>₹{item.price}</Text>
          {(() => {
            const cartItem = cartItems.find(c => c.id === (item._id || item.id));
            return cartItem ? (
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => updateQuantity(cartItem.id, cartItem.quantity - 1)} activeOpacity={0.8}>
                  <Ionicons name="remove" size={rs(16)} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.stepperCount}>{cartItem.quantity}</Text>
                <TouchableOpacity onPress={() => addToCart(item)} activeOpacity={0.8}>
                  <Ionicons name="add" size={rs(16)} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)} activeOpacity={0.8}>
                <Text style={styles.addBtnText}>ADD</Text>
                <Ionicons name="add" size={rs(14)} color={colors.primary} />
              </TouchableOpacity>
            );
          })()}
        </View>
      </View>
    </TouchableOpacity>
  ), [navigation, addToCart, cartItems, updateQuantity]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />

      {/* Header with search + menu button */}
      <View style={[styles.header, { paddingTop: insets.top + vs(12) }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={rs(22)} color="#fff" />
          </TouchableOpacity>
          <Searchbar
            placeholder="Search pizzas, burgers..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor={colors.primary}
            placeholderTextColor={colors.placeholder}
          />
          <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuPopupVisible(true)} activeOpacity={0.8}>
            <Ionicons name="grid" size={rs(22)} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[styles.tab, selectedCategory === cat && styles.tabActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, selectedCategory === cat && styles.tabTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        numColumns={2}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.resultCount}>
            {filteredItems.length} {selectedCategory === 'All' ? 'items' : selectedCategory + ' items'}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🍕</Text>
            <Text style={styles.emptyTitle}>Nothing found</Text>
          </View>
        }
      />

      {/* Cart bar — fixed at bottom in layout flow */}
      {itemCount > 0 && (
        <View style={[styles.cartBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : vs(12) }]}>
          <Text style={styles.cartBarPrice}>₹{total.toFixed(0)}</Text>
          <View style={styles.cartBarDivider} />
          <Text style={styles.cartBarItems}>{itemCount} item{itemCount > 1 ? 's' : ''}</Text>
          <TouchableOpacity
            style={styles.viewCartBtn}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.85}
          >
            <Text style={styles.viewCartText}>View Cart</Text>
            <Ionicons name="arrow-forward" size={rs(15)} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Menu Categories Popup */}
      <Modal
        visible={menuPopupVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuPopupVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuPopupVisible(false)}>
          <Pressable style={styles.popup} onPress={() => {}}>
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>Browse Menu</Text>
              <TouchableOpacity onPress={() => setMenuPopupVisible(false)}>
                <Ionicons name="close" size={rs(22)} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.popupGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.popupItem, selectedCategory === cat && styles.popupItemActive]}
                  onPress={() => handleCategorySelect(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.popupEmoji}>{CATEGORY_ICONS[cat]}</Text>
                  <Text style={[styles.popupItemText, selectedCategory === cat && styles.popupItemTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: vs(14),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
  },
  backBtn: {
    width: rs(44),
    height: rs(44),
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: { flex: 1, borderRadius: borderRadius.sm, backgroundColor: '#fff', elevation: 0, minHeight: vs(46) },
  searchInput: { fontSize: ms(13), color: colors.text, fontFamily: 'Poppins_400Regular' },
  menuBtn: {
    width: rs(44),
    height: rs(44),
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  tabsWrapper: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider },
  tabsContent: { paddingHorizontal: spacing.md, paddingVertical: vs(10), gap: rs(8) },
  tab: {
    paddingHorizontal: rs(16),
    paddingVertical: vs(7),
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    minHeight: vs(34),
    justifyContent: 'center',
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: ms(13), fontWeight: '700', color: colors.textSecondary, fontFamily: 'Poppins_700Bold' },
  tabTextActive: { color: '#FFFFFF' },

  resultCount: {
    fontSize: ms(12),
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    paddingHorizontal: rs(6),
    marginBottom: vs(10),
    fontFamily: 'Poppins_700Bold',
  },
  list: { padding: spacing.sm, paddingBottom: vs(20) },

  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    margin: rs(6),
    overflow: 'hidden',
    paddingBottom: rs(12),
  },
  vegIndicatorTop: { padding: rs(8), alignItems: 'flex-start' },
  vegBox: {
    width: rs(14), height: rs(14), borderRadius: rs(2),
    borderWidth: 1.5, justifyContent: 'center', alignItems: 'center',
  },
  vegDot: { width: rs(6), height: rs(6), borderRadius: rs(3) },
  emojiBox: {
    backgroundColor: colors.background,
    height: vs(100),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  emoji: { fontSize: ms(46) },
  itemImage: { width: '100%', height: vs(100) },
  cardBody: { paddingHorizontal: rs(10), paddingTop: vs(8) },
  cardName: { fontSize: ms(13), fontWeight: '800', color: colors.text, marginBottom: vs(3), fontFamily: 'Poppins_800ExtraBold' },
  cardDesc: { fontSize: ms(11), color: colors.placeholder, lineHeight: ms(17), marginBottom: vs(6), fontFamily: 'Poppins_400Regular' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: rs(3), marginBottom: vs(6) },
  ratingText: { fontSize: ms(11), fontWeight: '700', color: colors.text, fontFamily: 'Poppins_700Bold' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardPrice: { fontSize: ms(15), fontWeight: '900', color: colors.text, fontFamily: 'Poppins_900Black' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(8), paddingVertical: vs(5),
    gap: rs(2), minHeight: vs(30),
  },
  addBtnText: { fontSize: ms(12), fontWeight: '800', color: colors.primary, fontFamily: 'Poppins_800ExtraBold' },
  stepper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(6), paddingVertical: vs(5),
    gap: rs(6), minHeight: vs(30),
  },
  stepperCount: { fontSize: ms(13), fontWeight: '800', color: colors.primary, fontFamily: 'Poppins_800ExtraBold', minWidth: rs(14), textAlign: 'center' },

  empty: { alignItems: 'center', paddingVertical: vs(60) },
  emptyEmoji: { fontSize: ms(52), marginBottom: vs(10) },
  emptyTitle: { fontSize: ms(16), fontWeight: '700', color: colors.text, fontFamily: 'Poppins_700Bold' },

  // Cart bar
  cartBar: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: vs(12),
    paddingHorizontal: rs(16),
    ...shadows.medium,
  },
  cartBarPrice: { fontSize: ms(14), fontWeight: '900', color: '#fff', fontFamily: 'Poppins_900Black' },
  cartBarDivider: { width: 1, height: vs(16), backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: rs(10) },
  cartBarItems: { fontSize: ms(13), fontWeight: '600', color: 'rgba(255,255,255,0.9)', flex: 1, fontFamily: 'Poppins_700Bold' },
  viewCartBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(4),
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: rs(12), paddingVertical: vs(6),
    borderRadius: borderRadius.sm,
  },
  viewCartText: { fontSize: ms(13), fontWeight: '800', color: '#fff', fontFamily: 'Poppins_800ExtraBold' },

  // Popup
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  popup: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: vs(16),
    paddingBottom: vs(32),
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(16),
  },
  popupTitle: { fontSize: ms(17), fontWeight: '800', color: colors.text, fontFamily: 'Poppins_800ExtraBold' },
  popupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(10),
  },
  popupItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: vs(14),
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  popupItemActive: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  popupEmoji: { fontSize: ms(28), marginBottom: vs(6) },
  popupItemText: { fontSize: ms(12), fontWeight: '700', color: colors.textSecondary, fontFamily: 'Poppins_700Bold' },
  popupItemTextActive: { color: colors.primary },
});
