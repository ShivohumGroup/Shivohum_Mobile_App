'use client';

import { Badge, statusTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/ui/skeleton';
import { useArchiveSite, useDashboardSummary, useSite } from '@/lib/api-hooks';
import { getErrorMessage } from '@/lib/utils';
import { formatDateIst, formatInr } from '@siteflow/shared';
import { Archive, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function SiteDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: site, isLoading, isError, error } = useSite(id);
  const summary = useDashboardSummary({ siteId: id });
  const archive = useArchiveSite();

  if (isLoading) return <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>;
  if (isError || !site) {
    return <p className="text-red-600">{getErrorMessage(error, 'Site not found')}</p>;
  }

  const totals = site.totals;
  const dash = summary.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge tone={statusTone(site.status)}>{site.status.replaceAll('_', ' ')}</Badge>
            <span className="text-xs text-slate-500">{site.code}</span>
          </div>
          <h1 className="page-title">{site.name}</h1>
          <p className="page-subtitle">
            {site.clientName} · {site.address}, {site.city}, {site.state}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/sites/${id}/edit`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="danger"
            loading={archive.isPending}
            onClick={async () => {
              if (!confirm('Archive this site?')) return;
              await archive.mutateAsync(id);
            }}
          >
            <Archive className="h-4 w-4" />
            Archive
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-slate-500">Contract</div>
            <div className="mt-1 text-xl font-semibold">{formatInr(site.contractAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-slate-500">Received</div>
            <div className="mt-1 text-xl font-semibold text-teal">
              {formatInr(totals?.totalReceived ?? dash?.totalReceived ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-slate-500">Expenses paid</div>
            <div className="mt-1 text-xl font-semibold">
              {formatInr(totals?.totalExpensesPaid ?? dash?.totalExpensesPaid ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-slate-500">Outstanding</div>
            <div className="mt-1 text-xl font-semibold text-amber-pending">
              {formatInr(totals?.outstanding ?? dash?.outstandingReceivables ?? 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Type" value={site.projectType.replaceAll('_', ' ')} />
            <Row label="Start" value={formatDateIst(site.agreedStartDate)} />
            <Row
              label="Expected completion"
              value={
                site.expectedCompletionDate
                  ? formatDateIst(site.expectedCompletionDate)
                  : '—'
              }
            />
            <Row label="Manager" value={site.projectManager?.fullName || '—'} />
            <Row label="Phone" value={site.clientPhone || '—'} />
            {site.description ? <Row label="Description" value={site.description} /> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href={`/transactions/income/new?siteId=${id}`}>
              <Button variant="soft" size="sm">
                Record income
              </Button>
            </Link>
            <Link href={`/transactions/expenses/new?siteId=${id}`}>
              <Button variant="soft" size="sm">
                Add expense
              </Button>
            </Link>
            <Link href={`/progress?siteId=${id}`}>
              <Button variant="outline" size="sm">
                Progress
              </Button>
            </Link>
            <Link href={`/contacts?siteId=${id}`}>
              <Button variant="outline" size="sm">
                Contacts
              </Button>
            </Link>
            <Link href={`/reports?siteId=${id}`}>
              <Button variant="outline" size="sm">
                Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b border-surface-border py-2 last:border-0">
      <div className="w-40 shrink-0 text-slate-500">{label}</div>
      <div className="text-navy">{value}</div>
    </div>
  );
}
