import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import FlashMessage from 'react-native-flash-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import { Platform, Text, TextInput } from 'react-native';
import api from './src/services/api';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';
import {
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_700Bold,
} from '@expo-google-fonts/noto-sans-devanagari';

// Override default Text font globally — switches to Devanagari when Hindi is active
async function applyFontForLanguage() {
  const lang = await AsyncStorage.getItem('app_language');
  const isHindi = lang === 'hi';
  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.style = [{ fontFamily: isHindi ? 'NotoSansDevanagari_400Regular' : 'Poppins_400Regular' }];
  TextInput.defaultProps = TextInput.defaultProps || {};
  TextInput.defaultProps.style = [{ fontFamily: isHindi ? 'NotoSansDevanagari_400Regular' : 'Poppins_400Regular' }];
}
applyFontForLanguage();

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './src/navigation/MainNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { WalletProvider } from './src/context/WalletContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { theme } from './src/utils/theme';

SplashScreen.preventAutoHideAsync();

const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  const Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function registerPushToken() {
  if (isExpoGo) return;
  const Notifications = require('expo-notifications');
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await api.post('/auth/device-token', { token });
}

import OnboardingScreen from './src/screens/OnboardingScreen';
import SplashScreenCustom from './src/screens/SplashScreenCustom';

function AppContent() {
  const { user, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const done = await AsyncStorage.getItem('onboarding_done');
        if (!done) setShowOnboarding(true);
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (user) registerPushToken();
  }, [user]);

  if (!isReady || loading) return <SplashScreenCustom />;

  if (showOnboarding) {
    return <OnboardingScreen onDone={() => setShowOnboarding(false)} />;
  }

  return (
    <NavigationContainer>
      <MainNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <LanguageProvider>
            <CartProvider>
              <WalletProvider>
                  <AppContent />
                  <FlashMessage position="top" />
              </WalletProvider>
            </CartProvider>
            </LanguageProvider>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}