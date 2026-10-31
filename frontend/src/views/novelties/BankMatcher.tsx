import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  Check,
  History,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { noveltyApi } from '@/services/apiClient';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import type { MatchProposal, ReconciliationRecord } from '@/types';

export const BankMatcher: React.FC = () => {
  const [proposals, setProposals] = useState<MatchProposal[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<boolean>(false);
  const [reconciling, setReconciling] = useState<boolean>(false);
  const [history, setHistory] = useState<ReconciliationRecord[]>([]);
  const [reconciliationSuccess, setReconciliationSuccess] = useState<string | null>(null);
  const [showExplainer, setShowExplainer] = useState<boolean>(false);

  const fetchHistory = async () => {
    try {
      const res = await noveltyApi.getReconciliationHistory();
      setHistory(res.items || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchHistory();
    // Load sample data by default so user can immediately test
    handleLoadSampleCSV();
  }, []);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setReconciliationSuccess(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await noveltyApi.uploadBankCSV(formData);
      setProposals(res.proposals || []);

      // Default select all high-confidence matches
      const initialSelected: Record<string, boolean> = {};
      res.proposals.forEach((p) => {
        if (p.suggestions.length > 0) {
          initialSelected[p.transaction_id] = true;
        }
      });
      setSelectedMatches(initialSelected);
    } catch (err: any) {
      alert(err.message || 'CSV upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSampleCSV = () => {
    const sampleCSV = `date,description,reference,payer,amount\n2026-10-15,NEFT Settlement from TechCorp,NEFT-INV-2026-0105,TechCorp India,236.00\n2026-10-18,Consolidated Client Wire,CHQ-34521,Ravi Patel,450.00\n2026-10-22,Unidentified Suspense Deposit,UPI-98214,,150.00`;
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const file = new File([blob], 'sample_bank_statement.csv', { type: 'text/csv' });
    handleFileUpload(file);
  };

  const toggleSelect = (txId: string) => {
    setSelectedMatches((prev) => ({ ...prev, [txId]: !prev[txId] }));
  };

  const handleApproveSelected = async () => {
    const toReconcile: any[] = [];

    proposals.forEach((p) => {
      if (selectedMatches[p.transaction_id] && p.suggestions.length > 0) {
        toReconcile.push({
          transaction_id: p.transaction_id,
          invoice_ids: p.suggestions.map((s) => s.invoice_id),
          amount_paise: p.transaction_amount_paise,
          confidence: p.suggestions[0]?.confidence || 1.0,
          match_type: p.match_type,
        });
      }
    });

    if (toReconcile.length === 0) {
      alert('No matches selected for reconciliation');
      return;
    }

    setReconciling(true);
    try {
      const records = await noveltyApi.reconcileMatches(toReconcile);
      setReconciliationSuccess(`Successfully reconciled ${records.length} bank deposit(s)!`);
      fetchHistory();
      // Remove reconciled proposals
      setProposals((prev) => prev.filter((p) => !selectedMatches[p.transaction_id]));
      setSelectedMatches({});
    } catch (err: any) {
      alert(err.message || 'Reconciliation failed');
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 mb-2">
            Novelty N3 • Subset-Sum Algorithm
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Split-Payment Bank Matcher
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Solves the classical subset-sum problem by automatically matching multi-invoice lump-sum wire deposits to open customer invoices.
          </p>
        </div>

        <button
          onClick={() => setShowExplainer(!showExplainer)}
          className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-teal-600" />
          How Subset-Sum Works
        </button>
      </div>

      {/* Explainer Accordion */}
      {showExplainer && (
        <div className="bg-teal-50/60 border border-teal-200 rounded-2xl p-6 text-teal-900 text-xs space-y-3">
          <h3 className="font-bold text-sm text-teal-950 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            The Multi-Invoice Reconciliation Challenge
          </h3>
          <p className="leading-relaxed">
            Customers frequently pay multiple pending invoices with a single lump-sum bank transfer. Traditional billing tools fail to reconcile these because no single invoice matches the bank credit amount.
          </p>
          <p className="leading-relaxed">
            Our <strong>N3 Subset-Sum Matcher</strong> takes the deposit amount (e.g. ₹45,000) and finds the exact combination of pending customer invoices (e.g. ₹18,000 + ₹27,000 = ₹45,000) that balances the transfer with 95%+ confidence.
          </p>
        </div>
      )}

      {/* Upload Zone & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl p-6 border-2 border-dashed border-slate-300 hover:border-teal-500 transition-colors text-center relative flex flex-col items-center justify-center min-h-[160px]">
          <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            Upload Bank Statement CSV
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Columns: date, description, reference, payer, amount
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Demo Testing</h3>
            <p className="text-xs text-slate-500 mt-1">
              Load an instant sample statement containing both 1:1 exact matches and 1:N subset-sum split transfers.
            </p>
          </div>
          <button
            onClick={handleLoadSampleCSV}
            disabled={uploading}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 text-teal-600" />}
            Reload Sample Statement
          </button>
        </div>
      </div>

      {reconciliationSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {reconciliationSuccess}
        </div>
      )}

      {/* Match Proposals Table / Cards */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              Algorithmic Match Proposals
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review computed proposals before batch approving payment allocations
            </p>
          </div>

          <button
            onClick={handleApproveSelected}
            disabled={reconciling || Object.values(selectedMatches).filter(Boolean).length === 0}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {reconciling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Approve Selected ({Object.values(selectedMatches).filter(Boolean).length})
          </button>
        </div>

        <div className="space-y-4">
          {proposals.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No pending bank statement transactions to match.
            </div>
          ) : (
            proposals.map((p) => {
              const isSelected = !!selectedMatches[p.transaction_id];
              const isExact = p.match_type === 'exact';
              const isSubset = p.match_type === 'subset_sum';
              const hasMatch = p.suggestions.length > 0;

              return (
                <div
                  key={p.transaction_id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-teal-400 bg-teal-50/20 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Bank Tx Info */}
                    <div className="flex items-start gap-3">
                      {hasMatch && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(p.transaction_id)}
                          className="mt-1 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-slate-800">
                            {formatCurrency(p.transaction_amount_paise)}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              isExact
                                ? 'bg-emerald-100 text-emerald-700'
                                : isSubset
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isExact ? 'Exact 1:1 Match' : isSubset ? 'Subset-Sum Match (N3)' : 'Unmatched'}
                          </span>
                          {hasMatch && (
                            <span className="text-[11px] text-teal-700 font-semibold">
                              Confidence: {Math.round(p.suggestions[0].confidence * 100)}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 font-medium">
                          {p.transaction_description}
                        </p>
                      </div>
                    </div>

                    {/* Matched Invoices Breakdown */}
                    <div className="w-full md:w-auto flex flex-col md:items-end">
                      {hasMatch ? (
                        <div className="space-y-1.5 w-full md:w-auto">
                          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Matched Against:
                          </div>
                          {p.suggestions.map((inv) => (
                            <div
                              key={inv.invoice_id}
                              className="flex items-center justify-between md:justify-end gap-3 text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200"
                            >
                              <span className="font-semibold text-slate-700">
                                {inv.invoice_number} ({inv.customer_name})
                              </span>
                              <span className="font-bold text-slate-900">
                                {formatCurrency(inv.outstanding_paise)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> Requires manual investigation
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          Reconciliation Audit Trail
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Invoices Reconciled</th>
                <th className="py-3 px-4">Amount Reconciled</th>
                <th className="py-3 px-4">Match Algorithm</th>
                <th className="py-3 px-4">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No reconciliations completed yet.
                  </td>
                </tr>
              ) : (
                history.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px]">{formatDateTime(rec.reconciled_at)}</td>
                    <td className="py-3 px-4 font-mono">{rec.transaction_id.slice(0, 8)}...</td>
                    <td className="py-3 px-4 font-semibold">{rec.invoice_ids.join(', ')}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{formatCurrency(rec.amount_paise)}</td>
                    <td className="py-3 px-4 capitalize font-medium">{rec.match_type.replace('_', ' ')}</td>
                    <td className="py-3 px-4 font-bold text-teal-600">{Math.round(rec.confidence * 100)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


export default BankMatcher;
