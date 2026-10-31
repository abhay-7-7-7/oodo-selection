// Brightloop Customer Portal: Subscriptions
import React, { useState, useEffect } from 'react';
import {
  Repeat,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  History,
  RotateCcw,
} from 'lucide-react';
import { apiClient } from 'src/services/apiClient';
import { useAuth } from 'src/context/AuthContext';
import { Subscription } from 'src/types';
import { formatCurrency, formatDate } from 'src/utils/calculations';
import { toast } from 'sonner';

export const PortalSubscriptions: React.FC = () => {
  const { user } = useAuth();
  const customerId = user?.customer_id || 'cust-1';

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'closed'>('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getPortalSubscriptions(customerId);
      setSubscriptions(data);
    } catch (err: any) {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [customerId]);

  const handleRenew = async (sub: Subscription) => {
    try {
      await apiClient.renewSubscription(sub.id);
      toast.success(`Subscription ${sub.number} successfully renewed!`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Renewal not available');
    }
  };

  const filteredSubs = subscriptions.filter(
    (s) => statusFilter === 'all' || s.status === statusFilter
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Subscriptions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review active software subscription plans, billing cadences, and renewal schedules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['all', 'active', 'paused', 'closed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading your subscriptions...</div>
      ) : filteredSubs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <Repeat className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          No subscriptions found for filter: <strong className="capitalize">{statusFilter}</strong>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSubs.map((sub) => (
            <div key={sub.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-600">{sub.number}</span>
                    <h2 className="text-xl font-bold text-slate-900 mt-0.5">{sub.plan_name}</h2>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold capitalize ${
                      sub.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : sub.status === 'paused'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>

                {/* Pricing & Dates */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Cadence</span>
                    <strong className="text-slate-900 capitalize text-sm">{sub.billing_period}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Recurring Amount</span>
                    <strong className="text-slate-900 text-sm">{formatCurrency(sub.total)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Start Date</span>
                    <strong className="text-slate-700">{formatDate(sub.start_date)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Next Renewal</span>
                    <strong className="text-slate-700">{formatDate(sub.next_billing_date)}</strong>
                  </div>
                </div>

                {/* Line Items */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Included Products & Variants
                  </span>
                  <div className="space-y-1.5">
                    {sub.lines.map((l) => (
                      <div key={l.id} className="text-xs flex justify-between items-center text-slate-700">
                        <span>
                          {l.quantity}x {l.product_name} {l.variant_name ? `(${l.variant_name})` : ''}
                        </span>
                        <span className="font-mono font-medium">{formatCurrency(l.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Payment Terms: {sub.payment_terms}</span>
                {sub.plan_renewable !== false && sub.status !== 'closed' && (
                  <button
                    onClick={() => handleRenew(sub)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Renew Subscription
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PortalSubscriptions;
