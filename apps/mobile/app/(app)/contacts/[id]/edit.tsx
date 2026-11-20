import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Checkbox, HelperText, Text, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateContactSchema } from '@siteflow/shared';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi } from '@/api/contacts';
import { Screen } from '@/components/Screen';
import { ErrorView } from '@/components/ErrorView';
import { useContact, useSites } from '@/hooks/queries';
import { errorMessage } from '@/lib/utils';
import { colors } from '@/theme/colors';

type FormValues = z.infer<typeof updateContactSchema>;

export default function EditContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const contactQ = useContact(id);
  const sitesQ = useSites({ pageSize: 100 });
  const qc = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(updateContactSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (!contactQ.data) return;
    const c = contactQ.data;
    reset({
      siteIds: c.sites?.map((s) => s.id) || c.siteIds || [],
      personName: c.personName,
      companyName: c.companyName || '',
      workCategory: c.workCategory,
      designation: c.designation || '',
      primaryPhone: c.primaryPhone,
      alternatePhone: c.alternatePhone || '',
      whatsappNumber: c.whatsappNumber || '',
      email: c.email || '',
      address: c.address || '',
      notes: c.notes || '',
      isActive: c.isActive,
    });
  }, [contactQ.data, reset]);

  const siteIds = watch('siteIds') || [];
  const isActive = watch('isActive');

  const mutation = useMutation({
    mutationFn: (payload: FormValues) => contactsApi.update(id, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['contacts'] });
      await qc.invalidateQueries({ queryKey: ['contact', id] });
      router.back();
    },
    onError: (err) => setFormError(errorMessage(err)),
  });

  if (contactQ.isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (contactQ.error || !contactQ.data) {
    return (
      <Screen>
        <ErrorView message={errorMessage(contactQ.error)} onRetry={() => void contactQ.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Edit contact</Text>
      <View style={styles.sites}>
        {(sitesQ.data ?? []).map((s) => (
          <Checkbox.Item
            key={s.id}
            label={s.name}
            status={siteIds.includes(s.id) ? 'checked' : 'unchecked'}
            onPress={() => {
              const next = siteIds.includes(s.id) ? siteIds.filter((x) => x !== s.id) : [...siteIds, s.id];
              setValue('siteIds', next);
            }}
            position="leading"
            color={colors.accent}
          />
        ))}
      </View>

      {(
        [
          ['personName', 'Person name'],
          ['companyName', 'Company'],
          ['workCategory', 'Work category'],
          ['designation', 'Designation'],
          ['primaryPhone', 'Primary phone'],
          ['alternatePhone', 'Alternate phone'],
          ['whatsappNumber', 'WhatsApp'],
          ['email', 'Email'],
          ['address', 'Address'],
          ['notes', 'Notes'],
        ] as const
      ).map(([name, label]) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label={label}
              mode="outlined"
              value={(value as string) ?? ''}
              onBlur={onBlur}
              onChangeText={onChange}
              style={styles.input}
              multiline={name === 'notes' || name === 'address'}
            />
          )}
        />
      ))}

      <Checkbox.Item
        label="Active"
        status={isActive ? 'checked' : 'unchecked'}
        onPress={() => setValue('isActive', !isActive)}
        position="leading"
        color={colors.accent}
      />

      {formError ? <HelperText type="error">{formError}</HelperText> : null}
      {errors.primaryPhone ? <HelperText type="error">{errors.primaryPhone.message}</HelperText> : null}

      <Button
        mode="contained"
        buttonColor={colors.accent}
        loading={mutation.isPending}
        disabled={mutation.isPending}
        onPress={handleSubmit((values) => {
          if (mutation.isPending) return;
          setFormError(null);
          mutation.mutate(values);
        })}
        style={styles.btn}
      >
        Save changes
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', color: colors.primary, marginBottom: 12 },
  sites: { backgroundColor: colors.surface, borderRadius: 12, marginBottom: 10 },
  input: { marginBottom: 8, backgroundColor: colors.surface },
  btn: { marginTop: 8, borderRadius: 12 },
});
