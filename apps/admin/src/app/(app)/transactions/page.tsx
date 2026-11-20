'use client';

import { Badge, statusTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  unwrapList,
  useExpenses,
  useIncome,
  useVoidExpense,
  useVoidIncome,
} from '@/lib/api-hooks';
import { getErrorMessage } from '@/lib/utils';
import { formatDateIst, formatInr } from '@siteflow/shared';
import { Plus, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function TransactionsContent() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get('siteId') || undefined;
  const tab = searchParams.get('tab') || 'income';
  const incomeQuery = useIncome({ siteId, pageSize: 50 });
  const expensesQuery = useExpenses({ siteId, pageSize: 50 });
  const voidIncome = useVoidIncome();
  const voidExpense = useVoidExpense();
  const [voidTarget, setVoidTarget] = useState<{ type: 'income' | 'expense'; id: string } | null>(
    null,
  );
  const [reason, setReason] = useState('');

  const income = unwrapList(incomeQuery.data);
  const expenses = unwrapList(expensesQuery.data);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">Income receipts and expense payments</p>
        </div>
        <div className="flex gap-2">
          <Link href="/transactions/income/new">
            <Button variant="teal">
              <Plus className="h-4 w-4" />
              Income
            </Button>
          </Link>
          <Link href="/transactions/expenses/new">
            <Button variant="outline">
              <Plus className="h-4 w-4" />
              Expense
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-2">
        <Link href={`/transactions?tab=income${siteId ? `&siteId=${siteId}` : ''}`}>
          <Button variant={tab === 'income' ? 'primary' : 'outline'} size="sm">
            Income
          </Button>
        </Link>
        <Link href={`/transactions?tab=expenses${siteId ? `&siteId=${siteId}` : ''}`}>
          <Button variant={tab === 'expenses' ? 'primary' : 'outline'} size="sm">
            Expenses
          </Button>
        </Link>
      </div>

      {tab === 'income' ? (
        <Card>
          <CardHeader>
            <CardTitle>Income</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {incomeQuery.isLoading ? <TableSkeleton /> : null}
            {incomeQuery.isError ? (
              <p className="p-6 text-sm text-red-600">{getErrorMessage(incomeQuery.error)}</p>
            ) : null}
            {!incomeQuery.isLoading && income.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No income recorded"
                description="Record client receipts against a site."
                action={
                  <Link href="/transactions/income/new">
                    <Button variant="teal">Record income</Button>
                  </Link>
                }
              />
            ) : null}
            {income.length > 0 ? (
              <Table>
                <THead>
                  <TR>
                    <TH>Date</TH>
                    <TH>Site</TH>
                    <TH>Amount</TH>
                    <TH>Method</TH>
                    <TH>Status</TH>
                    <TH />
                  </TR>
                </THead>
                <TBody>
                  {income.map((row) => (
                    <TR key={row.id}>
                      <TD>{formatDateIst(row.dateReceived)}</TD>
                      <TD>{row.site?.name || row.siteId}</TD>
                      <TD className="font-medium">{formatInr(row.amount)}</TD>
                      <TD>{row.paymentMethod.replaceAll('_', ' ')}</TD>
                      <TD>
                        <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                      </TD>
                      <TD>
                        {row.status !== 'VOIDED' ? (
                          <button
                            type="button"
                            className="text-sm text-red-600 hover:underline"
                            onClick={() => setVoidTarget({ type: 'income', id: row.id })}
                          >
                            Void
                          </button>
                        ) : null}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {expensesQuery.isLoading ? <TableSkeleton /> : null}
            {expensesQuery.isError ? (
              <p className="p-6 text-sm text-red-600">{getErrorMessage(expensesQuery.error)}</p>
            ) : null}
            {!expensesQuery.isLoading && expenses.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No expenses yet"
                description="Track vendor bills and labour payments per site."
                action={
                  <Link href="/transactions/expenses/new">
                    <Button variant="teal">Add expense</Button>
                  </Link>
                }
              />
            ) : null}
            {expenses.length > 0 ? (
              <Table>
                <THead>
                  <TR>
                    <TH>Date</TH>
                    <TH>Site</TH>
                    <TH>Category</TH>
                    <TH>Amount</TH>
                    <TH>Paid</TH>
                    <TH>Payment</TH>
                    <TH />
                  </TR>
                </THead>
                <TBody>
                  {expenses.map((row) => (
                    <TR key={row.id}>
                      <TD>{formatDateIst(row.expenseDate)}</TD>
                      <TD>{row.site?.name || row.siteId}</TD>
                      <TD>{row.category?.name || '—'}</TD>
                      <TD className="font-medium">{formatInr(row.amount)}</TD>
                      <TD>{formatInr(row.amountPaid)}</TD>
                      <TD>
                        <Badge tone={statusTone(row.paymentStatus)}>
                          {row.paymentStatus.replaceAll('_', ' ')}
                        </Badge>
                      </TD>
                      <TD className="space-x-2">
                        <Link
                          href={`/transactions/expenses/${row.id}`}
                          className="text-sm text-teal hover:underline"
                        >
                          Open
                        </Link>
                        {row.status !== 'VOIDED' ? (
                          <button
                            type="button"
                            className="text-sm text-red-600 hover:underline"
                            onClick={() => setVoidTarget({ type: 'expense', id: row.id })}
                          >
                            Void
                          </button>
                        ) : null}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!voidTarget}
        onClose={() => {
          setVoidTarget(null);
          setReason('');
        }}
        title="Void transaction"
        description="This action is audited. Provide a reason."
        footer={
          <>
            <Button variant="outline" onClick={() => setVoidTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={voidIncome.isPending || voidExpense.isPending}
              onClick={async () => {
                if (!voidTarget || reason.trim().length < 3) return;
                if (voidTarget.type === 'income') {
                  await voidIncome.mutateAsync({ id: voidTarget.id, reason });
                } else {
                  await voidExpense.mutateAsync({ id: voidTarget.id, reason });
                }
                setVoidTarget(null);
                setReason('');
              }}
            >
              Confirm void
            </Button>
          </>
        }
      >
        <Input
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this being voided?"
        />
      </Dialog>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <TransactionsContent />
    </Suspense>
  );
}
