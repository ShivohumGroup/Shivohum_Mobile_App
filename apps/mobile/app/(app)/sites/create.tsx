import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ProjectStatus,
  ProjectType,
  createSiteSchema,
  type CreateSiteInput,
} from '@siteflow/shared';
import { useAuth } from '@/auth/AuthContext';
import { sitesApi } from '@/api/sites';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/lib/utils';

export default function CreateSiteScreen() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateSiteInput>({
    resolver: zodResolver(createSiteSchema),
    defaultValues: {
      name: '',
      code: '',
      clientName: '',
      clientPhone: '',
      address: '',
      city: '',
      state: '',
      projectType: ProjectType.RESIDENTIAL,
      contractAmount: '',
      agreedStartDate: new Date().toISOString().slice(0, 10),
      status: ProjectStatus.ACTIVE,
      description: '',
      notes: '',
    },
  });

  const projectType = watch('projectType');

  const create = useMutation({
    mutationFn: (values: CreateSiteInput) =>
      sitesApi.create({
        ...values,
        code: values.code || undefined,
        clientPhone: values.clientPhone || null,
        description: values.description || null,
        notes: values.notes || null,
      }),
    onSuccess: async (site) => {
      await qc.invalidateQueries({ queryKey: ['sites'] });
      await qc.invalidateQueries({ queryKey: ['dashboard'] });
      router.replace(`/(app)/sites/${site.id}`);
    },
    onError: (err) => setFormError(errorMessage(err, 'Could not create site')),
  });

  if (!isAdmin) return <Redirect href="/(app)/(tabs)/sites" />;

  return (
    <Screen>
      <Text style={styles.title}>New site / project</Text>
      <Text style={styles.sub}>Admins can create unlimited sites. Team members only see assigned ones.</Text>

      {(
        [
          ['name', 'Site name'],
          ['code', 'Site code (optional)'],
          ['clientName', 'Client name'],
          ['clientPhone', 'Client phone'],
          ['address', 'Address'],
          ['city', 'City'],
          ['state', 'State'],
          ['contractAmount', 'Contract amount (INR)'],
          ['agreedStartDate', 'Start date (YYYY-MM-DD)'],
        ] as const
      ).map(([name, label]) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <TextInput
                label={label}
                mode="outlined"
                value={value ? String(value) : ''}
                onBlur={onBlur}
                onChangeText={onChange}
                keyboardType={name === 'contractAmount' || name === 'clientPhone' ? 'numeric' : 'default'}
                style={styles.input}
                error={!!errors[name]}
              />
              {errors[name] ? <HelperText type="error">{String(errors[name]?.message)}</HelperText> : null}
            </View>
          )}
        />
      ))}

      <Text style={styles.label}>Project type</Text>
      <View style={styles.row}>
        {Object.values(ProjectType).map((t) => (
          <Button
            key={t}
            compact
            mode={projectType === t ? 'contained' : 'outlined'}
            buttonColor={projectType === t ? colors.accent : undefined}
            style={styles.typeBtn}
            onPress={() => setValue('projectType', t)}
          >
            {t}
          </Button>
        ))}
      </View>

      {formError ? <HelperText type="error">{formError}</HelperText> : null}

      <Button
        mode="contained"
        buttonColor={colors.accent}
        style={styles.btn}
        loading={create.isPending}
        disabled={create.isPending}
        onPress={handleSubmit((values) => {
          setFormError(null);
          create.mutate(values);
        })}
      >
        Create site
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.primary },
  sub: { color: colors.textSecondary, marginVertical: 8, lineHeight: 20 },
  input: { backgroundColor: colors.surface, marginBottom: 4 },
  label: { marginTop: 8, marginBottom: 6, fontWeight: '700', color: colors.primary },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { borderRadius: 10 },
  btn: { marginTop: 16, borderRadius: 12 },
});
