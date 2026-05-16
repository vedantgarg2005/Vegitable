import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import FlashMessage from 'react-native-flash-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { Text, TextInput } from 'react-native';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';

// Override default Text font globally
const oldTextRender = Text.render;
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = [{ fontFamily: 'Poppins_400Regular' }];

const oldInputRender = TextInput.render;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = [{ fontFamily: 'Poppins_400Regular' }];

import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { theme } from './src/utils/theme';

SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

function AppContent() {
  const { user, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!isReady || loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainNavigator} />
        <Stack.Screen name="Auth" component={AuthNavigator} />
      </Stack.Navigator>
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
  });

  if (!fontsLoaded) return null;

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <CartProvider>
          <AppContent />
          <FlashMessage position="top" />
        </CartProvider>
      </AuthProvider>
    </PaperProvider>
  );
}