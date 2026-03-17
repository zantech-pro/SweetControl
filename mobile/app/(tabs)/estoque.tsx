import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import { themes, ThemeType } from '../../src/theme/themes';
import { ui } from '../../src/ui/ui';

export default function Estoque() {
  const themeName = useSelector((state: RootState) => state.theme.currentTheme);
  const activeTheme = themes[themeName as ThemeType] || themes.verde;

  return (
    <View style={[ui.screen, styles.container, { backgroundColor: activeTheme.background }]}>
      <View style={ui.card}>
        <Text style={[ui.title, { color: activeTheme.text }]}>Gestao de Estoque</Text>
        <Text style={ui.subtitle}>Em breve: sincronizacao com HostGator.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
});
