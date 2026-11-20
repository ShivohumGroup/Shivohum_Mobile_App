import React from 'react';
import { Text, type TextProps } from 'react-native-paper';
import { formatInr, type MoneyInput } from '@siteflow/shared';
import { colors } from '@/theme/colors';

interface Props extends Omit<TextProps<never>, 'children'> {
  amount: MoneyInput;
  signed?: 'income' | 'expense' | 'none';
}

export function MoneyText({ amount, signed = 'none', style, ...rest }: Props) {
  const prefix = signed === 'income' ? '+' : signed === 'expense' ? '-' : '';
  const color =
    signed === 'income' ? colors.success : signed === 'expense' ? colors.danger : colors.primary;
  return (
    <Text {...rest} style={[{ color, fontWeight: '700' }, style]}>
      {prefix}
      {formatInr(amount)}
    </Text>
  );
}
