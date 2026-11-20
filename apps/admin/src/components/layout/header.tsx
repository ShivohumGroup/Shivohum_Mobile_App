'use client';

import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { MONTH_OPTIONS } from '@/lib/utils';
import { Bell, LogOut, Menu, Search, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { getIstYearMonth } from '@siteflow/shared';

export function Header({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const now = getIstYearMonth();
  const year = searchParams.get('year') || String(now.year);
  const month = searchParams.get('month') || String(now.month);
  const [search, setSearch] = useState(searchParams.get('q') || '');

  const applyPeriod = (nextYear: string, nextMonth: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', nextYear);
    params.set('month', nextMonth);
    router.push(`?${params.toString()}`);
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set('q', search);
    else params.delete('q');
    router.push(`?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-surface-border bg-white/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
        <button
          type="button"
          className="rounded-md p-2 text-navy hover:bg-surface-muted lg:hidden"
          onClick={onMenu}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form onSubmit={onSearch} className="relative min-w-[180px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sites, contacts…"
            className="pl-9"
            aria-label="Search"
          />
        </form>

        <div className="flex items-center gap-2">
          <Select
            aria-label="Year"
            className="w-[100px]"
            value={year}
            onChange={(e) => applyPeriod(e.target.value, month)}
            options={Array.from({ length: 6 }).map((_, i) => {
              const y = now.year - 2 + i;
              return { value: String(y), label: String(y) };
            })}
          />
          <Select
            aria-label="Month"
            className="w-[130px]"
            value={month}
            onChange={(e) => applyPeriod(year, e.target.value)}
            options={MONTH_OPTIONS.map((m) => ({
              value: String(m.value),
              label: m.label,
            }))}
          />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link href="/notifications">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" size="icon" aria-label="Profile">
              <UserRound className="h-4 w-4" />
            </Button>
          </Link>
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium text-navy">{user?.fullName}</div>
            <div className="text-xs text-slate-500">{user?.role?.replaceAll('_', ' ')}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await logout();
              router.replace('/login');
            }}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
