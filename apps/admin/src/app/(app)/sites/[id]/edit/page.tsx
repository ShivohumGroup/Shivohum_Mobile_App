'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CardSkeleton } from '@/components/ui/skeleton';
import { useSite, useUpdateSite } from '@/lib/api-hooks';
import { getErrorMessage } from '@/lib/utils';
import { ProjectStatus, ProjectType, updateSiteSchema } from '@siteflow/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

type FormValues = z.infer<typeof updateSiteSchema>;

function toDateInput(value?: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

export default function EditSitePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { data: site, isLoading } = useSite(id);
  const update = useUpdateSite(id);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(updateSiteSchema),
  });

  useEffect(() => {
    if (!site) return;
    reset({
      name: site.name,
      code: site.code,
      clientName: site.clientName,
      clientPhone: site.clientPhone ?? undefined,
      address: site.address,
      city: site.city,
      state: site.state,
      projectType: site.projectType,
      description: site.description ?? undefined,
      contractAmount: String(site.contractAmount),
      agreedStartDate: toDateInput(site.agreedStartDate),
      expectedCompletionDate: toDateInput(site.expectedCompletionDate) || undefined,
      status: site.status,
      notes: site.notes ?? undefined,
      projectManagerId: site.projectManagerId ?? undefined,
    });
  }, [site, reset]);

  if (isLoading) return <CardSkeleton />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">Edit site</h1>
        <p className="page-subtitle">{site?.name}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Site details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={handleSubmit(async (values) => {
              await update.mutateAsync(values);
              router.push(`/sites/${id}`);
            })}
          >
            <Input label="Site name" error={errors.name?.message} {...register('name')} />
            <Input label="Code" error={errors.code?.message} {...register('code')} />
            <Input label="Client name" error={errors.clientName?.message} {...register('clientName')} />
            <Input label="Client phone" error={errors.clientPhone?.message} {...register('clientPhone')} />
            <div className="sm:col-span-2">
              <Input label="Address" error={errors.address?.message} {...register('address')} />
            </div>
            <Input label="City" error={errors.city?.message} {...register('city')} />
            <Input label="State" error={errors.state?.message} {...register('state')} />
            <Select
              label="Project type"
              options={Object.values(ProjectType).map((v) => ({
                value: v,
                label: v.replaceAll('_', ' '),
              }))}
              {...register('projectType')}
            />
            <Select
              label="Status"
              options={Object.values(ProjectStatus).map((v) => ({
                value: v,
                label: v.replaceAll('_', ' '),
              }))}
              {...register('status')}
            />
            <Input label="Contract amount" {...register('contractAmount')} />
            <Input label="Start date" type="date" {...register('agreedStartDate')} />
            <Input label="Expected completion" type="date" {...register('expectedCompletionDate')} />
            <div className="sm:col-span-2">
              <Textarea label="Description" {...register('description')} />
            </div>
            <div className="sm:col-span-2">
              <Textarea label="Notes" {...register('notes')} />
            </div>
            {update.isError ? (
              <p className="sm:col-span-2 text-sm text-red-600">{getErrorMessage(update.error)}</p>
            ) : null}
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" variant="teal" loading={update.isPending}>
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
