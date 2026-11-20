'use client';

import { Badge, statusTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { unwrapList, useSites } from '@/lib/api-hooks';
import { getErrorMessage } from '@/lib/utils';
import { formatDateIst, formatInr, ProjectStatus } from '@siteflow/shared';
import { Building2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SitesContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || undefined;
  const { data, isLoading, isError, error } = useSites({ search: q, pageSize: 50 });
  const sites = unwrapList(data);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Sites</h1>
          <p className="page-subtitle">Manage construction projects and financials</p>
        </div>
        <Link href="/sites/new">
          <Button variant="teal">
            <Plus className="h-4 w-4" />
            New site
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <TableSkeleton /> : null}
          {isError ? (
            <p className="p-6 text-sm text-red-600">{getErrorMessage(error)}</p>
          ) : null}
          {!isLoading && !isError && sites.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No sites yet"
              description="Create your first construction site to start tracking income and expenses."
              action={
                <Link href="/sites/new">
                  <Button variant="teal">Create site</Button>
                </Link>
              }
            />
          ) : null}
          {!isLoading && sites.length > 0 ? (
            <Table>
              <THead>
                <TR>
                  <TH>Site</TH>
                  <TH>Client</TH>
                  <TH>Status</TH>
                  <TH>Contract</TH>
                  <TH>Start</TH>
                  <TH />
                </TR>
              </THead>
              <TBody>
                {sites.map((site) => (
                  <TR key={site.id}>
                    <TD>
                      <div className="font-medium">{site.name}</div>
                      <div className="text-xs text-slate-500">{site.code}</div>
                    </TD>
                    <TD>
                      <div>{site.clientName}</div>
                      <div className="text-xs text-slate-500">
                        {site.city}, {site.state}
                      </div>
                    </TD>
                    <TD>
                      <Badge tone={statusTone(site.status)}>
                        {site.status.replaceAll('_', ' ')}
                      </Badge>
                    </TD>
                    <TD>{formatInr(site.contractAmount)}</TD>
                    <TD>{formatDateIst(site.agreedStartDate)}</TD>
                    <TD>
                      <Link href={`/sites/${site.id}`} className="text-sm font-medium text-teal hover:underline">
                        Open
                      </Link>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {Object.values(ProjectStatus).map((s) => (
          <Badge key={s} tone={statusTone(s)}>
            {s.replaceAll('_', ' ')}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default function SitesPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <SitesContent />
    </Suspense>
  );
}
