'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  unwrapList,
  useContacts,
  useCreateContact,
  useSites,
  useUpdateContact,
} from '@/lib/api-hooks';
import { getErrorMessage } from '@/lib/utils';
import { createContactSchema } from '@siteflow/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Contact2, Plus } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

type FormValues = z.infer<typeof createContactSchema>;

function ContactsContent() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get('siteId') || undefined;
  const q = searchParams.get('q') || undefined;
  const { data, isLoading, isError, error } = useContacts({ siteId, search: q, pageSize: 50 });
  const sites = useSites({ pageSize: 100 });
  const create = useCreateContact();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const update = useUpdateContact(editId || '');
  const contacts = unwrapList(data);
  const siteOptions = unwrapList(sites.data);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createContactSchema),
    defaultValues: { siteIds: siteId ? [siteId] : [] },
  });

  const selectedSites = watch('siteIds') || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">Vendors, labour, and site people</p>
        </div>
        <Button
          variant="teal"
          onClick={() => {
            setEditId(null);
            reset({ siteIds: siteId ? [siteId] : [], personName: '', workCategory: '', primaryPhone: '' });
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add contact
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <TableSkeleton /> : null}
          {isError ? <p className="p-6 text-sm text-red-600">{getErrorMessage(error)}</p> : null}
          {!isLoading && contacts.length === 0 ? (
            <EmptyState
              icon={Contact2}
              title="No contacts"
              description="Add vendors and site contacts for quick reference."
              action={
                <Button variant="teal" onClick={() => setOpen(true)}>
                  Add contact
                </Button>
              }
            />
          ) : null}
          {contacts.length > 0 ? (
            <Table>
              <THead>
                <TR>
                  <TH>Person</TH>
                  <TH>Category</TH>
                  <TH>Phone</TH>
                  <TH>Sites</TH>
                  <TH>Status</TH>
                  <TH />
                </TR>
              </THead>
              <TBody>
                {contacts.map((c) => (
                  <TR key={c.id}>
                    <TD>
                      <div className="font-medium">{c.personName}</div>
                      <div className="text-xs text-slate-500">{c.companyName || c.designation || '—'}</div>
                    </TD>
                    <TD>{c.workCategory}</TD>
                    <TD>
                      <a className="text-teal hover:underline" href={`tel:${c.primaryPhone}`}>
                        {c.primaryPhone}
                      </a>
                    </TD>
                    <TD className="max-w-[180px] truncate text-xs">
                      {(c.sites || []).map((s) => s.name).join(', ') || '—'}
                    </TD>
                    <TD>
                      <Badge tone={c.isActive ? 'green' : 'slate'}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TD>
                    <TD>
                      <button
                        type="button"
                        className="text-sm text-teal hover:underline"
                        onClick={() => {
                          setEditId(c.id);
                          reset({
                            siteIds: c.sites?.map((s) => s.id) || c.siteIds || [],
                            personName: c.personName,
                            companyName: c.companyName ?? undefined,
                            workCategory: c.workCategory,
                            designation: c.designation ?? undefined,
                            primaryPhone: c.primaryPhone,
                            alternatePhone: c.alternatePhone ?? undefined,
                            whatsappNumber: c.whatsappNumber ?? undefined,
                            email: c.email ?? undefined,
                            address: c.address ?? undefined,
                            notes: c.notes ?? undefined,
                          });
                          setOpen(true);
                        }}
                      >
                        Edit
                      </button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? 'Edit contact' : 'Add contact'}
        className="sm:max-w-xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="teal"
              loading={create.isPending || update.isPending}
              onClick={handleSubmit(async (values) => {
                if (editId) await update.mutateAsync(values);
                else await create.mutateAsync(values);
                setOpen(false);
              })}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Person name" error={errors.personName?.message} {...register('personName')} />
          <Input label="Company" {...register('companyName')} />
          <Input label="Work category" error={errors.workCategory?.message} {...register('workCategory')} />
          <Input label="Designation" {...register('designation')} />
          <Input label="Primary phone" error={errors.primaryPhone?.message} {...register('primaryPhone')} />
          <Input label="WhatsApp" {...register('whatsappNumber')} />
          <Input label="Email" {...register('email')} />
          <Input label="Alternate phone" {...register('alternatePhone')} />
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-navy">Sites</label>
            <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-surface-border p-2">
              {siteOptions.map((s) => {
                const checked = selectedSites.includes(s.id);
                return (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...selectedSites, s.id]
                          : selectedSites.filter((id) => id !== s.id);
                        setValue('siteIds', next, { shouldValidate: true });
                      }}
                    />
                    {s.name}
                  </label>
                );
              })}
            </div>
            {errors.siteIds ? (
              <p className="mt-1 text-xs text-red-600">{errors.siteIds.message}</p>
            ) : null}
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Address" {...register('address')} />
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Notes" {...register('notes')} />
          </div>
          {(create.isError || update.isError) && (
            <p className="sm:col-span-2 text-sm text-red-600">
              {getErrorMessage(create.error || update.error)}
            </p>
          )}
        </div>
      </Dialog>
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ContactsContent />
    </Suspense>
  );
}
