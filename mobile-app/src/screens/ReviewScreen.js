import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { reviewAPI } from '../services/api';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';

function StarRating({ rating, onRate }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity key={star} onPress={() => onRate(star)} activeOpacity={0.7}>
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={rs(36)}
            color={star <= rating ? '#FFB800' : colors.border}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent!' };

export default function ReviewScreen({ route, navigation }) {
  const { orderId, items } = route.params;
  const insets = useSafeAreaInsets();

  // One rating + comment per item
  const [reviews, setReviews] = useState(
    items.map(item => ({ menuItemId: item.menuItem?._id || item.menuItem, name: item.name ?? item.menuItem?.name, rating: 0, comment: '' }))
  );
  const [submitting, setSubmitting] = useState(false);

  const updateReview = (index, field, value) => {
    setReviews(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const handleSubmit = async () => {
    const rated = reviews.filter(r => r.rating > 0);
    if (rated.length === 0) {
      Alert.alert('Rate at least one item', 'Please give a star rating to at least one item.');
      return;
    }
    setSubmitting(true);
    try {
      await Promise.all(
        rated.map(r =>
          reviewAPI.addReview({ orderId, menuItemId: r.menuItemId, rating: r.rating, comment: r.comment })
        )
      );
      Alert.alert('Thank you! 🎉', 'Your review has been submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + vs(8) }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Order</Text>
        <View style={{ width: rs(40) }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>How was your food? Your feedback helps us improve 🍽️</Text>

        {reviews.map((review, index) => (
          <View key={review.menuItemId} style={[styles.card, shadows.small]}>
            <Text style={styles.itemName}>{review.name || 'Item'}</Text>
            <StarRating rating={review.rating} onRate={val => updateReview(index, 'rating', val)} />
            {review.rating > 0 && (
              <Text style={styles.ratingLabel}>{RATING_LABELS[review.rating]}</Text>
            )}
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment (optional)"
              placeholderTextColor={colors.placeholder}
              value={review.comment}
              onChangeText={val => updateReview(index, 'comment', val)}
              multiline
              maxLength={200}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={rs(20)} color="#fff" />
                  <Text style={styles.submitBtnText}>Submit Review</Text>
                </>
            }
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: vs(24) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: rs(16), paddingBottom: vs(14),
  },
  backBtn: {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: ms(18), fontWeight: '700', color: '#fff' },

  scrollContent: { padding: rs(16) },
  subtitle: { fontSize: ms(14), color: colors.textSecondary, marginBottom: vs(16), textAlign: 'center', lineHeight: ms(20) },

  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: rs(16), marginBottom: vs(12), alignItems: 'center',
  },
  itemName: { fontSize: ms(15), fontWeight: '700', color: colors.text, marginBottom: vs(12), textAlign: 'center' },

  starsRow: { flexDirection: 'row', gap: rs(8), marginBottom: vs(8) },
  ratingLabel: { fontSize: ms(13), fontWeight: '700', color: '#FFB800', marginBottom: vs(10) },

  commentInput: {
    width: '100%', borderWidth: 1.5, borderColor: colors.border,
    borderRadius: borderRadius.sm, paddingHorizontal: rs(12), paddingVertical: vs(10),
    fontSize: ms(13), color: colors.text, backgroundColor: colors.background,
    minHeight: vs(72), textAlignVertical: 'top', marginTop: vs(4),
  },

  submitBtn: { borderRadius: borderRadius.md, overflow: 'hidden', marginTop: vs(8) },
  submitBtnDisabled: { opacity: 0.6 },
  submitGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: vs(15), gap: rs(8),
  },
  submitBtnText: { color: '#fff', fontSize: ms(16), fontWeight: '700' },
});
