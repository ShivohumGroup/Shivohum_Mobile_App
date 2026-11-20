'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  unwrapList,
  useCreateProgress,
  useDeleteProgress,
  useProgress,
  useSites,
} from '@/lib/api-hooks';
import { getErrorMessage } from '@/lib/utils';
import { createProgressSchema, formatDateIst } from '@siteflow/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

type FormValues = z.infer<typeof createProgressSchema>;

function ProgressContent() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get('siteId') || undefined;
  const { data, isLoading, isError, error } = useProgress({ siteId, pageSize: 50 });
  const sites = useSites({ pageSize: 100 });
  const create = useCreateProgress();
  const remove = useDeleteProgress();
  const [open, setOpen] = useState(false);
  const items = unwrapList(data);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createProgressSchema),
    defaultValues: { siteId: siteId || '' },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Progress</h1>
          <p className="page-subtitle">Daily / weekly site updates</p>
        </div>
        <Button
          variant="teal"
          onClick={() => {
            reset({ siteId: siteId || '', title: '', description: '', updateDate: '' });
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Post update
        </Button>
      </div>

      {isLoading ? <TableSkeleton rows={4} /> : null}
      {isError ? <p className="text-sm text-red-600">{getErrorMessage(error)}</p> : null}

      {!isLoading && items.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="No progress updates"
            description="Post the first site progress note for the timeline."
            action={
              <Button variant="teal" onClick={() => setOpen(true)}>
                Post update
              </Button>
            }
          />
        </Card>
      ) : null}

      <div className="relative space-y-4 before:absolute before:left-4 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-surface-border sm:before:left-6">
        {items.map((item) => (
          <Card key={item.id} className="relative ml-8 sm:ml-12">
            <div className="absolute -left-8 top-6 h-3 w-3 rounded-full border-2 border-teal bg-white sm:-left-12 sm:left-[-2.15rem]" />
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle>{item.title}</CardTitle>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateIst(item.updateDate)}
                    {item.site?.name ? ` · ${item.site.name}` : ''}
                    {item.createdBy?.fullName ? ` · ${item.createdBy.fullName}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.completionPercent != null ? (
                    <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">
                      {item.completionPercent}%
                    </span>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete update"
                    onClick={async () => {
                      if (!confirm('Delete this progress update?')) return;
                      await remove.mutateAsync(item.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p>{item.description}</p>
              {item.completedWork ? (
                <p>
                  <span className="font-medium text-navy">Completed: </span>
                  {item.completedWork}
                </p>
              ) : null}
              {item.workInProgress ? (
                <p>
                  <span className="font-medium text-navy">In progress: </span>
                  {item.workInProgress}
                </p>
              ) : null}
              {item.blockers ? (
                <p className="text-amber-pending">
                  <span className="font-medium">Blockers: </span>
                  {item.blockers}
                </p>
              ) : null}
              {item.nextDayPlan ? (
                <p>
                  <span className="font-medium text-navy">Next plan: </span>
                  {item.nextDayPlan}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Post progress update"
        className="sm:max-w-xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="teal"
              loading={create.isPending}
              onClick={handleSubmit(async (values) => {
                const payload = {
                  ...values,
                  completionPercent:
                    values.completionPercent === undefined || values.completionPercent === null
                      ? undefined
                      : Number(values.completionPercent),
                };
                await create.mutateAsync(payload);
                setOpen(false);
              })}
            >
              Publish
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Select
              label="Site"
              options={unwrapList(sites.data).map((s) => ({
                value: s.id,
                label: s.name,
              }))}
              placeholder="Select site"
              error={errors.siteId?.message}
              {...register('siteId')}
            />
          </div>
          <Input label="Update date" type="date" error={errors.updateDate?.message} {...register('updateDate')} />
          <Input
            label="Completion %"
            type="number"
            min={0}
            max={100}
            {...register('completionPercent', { valueAsNumber: true })}
          />
          <div className="sm:col-span-2">
            <Input label="Title" error={errors.title?.message} {...register('title')} />
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Description" error={errors.description?.message} {...register('description')} />
          </div>
          <Input label="Work category" {...register('workCategory')} />
          <Input label="Completed work" {...register('completedWork')} />
          <div className="sm:col-span-2">
            <Textarea label="Work in progress" {...register('workInProgress')} />
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Blockers" {...register('blockers')} />
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Next day plan" {...register('nextDayPlan')} />
          </div>
          {create.isError ? (
            <p className="sm:col-span-2 text-sm text-red-600">{getErrorMessage(create.error)}</p>
          ) : null}
        </div>
      </Dialog>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ProgressContent />
    </Suspense>
  );
}
