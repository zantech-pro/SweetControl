import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Stack } from 'expo-router';
import { store, persistor, RootState } from '../src/store';
import { themes, ThemeType } from '../src/theme/themes';

function RootLayoutNav() {
  // Pega o tema do Redux
  const themeName = useSelector((state: RootState) => state.theme.currentTheme);
  const activeTheme = themes[themeName as ThemeType] || themes.verde;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: activeTheme.primary },
        headerTintColor: '#fff',
        contentStyle: { backgroundColor: activeTheme.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'SweetControl 🧁' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RootLayoutNav />
      </PersistGate>
    </Provider>
  );
}