import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { APP_NAME } from '@siteflow/shared';
import { colors } from '@/theme/colors';

export function LoadingScreen({ message = 'Loading…' }: { message?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.brand}>{APP_NAME}</Text>
      <ActivityIndicator color={colors.accent} style={{ marginTop: 16 }} />
      <Text style={styles.msg}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 24,
  },
  brand: { color: colors.textInverse, fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  msg: { marginTop: 10, color: '#94A3B8', fontSize: 14 },
});
