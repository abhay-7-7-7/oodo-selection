// Brightloop Customer Portal: Dashboard
import React, { useState, useEffect } from 'react';
import {
  Repeat,
  FileText,
  CreditCard,
  Calendar,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  Download,
  Building,
  Shield,
} from 'lucide-react';
import { Link } from 'react-router';
import { Button } from 'src/components/ui/button';
import { apiClient } from 'src/services/apiClient';
import { useAuth } from 'src/context/AuthContext';
import { Subscription, Invoice, PaymentRecord } from 'src/types';
import { formatCurrency, formatDate } from 'src/utils/calculations';
import { toast } from 'sonner';

export const PortalDashboard: React.FC = () => {
  const { user, switchRole } = useAuth();
  const customerId = user?.customer_id || 'cust-1';

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPortalData = async () => {
    setLoading(true);
    try {
      const [subs, invs] = await Promise.all([
        apiClient.getPortalSubscriptions(customerId),
        apiClient.getPortalInvoices(customerId),
      ]);
      setSubscriptions(subs);
      setInvoices(invs);
    } catch (err: any) {
      toast.error('Failed to load portal account details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [customerId]);

  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const outstandingInvoices = invoices.filter((i) => i.status !== 'paid' && i.status !== 'cancelled');
  const totalOutstanding = outstandingInvoices.reduce((sum, i) => sum + (i.total - i.paid_total), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.paid_total, 0);
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');

  const earliestNextBilling = activeSubs
    .map((s) => s.next_billing_date)
    .filter(Boolean)
    .sort()[0];

  const handleRenew = async (sub: Subscription) => {
    try {
      await apiClient.renewSubscription(sub.id);
      toast.success(`Subscription ${sub.number} successfully renewed!`);
      await loadPortalData();
    } catch (err: any) {
      toast.error(err.message || 'Renewal not available for this plan');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
              Customer Billing Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user?.name || 'Customer'}
            </h1>
            <p className="text-sm text-blue-100 max-w-xl">
              Manage your active software subscriptions, review itemized billing statements, and track payment history.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/portal/invoices"
              className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              View Invoices
            </Link>
          </div>
        </div>
      </div>

      {/* Overdue Warning Alert */}
      {overdueInvoices.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-4 text-rose-900 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">Payment Required: </span>
              You have {overdueInvoices.length} overdue invoice(s) totaling{' '}
              <strong className="font-bold">{formatCurrency(totalOutstanding)}</strong>.
            </div>
          </div>
          <Link
            to="/portal/invoices"
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shrink-0"
          >
            Review & Settle
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Subscriptions</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{activeSubs.length}</span>
            <p className="text-xs text-slate-500 mt-1">{subscriptions.length} total historical plans</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Outstanding Balance</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold ${totalOutstanding > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {formatCurrency(totalOutstanding)}
            </span>
            <p className="text-xs text-slate-500 mt-1">{outstandingInvoices.length} invoices awaiting payment</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Next Billing Date</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              {earliestNextBilling ? formatDate(earliestNextBilling) : '—'}
            </span>
            <p className="text-xs text-slate-500 mt-1">Automatic renewal date</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Settled</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</span>
            <p className="text-xs text-slate-500 mt-1">Lifetime payments processed</p>
          </div>
        </div>
      </div>

      {/* Subscriptions Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 text-base flex items-center gap-2">
            <Repeat className="w-4 h-4 text-blue-600" />
            My Active Subscriptions
          </h2>
          <Link to="/portal/subscriptions" className="text-xs font-semibold text-blue-600 hover:underline">
            View All Subscriptions &rarr;
          </Link>
        </div>

        {activeSubs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No active subscriptions currently active.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSubs.map((sub) => (
              <div key={sub.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-medium text-blue-600">{sub.number}</span>
                    <h3 className="font-bold text-slate-900 text-base">{sub.plan_name}</h3>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <div>Cadence: <strong className="text-slate-800 capitalize">{sub.billing_period}</strong></div>
                  <div>Amount: <strong className="text-slate-800">{formatCurrency(sub.total)}</strong></div>
                  <div>Next Renewal: <strong>{formatDate(sub.next_billing_date)}</strong></div>
                  <div>Terms: <strong>{sub.payment_terms}</strong></div>
                </div>

                {sub.plan_renewable !== false && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleRenew(sub)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
                    >
                      Renew Early
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Invoices Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Recent Billing Invoices
          </h2>
          <Link to="/portal/invoices" className="text-xs font-semibold text-blue-600 hover:underline">
            All Invoices &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.slice(0, 5).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-mono font-medium text-blue-600">{inv.number}</td>
                  <td className="py-3.5 px-4 text-slate-600 text-xs">
                    {formatDate(inv.period_start)} – {formatDate(inv.period_end)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 text-xs">{formatDate(inv.due_date)}</td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-900">{formatCurrency(inv.total)}</td>
                  <td className="py-3.5 px-4 text-right font-bold">
                    {inv.total - inv.paid_total > 0.01 ? (
                      <span className={inv.status === 'overdue' ? 'text-rose-600' : 'text-amber-600'}>
                        {formatCurrency(inv.total - inv.paid_total)}
                      </span>
                    ) : (
                      <span className="text-emerald-600">Paid in Full</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                        inv.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'overdue'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {inv.subscription_id && (
                        <Link
                          to={`/bill-explainer?invoice_id=${inv.id}`}
                          title="Why did my bill change? (N4)"
                          className="p-1 text-teal-600 hover:bg-teal-50 rounded"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </Link>
                      )}
                      <Link
                        to="/portal/invoices"
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        View &rarr;
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PortalDashboard;
