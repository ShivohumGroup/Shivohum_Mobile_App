'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  useChangePassword,
  useOrganization,
  useUpdateOrganization,
} from '@/lib/api-hooks';
import { getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { changePasswordSchema } from '@siteflow/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

type FormValues = z.infer<typeof changePasswordSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const orgQ = useOrganization();
  const updateOrg = useUpdateOrganization();
  const changePassword = useChangePassword();
  const [orgName, setOrgName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [orgMessage, setOrgMessage] = useState<string | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);
  const canEditOrg = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (orgQ.data) {
      setOrgName(orgQ.data.name);
      setTimezone(orgQ.data.timezone);
    }
  }, [orgQ.data]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Organization, profile and security</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>Timezone and currency used for reports and dashboards</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Organization name"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            readOnly={!canEditOrg}
          />
          <Input label="Code" value={orgQ.data?.code || ''} readOnly />
          <Select
            label="Timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            disabled={!canEditOrg}
            options={[
              { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
              { value: 'UTC', label: 'UTC' },
              { value: 'Asia/Dubai', label: 'Asia/Dubai' },
              { value: 'Asia/Singapore', label: 'Asia/Singapore' },
            ]}
          />
          <Input label="Currency" value={orgQ.data?.currency || 'INR'} readOnly />
          {canEditOrg ? (
            <div className="sm:col-span-2">
              <Button
                type="button"
                disabled={updateOrg.isPending}
                onClick={async () => {
                  setOrgError(null);
                  setOrgMessage(null);
                  try {
                    await updateOrg.mutateAsync({ name: orgName, timezone });
                    setOrgMessage('Organization settings saved.');
                  } catch (e) {
                    setOrgError(getErrorMessage(e));
                  }
                }}
              >
                Save organization
              </Button>
              {orgMessage ? <p className="mt-2 text-sm text-teal-700">{orgMessage}</p> : null}
              {orgError ? <p className="mt-2 text-sm text-red-600">{orgError}</p> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Auth tokens are stored in localStorage and sent as Bearer headers. Prefer httpOnly
            cookies for higher-threat environments.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" value={user?.fullName || ''} readOnly />
          <Input label="Email" value={user?.email || ''} readOnly />
          <Input label="Role" value={user?.role?.replaceAll('_', ' ') || ''} readOnly />
          <Input label="Phone" value={user?.phone || '—'} readOnly />
          <Input
            label="API base"
            value={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}
            readOnly
            className="sm:col-span-2"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Requires your current password</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={handleSubmit(async (values) => {
              await changePassword.mutateAsync(values);
              reset();
            })}
          >
            <Input
              label="Current password"
              type="password"
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />
            <Input
              label="New password"
              type="password"
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <div className="sm:col-span-2">
              <Button type="submit" disabled={changePassword.isPending}>
                Update password
              </Button>
              {changePassword.isError ? (
                <p className="mt-2 text-sm text-red-600">{getErrorMessage(changePassword.error)}</p>
              ) : null}
              {changePassword.isSuccess ? (
                <p className="mt-2 text-sm text-teal-700">Password updated.</p>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
