import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Switch, Text, TextInput } from 'react-native-paper';
import { APP_NAME, APP_TAGLINE, CURRENCY_CODE } from '@siteflow/shared';
import { Screen } from '@/components/Screen';
import {
  clearApiBaseUrlOverride,
  getApiBaseUrl,
  hydrateApiBaseUrl,
  setApiBaseUrlOverride,
} from '@/api/apiUrl';
import { setupNotificationInfrastructure } from '@/lib/notificationsSetup';
import { colors } from '@/theme/colors';

export default function SettingsScreen() {
  const [compact, setCompact] = useState(false);
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [saving, setSaving] = useState(false);
  const [notifStatus, setNotifStatus] = useState<string>('Not checked');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void hydrateApiBaseUrl().then((url) => setApiUrl(url));
  }, []);

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.title}>{APP_NAME}</Text>
        <Text style={styles.sub}>{APP_TAGLINE}</Text>
        <Text style={styles.meta}>Currency: {CURRENCY_CODE} · Dates: DD MMM YYYY (IST)</Text>
      </View>

      <Text style={styles.label}>API endpoint</Text>
      <TextInput
        mode="outlined"
        value={apiUrl}
        onChangeText={setApiUrl}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      <Text style={styles.hint}>
        Change this when your PC Wi‑Fi IP changes (e.g. http://192.168.x.x:3001/api/v1). Saved on device —
        no rebuild needed.
      </Text>
      <Button
        mode="contained"
        buttonColor={colors.accent}
        loading={saving}
        disabled={saving}
        style={styles.btn}
        onPress={async () => {
          setSaving(true);
          setMessage(null);
          try {
            const saved = await setApiBaseUrlOverride(apiUrl);
            setApiUrl(saved);
            setMessage('API URL saved on this device.');
          } finally {
            setSaving(false);
          }
        }}
      >
        Save API URL
      </Button>
      <Button
        mode="outlined"
        style={styles.btn}
        onPress={async () => {
          const baked = await clearApiBaseUrlOverride();
          setApiUrl(baked);
          setMessage('Restored build-time API URL.');
        }}
      >
        Reset to build default
      </Button>
      {message ? <Text style={styles.ok}>{message}</Text> : null}

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Compact lists</Text>
          <Text style={styles.hint}>Local preference only</Text>
        </View>
        <Switch value={compact} onValueChange={setCompact} color={colors.accent} />
      </View>

      <Button
        mode="outlined"
        style={styles.btn}
        onPress={async () => {
          const result = await setupNotificationInfrastructure({ registerWithApi: true });
          setNotifStatus(
            `${result.permission}${result.tokenRegistered ? ' · token registered' : ''} — ${result.projectIdHint}`,
          );
        }}
      >
        Check / register notifications
      </Button>
      <Text style={styles.hint}>{notifStatus}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.primary },
  sub: { marginTop: 4, color: colors.textSecondary },
  meta: { marginTop: 10, color: colors.textSecondary, fontSize: 12 },
  label: { fontWeight: '700', color: colors.primary, marginBottom: 6 },
  input: { backgroundColor: colors.surface, marginBottom: 6 },
  hint: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  ok: { color: colors.accent, marginBottom: 12, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  rowTitle: { fontWeight: '700', color: colors.primary },
  btn: { borderRadius: 12, marginBottom: 8 },
});
