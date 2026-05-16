import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, ms, rs, vs } from '../utils/theme';

export default function Header({ title, showBack = false, onBack, rightIcon, onRightPress }) {
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.gradient}
    >
      <Appbar.Header style={styles.header}>
        {showBack && <Appbar.BackAction onPress={onBack} color="#FFFFFF" />}
        <Appbar.Content title={title} titleStyle={styles.title} />
        {rightIcon && (
          <TouchableOpacity onPress={onRightPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={rs(22)} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </Appbar.Header>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  header: { backgroundColor: 'transparent', elevation: 0 },
  title: { color: '#FFFFFF', fontSize: ms(18), fontWeight: '700', letterSpacing: 0.3 },
  rightIcon: {
    marginRight: rs(12),
    padding: rs(8),
    borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
