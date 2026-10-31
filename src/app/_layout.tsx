import { BlackHanSans_400Regular } from '@expo-google-fonts/black-han-sans';
import {
  IBMPlexSansKR_400Regular, IBMPlexSansKR_500Medium, IBMPlexSansKR_600SemiBold, IBMPlexSansKR_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-kr';
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { useBeat } from '@/constants/beat-theme';
import { StoreProvider } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();
  const c = useBeat();
  const [loaded, error] = useFonts({
    BlackHanSans_400Regular,
    IBMPlexSansKR_400Regular, IBMPlexSansKR_500Medium, IBMPlexSansKR_600SemiBold, IBMPlexSansKR_700Bold,
    JetBrainsMono_500Medium, JetBrainsMono_700Bold,
  });
  useEffect(() => { if (loaded || error) SplashScreen.hideAsync(); }, [loaded, error]);
  if (!loaded && !error) return null;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = { ...base, colors: { ...base.colors, background: c.bg, card: c.surface, text: c.ink, border: c.line, primary: c.accent } };
  return (
    <ThemeProvider value={theme}>
      <StoreProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="lesson/[id]" />
        </Stack>
      </StoreProvider>
    </ThemeProvider>
  );
}
