import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createExpenseSchema, PaymentMethod, type CreateExpenseInput } from '@siteflow/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/api/finance';
import { Screen } from '@/components/Screen';
import { SelectField } from '@/components/SelectField';
import { useCategories, useSites } from '@/hooks/queries';
import { todayIsoDate, errorMessage, paymentMethodLabel } from '@/lib/utils';
import { colors } from '@/theme/colors';

export default function CreateExpenseScreen() {
  const router = useRouter();
  const { siteId: presetSiteId } = useLocalSearchParams<{ siteId?: string }>();
  const sitesQ = useSites({ pageSize: 100 });
  const categoriesQ = useCategories();
  const qc = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      siteId: presetSiteId || '',
      categoryId: '',
      amount: '',
      expenseDate: todayIsoDate(),
      paymentMethod: PaymentMethod.CASH,
      vendorName: '',
      description: '',
      notes: '',
      initialPaymentAmount: '',
    },
  });

  const siteId = watch('siteId');
  const categoryId = watch('categoryId');
  const paymentMethod = watch('paymentMethod');

  const mutation = useMutation({
    mutationFn: (payload: CreateExpenseInput) => financeApi.createExpense(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['expenses'] });
      await qc.invalidateQueries({ queryKey: ['dashboard'] });
      await qc.invalidateQueries({ queryKey: ['sites'] });
      await qc.invalidateQueries({ queryKey: ['site'] });
      await qc.invalidateQueries({ queryKey: ['site-summary'] });
      router.back();
    },
    onError: (err) => setFormError(errorMessage(err)),
  });

  const onSubmit = handleSubmit((values) => {
    if (mutation.isPending) return;
    setFormError(null);
    const paidNow =
      values.initialPaymentAmount && String(values.initialPaymentAmount).trim() !== ''
        ? values.initialPaymentAmount
        : values.amount;
    mutation.mutate({
      ...values,
      vendorName: values.vendorName || null,
      description: values.description || null,
      notes: values.notes || null,
      referenceNumber: values.referenceNumber || null,
      initialPaymentAmount: paidNow,
    });
  });

  return (
    <Screen contentStyle={styles.screenPad}>
      <Text style={styles.title}>Add site expense</Text>

      <SelectField
        label="Site"
        value={siteId}
        options={(sitesQ.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
        onChange={(v) => setValue('siteId', v, { shouldValidate: true })}
        error={errors.siteId?.message}
        placeholder="Select site"
      />

      <SelectField
        label="Category"
        value={categoryId}
        options={(categoriesQ.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
        onChange={(v) => setValue('categoryId', v, { shouldValidate: true })}
        error={errors.categoryId?.message}
        placeholder="Select category"
      />

      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Amount incurred (₹)"
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
        name="initialPaymentAmount"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Amount paid now (₹)"
            mode="outlined"
            keyboardType="decimal-pad"
            placeholder="Defaults to full amount"
            value={String(value ?? '')}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
          />
        )}
      />
      <Text style={styles.hint}>
        Leave blank to mark fully paid (deducts from Available). Enter less for partial pay.
      </Text>

      <Controller
        control={control}
        name="expenseDate"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Expense date (YYYY-MM-DD)"
            mode="outlined"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
            error={!!errors.expenseDate}
          />
        )}
      />
      {errors.expenseDate ? (
        <HelperText type="error">{String(errors.expenseDate.message)}</HelperText>
      ) : null}

      <SelectField
        label="Payment method"
        value={paymentMethod ?? ''}
        displayValue={paymentMethod ? paymentMethodLabel(paymentMethod) : ''}
        options={Object.values(PaymentMethod).map((m) => ({
          value: m,
          label: paymentMethodLabel(m),
        }))}
        onChange={(v) => setValue('paymentMethod', v as PaymentMethod, { shouldValidate: true })}
        error={errors.paymentMethod?.message}
      />

      <Controller
        control={control}
        name="vendorName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Vendor name (optional)"
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
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Description"
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
        onPress={onSubmit}
        style={styles.btn}
        contentStyle={{ height: 48 }}
      >
        Save expense
      </Button>
      <View style={{ height: 24 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenPad: { paddingBottom: 48 },
  title: { fontSize: 18, fontWeight: '700', color: colors.primary, marginBottom: 12 },
  input: { marginBottom: 8, backgroundColor: colors.surface },
  hint: { marginTop: -2, marginBottom: 8, color: colors.textSecondary, fontSize: 12 },
  btn: { marginTop: 8, borderRadius: 12 },
});
