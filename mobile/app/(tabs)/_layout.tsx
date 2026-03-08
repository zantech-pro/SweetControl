import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import { ThemeType, themes } from '../../src/theme/themes';

export default function TabsLayout() {
  const themeName = useSelector((state: RootState) => state.theme.currentTheme);
  const activeTheme = themes[themeName as ThemeType] || themes.verde;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: activeTheme.card },
        headerTitleStyle: { color: activeTheme.text },
        tabBarStyle: { backgroundColor: activeTheme.card },
        tabBarActiveTintColor: activeTheme.primary,
        tabBarInactiveTintColor: '#7a7a7a',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="vendas"
        options={{
          title: 'Vendas',
          tabBarIcon: ({ color, size }) => <Ionicons name="cash" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="estoque"
        options={{
          title: 'Estoque',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
