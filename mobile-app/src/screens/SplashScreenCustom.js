import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet, Dimensions } from 'react-native';
import { colors, fonts } from '../utils/theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreenCustom({ onDone }) {
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const bgScale = useRef(new Animated.Value(1.15)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(bgScale, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(textY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.delay(900),
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(taglineOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
    ]).start(() => onDone?.());
  }, []);

  return (
    <View style={styles.container}>
      {/* Decorative blobs */}
      <Animated.View style={[styles.blobTop, { transform: [{ scale: bgScale }] }]} />
      <Animated.View style={[styles.blobBottom, { transform: [{ scale: bgScale }] }]} />

      <Animated.Image
        source={require('../../assets/Logo.png')}
        style={[styles.logo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
        resizeMode="contain"
      />

      <Animated.Text style={[styles.appName, { opacity: textOpacity, transform: [{ translateY: textY }] }]}>
        Vegitable
      </Animated.Text>

      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Fresh. Fast. Delivered.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blobTop: {
    position: 'absolute',
    top: -height * 0.18,
    right: -width * 0.25,
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: width * 0.425,
    backgroundColor: colors.primaryLight,
    opacity: 0.25,
  },
  blobBottom: {
    position: 'absolute',
    bottom: -height * 0.12,
    left: -width * 0.3,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: colors.accent,
    opacity: 0.1,
  },
  logo: {
    width: width * 0.35,
    height: width * 0.35,
    marginBottom: 20,
  },
  appName: {
    fontFamily: fonts.black,
    fontSize: 38,
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.accent,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 8,
  },
});
