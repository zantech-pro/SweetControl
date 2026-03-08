const fallbackApiBaseUrl = 'https://sweetcontrol.zantech.com.br/api';

export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? fallbackApiBaseUrl,
};

