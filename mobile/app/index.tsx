import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { themes, ThemeType } from '../src/theme/themes';
import { setTheme } from '../src/store/slices/themeSlice';
import { RootState } from '../src/store';

export default function Home() {
  const dispatch = useDispatch();
  const themeName = useSelector((state: RootState) => state.theme.currentTheme);
  const activeTheme = themes[themeName as ThemeType] || themes.verde;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: activeTheme.background }}>
      <View style={styles.container}>
        <Text style={[styles.welcome, { color: activeTheme.text }]}>
          Bem-vinda, Simone!
        </Text>
        
        <View style={[styles.card, { backgroundColor: activeTheme.card }]}>
          <Text style={styles.cardTitle}>Escolha a cor do seu dia:</Text>
          
          <View style={styles.grid}>
            {(Object.keys(themes) as ThemeType[]).map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.btn, 
                  { backgroundColor: themes[key].primary },
                  themeName === key && styles.btnActive
                ]}
                onPress={() => dispatch(setTheme(key))}
              >
                <Text style={styles.btnText}>{themes[key].name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  welcome: { fontSize: 24, fontWeight: 'bold', marginVertical: 20 },
  card: { width: '100%', padding: 20, borderRadius: 15, elevation: 3 },
  cardTitle: { fontSize: 16, marginBottom: 15, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  btn: { width: '48%', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  btnActive: { borderWidth: 3, borderColor: '#000' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});