import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Loader2,
  HelpCircle,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { noveltyApi } from '@/services/apiClient';
import { formatCurrency } from '@/utils/formatters';
import type { BillExplanation } from '@/types';

export const BillExplainer: React.FC = () => {
  const [prevId, setPrevId] = useState<string>('inv-001');
  const [currId, setCurrId] = useState<string>('inv-002');
  const [loading, setLoading] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<BillExplanation | null>(null);

  const fetchExplanation = async (pId: string, cId: string) => {
    setLoading(true);
    try {
      const res = await noveltyApi.explainBill(pId, cId);
      setExplanation(res);
    } catch (err: any) {
      alert(err.message || 'Failed to generate bill explanation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExplanation(prevId, currId);
  }, []);

  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExplanation(prevId, currId);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 mb-2">
            Novelty N4 • Plain-English Diff
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Bill-Change Explainer
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Empowers customers and support reps by translating complex recurring billing adjustments, plan prorations, and tax deltas into human-friendly explanations.
          </p>
        </div>
      </div>

      {/* Invoice Selector Controls */}
      <form
        onSubmit={handleCompare}
        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Previous Invoice ID / Number
          </label>
          <input
            type="text"
            value={prevId}
            onChange={(e) => setPrevId(e.target.value)}
            placeholder="e.g. inv-001"
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Current / New Invoice ID
          </label>
          <input
            type="text"
            value={currId}
            onChange={(e) => setCurrId(e.target.value)}
            placeholder="e.g. inv-002"
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Compare & Explain Differences
        </button>
      </form>

      {/* Results View */}
      {explanation ? (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-200 mb-2">
              <Sparkles className="w-4 h-4" /> Natural Language AI Summary
            </div>
            <h2 className="text-xl font-bold leading-snug">
              {explanation.human_summary}
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-6 pt-4 border-t border-white/20 text-xs">
              <div>
                <span className="text-violet-200 block">Previous Total:</span>
                <span className="font-bold text-base">{formatCurrency(explanation.previous_total_paise)}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-violet-300 shrink-0 hidden sm:block" />
              <div>
                <span className="text-violet-200 block">Current Total:</span>
                <span className="font-bold text-base">{formatCurrency(explanation.current_total_paise)}</span>
              </div>
              <div className="sm:ml-auto">
                <span className="text-violet-200 block">Net Change:</span>
                <span className={`font-bold text-base flex items-center gap-1 ${explanation.total_delta_paise >= 0 ? 'text-amber-200' : 'text-emerald-200'}`}>
                  {explanation.total_delta_paise >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {formatCurrency(Math.abs(explanation.total_delta_paise))}
                </span>
              </div>
            </div>
          </div>

          {/* Line By Line Deltas */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Granular Line-Item Delta Analysis
            </h3>

            <div className="space-y-3">
              {explanation.changes.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No line-item differences found between these two invoices.
                </div>
              ) : (
                explanation.changes.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            {c.label}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ({c.field})
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 font-medium">
                          {c.explanation}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
                        <span className="text-slate-500">
                          {typeof c.previous === 'number' && c.previous > 100
                            ? formatCurrency(c.previous)
                            : c.previous}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-900">
                          {typeof c.current === 'number' && c.current > 100
                            ? formatCurrency(c.current)
                            : c.current}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.delta_paise >= 0
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {c.delta_paise >= 0 ? '+' : '-'}
                          {formatCurrency(Math.abs(c.delta_paise))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
          Enter two invoice identifiers to compare.
        </div>
      )}
    </div>
  );
};
