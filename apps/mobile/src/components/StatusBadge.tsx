import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '@/theme/colors';
import { statusLabel } from '@/lib/utils';

const TONE: Record<string, { bg: string; fg: string }> = {
  ACTIVE: { bg: '#D1FAE5', fg: colors.success },
  PLANNING: { bg: '#DBEAFE', fg: colors.info },
  ON_HOLD: { bg: '#FEF3C7', fg: colors.warning },
  COMPLETED: { bg: '#E0E7FF', fg: '#4338CA' },
  CANCELLED: { bg: '#FEE2E2', fg: colors.danger },
  ARCHIVED: { bg: '#E2E8F0', fg: colors.textSecondary },
  CONFIRMED: { bg: '#D1FAE5', fg: colors.success },
  PENDING: { bg: '#FEF3C7', fg: colors.warning },
  VOIDED: { bg: '#FEE2E2', fg: colors.danger },
  REJECTED: { bg: '#FEE2E2', fg: colors.danger },
  PAID: { bg: '#D1FAE5', fg: colors.success },
  PARTIALLY_PAID: { bg: '#FEF3C7', fg: colors.warning },
  UNPAID: { bg: '#FEE2E2', fg: colors.danger },
  PLANNED: { bg: '#DBEAFE', fg: colors.info },
  IN_PROGRESS: { bg: '#FEF3C7', fg: colors.warning },
  DONE: { bg: '#D1FAE5', fg: colors.success },
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONE[status] ?? { bg: colors.surfaceAlt, fg: colors.textSecondary };
  return (
    <Text style={[styles.badge, { backgroundColor: tone.bg, color: tone.fg }]}>
      {statusLabel(status)}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '700',
  },
});
