'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLogin } from '@/lib/api-hooks';
import { getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { APP_NAME, APP_TAGLINE, loginSchema } from '@siteflow/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

type FormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/dashboard';
  const { loginSuccess, isAuthenticated, loading } = useAuth();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace(next);
  }, [loading, isAuthenticated, router, next]);

  const onSubmit = handleSubmit(async (values) => {
    const res = await login.mutateAsync(values);
    loginSuccess(res.accessToken, res.refreshToken, res.user);
    router.replace(next);
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-muted px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(13,148,136,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(11,31,58,0.12),transparent_35%)]" />
      <Card className="relative z-10 w-full max-w-md">
        <CardHeader>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
            {APP_NAME}
          </div>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>{APP_TAGLINE} — admin console</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            {login.isError ? (
              <p className="text-sm text-red-600">{getErrorMessage(login.error)}</p>
            ) : null}
            <Button type="submit" className="w-full" loading={login.isPending}>
              Sign in
            </Button>
            <div className="text-center text-sm">
              <Link href="/forgot-password" className="text-teal hover:underline">
                Forgot password?
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
