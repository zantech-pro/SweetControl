// src/theme/themes.ts

export const themes = {
  verde: {
    name: 'Verde',
    primary: '#2E7D32', // Cor da sua logo
    secondary: '#A5D6A7',
    background: '#F1F8E9',
    card: '#FFFFFF',
    text: '#1B5E20',
  },
  rosa: {
    name: 'Rosa',
    primary: '#D81B60',
    secondary: '#F48FB1',
    background: '#FCE4EC',
    card: '#FFFFFF',
    text: '#880E4F',
  },
  azul: {
    name: 'Azul',
    primary: '#1976D2',
    secondary: '#90CAF9',
    background: '#E3F2FD',
    card: '#FFFFFF',
    text: '#0D47A1',
  },
  vermelho: {
    name: 'Vermelho',
    primary: '#D32F2F',
    secondary: '#EF9A9A',
    background: '#FFEBEE',
    card: '#FFFFFF',
    text: '#B71C1C',
  },
  amarelo: {
    name: 'Amarelo',
    primary: '#FBC02D',
    secondary: '#FFF59D',
    background: '#FFFDE7',
    card: '#FFFFFF',
    text: '#F57F17',
  }
};

export type ThemeType = keyof typeof themes;