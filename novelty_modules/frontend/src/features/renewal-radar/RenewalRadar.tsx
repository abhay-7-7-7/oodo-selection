import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  Calendar,
  FileCheck2,
  CheckCircle2,
  Plus,
  Loader2,
  RefreshCw,
  Check,
} from 'lucide-react';
import { noveltyApi } from '@/services/apiClient';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { RenewalSubscription, RenewalBucket } from '@/types';

export const RenewalRadar: React.FC = () => {
  const [activeBucket, setActiveBucket] = useState<RenewalBucket | 'all'>('all');
  const [subscriptions, setSubscriptions] = useState<RenewalSubscription[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [creatingQuoteId, setCreatingQuoteId] = useState<string | null>(null);
  const [successQuoteId, setSuccessQuoteId] = useState<string | null>(null);

  const fetchSubscriptions = async (bucket?: string) => {
    setLoading(true);
    try {
      const res = await noveltyApi.getRenewalSubscriptions(
        bucket === 'all' ? undefined : bucket
      );
      setSubscriptions(res.items || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions(activeBucket);
  }, [activeBucket]);

  const handleGenerateQuote = async (sub: RenewalSubscription) => {
    setCreatingQuoteId(sub.subscription_id);
    setSuccessQuoteId(null);
    try {
      await noveltyApi.createRenewalQuotation({
        subscription_id: sub.subscription_id,
        customer_id: 'cust-001',
        plan_id: sub.plan_name.toLowerCase(),
        quantity: 1,
        notes: `Automated renewal quotation for ${sub.customer_name} generated via Renewal Radar.`,
      });
      setSuccessQuoteId(sub.subscription_id);
      fetchSubscriptions(activeBucket);
    } catch (err: any) {
      alert(err.message || 'Quotation creation failed');
    } finally {
      setCreatingQuoteId(null);
    }
  };

  const bucketCounts = {
    all: subscriptions.length,
    '7d': subscriptions.filter((s) => s.bucket === '7d').length,
    '30d': subscriptions.filter((s) => s.bucket === '30d').length,
    '60d': subscriptions.filter((s) => s.bucket === '60d').length,
    expired: subscriptions.filter((s) => s.bucket === 'expired').length,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 mb-2">
            Novelty N5 • Churn Prevention
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Renewal Radar
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Proactive pipeline bucketing customer subscriptions by expiry horizon (7, 30, 60 days) with instant 1-click renewal quotation drafts.
          </p>
        </div>

        <button
          onClick={() => fetchSubscriptions(activeBucket)}
          disabled={loading}
          className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Pipeline
        </button>
      </div>

      {/* Bucket Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: 'all', label: 'All Subscriptions', count: bucketCounts.all, color: 'text-slate-700 bg-slate-100' },
          { id: '7d', label: 'Urgent (≤ 7 Days)', count: bucketCounts['7d'], color: 'text-rose-700 bg-rose-50 border-rose-200' },
          { id: '30d', label: 'Next 30 Days', count: bucketCounts['30d'], color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { id: '60d', label: 'Next 60 Days', count: bucketCounts['60d'], color: 'text-blue-700 bg-blue-50 border-blue-200' },
          { id: 'expired', label: 'Expired / Lapsed', count: bucketCounts.expired, color: 'text-slate-700 bg-slate-100' },
        ].map((tab) => {
          const isActive = activeBucket === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveBucket(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Subscriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subscriptions.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
            No subscriptions found matching this renewal bucket.
          </div>
        ) : (
          subscriptions.map((sub) => {
            const is7d = sub.bucket === '7d';
            const isExpired = sub.bucket === 'expired';
            const isQuoteCreated = sub.has_open_renewal_quotation || successQuoteId === sub.subscription_id;

            return (
              <div
                key={sub.subscription_id}
                className={`bg-white rounded-2xl p-6 border transition-all shadow-sm flex flex-col justify-between space-y-4 ${
                  is7d
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : isExpired
                    ? 'border-slate-300 opacity-90'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                        is7d
                          ? 'bg-rose-100 text-rose-700'
                          : isExpired
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isExpired ? 'Expired' : `${sub.days_until_expiry} Days Left`}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      ID: {sub.subscription_id}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {sub.customer_name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Plan: <span className="font-semibold text-slate-700">{sub.plan_name}</span>
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Expiration Date:</span>
                      <span className="font-semibold text-slate-800">{formatDate(sub.expires_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Outstanding Balance:</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(sub.outstanding_paise)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  {isQuoteCreated ? (
                    <div className="w-full py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Renewal Quote Drafted
                    </div>
                  ) : (
                    <button
                      onClick={() => handleGenerateQuote(sub)}
                      disabled={creatingQuoteId === sub.subscription_id}
                      className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {creatingQuoteId === sub.subscription_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileCheck2 className="w-4 h-4" />
                      )}
                      1-Click Renewal Quotation
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
