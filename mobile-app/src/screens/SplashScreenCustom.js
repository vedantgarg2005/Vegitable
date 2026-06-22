import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../utils/theme';

const { width } = Dimensions.get('window');

export default function SplashScreenCustom({ onDone }) {
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(logoOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start(() => onDone?.());
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../assets/Logo.png')}
        style={[styles.logo, { opacity: logoOpacity }]}
        resizeMode="contain"
      />
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
  logo: {
    width: width * 1.8,
    height: width * 1.8,
  },
});
