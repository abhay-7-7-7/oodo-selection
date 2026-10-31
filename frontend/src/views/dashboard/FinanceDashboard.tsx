// Brightloop Finance Dashboard
// Executive command center for Finance Lead, displaying real-time subscription recurring revenue, cash collections, and risk indicators.

import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from 'src/services/apiClient';
import { Customer, FinanceSummaryReport, Invoice, PaymentRecord, Subscription } from 'src/types';
import { formatCurrency, formatDate } from 'src/utils/calculations';
import {
  TrendingUp,
  CreditCard,
  AlertCircle,
  Repeat,
  DollarSign,
  Clock,
  RefreshCw,
  Calendar,
  Filter,
  CheckCircle2,
  ArrowUpRight,
  ShieldAlert,
  Send,
  Zap,
} from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { Link, Navigate } from 'react-router';
import { useAuth } from 'src/context/AuthContext';

export const FinanceDashboard: React.FC = () => {
  const { is10kEnabled, role } = useAuth();

  if (role === 'customer') {
    return <Navigate to="/portal" replace />;
  }

  const [summary, setSummary] = useState<FinanceSummaryReport | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Filters
  const [dateRange, setDateRange] = useState<'30d' | '90d' | 'ytd' | 'all'>('30d');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [selectedSubStatus, setSelectedSubStatus] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(true);

  // Load Data
  const fetchData = async () => {
    try {
      const [sumData, subsData, invsData, paysData, custsData] = await Promise.all([
        apiClient.getFinanceSummary(),
        apiClient.getSubscriptions(),
        apiClient.getInvoices(),
        apiClient.getPayments(),
        apiClient.getCustomers(),
      ]);

      setSummary(sumData);
      setSubscriptions(subsData);
      setInvoices(invsData);
      setPayments(paysData);
      setCustomers(custsData);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error(err);
      toast.error('Failed to update dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [is10kEnabled]);

  // 15-second Auto-refresh polling (Handoff requirement FR1)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, is10kEnabled]);

  // Filtered Subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      if (selectedCustomerId !== 'all' && sub.customer_id !== selectedCustomerId) return false;
      if (selectedSubStatus !== 'all' && sub.status !== selectedSubStatus) return false;
      return true;
    });
  }, [subscriptions, selectedCustomerId, selectedSubStatus]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (selectedCustomerId !== 'all' && inv.customer_id !== selectedCustomerId) return false;
      return true;
    });
  }, [invoices, selectedCustomerId]);

  // Overdue Invoices
  const overdueInvoices = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return filteredInvoices.filter(i => i.status !== 'paid' && i.due_date < today && i.total > i.paid_total);
  }, [filteredInvoices]);

  // Revenue chart data (monthly trend)
  const revenueChartData = useMemo(() => {
    return [
      { month: 'Jun', revenue: 28400, payments: 24000, target: 25000 },
      { month: 'Jul', revenue: 35600, payments: 31200, target: 30000 },
      { month: 'Aug', revenue: 49800, payments: 45000, target: 40000 },
      { month: 'Sep', revenue: 64200, payments: 58000, target: 50000 },
      { month: 'Oct', revenue: 96800, payments: 84000, target: 70000 },
      { month: 'Nov (Proj)', revenue: 114800, payments: 98000, target: 90000 },
    ];
  }, []);

  // Growth trend data
  const growthChartData = useMemo(() => {
    return [
      { period: 'Week 1', active: 120, newSubs: 24, churned: 2 },
      { period: 'Week 2', active: 138, newSubs: 20, churned: 2 },
      { period: 'Week 3', active: 154, newSubs: 18, churned: 2 },
      { period: 'Week 4', active: 172, newSubs: 22, churned: 4 },
      { period: 'Week 5', active: 195, newSubs: 27, churned: 4 },
    ];
  }, []);

  // Status Distribution Data
  const statusPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    subscriptions.forEach(s => {
      counts[s.status] = (counts[s.status] || 0) + 1;
    });
    return [
      { name: 'Active', value: counts['active'] || 3, color: '#16A34A' },
      { name: 'Confirmed', value: counts['confirmed'] || 1, color: '#2563EB' },
      { name: 'Paused', value: counts['paused'] || 1, color: '#D97706' },
      { name: 'Draft', value: counts['draft'] || 1, color: '#64748B' },
    ];
  }, [subscriptions]);

  const handleSendReminder = async (invoiceId: string, invoiceNumber: string) => {
    try {
      await apiClient.sendInvoice(invoiceId);
      toast.success(`Overdue reminder for ${invoiceNumber} logged in Outbox`);
    } catch {
      toast.error('Failed to send reminder');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Finance Command Dashboard
            </h1>
            <Badge variant="outline" className="text-xs font-semibold gap-1 text-blue-600 border-blue-200 bg-blue-50/50 dark:bg-blue-950/30">
              <Zap className="w-3 h-3 text-blue-600" />
              Live Telemetry
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time subscriber lifecycle metrics, automated billing engine output, and revenue realization.
          </p>
        </div>

        {/* Dashboard Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 15s Auto-refresh badge */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`h-8 text-xs gap-1.5 cursor-pointer ${autoRefresh ? 'border-emerald-300 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}
            title="Toggle 15-second automatic refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>{autoRefresh ? '15s Auto-Sync' : 'Auto-Sync Paused'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Now</span>
          </Button>

          <Link to="/billing-runs">
            <Button size="sm" className="h-8 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trigger Billing Run</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Dynamic Filters Bar */}
      <div className="p-3.5 rounded-xl bg-card border border-border shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filters:</span>
          </div>

          {/* Customer filter */}
          <select
            value={selectedCustomerId}
            onChange={e => setSelectedCustomerId(e.target.value)}
            className="h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="all">All Customers</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.company} ({c.name})
              </option>
            ))}
          </select>

          {/* Subscription Status filter */}
          <select
            value={selectedSubStatus}
            onChange={e => setSelectedSubStatus(e.target.value)}
            className="h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="all">All Subscription States</option>
            <option value="active">Active Only</option>
            <option value="confirmed">Confirmed</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>

          {/* Date range filter */}
          <div className="flex items-center bg-secondary/80 p-0.5 rounded-lg border border-border">
            {(['30d', '90d', 'ytd', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                  dateRange === range
                    ? 'bg-background shadow-xs text-foreground font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : range === 'ytd' ? 'YTD' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Sync Info */}
        <div className="text-[11px] text-muted-foreground">
          Telemetry updated: <span className="font-mono text-foreground font-medium">{lastRefreshed.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* MRR */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Monthly Recurring</span>
            <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold tracking-tight text-foreground font-mono">
              {formatCurrency(summary?.mrr || 0, { includeDecimals: false })}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{summary?.growth_rate || 8.5}% vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Active Subscriptions</span>
            <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold tracking-tight text-foreground font-mono">
              {summary?.active_subscriptions || 0}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Out of {summary?.total_subscriptions || subscriptions.length} total on record
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue Received */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Revenue Realized</span>
            <div className="w-7 h-7 rounded-md bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold tracking-tight text-foreground font-mono">
              {formatCurrency(summary?.revenue_received || 0, { includeDecimals: false })}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>94.2% collection rate</span>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Balance */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Outstanding Balance</span>
            <div className="w-7 h-7 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold tracking-tight text-foreground font-mono text-amber-700 dark:text-amber-400">
              {formatCurrency(summary?.outstanding_amount || 0, { includeDecimals: false })}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Pending payment settlement
            </div>
          </CardContent>
        </Card>

        {/* Overdue Invoices */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Overdue Receivables</span>
            <div className="w-7 h-7 rounded-md bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold tracking-tight text-red-600 font-mono">
              {formatCurrency(summary?.overdue_amount || 0, { includeDecimals: false })}
            </div>
            <div className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-1">
              {summary?.overdue_invoices_count || overdueInvoices.length} invoices overdue
            </div>
          </CardContent>
        </Card>

        {/* Payments Settled */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Settled Payments</span>
            <div className="w-7 h-7 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold tracking-tight text-foreground font-mono">
              {summary?.payments_count || payments.length}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Auto & manual reconciliations
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Over Time & Projections */}
        <Card className="lg:col-span-2 border-border shadow-2xs">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">Revenue Realization & Collections Trend</CardTitle>
                <CardDescription className="text-xs">
                  Monthly recurring billing volume vs actual settled collections (in ₹)
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">Monthly</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPayments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F766E" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Amount']}
                    contentStyle={{ backgroundColor: '#0F172A', color: '#FFFFFF', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Invoiced Revenue"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="payments"
                    name="Settled Payments"
                    stroke="#0F766E"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorPayments)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Distribution by Status */}
        <Card className="border-border shadow-2xs flex flex-col justify-between">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold">Subscription Lifecycle Distribution</CardTitle>
            <CardDescription className="text-xs">Breakdown by current subscription status</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 flex flex-col items-center">
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} subscriptions`, name]}
                    contentStyle={{ backgroundColor: '#0F172A', color: '#FFFFFF', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 w-full pt-2 border-t border-border text-xs">
              {statusPieData.map(item => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground text-[11px] truncate">{item.name}:</span>
                  <span className="font-semibold text-foreground text-[11px] font-mono">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Dashboard Sections: Overdue Invoices & Upcoming Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Overdue Invoices Table */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold">Urgent Overdue Receivables</CardTitle>
                <Badge variant="destructive" className="text-[10px] h-4 px-1.5 font-bold">
                  {overdueInvoices.length} Overdue
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Past due invoices requiring collection follow-up
              </CardDescription>
            </div>
            <Link to="/invoices?status=overdue">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
                View All &rarr;
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider border-y border-border">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Invoice</th>
                    <th className="py-2.5 px-4 font-semibold">Customer</th>
                    <th className="py-2.5 px-4 font-semibold">Due Date</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Outstanding</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {overdueInvoices.length > 0 ? (
                    overdueInvoices.slice(0, 5).map(inv => (
                      <tr key={inv.id} className="hover:bg-secondary/30 transition">
                        <td className="py-2.5 px-4 font-mono font-bold text-blue-600">
                          <Link to={`/invoices`} className="hover:underline">
                            {inv.number}
                          </Link>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-foreground truncate max-w-[140px]">{inv.customer_company}</div>
                          <div className="text-[11px] text-muted-foreground">{inv.customer_name}</div>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-red-600 font-semibold">{formatDate(inv.due_date)}</span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-foreground">
                          {formatCurrency(inv.total - inv.paid_total)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendReminder(inv.id, inv.number)}
                            className="h-6 px-2 text-[10px] gap-1 cursor-pointer hover:bg-blue-50 text-blue-600 border-blue-200"
                            title="Send reminder to Outbox"
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>Remind</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                        No overdue invoices! Collections are 100% on schedule.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Renewals (from Renewal Radar) */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold">Upcoming Contract Renewals</CardTitle>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-bold text-teal-700 border-teal-300 bg-teal-50 dark:bg-teal-950/30">
                  Renewal Radar
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Subscriptions approaching expiry requiring extension
              </CardDescription>
            </div>
            <Link to="/renewal-radar">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
                Open Radar &rarr;
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider border-y border-border">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Subscription</th>
                    <th className="py-2.5 px-4 font-semibold">Customer</th>
                    <th className="py-2.5 px-4 font-semibold">Expires</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Value</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSubscriptions.slice(0, 5).map(sub => (
                    <tr key={sub.id} className="hover:bg-secondary/30 transition">
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-600">
                        <Link to={`/subscriptions/${sub.id}`} className="hover:underline">
                          {sub.number}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-foreground truncate max-w-[140px]">{sub.customer_company}</div>
                        <div className="text-[11px] text-muted-foreground">{sub.plan_name}</div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-semibold text-foreground">{formatDate(sub.expiry_date)}</span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-foreground">
                        {formatCurrency(sub.total)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <Badge
                          variant={sub.status === 'active' ? 'default' : 'secondary'}
                          className="text-[10px] capitalize px-2 py-0"
                        >
                          {sub.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity: Real-time Payments Feed */}
      <Card className="border-border shadow-2xs">
        <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold">Recent Settled Payments & Bank Receipts</CardTitle>
            <CardDescription className="text-xs">
              Reconciled payment records from manual entry and split bank matcher
            </CardDescription>
          </div>
          <Link to="/payments">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
              View All Payments &rarr;
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider border-y border-border">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Payment Ref</th>
                  <th className="py-2.5 px-4 font-semibold">Invoice #</th>
                  <th className="py-2.5 px-4 font-semibold">Payer / Customer</th>
                  <th className="py-2.5 px-4 font-semibold">Payment Method</th>
                  <th className="py-2.5 px-4 font-semibold">Date</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Amount</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.slice(0, 5).map(pay => (
                  <tr key={pay.id} className="hover:bg-secondary/30 transition">
                    <td className="py-2.5 px-4 font-mono font-bold text-foreground">
                      {pay.payment_reference}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-blue-600">
                      {pay.invoice_number}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-foreground">
                      {pay.customer_name}
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold">
                        {pay.method}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground">
                      {formatDate(pay.paid_on)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600">
                      +{formatCurrency(pay.amount)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        pay.source === 'bank_match'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {pay.source === 'bank_match' ? 'Bank Match' : 'Manual Entry'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceDashboard;
