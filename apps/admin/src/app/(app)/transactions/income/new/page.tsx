'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { unwrapList, useCreateIncome, useSites } from '@/lib/api-hooks';
import { getErrorMessage } from '@/lib/utils';
import { createIncomeSchema, PaymentMethod } from '@siteflow/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

type FormValues = z.infer<typeof createIncomeSchema>;

function NewIncomeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteId = searchParams.get('siteId') || '';
  const sites = useSites({ pageSize: 100 });
  const create = useCreateIncome();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createIncomeSchema),
    defaultValues: {
      siteId,
      paymentMethod: PaymentMethod.UPI,
    },
  });

  const siteOptions = unwrapList(sites.data).map((s) => ({
    value: s.id,
    label: `${s.name} (${s.code})`,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">Record income</h1>
        <p className="page-subtitle">Client payment against a site</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Income details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={handleSubmit(async (values) => {
              await create.mutateAsync(values);
              router.push('/transactions?tab=income');
            })}
          >
            <div className="sm:col-span-2">
              <Select
                label="Site"
                options={siteOptions}
                placeholder="Select site"
                error={errors.siteId?.message}
                {...register('siteId')}
              />
            </div>
            <Input label="Amount (INR)" error={errors.amount?.message} {...register('amount')} />
            <Input
              label="Date received"
              type="date"
              error={errors.dateReceived?.message}
              {...register('dateReceived')}
            />
            <Select
              label="Payment method"
              options={Object.values(PaymentMethod).map((v) => ({
                value: v,
                label: v.replaceAll('_', ' '),
              }))}
              {...register('paymentMethod')}
            />
            <Input label="Reference no." {...register('referenceNumber')} />
            <div className="sm:col-span-2">
              <Textarea label="Description" {...register('description')} />
            </div>
            {create.isError ? (
              <p className="sm:col-span-2 text-sm text-red-600">{getErrorMessage(create.error)}</p>
            ) : null}
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" variant="teal" loading={create.isPending}>
                Save income
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewIncomePage() {
  return (
    <Suspense>
      <NewIncomeForm />
    </Suspense>
  );
}
