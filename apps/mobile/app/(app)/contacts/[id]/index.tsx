import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ErrorView } from '@/components/ErrorView';
import { useContact } from '@/hooks/queries';
import { copyPhone, dialPhone, openWhatsApp } from '@/lib/contactActions';
import { errorMessage } from '@/lib/utils';
import { colors } from '@/theme/colors';

export default function ContactDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const q = useContact(id);
  const c = q.data;

  if (q.isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (q.error || !c) {
    return (
      <Screen>
        <ErrorView message={errorMessage(q.error)} onRetry={() => void q.refetch()} />
      </Screen>
    );
  }

  const whatsapp = c.whatsappNumber || c.primaryPhone;

  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
      <View style={styles.card}>
        <Text style={styles.name}>{c.personName}</Text>
        <Text style={styles.sub}>
          {c.workCategory}
          {c.designation ? ` · ${c.designation}` : ''}
        </Text>
        {c.companyName ? <Text style={styles.sub}>{c.companyName}</Text> : null}
        <Text style={styles.phone}>{c.primaryPhone}</Text>
        {c.email ? <Text style={styles.sub}>{c.email}</Text> : null}
        {c.address ? <Text style={styles.sub}>{c.address}</Text> : null}
        {c.notes ? <Text style={styles.notes}>{c.notes}</Text> : null}
        {c.sites?.length ? (
          <Text style={styles.sites}>Sites: {c.sites.map((s) => s.name).join(', ')}</Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button mode="contained" icon="phone" buttonColor={colors.primary} style={styles.btn} onPress={() => void dialPhone(c.primaryPhone)}>
          Call
        </Button>
        <Button mode="contained" icon="whatsapp" buttonColor="#25D366" style={styles.btn} onPress={() => void openWhatsApp(whatsapp)}>
          WhatsApp
        </Button>
      </View>
      <Button mode="outlined" icon="content-copy" style={styles.btn} onPress={() => void copyPhone(c.primaryPhone)}>
        Copy phone
      </Button>
      <Button mode="outlined" icon="pencil" style={styles.btn} onPress={() => router.push(`/(app)/contacts/${id}/edit`)}>
        Edit contact
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  name: { fontSize: 22, fontWeight: '800', color: colors.primary },
  sub: { marginTop: 4, color: colors.textSecondary },
  phone: { marginTop: 10, fontSize: 18, fontWeight: '700', color: colors.accent },
  notes: { marginTop: 12, color: colors.text, lineHeight: 20 },
  sites: { marginTop: 12, fontSize: 12, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, marginBottom: 8, borderRadius: 12 },
});
