'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateSite } from '@/lib/api-hooks';
import { getErrorMessage } from '@/lib/utils';
import { createSiteSchema, ProjectStatus, ProjectType } from '@siteflow/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

type FormValues = z.infer<typeof createSiteSchema>;

export default function NewSitePage() {
  const router = useRouter();
  const create = useCreateSite();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createSiteSchema),
    defaultValues: {
      status: ProjectStatus.PLANNING,
      projectType: ProjectType.RESIDENTIAL,
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">New site</h1>
        <p className="page-subtitle">Register a construction project</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Site details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={handleSubmit(async (values) => {
              const site = await create.mutateAsync(values);
              router.push(`/sites/${site.id}`);
            })}
          >
            <Input label="Site name" error={errors.name?.message} {...register('name')} />
            <Input label="Code (optional)" error={errors.code?.message} {...register('code')} />
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
              error={errors.projectType?.message}
              {...register('projectType')}
            />
            <Select
              label="Status"
              options={Object.values(ProjectStatus).map((v) => ({
                value: v,
                label: v.replaceAll('_', ' '),
              }))}
              error={errors.status?.message}
              {...register('status')}
            />
            <Input
              label="Contract amount (INR)"
              error={errors.contractAmount?.message}
              {...register('contractAmount')}
            />
            <Input
              label="Agreed start date"
              type="date"
              error={errors.agreedStartDate?.message}
              {...register('agreedStartDate')}
            />
            <Input
              label="Expected completion"
              type="date"
              error={errors.expectedCompletionDate?.message}
              {...register('expectedCompletionDate')}
            />
            <div className="sm:col-span-2">
              <Textarea label="Description" error={errors.description?.message} {...register('description')} />
            </div>
            <div className="sm:col-span-2">
              <Textarea label="Notes" error={errors.notes?.message} {...register('notes')} />
            </div>
            {create.isError ? (
              <p className="sm:col-span-2 text-sm text-red-600">{getErrorMessage(create.error)}</p>
            ) : null}
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" variant="teal" loading={create.isPending}>
                Create site
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
