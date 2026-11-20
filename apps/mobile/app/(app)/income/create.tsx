import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createIncomeSchema, PaymentMethod, type CreateIncomeInput } from '@siteflow/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/api/finance';
import { Screen } from '@/components/Screen';
import { SelectField } from '@/components/SelectField';
import { useSites } from '@/hooks/queries';
import { todayIsoDate, errorMessage, paymentMethodLabel } from '@/lib/utils';
import { colors } from '@/theme/colors';

export default function CreateIncomeScreen() {
  const router = useRouter();
  const { siteId: presetSiteId } = useLocalSearchParams<{ siteId?: string }>();
  const sitesQ = useSites({ pageSize: 100 });
  const qc = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateIncomeInput>({
    resolver: zodResolver(createIncomeSchema),
    defaultValues: {
      siteId: presetSiteId || '',
      amount: '',
      dateReceived: todayIsoDate(),
      paymentMethod: PaymentMethod.UPI,
      referenceNumber: '',
      description: '',
    },
  });

  const siteId = watch('siteId');
  const paymentMethod = watch('paymentMethod');

  const mutation = useMutation({
    mutationFn: (payload: CreateIncomeInput) => financeApi.createIncome(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['income'] });
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
    mutation.mutate({
      ...values,
      referenceNumber: values.referenceNumber || null,
      description: values.description || null,
    });
  });

  return (
    <Screen contentStyle={styles.screenPad}>
      <Text style={styles.title}>Record client payment</Text>

      <SelectField
        label="Site"
        value={siteId}
        options={(sitesQ.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
        onChange={(v) => setValue('siteId', v, { shouldValidate: true })}
        error={errors.siteId?.message}
        placeholder="Select site"
      />

      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Amount (₹)"
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
        name="dateReceived"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Date received (YYYY-MM-DD)"
            mode="outlined"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
            error={!!errors.dateReceived}
          />
        )}
      />
      {errors.dateReceived ? (
        <HelperText type="error">{String(errors.dateReceived.message)}</HelperText>
      ) : null}

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
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Description (optional)"
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
        Save income
      </Button>
      <View style={{ height: 24 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenPad: { paddingBottom: 48 },
  title: { fontSize: 18, fontWeight: '700', color: colors.primary, marginBottom: 12 },
  input: { marginBottom: 8, backgroundColor: colors.surface },
  btn: { marginTop: 8, borderRadius: 12 },
});
