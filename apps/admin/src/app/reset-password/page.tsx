'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useResetPassword } from '@/lib/api-hooks';
import { getErrorMessage } from '@/lib/utils';
import { resetPasswordSchema } from '@siteflow/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

type FormValues = z.infer<typeof resetPasswordSchema>;

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const router = useRouter();
  const mutation = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: '' },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Choose a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleSubmit(async (values) => {
              await mutation.mutateAsync(values);
              router.push('/login');
            })}
          >
            <input type="hidden" {...register('token')} />
            <Input
              label="New password"
              type="password"
              error={errors.password?.message}
              {...register('password')}
            />
            {mutation.isError ? (
              <p className="text-sm text-red-600">{getErrorMessage(mutation.error)}</p>
            ) : null}
            <Button type="submit" className="w-full" loading={mutation.isPending}>
              Update password
            </Button>
            <Link href="/login" className="block text-center text-sm text-teal hover:underline">
              Back to login
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
