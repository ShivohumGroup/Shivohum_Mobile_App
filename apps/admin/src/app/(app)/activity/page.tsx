'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { unwrapList, useActivity, useAuditLogs } from '@/lib/api-hooks';
import { getErrorMessage } from '@/lib/utils';
import { formatDateTimeIst } from '@siteflow/shared';
import { Activity, Shield } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ActivityContent() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get('siteId') || undefined;
  const activityQ = useActivity({ siteId, pageSize: 100 });
  const auditQ = useAuditLogs({ pageSize: 100 });
  const items = unwrapList(activityQ.data);
  const audits = unwrapList(auditQ.data);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Activity & audit</h1>
        <p className="page-subtitle">Organisation event stream and financial audit trail</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {activityQ.isLoading ? <TableSkeleton /> : null}
          {activityQ.isError ? (
            <p className="p-6 text-sm text-red-600">{getErrorMessage(activityQ.error)}</p>
          ) : null}
          {!activityQ.isLoading && items.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="Actions across sites will appear here."
            />
          ) : null}
          {items.length > 0 ? (
            <Table>
              <THead>
                <TR>
                  <TH>When</TH>
                  <TH>Type</TH>
                  <TH>Summary</TH>
                  <TH>Actor</TH>
                  <TH>Site</TH>
                </TR>
              </THead>
              <TBody>
                {items.map((item) => (
                  <TR key={item.id}>
                    <TD className="whitespace-nowrap text-xs">
                      {formatDateTimeIst(item.createdAt)}
                    </TD>
                    <TD>
                      <Badge tone="navy">{item.type.replaceAll('_', ' ')}</Badge>
                    </TD>
                    <TD>{item.summary}</TD>
                    <TD>{item.actor?.fullName || 'System'}</TD>
                    <TD>{item.site?.name || '—'}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-[var(--navy)]">Financial audit log</h2>
        <p className="text-sm text-slate-500">Voids, corrections, and sensitive entity changes</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {auditQ.isLoading ? <TableSkeleton /> : null}
          {auditQ.isError ? (
            <p className="p-6 text-sm text-red-600">{getErrorMessage(auditQ.error)}</p>
          ) : null}
          {!auditQ.isLoading && audits.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No audit entries"
              description="Void and correction events will appear here."
            />
          ) : null}
          {audits.length > 0 ? (
            <Table>
              <THead>
                <TR>
                  <TH>When</TH>
                  <TH>Entity</TH>
                  <TH>Action</TH>
                  <TH>Reason</TH>
                  <TH>Actor</TH>
                </TR>
              </THead>
              <TBody>
                {audits.map((item) => (
                  <TR key={item.id}>
                    <TD className="whitespace-nowrap text-xs">
                      {formatDateTimeIst(item.createdAt)}
                    </TD>
                    <TD>
                      {item.entityType} · {item.entityId.slice(0, 8)}…
                    </TD>
                    <TD>
                      <Badge tone="amber">{item.action}</Badge>
                    </TD>
                    <TD>{item.reason || '—'}</TD>
                    <TD>{item.actor?.fullName || 'System'}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ActivityPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ActivityContent />
    </Suspense>
  );
}
