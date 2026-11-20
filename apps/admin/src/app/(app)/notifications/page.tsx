'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { unwrapList, useMarkNotificationRead, useNotifications } from '@/lib/api-hooks';
import { getErrorMessage } from '@/lib/utils';
import { formatDateTimeIst } from '@siteflow/shared';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  const { data, isLoading, isError, error } = useNotifications({ pageSize: 50 });
  const markRead = useMarkNotificationRead();
  const items = unwrapList(data);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Notifications</h1>
        <p className="page-subtitle">Activity alerts and system reminders</p>
      </div>

      <Card>
        <CardContent className="divide-y divide-surface-border p-0">
          {isLoading ? <TableSkeleton /> : null}
          {isError ? <p className="p-6 text-sm text-red-600">{getErrorMessage(error)}</p> : null}
          {!isLoading && items.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="All caught up"
              description="You have no notifications right now."
            />
          ) : null}
          {items.map((n) => (
            <div
              key={n.id}
              className={`flex flex-wrap items-start justify-between gap-3 px-5 py-4 ${
                n.isRead ? 'bg-white' : 'bg-teal-50/40'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-navy">{n.title}</h3>
                  {!n.isRead ? <Badge tone="teal">New</Badge> : null}
                  <Badge tone="slate">{n.type}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{n.body}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDateTimeIst(n.createdAt)}</p>
              </div>
              {!n.isRead ? (
                <Button
                  size="sm"
                  variant="outline"
                  loading={markRead.isPending}
                  onClick={() => markRead.mutate(n.id)}
                >
                  Mark read
                </Button>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
