import React, { useState } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, Dimensions,
} from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, shadows, borderRadius, ms, rs, vs } from '../utils/theme';

const { width: W } = Dimensions.get('window');

const mockMenuItems = [
  { _id: '1', name: 'Gulab Jamun', description: 'Soft, spongy balls soaked in rose sugar syrup', price: 120, image: '🍯', category: 'Sweets', rating: 4.8, isVeg: true },
  { _id: '2', name: 'Samosa', description: 'Crispy triangular pastry with spiced potato filling', price: 25, image: '🥟', category: 'Snacks', rating: 4.5, isVeg: true },
  { _id: '3', name: 'Masala Chai', description: 'Traditional Indian spiced tea with ginger', price: 15, image: '☕', category: 'Beverages', rating: 4.7, isVeg: true },
  { _id: '4', name: 'Paneer Butter Masala', description: 'Rich and creamy paneer curry with butter', price: 180, image: '🍛', category: 'Main Course', rating: 4.6, isVeg: true },
  { _id: '5', name: 'Kulfi', description: 'Traditional Indian ice cream with pistachios', price: 40, image: '🍦', category: 'Desserts', rating: 4.4, isVeg: true },
  { _id: '6', name: 'Chole Bhature', description: 'Spicy chickpeas with fluffy fried bread', price: 150, image: '🍞', category: 'Main Course', rating: 4.7, isVeg: true },
];

const categories = [
  { label: 'All', icon: '🍽️' },
  { label: 'Sweets', icon: '🍯' },
  { label: 'Snacks', icon: '🥟' },
  { label: 'Beverages', icon: '☕' },
  { label: 'Main Course', icon: '🍛' },
  { label: 'Desserts', icon: '🍦' },
];

const HomeScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [pureVeg, setPureVeg] = useState(false);
  const insets = useSafeAreaInsets();

  const filteredItems = mockMenuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesVeg = !pureVeg || item.isVeg;
    return matchesSearch && matchesCategory && matchesVeg;
  });

  const renderMenuItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.menuCard, shadows.medium]}
      onPress={() => navigation.navigate('MenuItemDetail', { item })}
      activeOpacity={0.88}
    >
      <View style={styles.emojiContainer}>
        <Text style={styles.itemEmoji}>{item.image}</Text>
        {item.isVeg && (
          <View style={styles.vegBadge}>
            <View style={styles.vegDot} />
          </View>
        )}
      </View>
      <View style={styles.itemInfo}>
        <View style={styles.itemTitleRow}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={rs(10)} color={colors.warning} />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
        <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.itemFooter}>
          <Text style={styles.itemPrice}>₹{item.price}</Text>
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
            <Ionicons name="add" size={rs(18)} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} translucent />

      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + vs(12) }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good day! 👋</Text>
            <Text style={styles.title}>What's your craving?</Text>
          </View>
          <TouchableOpacity style={styles.cartIconBtn} onPress={() => navigation.navigate('Cart')}>
            <Ionicons name="bag-outline" size={rs(22)} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchRow}>
          <Searchbar
            placeholder="Search food, sweets..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor={colors.primary}
            placeholderTextColor={colors.placeholder}
          />
          <TouchableOpacity
            onPress={() => setPureVeg(v => !v)}
            style={[styles.vegToggle, pureVeg && styles.vegToggleActive]}
            activeOpacity={0.8}
          >
            <Text style={styles.vegToggleIcon}>🌿</Text>
            <Text style={[styles.vegToggleText, pureVeg && styles.vegToggleTextActive]}>Veg</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.label}
            onPress={() => setSelectedCategory(cat.label)}
            style={[styles.categoryPill, selectedCategory === cat.label && styles.categoryPillActive]}
            activeOpacity={0.8}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={[styles.categoryText, selectedCategory === cat.label && styles.categoryTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredItems}
        renderItem={renderMenuItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.sectionHeader}>
            {selectedCategory === 'All' ? 'All Items' : selectedCategory}
            <Text style={styles.sectionCount}> ({filteredItems.length})</Text>
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>Nothing found</Text>
            <Text style={styles.emptySubtitle}>Try a different search or category</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  headerGradient: {
    paddingHorizontal: spacing.md,
    paddingBottom: vs(20),
    borderBottomLeftRadius: rs(28),
    borderBottomRightRadius: rs(28),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: vs(14),
  },
  greeting: { fontSize: ms(13), color: 'rgba(255,255,255,0.85)', fontWeight: '500', marginBottom: 2 },
  title: { fontSize: ms(22), fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  cartIconBtn: {
    width: rs(42),
    height: rs(42),
    borderRadius: rs(21),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
  },
  searchBar: {
    flex: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: '#FFFFFF',
    elevation: 0,
    height: vs(46),
  },
  vegToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: rs(10),
    height: vs(46),
    gap: rs(4),
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  vegToggleActive: {
    backgroundColor: '#fff',
    borderColor: colors.tagVeg,
  },
  vegToggleIcon: { fontSize: ms(14) },
  vegToggleText: { fontSize: ms(12), fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  vegToggleTextActive: { color: colors.tagVeg },
  searchInput: { fontSize: ms(14), color: colors.text },

  categoriesContainer: { maxHeight: vs(64), backgroundColor: colors.surface },
  categoriesContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: vs(10),
    gap: rs(8),
    alignItems: 'center',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(14),
    paddingVertical: vs(6),
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: rs(5),
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryIcon: { fontSize: ms(13) },
  categoryText: { fontSize: ms(13), fontWeight: '600', color: colors.textSecondary },
  categoryTextActive: { color: '#FFFFFF' },

  list: { padding: spacing.md, paddingTop: vs(8) },
  sectionHeader: { fontSize: ms(16), fontWeight: '700', color: colors.text, marginBottom: vs(12) },
  sectionCount: { fontSize: ms(14), fontWeight: '400', color: colors.textSecondary },

  menuCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: vs(12),
    overflow: 'hidden',
    padding: rs(14),
    alignItems: 'center',
  },
  emojiContainer: {
    width: rs(72),
    height: rs(72),
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rs(14),
    position: 'relative',
  },
  itemEmoji: { fontSize: ms(36) },
  vegBadge: {
    position: 'absolute',
    bottom: rs(4),
    right: rs(4),
    width: rs(14),
    height: rs(14),
    borderRadius: rs(2),
    borderWidth: 1.5,
    borderColor: colors.tagVeg,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegDot: { width: rs(6), height: rs(6), borderRadius: rs(3), backgroundColor: colors.tagVeg },

  itemInfo: { flex: 1 },
  itemTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(3) },
  itemName: { fontSize: ms(15), fontWeight: '700', color: colors.text, flex: 1, marginRight: rs(8) },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    paddingHorizontal: rs(6),
    paddingVertical: vs(2),
    borderRadius: borderRadius.full,
    gap: rs(2),
  },
  ratingText: { fontSize: ms(11), fontWeight: '700', color: colors.text },
  itemDescription: { fontSize: ms(12), color: colors.placeholder, lineHeight: ms(17), marginBottom: vs(10) },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemPrice: { fontSize: ms(16), fontWeight: '800', color: colors.primary },
  addBtn: {
    backgroundColor: colors.primary,
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyContainer: { alignItems: 'center', paddingVertical: vs(60) },
  emptyEmoji: { fontSize: ms(56), marginBottom: vs(12) },
  emptyTitle: { fontSize: ms(18), fontWeight: '700', color: colors.text, marginBottom: vs(6) },
  emptySubtitle: { fontSize: ms(14), color: colors.placeholder },
});

export default HomeScreen;
