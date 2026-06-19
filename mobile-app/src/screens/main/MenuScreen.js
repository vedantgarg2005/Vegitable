import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Modal, Pressable } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, ms, rs, vs, shadows } from '../../utils/theme';
import { menuAPI, API_BASE_URL } from '../../services/api';
import { API_BASE_URL as BASE_URL } from '../../utils/constants';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import FoodCard from '../../components/FoodCard';

function formatTime12(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const CATEGORIES = ['All', 'Running', 'Football', 'Cricket', 'Basketball', 'Fitness', 'Accessories'];

const CATEGORY_ICONS = {
  All: '🏅',
  Running: '👟',
  Football: '⚽',
  Cricket: '🏏',
  Basketball: '🏀',
  Fitness: '💪',
  Accessories: '🎽',
};

export default function MenuScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuItems, setMenuItems] = useState([]);
  const [menuPopupVisible, setMenuPopupVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [restaurantOpen, setRestaurantOpen] = useState(true);
  const [nextOpenTime, setNextOpenTime] = useState(null);
  const { addToCart, items: cartItems, updateQuantity, total, itemCount } = useCart();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const fetchMenu = useCallback(() => {
    return menuAPI.getItems()
      .then(res => setMenuItems(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  useEffect(() => {
    fetch(`${BASE_URL}/admin/restaurant-status`)
      .then(r => r.json())
      .then(d => {
        setRestaurantOpen(d.isOpen ?? true);
        if (d.nextOpenTime) setNextOpenTime(d.nextOpenTime);
      })
      .catch(() => {});
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMenu();
    setRefreshing(false);
  }, [fetchMenu]);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setMenuPopupVisible(false);
  };

  const renderItem = useCallback(({ item }) => {
    const cartItem = cartItems.find(c => c.id === (item._id || item.id));
    const qty = cartItem?.quantity || 0;

    return (
      <FoodCard
        item={item}
        qty={qty}
        isOpen={restaurantOpen}
        nextAvailableLabel={nextOpenTime ? `Next at: ${formatTime12(nextOpenTime)}` : 'Closed'}
        onPress={() => navigation.navigate('MenuItemDetail', { item })}
        onAdd={() => addToCart(item)}
        onRemove={() => updateQuantity(cartItem.id, qty - 1)}
      />
    );
  }, [navigation, addToCart, cartItems, updateQuantity, restaurantOpen, nextOpenTime]);

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
            placeholder="Search shoes, jerseys, equipment..."
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
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <Text style={styles.resultCount}>
            {filteredItems.length} {selectedCategory === 'All' ? t.items : selectedCategory + ' ' + t.items}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏅</Text>
            <Text style={styles.emptyTitle}>{t.nothingFound}</Text>
          </View>
        }
      />

      {/* Cart bar — fixed at bottom in layout flow */}
      {itemCount > 0 && (
        <View style={[styles.cartBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : vs(20) }]}>
          <Text style={styles.cartBarPrice}>₹{total.toFixed(0)}</Text>
          <View style={styles.cartBarDivider} />
          <Text style={styles.cartBarItems}>{itemCount} {t.items}</Text>
          <TouchableOpacity
            style={styles.viewCartBtn}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.85}
          >
            <Text style={styles.viewCartText}>{t.viewCart}</Text>
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
              <Text style={styles.popupTitle}>{t.shopByCategory}</Text>
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
  list: { paddingVertical: vs(10), paddingBottom: vs(20) },

  foodCard: {
    // defined in shared FoodCard component
  },

  empty: { alignItems: 'center', paddingVertical: vs(60) },
  emptyEmoji: { fontSize: ms(52), marginBottom: vs(10) },
  emptyTitle: { fontSize: ms(16), fontWeight: '700', color: colors.text, fontFamily: 'Poppins_700Bold' },

  // Cart bar
  cartBar: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: vs(4),
    paddingBottom: vs(16),
    paddingHorizontal: rs(16),
    ...shadows.medium,
  },
  cartBarPrice: { fontSize: ms(17), fontWeight: '900', color: '#fff', fontFamily: 'Poppins_900Black' },
  cartBarDivider: { width: 1, height: vs(20), backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: rs(10) },
  cartBarItems: { fontSize: ms(16), fontWeight: '600', color: 'rgba(255,255,255,0.9)', flex: 1, fontFamily: 'Poppins_700Bold' },
  viewCartBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(4),
    paddingHorizontal: rs(12), paddingVertical: vs(6),
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
