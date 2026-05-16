import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, ms, rs, vs, shadows } from '../../utils/theme';
import { menuAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';

const CATEGORIES = ['All', 'Pizza', 'Burgers', 'Pasta', 'Sides', 'Beverages', 'Desserts'];

export default function MenuScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuItems, setMenuItems] = useState([]);
  const { addToCart } = useCart();
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
        <Text style={styles.emoji}>{item.image || '🍕'}</Text>
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
          <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>ADD</Text>
            <Ionicons name="add" size={rs(14)} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  ), [navigation, addToCart]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />

      {/* Dark header */}
      <View style={[styles.header, { paddingTop: insets.top + vs(12) }]}>
        <Text style={styles.headerTitle}>MENU</Text>
        <Searchbar
          placeholder="Search pizzas, burgers..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={colors.primary}
          placeholderTextColor={colors.placeholder}
        />
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
  headerTitle: {
    fontSize: ms(20),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: vs(12),
    fontFamily: 'Poppins_900Black',
  },
  searchBar: { borderRadius: borderRadius.sm, backgroundColor: '#fff', elevation: 0, minHeight: vs(46) },
  searchInput: { fontSize: ms(13), color: colors.text, fontFamily: 'Poppins_400Regular' },

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
  },
  emoji: { fontSize: ms(46) },
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

  empty: { alignItems: 'center', paddingVertical: vs(60) },
  emptyEmoji: { fontSize: ms(52), marginBottom: vs(10) },
  emptyTitle: { fontSize: ms(16), fontWeight: '700', color: colors.text, fontFamily: 'Poppins_700Bold' },
});
