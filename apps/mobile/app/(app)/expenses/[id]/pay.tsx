import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createExpensePaymentSchema,
  formatInr,
  PaymentMethod,
  type CreateExpensePaymentInput,
} from '@siteflow/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/api/finance';
import { Screen } from '@/components/Screen';
import { SelectField } from '@/components/SelectField';
import { ErrorView } from '@/components/ErrorView';
import { todayIsoDate, errorMessage, paymentMethodLabel } from '@/lib/utils';
import { colors } from '@/theme/colors';

export default function ExpensePaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const expenseQ = useQuery({
    queryKey: ['expense', id],
    queryFn: () => financeApi.getExpense(id),
    enabled: !!id,
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateExpensePaymentInput>({
    resolver: zodResolver(createExpensePaymentSchema),
    defaultValues: {
      amount: '',
      paidAt: todayIsoDate(),
      paymentMethod: PaymentMethod.UPI,
      referenceNumber: '',
      notes: '',
    },
  });

  const paymentMethod = watch('paymentMethod');

  const mutation = useMutation({
    mutationFn: (payload: CreateExpensePaymentInput) => financeApi.addExpensePayment(id, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['expense', id] });
      await qc.invalidateQueries({ queryKey: ['expenses'] });
      await qc.invalidateQueries({ queryKey: ['dashboard'] });
      await qc.invalidateQueries({ queryKey: ['sites'] });
      await qc.invalidateQueries({ queryKey: ['site'] });
      await qc.invalidateQueries({ queryKey: ['site-summary'] });
      router.back();
    },
    onError: (err) => setFormError(errorMessage(err)),
  });

  if (expenseQ.isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (expenseQ.error || !expenseQ.data) {
    return (
      <Screen>
        <ErrorView message={errorMessage(expenseQ.error)} onRetry={() => void expenseQ.refetch()} />
      </Screen>
    );
  }

  const expense = expenseQ.data;
  const outstanding = Number(expense.amount) - Number(expense.amountPaid);

  return (
    <Screen>
      <View style={styles.summary}>
        <Text style={styles.title}>{expense.description || expense.category?.name || 'Expense'}</Text>
        <Text style={styles.meta}>Total {formatInr(expense.amount)} · Paid {formatInr(expense.amountPaid)}</Text>
        <Text style={styles.out}>Outstanding {formatInr(Math.max(0, outstanding))}</Text>
      </View>

      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Payment amount (₹)"
            mode="outlined"
            keyboardType="decimal-pad"
            value={String(value ?? '')}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
            error={!!errors.amount}
          />
        )}
      />
      {errors.amount ? <HelperText type="error">{String(errors.amount.message)}</HelperText> : null}

      <Controller
        control={control}
        name="paidAt"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Paid on (YYYY-MM-DD)"
            mode="outlined"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
          />
        )}
      />

      <SelectField
        label="Payment method"
        value={paymentMethod}
        displayValue={paymentMethodLabel(paymentMethod)}
        options={Object.values(PaymentMethod).map((m) => ({
          value: m,
          label: paymentMethodLabel(m),
        }))}
        onChange={(v) => setValue('paymentMethod', v as PaymentMethod, { shouldValidate: true })}
        error={errors.paymentMethod?.message}
      />

      <Controller
        control={control}
        name="referenceNumber"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Reference (optional)"
            mode="outlined"
            value={value ?? ''}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
          />
        )}
      />

      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Notes (optional)"
            mode="outlined"
            multiline
            value={value ?? ''}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
          />
        )}
      />

      {formError ? <HelperText type="error">{formError}</HelperText> : null}

      <Button
        mode="contained"
        buttonColor={colors.accent}
        loading={mutation.isPending}
        disabled={mutation.isPending}
        onPress={handleSubmit((values) => {
          if (mutation.isPending) return;
          setFormError(null);
          mutation.mutate({
            ...values,
            referenceNumber: values.referenceNumber || null,
            notes: values.notes || null,
          });
        })}
        style={styles.btn}
      >
        Save payment
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.primary },
  meta: { marginTop: 6, color: colors.textSecondary },
  out: { marginTop: 4, color: colors.warning, fontWeight: '700' },
  input: { marginBottom: 8, backgroundColor: colors.surface },
  btn: { marginTop: 8, borderRadius: 12 },
});
