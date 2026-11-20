import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createScheduleTaskSchema,
  ScheduleTaskStatus,
  type CreateScheduleTaskInput,
} from '@siteflow/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleApi } from '@/api/schedule';
import { Screen } from '@/components/Screen';
import { SelectField } from '@/components/SelectField';
import { useSites } from '@/hooks/queries';
import { todayIsoDate, errorMessage } from '@/lib/utils';
import { colors } from '@/theme/colors';

const CATEGORY_SUGGESTIONS = [
  'Excavation',
  'Plumbing',
  'Electrical',
  'Labour',
  'Material delivery',
  'Client meeting',
  'Inspection',
  'Other',
];

export default function CreateScheduleScreen() {
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
  } = useForm<CreateScheduleTaskInput>({
    resolver: zodResolver(createScheduleTaskSchema),
    defaultValues: {
      siteId: presetSiteId || null,
      title: '',
      notes: '',
      category: '',
      scheduledDate: todayIsoDate(),
      status: ScheduleTaskStatus.PLANNED,
    },
  });

  const siteId = watch('siteId') || '';
  const category = watch('category') || '';

  const mutation = useMutation({
    mutationFn: (payload: CreateScheduleTaskInput) => scheduleApi.create(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['schedule'] });
      router.back();
    },
    onError: (err) => setFormError(errorMessage(err)),
  });

  const onSubmit = handleSubmit((values) => {
    if (mutation.isPending) return;
    setFormError(null);
    mutation.mutate({
      ...values,
      siteId: values.siteId || null,
      notes: values.notes || null,
      category: values.category || null,
    });
  });

  return (
    <Screen contentStyle={styles.screenPad}>
      <Text style={styles.title}>Plan a future task</Text>
      <Text style={styles.sub}>
        Examples: excavation tomorrow, call plumber, order tiles, client site visit.
      </Text>

      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Task title"
            mode="outlined"
            placeholder="e.g. Call plumber for bathroom"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
            error={!!errors.title}
          />
        )}
      />
      {errors.title ? <HelperText type="error">{errors.title.message}</HelperText> : null}

      <SelectField
        label="Site (optional)"
        value={siteId}
        options={[
          { value: '', label: 'No site / general' },
          ...(sitesQ.data ?? []).map((s) => ({ value: s.id, label: s.name })),
        ]}
        onChange={(v) => setValue('siteId', v || null, { shouldValidate: true })}
        error={errors.siteId?.message}
        placeholder="Select site"
      />

      <SelectField
        label="Category (optional)"
        value={category}
        options={CATEGORY_SUGGESTIONS.map((c) => ({ value: c, label: c }))}
        onChange={(v) => setValue('category', v, { shouldValidate: true })}
        placeholder="Select category"
      />

      <Controller
        control={control}
        name="scheduledDate"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Schedule date (YYYY-MM-DD)"
            mode="outlined"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            style={styles.input}
            error={!!errors.scheduledDate}
          />
        )}
      />
      {errors.scheduledDate ? (
        <HelperText type="error">{String(errors.scheduledDate.message)}</HelperText>
      ) : null}

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
        onPress={onSubmit}
        style={styles.btn}
        contentStyle={{ height: 48 }}
      >
        Save task
      </Button>
      <View style={{ height: 24 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenPad: { paddingBottom: 48 },
  title: { fontSize: 18, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  sub: { color: colors.textSecondary, marginBottom: 14, lineHeight: 20 },
  input: { marginBottom: 8, backgroundColor: colors.surface },
  btn: { marginTop: 8, borderRadius: 12 },
});
