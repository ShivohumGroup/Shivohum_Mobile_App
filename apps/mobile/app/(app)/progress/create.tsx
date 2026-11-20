import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProgressSchema, type CreateProgressInput } from '@siteflow/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { progressApi } from '@/api/progress';
import { Screen } from '@/components/Screen';
import { SelectField } from '@/components/SelectField';
import { useSites } from '@/hooks/queries';
import { todayIsoDate, errorMessage } from '@/lib/utils';
import { colors } from '@/theme/colors';

export default function CreateProgressScreen() {
  const router = useRouter();
  const { siteId: presetSiteId } = useLocalSearchParams<{ siteId?: string }>();
  const sitesQ = useSites({ pageSize: 100 });
  const qc = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Array<{ uri: string; fileName: string; mimeType: string }>>([]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateProgressInput>({
    resolver: zodResolver(createProgressSchema),
    defaultValues: {
      siteId: presetSiteId || '',
      updateDate: todayIsoDate(),
      title: '',
      description: '',
      workCategory: '',
      completedWork: '',
      workInProgress: '',
      blockers: '',
      nextDayPlan: '',
      completionPercent: undefined,
    },
  });

  const siteId = watch('siteId');

  const mutation = useMutation({
    mutationFn: async (payload: CreateProgressInput) => {
      const created = await progressApi.create(payload);
      for (const photo of photos) {
        try {
          await progressApi.uploadPhoto(created.id, photo.uri, photo.fileName, photo.mimeType);
        } catch {
          // keep progress even if a photo upload fails
        }
      }
      return created;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['progress'] });
      await qc.invalidateQueries({ queryKey: ['dashboard'] });
      router.back();
    },
    onError: (err) => setFormError(errorMessage(err)),
  });

  const pickPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setFormError('Photo library permission is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 6,
    });
    if (result.canceled) return;
    setPhotos((prev) => [
      ...prev,
      ...result.assets.map((a, idx) => ({
        uri: a.uri,
        fileName: a.fileName || `progress-${Date.now()}-${idx}.jpg`,
        mimeType: a.mimeType || 'image/jpeg',
      })),
    ]);
  };

  return (
    <Screen contentStyle={styles.screenPad}>
      <Text style={styles.title}>Daily progress update</Text>

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
        name="updateDate"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput label="Update date (YYYY-MM-DD)" mode="outlined" value={value} onBlur={onBlur} onChangeText={onChange} style={styles.input} error={!!errors.updateDate} />
        )}
      />
      {errors.updateDate ? <HelperText type="error">{errors.updateDate.message}</HelperText> : null}
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput label="Title" mode="outlined" value={value} onBlur={onBlur} onChangeText={onChange} style={styles.input} error={!!errors.title} />
        )}
      />
      {errors.title ? <HelperText type="error">{errors.title.message}</HelperText> : null}

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput label="Description" mode="outlined" multiline value={value} onBlur={onBlur} onChangeText={onChange} style={styles.input} error={!!errors.description} />
        )}
      />
      {errors.description ? <HelperText type="error">{errors.description.message}</HelperText> : null}

      {(
        [
          ['workCategory', 'Work category'],
          ['completedWork', 'Completed work'],
          ['workInProgress', 'Work in progress'],
          ['blockers', 'Blockers'],
          ['nextDayPlan', 'Next-day plan'],
        ] as const
      ).map(([name, label]) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label={`${label} (optional)`}
              mode="outlined"
              multiline={name !== 'workCategory'}
              value={value ?? ''}
              onBlur={onBlur}
              onChangeText={onChange}
              style={styles.input}
            />
          )}
        />
      ))}

      <Controller
        control={control}
        name="completionPercent"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Completion % (optional)"
            mode="outlined"
            keyboardType="number-pad"
            value={value === undefined || value === null ? '' : String(value)}
            onBlur={onBlur}
            onChangeText={(t) => onChange(t === '' ? undefined : Number(t))}
            style={styles.input}
            error={!!errors.completionPercent}
          />
        )}
      />
      {errors.completionPercent ? (
        <HelperText type="error">{String(errors.completionPercent.message)}</HelperText>
      ) : null}

      <Button mode="outlined" icon="image-plus" onPress={() => void pickPhotos()} style={styles.btn}>
        Add photos ({photos.length})
      </Button>

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
            workCategory: values.workCategory || null,
            completedWork: values.completedWork || null,
            workInProgress: values.workInProgress || null,
            blockers: values.blockers || null,
            nextDayPlan: values.nextDayPlan || null,
            completionPercent: values.completionPercent ?? null,
          });
        })}
        style={styles.btn}
      >
        Post update
      </Button>
      <View style={{ height: 40 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenPad: { paddingBottom: 48 },
  title: { fontSize: 18, fontWeight: '700', color: colors.primary, marginBottom: 12 },
  input: { marginBottom: 8, backgroundColor: colors.surface },
  btn: { marginTop: 8, borderRadius: 12 },
});
