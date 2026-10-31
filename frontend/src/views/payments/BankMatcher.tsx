import React, { useState } from 'react';
import {
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Banknote,
  ArrowRight,
  Info,
  BarChart2,
} from 'lucide-react';
import { apiClient } from 'src/services/apiClient';
import { formatCurrency, formatDate } from 'src/utils/calculations';
import { toast } from 'sonner';
import type { BankMatchProposal, BankTransactionRow } from 'src/types/index';

// ─── Demo bank statement data ────────────────────────────────────────────────

const DEMO_TRANSACTIONS: BankTransactionRow[] = [
  {
    id: 'bt-001',
    date: '2026-10-15',
    payer: 'TechCorp India Pvt Ltd',
    reference: 'NEFT-INV-2026-0105',
    amount: 23600,
  },
  {
    id: 'bt-002',
    date: '2026-10-18',
    payer: 'Ravi Patel',
    reference: 'UPI-REF-89234',
    amount: 45000,
  },
  {
    id: 'bt-003',
    date: '2026-10-22',
    payer: 'Unknown Corp',
    reference: 'CHQ-34521',
    amount: 99999,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function confidenceColor(confidence: number): string {
  if (confidence >= 99) return 'bg-green-500';
  if (confidence >= 90) return 'bg-teal-500';
  return 'bg-blue-500';
}

function confidenceBadge(confidence: number): string {
  if (confidence >= 99) return 'bg-green-50 text-green-700 border-green-200';
  if (confidence >= 90) return 'bg-teal-50 text-teal-700 border-teal-200';
  return 'bg-blue-50 text-blue-700 border-blue-200';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ConfidenceBarProps {
  confidence: number;
}

const ConfidenceBar: React.FC<ConfidenceBarProps> = ({ confidence }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${confidenceColor(confidence)}`}
        style={{ width: `${confidence}%` }}
      />
    </div>
    <span
      className={`text-xs font-bold px-2 py-0.5 border rounded-full ${confidenceBadge(confidence)}`}
    >
      {confidence}%
    </span>
  </div>
);

interface MatchProposalCardProps {
  proposal: BankMatchProposal;
  selected: boolean;
  onToggle: () => void;
}

const MatchProposalCard: React.FC<MatchProposalCardProps> = ({
  proposal,
  selected,
  onToggle,
}) => {
  const isSubsetSum = proposal.match_type === 'subset_sum';

  return (
    <div
      className={`border rounded-xl p-4 transition-all duration-150 ${
        selected
          ? 'border-blue-400 bg-blue-50/40 shadow-sm'
          : 'border-slate-200 bg-white shadow-sm'
      }`}
    >
      {/* Top row: checkbox + bank row info */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-1 w-4 h-4 accent-blue-600 cursor-pointer flex-shrink-0"
        />
        <div className="flex-1 min-w-0 space-y-3">
          {/* Bank Row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-800 text-sm">
                {proposal.row.payer}
              </p>
              <p className="text-xs text-slate-500 font-mono">
                {proposal.row.reference} · {formatDate(proposal.row.date)}
              </p>
            </div>
            <span className="text-lg font-bold text-slate-800 whitespace-nowrap">
              {formatCurrency(proposal.row.amount)}
            </span>
          </div>

          {/* Match Type Badge */}
          <div className="flex flex-wrap items-center gap-2">
            {isSubsetSum ? (
              <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                <span className="bg-teal-600 text-white text-[9px] font-bold px-1 rounded">
                  N3
                </span>
                Subset-Sum Match
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Exact Match
              </span>
            )}
            {isSubsetSum && (
              <span className="text-xs text-teal-600 italic">
                Deposit covers multiple invoices
              </span>
            )}
          </div>

          {/* Confidence */}
          <div>
            <p className="text-xs text-slate-500 mb-1">Confidence Score</p>
            <ConfidenceBar confidence={Math.round(proposal.confidence * 100)} />
          </div>

          {/* Match Reason */}
          <p className="text-xs text-slate-500 italic">{proposal.reason}</p>

          {/* Matched Invoices */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
              Matched Invoice{proposal.matched_invoices.length > 1 ? 's' : ''}
            </p>
            <div className="space-y-1.5">
              {proposal.matched_invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-blue-600">
                        {inv.number}
                      </span>
                      <span className="text-xs text-slate-500 ml-2">
                        {inv.customer_name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-700">
                      {formatCurrency(inv.total)}
                    </p>
                    <p className="text-[10px] text-amber-600">
                      {formatCurrency(inv.outstanding)} outstanding
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── How Subset-Sum Works accordion ──────────────────────────────────────────

const SubsetSumExplainer: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-2 font-semibold text-slate-700 text-sm">
          <Info className="w-4 h-4 text-teal-500" />
          How Subset-Sum Matching Works
          <span className="bg-teal-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
            N3
          </span>
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 text-sm text-slate-600 border-t border-slate-100">
          <p className="pt-4">
            The <strong>subset-sum problem</strong> asks: given a set of
            numbers, find which subset adds up to a target value. Brightloop
            applies this to bank matching:
          </p>

          <div className="space-y-2">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <p>
                <strong>Collect open invoices.</strong> Brightloop gathers all
                invoices with an outstanding balance — their amounts form the
                candidate set.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <p>
                <strong>For each bank deposit,</strong> the algorithm checks
                whether any combination of outstanding invoices sums to the
                deposit amount (within a small tolerance for rounding).
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <p>
                <strong>Dynamic programming</strong> makes this efficient:
                rather than testing all 2ⁿ subsets, a DP table is built in
                O(n × target) time, making it practical for hundreds of invoices.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                4
              </span>
              <p>
                <strong>Ranked by confidence:</strong> exact matches score
                100%, subset-sum matches are scored by how closely the matched
                invoices' customers or references align with the bank row's
                payer name and reference.
              </p>
            </div>
          </div>

          {/* Example */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <p className="font-semibold text-slate-700 text-xs uppercase tracking-wide">
              Concrete Example
            </p>
            <p>
              Bank deposit: <strong>{formatCurrency(45000)}</strong> from "Ravi
              Patel"
            </p>
            <p>Open invoices:</p>
            <ul className="list-disc list-inside space-y-1 text-xs ml-2">
              <li>INV-2026-0201 — {formatCurrency(20000)}</li>
              <li>INV-2026-0202 — {formatCurrency(15000)}</li>
              <li>INV-2026-0203 — {formatCurrency(10000)}</li>
              <li>INV-2026-0210 — {formatCurrency(8000)}</li>
            </ul>
            <p>
              The algorithm finds that{' '}
              <strong>
                {formatCurrency(20000)} + {formatCurrency(15000)} +{' '}
                {formatCurrency(10000)} = {formatCurrency(45000)}
              </strong>{' '}
              — a perfect subset-sum match covering 3 invoices in one deposit.
              All three are marked paid in a single approval step.
            </p>
          </div>

          <p className="text-xs text-slate-400">
            Unmatched deposits are flagged for manual review — no payment is
            ever recorded without explicit approval.
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const BankMatcherPage: React.FC = () => {
  const [analysing, setAnalysing] = useState(false);
  const [analysed, setAnalysed] = useState(false);
  const [matches, setMatches] = useState<BankMatchProposal[]>([]);
  const [unmatched, setUnmatched] = useState<BankTransactionRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState(false);
  const [approvalResult, setApprovalResult] = useState<number | null>(null);

  async function handleAnalyse() {
    setAnalysing(true);
    setAnalysed(false);
    setMatches([]);
    setUnmatched([]);
    setSelectedIds(new Set());
    setApprovalResult(null);
    try {
      const result = await apiClient.uploadBankTransactions();
      setMatches(result.matches);
      setUnmatched(result.unmatched);
      // Pre-select all matched
      setSelectedIds(
        new Set(result.matches.map((m) => m.row.id || m.row.row_id || ''))
      );
      setAnalysed(true);
      toast.success(
        `Analysis complete: ${result.matches.length} match${result.matches.length !== 1 ? 'es' : ''} found.`
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Analysis failed.';
      toast.error(msg);
    } finally {
      setAnalysing(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleApprove() {
    const selected = matches
      .filter((m) => selectedIds.has(m.row.id || m.row.row_id || ''))
      .map((m) => ({ row: m.row, invoice_ids: m.matched_invoice_ids }));
    if (selected.length === 0) {
      toast.error('Select at least one match to approve.');
      return;
    }
    setApproving(true);
    try {
      const result = await apiClient.approveBankMatches(selected);
      setApprovalResult(result.payments_recorded);
      toast.success(
        `${result.payments_recorded} payment${result.payments_recorded !== 1 ? 's' : ''} recorded successfully!`
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Approval failed.';
      toast.error(msg);
    } finally {
      setApproving(false);
    }
  }

  const selectedCount = selectedIds.size;

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      {/* ── Hero Explainer ── */}
      <div className="border border-teal-200 shadow-sm rounded-xl bg-gradient-to-br from-teal-50 to-white overflow-hidden">
        <div className="px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-800">
                  Bank Matcher
                </h1>
                <span className="bg-teal-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                  N3
                </span>
              </div>
              <p className="text-sm text-slate-600 max-w-xl">
                Automatically reconcile bank statement deposits against open
                invoices — even when a single deposit covers{' '}
                <strong>multiple invoices</strong> using the subset-sum
                algorithm.
              </p>

              {/* Flow steps */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {[
                  { icon: <Upload className="w-3.5 h-3.5" />, label: 'Upload statement' },
                  {
                    icon: <Sparkles className="w-3.5 h-3.5" />,
                    label: 'AI subset-sum matching',
                  },
                  {
                    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
                    label: '1-click approve',
                  },
                ].map((step, i, arr) => (
                  <React.Fragment key={step.label}>
                    <span className="inline-flex items-center gap-1.5 bg-white border border-teal-200 text-teal-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
                      {step.icon}
                      {step.label}
                    </span>
                    {i < arr.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center">
                <BarChart2 className="w-8 h-8 text-teal-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Demo Bank Statement ── */}
      <div className="border border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800 text-sm">
              Demo Bank Statement
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              3 sample transactions loaded for demonstration
            </p>
          </div>
          <button
            onClick={handleAnalyse}
            disabled={analysing}
            className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
          >
            {analysing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analysing…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyse Statement
              </>
            )}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Date', 'Payer', 'Reference', 'Amount'].map((col) => (
                  <th
                    key={col}
                    className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DEMO_TRANSACTIONS.map((tx, idx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {formatDate(tx.date)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                    {tx.payer}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {tx.reference}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">
                    {formatCurrency(tx.amount)}
                    {idx === 1 && (
                      <span className="ml-2 text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded-full font-semibold">
                        subset-sum
                      </span>
                    )}
                    {idx === 2 && (
                      <span className="ml-2 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-semibold">
                        unmatched
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Analysis Results ── */}
      {analysed && (
        <>
          {/* Matched Section */}
          {matches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Matched Transactions
                  <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                    {matches.length} found
                  </span>
                </h2>
                <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedCount === matches.length}
                    onChange={() => {
                      if (selectedCount === matches.length) {
                        setSelectedIds(new Set());
                      } else {
                        setSelectedIds(new Set(matches.map((m) => m.row.id || m.row.row_id || '')));
                      }
                    }}
                    className="accent-blue-600"
                  />
                  Select all
                </label>
              </div>

              <div className="space-y-3">
                {matches.map((proposal) => {
                  const pId = proposal.row.id || proposal.row.row_id || '';
                  return (
                    <MatchProposalCard
                      key={pId}
                      proposal={proposal}
                      selected={selectedIds.has(pId)}
                      onToggle={() => toggleSelect(pId)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Unmatched Section */}
          {unmatched.length > 0 && (
            <div className="border border-amber-200 shadow-sm rounded-xl bg-amber-50 overflow-hidden">
              <div className="px-5 py-4 border-b border-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h2 className="font-semibold text-amber-800 text-sm">
                  Unmatched Transactions
                </h2>
                <span className="text-xs bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full font-semibold">
                  {unmatched.length} row{unmatched.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="px-5 py-3 space-y-2">
                <p className="text-xs text-amber-700 mb-3">
                  These deposits could not be matched to any open invoice.
                  Review manually or contact the payer.
                </p>
                {unmatched.map((tx, idx) => (
                  <div
                    key={tx.id || tx.row_id || idx}
                    className="flex flex-wrap items-center justify-between gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {tx.payer}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {tx.reference} · {formatDate(tx.date)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-amber-700">
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approval Result Banner */}
          {approvalResult !== null && (
            <div className="border border-green-200 bg-green-50 rounded-xl px-5 py-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-green-800">
                {approvalResult} payment
                {approvalResult !== 1 ? 's' : ''} recorded successfully from
                bank matching.
              </p>
            </div>
          )}

          {/* Approve Button */}
          {approvalResult === null && matches.length > 0 && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                {selectedCount} of {matches.length} match
                {matches.length !== 1 ? 'es' : ''} selected
              </p>
              <button
                onClick={handleApprove}
                disabled={approving || selectedCount === 0}
                className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
              >
                {approving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Approving…
                  </>
                ) : (
                  <>
                    <Banknote className="w-4 h-4" />
                    Approve Selected Matches ({selectedCount})
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Subset-Sum Explainer ── */}
      <SubsetSumExplainer />
    </div>
  );
};

export default BankMatcherPage;
