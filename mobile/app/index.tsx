import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../src/store';

export default function AppIndex() {
  const isAuthenticated = useSelector((state: RootState) => state.session.isAuthenticated);
  return <Redirect href={(isAuthenticated ? '/(tabs)' : '/login') as never} />;
}
