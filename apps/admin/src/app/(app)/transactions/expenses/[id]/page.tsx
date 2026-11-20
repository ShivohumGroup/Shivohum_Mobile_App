'use client';

import { Badge, statusTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { CardSkeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { useAddExpensePayment, useExpense } from '@/lib/api-hooks';
import { getErrorMessage } from '@/lib/utils';
import {
  createExpensePaymentSchema,
  formatDateIst,
  formatInr,
  PaymentMethod,
} from '@siteflow/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

type PaymentForm = z.infer<typeof createExpensePaymentSchema>;

export default function ExpenseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: expense, isLoading, isError, error } = useExpense(id);
  const addPayment = useAddExpensePayment(id);
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentForm>({
    resolver: zodResolver(createExpensePaymentSchema),
    defaultValues: { paymentMethod: PaymentMethod.UPI },
  });

  if (isLoading) return <CardSkeleton />;
  if (isError || !expense) {
    return <p className="text-red-600">{getErrorMessage(error, 'Expense not found')}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Expense</h1>
          <p className="page-subtitle">
            {expense.site?.name || expense.siteId} · {expense.category?.name || 'Uncategorised'}
          </p>
        </div>
        <Button variant="teal" onClick={() => setOpen(true)}>
          Add payment
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-slate-500">Amount</div>
            <div className="mt-1 text-xl font-semibold">{formatInr(expense.amount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-slate-500">Paid</div>
            <div className="mt-1 text-xl font-semibold text-teal">
              {formatInr(expense.amountPaid)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-slate-500">Status</div>
            <div className="mt-2">
              <Badge tone={statusTone(expense.paymentStatus)}>
                {expense.paymentStatus.replaceAll('_', ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>Date: {formatDateIst(expense.expenseDate)}</div>
          <div>Vendor: {expense.vendorName || '—'}</div>
          <div>Reference: {expense.referenceNumber || '—'}</div>
          <div>Description: {expense.description || '—'}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(expense.payments?.length ?? 0) === 0 ? (
            <p className="p-6 text-sm text-slate-500">No payments recorded yet.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Date</TH>
                  <TH>Amount</TH>
                  <TH>Method</TH>
                  <TH>Reference</TH>
                </TR>
              </THead>
              <TBody>
                {expense.payments!.map((p) => (
                  <TR key={p.id}>
                    <TD>{formatDateIst(p.paidAt)}</TD>
                    <TD>{formatInr(p.amount)}</TD>
                    <TD>{p.paymentMethod.replaceAll('_', ' ')}</TD>
                    <TD>{p.referenceNumber || '—'}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add payment"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="teal"
              loading={addPayment.isPending}
              onClick={handleSubmit(async (values) => {
                await addPayment.mutateAsync(values);
                reset();
                setOpen(false);
              })}
            >
              Save payment
            </Button>
          </>
        }
      >
        <form className="space-y-3">
          <Input label="Amount" error={errors.amount?.message} {...register('amount')} />
          <Input label="Paid at" type="date" error={errors.paidAt?.message} {...register('paidAt')} />
          <Select
            label="Method"
            options={Object.values(PaymentMethod).map((v) => ({
              value: v,
              label: v.replaceAll('_', ' '),
            }))}
            {...register('paymentMethod')}
          />
          <Input label="Reference" {...register('referenceNumber')} />
          {addPayment.isError ? (
            <p className="text-sm text-red-600">{getErrorMessage(addPayment.error)}</p>
          ) : null}
        </form>
      </Dialog>
    </div>
  );
}
