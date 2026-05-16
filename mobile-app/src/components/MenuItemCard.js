import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';
import { useCart } from '../context/CartContext';

export default function MenuItemCard({ item, onPress }) {
  const { addToCart } = useCart();

  return (
    <TouchableOpacity style={[styles.card, shadows.medium]} onPress={onPress} activeOpacity={0.88}>
      <Image source={{ uri: item.image }} style={styles.image} />

      {item.isVeg !== undefined && (
        <View style={[styles.vegBadge, { borderColor: item.isVeg ? colors.tagVeg : colors.tagNonVeg }]}>
          <View style={[styles.vegDot, { backgroundColor: item.isVeg ? colors.tagVeg : colors.tagNonVeg }]} />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>₹{item.price}</Text>
            {item.originalPrice && item.originalPrice > item.price && (
              <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
            )}
          </View>

          <View style={styles.right}>
            {item.rating && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={rs(11)} color={colors.warning} />
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)} activeOpacity={0.8}>
              <Ionicons name="add" size={rs(20)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    margin: rs(8),
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: vs(140),
    backgroundColor: colors.background,
  },
  vegBadge: {
    position: 'absolute',
    top: rs(10),
    left: rs(10),
    width: rs(18),
    height: rs(18),
    borderRadius: rs(3),
    borderWidth: 1.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegDot: { width: rs(8), height: rs(8), borderRadius: rs(4) },
  content: { padding: rs(12) },
  name: { fontSize: ms(15), fontWeight: '700', color: colors.text, marginBottom: vs(4) },
  description: { fontSize: ms(12), color: colors.placeholder, lineHeight: ms(17), marginBottom: vs(10) },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: ms(16), fontWeight: '800', color: colors.primary },
  originalPrice: { fontSize: ms(11), color: colors.placeholder, textDecorationLine: 'line-through' },
  right: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    paddingHorizontal: rs(6),
    paddingVertical: vs(3),
    borderRadius: borderRadius.full,
    gap: rs(3),
  },
  ratingText: { fontSize: ms(11), fontWeight: '700', color: colors.text },
  addBtn: {
    backgroundColor: colors.primary,
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
