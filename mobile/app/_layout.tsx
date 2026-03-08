import { Slot } from 'expo-router';
import { StoreProvider } from '../src/store/StoreProvider';

export default function RootLayout() {
  return (
    <StoreProvider>
      <Slot />
    </StoreProvider>
  );
}
