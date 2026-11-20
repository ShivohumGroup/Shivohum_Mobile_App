import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { colors } from '@/theme/colors';

export function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Couldn’t load</Text>
      <Text style={styles.msg}>{message}</Text>
      {onRetry ? (
        <Button mode="contained" onPress={onRetry} buttonColor={colors.primary} style={{ marginTop: 12 }}>
          Try again
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 24, alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.danger },
  msg: { marginTop: 6, textAlign: 'center', color: colors.textSecondary },
});
