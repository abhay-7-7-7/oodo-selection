// Brightloop Novelty N4: "Why Did My Bill Change?" Explainer
import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  FileText,
  Calendar,
  Sparkles,
  CheckCircle2,
  Receipt,
  Scale,
  Search,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { apiClient } from 'src/services/apiClient';
import { Invoice } from 'src/types';
import { formatCurrency, formatDate } from 'src/utils/calculations';
import { toast } from 'sonner';

export const BillExplainerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialInvoiceId = searchParams.get('invoice_id') || '';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(initialInvoiceId);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [explanation, setExplanation] = useState<{
    summary_sentence: string;
    deltas: Array<{
      component: string;
      old_value: number;
      new_value: number;
      difference: number;
      description: string;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const list = await apiClient.getInvoices();
        // Prefer subscription-linked invoices
        const subInvoices = list.filter((i) => i.subscription_id);
        setInvoices(subInvoices.length > 0 ? subInvoices : list);

        const targetId = initialInvoiceId || (subInvoices[0]?.id || list[0]?.id);
        if (targetId) {
          setSelectedInvoiceId(targetId);
          loadExplanation(targetId, list);
        }
      } catch (err: any) {
        toast.error('Failed to load invoices');
      }
    };
    fetchInvoices();
  }, [initialInvoiceId]);

  const loadExplanation = async (invId: string, currentInvoices = invoices) => {
    setLoading(true);
    try {
      const inv = currentInvoices.find((i) => i.id === invId);
      if (inv) setSelectedInvoice(inv);

      const data = await apiClient.getBillChangeExplanation(invId);
      setExplanation(data);
    } catch (err: any) {
      toast.error('Could not compute bill comparison');
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceChange = (id: string) => {
    setSelectedInvoiceId(id);
    setSearchParams({ invoice_id: id });
    loadExplanation(id);
  };

  // Mock prior cycle baseline values for Before/After visual comparison
  const deltaTotal = explanation?.deltas.reduce((s, d) => s + d.difference, 0) || 0;
  const currentTotal = selectedInvoice?.total || 0;
  const priorTotal = Math.max(0, currentTotal - deltaTotal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Why Did My Bill Change?</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
              Novelty N4
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Automated snapshot delta engine providing human-readable explanations of subscription invoice changes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedInvoice && (
            <Link
              to="/invoices"
              className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm"
            >
              <FileText className="w-4 h-4" />
              View All Invoices
            </Link>
          )}
        </div>
      </div>

      {/* Invoice Selector Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Receipt className="w-5 h-5 text-blue-600 shrink-0" />
          <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
            Select Target Invoice:
          </label>
          <select
            value={selectedInvoiceId}
            onChange={(e) => handleInvoiceChange(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-mono"
          >
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.number} — {inv.customer_name} ({formatCurrency(inv.total)})
              </option>
            ))}
          </select>
        </div>

        {selectedInvoice && (
          <div className="text-xs text-slate-500 flex items-center gap-4">
            <span>
              Period: <strong className="text-slate-700">{formatDate(selectedInvoice.period_start)}</strong> to{' '}
              <strong className="text-slate-700">{formatDate(selectedInvoice.period_end)}</strong>
            </span>
            <span>
              Sub: <strong className="text-blue-600 font-mono">{selectedInvoice.subscription_number}</strong>
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-teal-500 animate-spin" />
          Analyzing pricing engine snapshots and computing cycle delta...
        </div>
      ) : explanation ? (
        <div className="space-y-6">
          {/* Main Hero Summary Card */}
          <div className="bg-gradient-to-r from-teal-500/10 via-blue-500/5 to-transparent border border-teal-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-teal-600 text-white rounded-xl shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  Automated Natural Language Analysis
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  "{explanation.summary_sentence}"
                </h2>
                <p className="text-sm text-slate-600">
                  Compared against the previous billing cycle baseline for subscription{' '}
                  <strong className="text-slate-800">{selectedInvoice?.subscription_number}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Before vs After Visual Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Prior Cycle */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Previous Cycle Invoice
              </span>
              <div className="text-2xl font-bold text-slate-700 font-mono">
                {formatCurrency(priorTotal)}
              </div>
              <p className="text-xs text-slate-500">Baseline before mid-cycle plan changes</p>
            </div>

            {/* Delta Indicator */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Net Bill Change
              </span>
              <div
                className={`text-2xl font-bold flex items-center gap-1.5 ${
                  deltaTotal > 0 ? 'text-rose-600' : deltaTotal < 0 ? 'text-emerald-600' : 'text-slate-700'
                }`}
              >
                {deltaTotal > 0 ? (
                  <TrendingUp className="w-5 h-5 text-rose-600" />
                ) : deltaTotal < 0 ? (
                  <TrendingDown className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Scale className="w-5 h-5 text-slate-500" />
                )}
                {deltaTotal > 0 ? `+${formatCurrency(deltaTotal)}` : formatCurrency(deltaTotal)}
              </div>
              <span className="text-xs text-slate-500 mt-1">
                {deltaTotal > 0 ? 'Surcharge / Variant added' : deltaTotal < 0 ? 'Discount applied' : 'Zero variance'}
              </span>
            </div>

            {/* Current Cycle */}
            <div className="bg-white rounded-xl border border-blue-200 bg-blue-50/20 p-5 shadow-sm space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Current Cycle Invoice ({selectedInvoice?.number})
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {formatCurrency(currentTotal)}
              </div>
              <p className="text-xs text-slate-500">Reflects current active configuration</p>
            </div>
          </div>

          {/* Line-by-Line Delta Breakdown Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">Component Variance Breakdown</h3>
              <span className="text-xs text-slate-500">{explanation.deltas.length} variance components identified</span>
            </div>

            {explanation.deltas.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                This invoice is identical to the prior cycle. No price or component variance detected.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Component</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Prior Value</th>
                      <th className="py-3 px-4 text-right">New Value</th>
                      <th className="py-3 px-4 text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {explanation.deltas.map((d, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-semibold text-slate-800 capitalize">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                            {d.component}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{d.description}</td>
                        <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                          {formatCurrency(d.old_value)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-900 font-semibold font-mono">
                          {formatCurrency(d.new_value)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold font-mono">
                          <span className={d.difference > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                            {d.difference > 0 ? `+${formatCurrency(d.difference)}` : formatCurrency(d.difference)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Architecture Guarantee Note */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">Snapshot Integrity: </span>
              Brightloop records immutable JSON snapshots at invoice confirmation. Even if catalog prices, taxes, or variant surcharges change later, historical explanations remain 100% reproducible and verifiable for customer trust.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BillExplainerPage;
