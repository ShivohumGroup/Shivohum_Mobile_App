'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatInr } from '@siteflow/shared';

const TEAL = '#0D9488';
const NAVY = '#0B1F3A';
const AMBER = '#D97706';
const COLORS = [TEAL, NAVY, AMBER, '#64748B', '#DC2626', '#2563EB'];

export function IncomeExpenseChart({
  income,
  expenses,
}: {
  income: { month: string; amount: number }[];
  expenses: { month: string; amount: number }[];
}) {
  const map = new Map<string, { month: string; income: number; expenses: number }>();
  income.forEach((i) => map.set(i.month, { month: i.month, income: i.amount, expenses: 0 }));
  expenses.forEach((e) => {
    const row = map.get(e.month) || { month: e.month, income: 0, expenses: 0 };
    row.expenses = e.amount;
    map.set(e.month, row);
  });
  const data = Array.from(map.values());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs expenses</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">No chart data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatInr(v)} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke={TEAL} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expenses" stroke={AMBER} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function CategoryPieChart({
  data,
}: {
  data: { category: string; amount: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses by category</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">No category data</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ category }) => category}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatInr(v)} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function SitesStatusChart({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sites by status</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">No site status data</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F0" />
              <XAxis dataKey="status" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill={NAVY} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
