import React, { useCallback } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { StoreProvider } from './src/store';
import { Navigator, ScreenName } from './src/nav/Navigator';
import { C } from './src/theme';
import { Splash } from './src/screens/Splash';
import { Main } from './src/screens/Main';
import { Results } from './src/screens/Results';
import { Detail } from './src/screens/Detail';
import { Seats } from './src/screens/Seats';
import { Passengers } from './src/screens/Passengers';
import { Payment } from './src/screens/Payment';
import { Success } from './src/screens/Success';
import { Pass } from './src/screens/Pass';

SplashScreen.preventAutoHideAsync();

const screens: Record<ScreenName, React.ComponentType> = {
  Splash, Main, Results, Detail, Seats, Passengers, Payment, Success, Pass,
};

export default function App() {
  const [loaded] = useFonts({
    InstrumentSerif_400Regular: require('@expo-google-fonts/instrument-serif/400Regular/InstrumentSerif_400Regular.ttf'),
    InstrumentSerif_400Regular_Italic: require('@expo-google-fonts/instrument-serif/400Regular_Italic/InstrumentSerif_400Regular_Italic.ttf'),
    HankenGrotesk_300Light: require('@expo-google-fonts/hanken-grotesk/300Light/HankenGrotesk_300Light.ttf'),
    HankenGrotesk_400Regular: require('@expo-google-fonts/hanken-grotesk/400Regular/HankenGrotesk_400Regular.ttf'),
    HankenGrotesk_500Medium: require('@expo-google-fonts/hanken-grotesk/500Medium/HankenGrotesk_500Medium.ttf'),
    HankenGrotesk_600SemiBold: require('@expo-google-fonts/hanken-grotesk/600SemiBold/HankenGrotesk_600SemiBold.ttf'),
  });
  const onLayout = useCallback(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaProvider>
        <StoreProvider>
          <View style={{ flex: 1, backgroundColor: C.bg }} onLayout={onLayout}>
            <StatusBar style="dark" />
            <Navigator screens={screens} initial="Splash" />
          </View>
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
