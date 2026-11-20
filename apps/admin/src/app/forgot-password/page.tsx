'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useForgotPassword } from '@/lib/api-hooks';
import { getErrorMessage } from '@/lib/utils';
import { forgotPasswordSchema } from '@siteflow/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

type FormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const mutation = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>We will email a reset link if the account exists.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleSubmit(async (values) => {
              await mutation.mutateAsync(values);
            })}
          >
            <Input
              label="Email"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />
            {mutation.isError ? (
              <p className="text-sm text-red-600">{getErrorMessage(mutation.error)}</p>
            ) : null}
            {mutation.isSuccess ? (
              <p className="text-sm text-teal-700">
                If that email is registered, reset instructions have been sent.
              </p>
            ) : null}
            <Button type="submit" className="w-full" loading={mutation.isPending}>
              Send reset link
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
