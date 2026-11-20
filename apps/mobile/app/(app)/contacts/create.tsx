import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Checkbox, HelperText, Text, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createContactSchema, type CreateContactInput } from '@siteflow/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi } from '@/api/contacts';
import { Screen } from '@/components/Screen';
import { useSites } from '@/hooks/queries';
import { errorMessage } from '@/lib/utils';
import { colors } from '@/theme/colors';

export default function CreateContactScreen() {
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId?: string }>();
  const sitesQ = useSites({ pageSize: 100 });
  const qc = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateContactInput>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      siteIds: siteId ? [siteId] : [],
      personName: '',
      companyName: '',
      workCategory: '',
      designation: '',
      primaryPhone: '',
      alternatePhone: '',
      whatsappNumber: '',
      email: '',
      address: '',
      notes: '',
    },
  });

  const siteIds = watch('siteIds') || [];

  const mutation = useMutation({
    mutationFn: (payload: CreateContactInput) => contactsApi.create(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['contacts'] });
      router.back();
    },
    onError: (err) => setFormError(errorMessage(err)),
  });

  const toggleSite = (id: string) => {
    const next = siteIds.includes(id) ? siteIds.filter((s) => s !== id) : [...siteIds, id];
    setValue('siteIds', next, { shouldValidate: true });
  };

  return (
    <Screen>
      <Text style={styles.title}>New contact</Text>

      <Text style={styles.label}>Linked sites</Text>
      <View style={styles.sites}>
        {(sitesQ.data ?? []).map((s) => (
          <Checkbox.Item
            key={s.id}
            label={s.name}
            status={siteIds.includes(s.id) ? 'checked' : 'unchecked'}
            onPress={() => toggleSite(s.id)}
            position="leading"
            color={colors.accent}
            style={styles.check}
          />
        ))}
      </View>
      {errors.siteIds ? <HelperText type="error">{errors.siteIds.message as string}</HelperText> : null}

      {(
        [
          ['personName', 'Person name'],
          ['companyName', 'Company (optional)'],
          ['workCategory', 'Work category'],
          ['designation', 'Designation (optional)'],
          ['primaryPhone', 'Primary phone'],
          ['alternatePhone', 'Alternate phone'],
          ['whatsappNumber', 'WhatsApp number'],
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
              value={value ?? ''}
              onBlur={onBlur}
              onChangeText={onChange}
              style={styles.input}
              multiline={name === 'notes' || name === 'address'}
              keyboardType={
                name.includes('Phone') || name === 'whatsappNumber'
                  ? 'phone-pad'
                  : name === 'email'
                    ? 'email-address'
                    : 'default'
              }
              error={!!errors[name]}
            />
          )}
        />
      ))}
      {errors.personName ? <HelperText type="error">{errors.personName.message}</HelperText> : null}
      {errors.primaryPhone ? <HelperText type="error">{errors.primaryPhone.message}</HelperText> : null}
      {errors.workCategory ? <HelperText type="error">{errors.workCategory.message}</HelperText> : null}
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
            companyName: values.companyName || null,
            designation: values.designation || null,
            alternatePhone: values.alternatePhone || null,
            whatsappNumber: values.whatsappNumber || null,
            email: values.email || null,
            address: values.address || null,
            notes: values.notes || null,
          });
        })}
        style={styles.btn}
      >
        Save contact
      </Button>
      <View style={{ height: 40 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', color: colors.primary, marginBottom: 12 },
  label: { fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  sites: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  check: { paddingVertical: 0 },
  input: { marginBottom: 8, backgroundColor: colors.surface },
  btn: { marginTop: 8, borderRadius: 12 },
});
