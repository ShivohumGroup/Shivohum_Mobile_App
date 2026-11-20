'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { unwrapList, useCategories, useCreateExpense, useSites } from '@/lib/api-hooks';
import { getErrorMessage } from '@/lib/utils';
import { createExpenseSchema, PaymentMethod } from '@siteflow/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

type FormValues = z.infer<typeof createExpenseSchema>;

function NewExpenseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteId = searchParams.get('siteId') || '';
  const sites = useSites({ pageSize: 100 });
  const categories = useCategories();
  const create = useCreateExpense();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: { siteId },
  });

  const siteOptions = unwrapList(sites.data).map((s) => ({
    value: s.id,
    label: `${s.name} (${s.code})`,
  }));
  const categoryOptions = unwrapList(categories.data).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">Add expense</h1>
        <p className="page-subtitle">Vendor bill or site cost</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Expense details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={handleSubmit(async (values) => {
              await create.mutateAsync(values);
              router.push('/transactions?tab=expenses');
            })}
          >
            <Select
              label="Site"
              options={siteOptions}
              placeholder="Select site"
              error={errors.siteId?.message}
              {...register('siteId')}
            />
            <Select
              label="Category"
              options={categoryOptions}
              placeholder="Select category"
              error={errors.categoryId?.message}
              {...register('categoryId')}
            />
            <Input label="Amount (INR)" error={errors.amount?.message} {...register('amount')} />
            <Input
              label="Expense date"
              type="date"
              error={errors.expenseDate?.message}
              {...register('expenseDate')}
            />
            <Input label="Vendor name" {...register('vendorName')} />
            <Select
              label="Payment method"
              options={Object.values(PaymentMethod).map((v) => ({
                value: v,
                label: v.replaceAll('_', ' '),
              }))}
              placeholder="Optional"
              {...register('paymentMethod')}
            />
            <Input
              label="Initial payment (optional)"
              {...register('initialPaymentAmount')}
            />
            <Input label="Reference no." {...register('referenceNumber')} />
            <div className="sm:col-span-2">
              <Textarea label="Description" {...register('description')} />
            </div>
            <div className="sm:col-span-2">
              <Textarea label="Notes" {...register('notes')} />
            </div>
            {create.isError ? (
              <p className="sm:col-span-2 text-sm text-red-600">{getErrorMessage(create.error)}</p>
            ) : null}
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" variant="teal" loading={create.isPending}>
                Save expense
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewExpensePage() {
  return (
    <Suspense>
      <NewExpenseForm />
    </Suspense>
  );
}
