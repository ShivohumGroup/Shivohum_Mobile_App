'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { unwrapList, useInviteUser, useSites, useUsers } from '@/lib/api-hooks';
import { getErrorMessage } from '@/lib/utils';
import { formatDateIst, inviteUserSchema, UserRole } from '@siteflow/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

type FormValues = z.infer<typeof inviteUserSchema>;

export default function TeamPage() {
  const { data, isLoading, isError, error } = useUsers({ pageSize: 100 });
  const sites = useSites({ pageSize: 100 });
  const invite = useInviteUser();
  const [open, setOpen] = useState(false);
  const users = unwrapList(data);
  const siteOptions = unwrapList(sites.data);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { role: UserRole.SITE_MANAGER, siteIds: [] },
  });

  const selectedSites = watch('siteIds') || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">Invite and manage organisation users</p>
        </div>
        <Button
          variant="teal"
          onClick={() => {
            reset({ role: UserRole.SITE_MANAGER, siteIds: [], email: '', fullName: '' });
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Invite user
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <TableSkeleton /> : null}
          {isError ? <p className="p-6 text-sm text-red-600">{getErrorMessage(error)}</p> : null}
          {!isLoading && users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No team members"
              description="Invite admins, partners, or site managers."
              action={
                <Button variant="teal" onClick={() => setOpen(true)}>
                  Invite user
                </Button>
              }
            />
          ) : null}
          {users.length > 0 ? (
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Role</TH>
                  <TH>Status</TH>
                  <TH>Last login</TH>
                </TR>
              </THead>
              <TBody>
                {users.map((u) => (
                  <TR key={u.id}>
                    <TD className="font-medium">{u.fullName}</TD>
                    <TD>{u.email}</TD>
                    <TD>
                      <Badge tone="navy">{u.role.replaceAll('_', ' ')}</Badge>
                    </TD>
                    <TD>
                      <Badge tone={u.isActive ? 'green' : 'slate'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TD>
                    <TD>{u.lastLoginAt ? formatDateIst(u.lastLoginAt) : '—'}</TD>
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
        title="Invite user"
        className="sm:max-w-lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="teal"
              loading={invite.isPending}
              onClick={handleSubmit(async (values) => {
                await invite.mutateAsync(values);
                setOpen(false);
              })}
            >
              Send invite
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Input label="Full name" error={errors.fullName?.message} {...register('fullName')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Phone" {...register('phone')} />
          <Select
            label="Role"
            options={Object.values(UserRole).map((r) => ({
              value: r,
              label: r.replaceAll('_', ' '),
            }))}
            {...register('role')}
          />
          <Input
            label="Temporary password (optional)"
            type="password"
            {...register('password')}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Site access</label>
            <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-surface-border p-2">
              {siteOptions.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedSites.includes(s.id)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...selectedSites, s.id]
                        : selectedSites.filter((id) => id !== s.id);
                      setValue('siteIds', next);
                    }}
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
          {invite.isError ? (
            <p className="text-sm text-red-600">{getErrorMessage(invite.error)}</p>
          ) : null}
        </div>
      </Dialog>
    </div>
  );
}
