import { Redirect } from 'expo-router';

import { useApp } from '@/context/app-context';

export default function Index() {
  const { session } = useApp();
  return <Redirect href={session ? '/(tabs)' : '/login'} />;
}