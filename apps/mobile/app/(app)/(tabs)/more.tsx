import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Divider, List, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthContext';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';
import { getApiBaseUrl } from '@/api/client';

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();

  return (
    <Screen>
      <View style={styles.profile}>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.meta}>{user?.role?.replace(/_/g, ' ')}</Text>
        {isAdmin ? <Text style={styles.adminBadge}>Full admin access on mobile</Text> : null}
      </View>

      <View style={styles.card}>
        {isAdmin ? (
          <>
            <List.Item
              title="Team"
              description="Invite members & assign sites"
              left={(p) => <List.Icon {...p} icon="account-group" color={colors.accent} />}
              onPress={() => router.push('/(app)/team')}
            />
            <Divider />
            <List.Item
              title="Create site"
              description="Add a new project"
              left={(p) => <List.Icon {...p} icon="office-building-plus" color={colors.accent} />}
              onPress={() => router.push('/(app)/sites/create')}
            />
            <Divider />
          </>
        ) : null}
        <List.Item
          title="Contacts"
          description="Site directory, call & WhatsApp"
          left={(p) => <List.Icon {...p} icon="card-account-phone" color={colors.accent} />}
          onPress={() => router.push('/(app)/contacts')}
        />
        <Divider />
        <List.Item
          title="Progress"
          description="Daily site updates & photos"
          left={(p) => <List.Icon {...p} icon="timeline-text" color={colors.accent} />}
          onPress={() => router.push('/(app)/(tabs)/progress')}
        />
        <Divider />
        <List.Item
          title="Notifications"
          left={(p) => <List.Icon {...p} icon="bell" color={colors.accent} />}
          onPress={() => router.push('/(app)/notifications')}
        />
        <Divider />
        <List.Item
          title="Profile"
          left={(p) => <List.Icon {...p} icon="account" color={colors.accent} />}
          onPress={() => router.push('/(app)/profile')}
        />
        <Divider />
        <List.Item
          title="Settings"
          description="API URL for this device"
          left={(p) => <List.Icon {...p} icon="cog" color={colors.accent} />}
          onPress={() => router.push('/(app)/settings')}
        />
        <Divider />
        <List.Item
          title="Sign out"
          titleStyle={{ color: colors.danger }}
          left={(p) => <List.Icon {...p} icon="logout" color={colors.danger} />}
          onPress={() => void logout()}
        />
      </View>

      <Text style={styles.api}>API: {getApiBaseUrl()}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  name: { color: '#fff', fontSize: 20, fontWeight: '800' },
  meta: { color: '#94A3B8', marginTop: 4 },
  adminBadge: {
    marginTop: 10,
    color: '#5EEAD4',
    fontWeight: '700',
    fontSize: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  api: { marginTop: 16, fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
});
