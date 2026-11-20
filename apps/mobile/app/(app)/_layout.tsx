import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/auth/AuthContext';
import { LoadingScreen } from '@/components/LoadingScreen';
import { colors } from '@/theme/colors';

export default function AppLayout() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="sites/create" options={{ title: 'Create site' }} />
      <Stack.Screen name="sites/[id]/index" options={{ title: 'Site details' }} />
      <Stack.Screen name="sites/[id]/financial" options={{ title: 'Financial summary' }} />
      <Stack.Screen name="team/index" options={{ title: 'Team' }} />
      <Stack.Screen name="team/invite" options={{ title: 'Invite member' }} />
      <Stack.Screen name="team/[id]" options={{ title: 'Team member' }} />
      <Stack.Screen name="income/create" options={{ title: 'Add income' }} />
      <Stack.Screen name="expenses/create" options={{ title: 'Add expense' }} />
      <Stack.Screen name="expenses/[id]/pay" options={{ title: 'Record payment' }} />
      <Stack.Screen name="transactions/[id]" options={{ title: 'Transaction' }} />
      <Stack.Screen name="contacts/index" options={{ title: 'Contacts' }} />
      <Stack.Screen name="contacts/create" options={{ title: 'Add contact' }} />
      <Stack.Screen name="contacts/[id]/index" options={{ title: 'Contact' }} />
      <Stack.Screen name="contacts/[id]/edit" options={{ title: 'Edit contact' }} />
      <Stack.Screen name="progress/create" options={{ title: 'Add progress' }} />
      <Stack.Screen name="progress/[id]" options={{ title: 'Progress update' }} />
      <Stack.Screen name="progress/gallery" options={{ title: 'Photo gallery' }} />
      <Stack.Screen name="schedule/create" options={{ title: 'Add schedule' }} />
      <Stack.Screen name="schedule/[id]" options={{ title: 'Schedule task' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
