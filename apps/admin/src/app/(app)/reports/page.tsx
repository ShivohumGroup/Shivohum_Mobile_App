'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { exportReport, unwrapList, useSites } from '@/lib/api-hooks';
import { getErrorMessage } from '@/lib/utils';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

const REPORTS = [
  {
    name: 'Site-wise financial',
    description: 'Contract, receipts, expenses, outstanding per site',
    kind: 'site-wise',
  },
  {
    name: 'Yearly financial summary',
    description: 'Month-by-month income and expenses with yearly total',
    kind: 'yearly',
  },
  {
    name: 'Transaction ledger',
    description: 'Chronological income and expense ledger',
    kind: 'ledger',
  },
  {
    name: 'Expense category',
    description: 'Incurred vs paid by category for the year',
    kind: 'expense-categories',
    jsonOnly: true,
  },
  {
    name: 'Site comparison',
    description: 'Side-by-side site financial comparison',
    kind: 'site-comparison',
    jsonOnly: true,
  },
  {
    name: 'Project profitability estimate',
    description: 'Contract minus incurred expenses (not cash)',
    kind: 'profitability',
    jsonOnly: true,
  },
  {
    name: 'Client outstanding',
    description: 'Sites with unpaid contract balances',
    kind: 'outstanding-clients',
    jsonOnly: true,
  },
  {
    name: 'Vendor outstanding',
    description: 'Unpaid / partially paid expenses',
    kind: 'outstanding-vendors',
    jsonOnly: true,
  },
];

function ReportsContent() {
  const searchParams = useSearchParams();
  const initialSite = searchParams.get('siteId') || '';
  const year = searchParams.get('year') || String(new Date().getFullYear());
  const [siteId, setSiteId] = useState(initialSite);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const sites = useSites({ pageSize: 100 });

  const download = async (kind: string, format: 'xlsx' | 'pdf') => {
    const key = `${kind}:${format}`;
    setBusy(key);
    setError(null);
    try {
      await exportReport(`/reports/export/${format === 'xlsx' ? 'excel' : 'pdf'}`, `siteflow-${kind}.${format}`, {
        kind: kind === 'yearly' ? 'yearly' : kind === 'ledger' ? 'ledger' : 'site-wise',
        siteId: siteId || undefined,
        year,
      });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const openJson = async (pathKind: string) => {
    setBusy(pathKind);
    setError(null);
    setPreview(null);
    try {
      const { apiRequest } = await import('@/lib/api');
      const qs = new URLSearchParams();
      if (siteId) qs.set('siteId', siteId);
      if (year) qs.set('year', year);
      const data = await apiRequest(`/reports/${pathKind}?${qs.toString()}`);
      setPreview(JSON.stringify(data, null, 2));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Excel / PDF exports and on-screen report previews</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Applied to exports and JSON previews</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Site"
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            options={[
              { value: '', label: 'All accessible sites' },
              ...unwrapList(sites.data).map((s) => ({
                value: s.id,
                label: `${s.name} (${s.code})`,
              })),
            ]}
          />
          <InputYear year={year} />
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {REPORTS.map((report) => (
          <Card key={report.kind}>
            <CardHeader>
              <CardTitle className="text-base">{report.name}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {report.jsonOnly ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy === report.kind}
                  onClick={() => void openJson(report.kind)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Preview JSON
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy === `${report.kind}:xlsx`}
                    onClick={() => void download(report.kind, 'xlsx')}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Excel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy === `${report.kind}:pdf`}
                    onClick={() => void download(report.kind, 'pdf')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {preview ? (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[480px] overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
              {preview}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function InputYear({ year }: { year: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">Year</label>
      <input
        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
        value={year}
        readOnly
      />
      <p className="mt-1 text-xs text-slate-500">Pass ?year=YYYY in the URL to change</p>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading reports…</div>}>
      <ReportsContent />
    </Suspense>
  );
}
