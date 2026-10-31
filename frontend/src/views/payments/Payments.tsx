import React, { useEffect, useState, useMemo } from 'react';
import {
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  Search,
  Plus,
  X,
  ChevronDown,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { apiClient } from 'src/services/apiClient';
import { useAuth } from 'src/context/AuthContext';
import { formatCurrency, formatDate } from 'src/utils/calculations';
import { toast } from 'sonner';
import type { PaymentRecord, PaymentMethod, Invoice } from 'src/types/index';

// ─── helpers ────────────────────────────────────────────────────────────────

const METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  upi: <Smartphone className="w-4 h-4 text-violet-500" />,
  bank_transfer: <Banknote className="w-4 h-4 text-blue-500" />,
  card: <CreditCard className="w-4 h-4 text-orange-500" />,
  cheque: <FileText className="w-4 h-4 text-slate-500" />,
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  cheque: 'Cheque',
};

function KPICard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="border border-slate-200 shadow-sm rounded-xl bg-white p-5 flex flex-col gap-1">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

// ─── Record Payment Modal ────────────────────────────────────────────────────

interface RecordPaymentModalProps {
  invoices: Invoice[];
  onClose: () => void;
  onSuccess: (payment: PaymentRecord) => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  invoices,
  onClose,
  onSuccess,
}) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [reference, setReference] = useState('');
  const [paidOn, setPaidOn] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openInvoices = invoices.filter(
    (inv) =>
      inv.status === 'confirmed' ||
      inv.status === 'partially_paid' ||
      inv.status === 'overdue'
  );

  const selectedInvoice = openInvoices.find(
    (inv) => inv.id === selectedInvoiceId
  );
  const outstanding = selectedInvoice
    ? selectedInvoice.total - selectedInvoice.paid_total
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInvoiceId) {
      toast.error('Please select an invoice.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiClient.recordPayment(selectedInvoiceId, {
        method,
        amount: numAmount,
        paid_on: paidOn,
        note: note || undefined,
      });
      toast.success(
        `Payment recorded. New balance: ${formatCurrency(result.new_balance)}`
      );
      onSuccess(result.payment);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to record payment.';
      if (message.toLowerCase().includes('overpayment')) {
        toast.error(
          `Overpayment: The amount exceeds the outstanding balance of ${formatCurrency(outstanding ?? 0)}.`
        );
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            Record New Payment
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Invoice Picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Invoice <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedInvoiceId}
                onChange={(e) => {
                  setSelectedInvoiceId(e.target.value);
                  // Pre-fill outstanding as amount
                  const inv = openInvoices.find(
                    (i) => i.id === e.target.value
                  );
                  if (inv) {
                    setAmount(
                      String((inv.total - inv.paid_total).toFixed(2))
                    );
                  } else {
                    setAmount('');
                  }
                }}
                className="w-full appearance-none border border-slate-300 rounded-lg px-3 py-2.5 pr-8 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select invoice…</option>
                {openInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.number} — {inv.customer_name} (
                    {formatCurrency(inv.total - inv.paid_total)} outstanding)
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {outstanding !== null && (
              <p className="mt-1 text-xs text-slate-500">
                Outstanding:{' '}
                <span className="font-semibold text-blue-600">
                  {formatCurrency(outstanding)}
                </span>
                {selectedInvoice?.status === 'partially_paid' && (
                  <span className="ml-2 text-amber-600">Partial payment OK</span>
                )}
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {outstanding !== null &&
              parseFloat(amount) > outstanding && (
                <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Amount exceeds outstanding
                  balance — will trigger overpayment error.
                </p>
              )}
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full appearance-none border border-slate-300 rounded-lg px-3 py-2.5 pr-8 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(
                  ['upi', 'bank_transfer', 'card', 'cheque'] as PaymentMethod[]
                ).map((m) => (
                  <option key={m} value={m}>
                    {METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Payment Reference
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. NEFT-INV-2026-0105"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={paidOn}
              onChange={(e) => setPaidOn(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Any additional details…"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-300 rounded-lg py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Recording…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Record Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export const PaymentsPage: React.FC = () => {
  useAuth(); // ensure authenticated context

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'manual' | 'bank_match'>('all');

  // Modal
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [paymentsData, invoicesData] = await Promise.all([
          apiClient.getPayments(),
          apiClient.getInvoices(),
        ]);
        setPayments(paymentsData);
        setInvoices(invoicesData);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load data.';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter((p) => {
      const matchSearch =
        !q ||
        p.payment_reference.toLowerCase().includes(q) ||
        p.customer_name.toLowerCase().includes(q) ||
        p.invoice_number.toLowerCase().includes(q);
      const matchMethod =
        methodFilter === 'all' || p.method === methodFilter;
      const matchSource =
        sourceFilter === 'all' || p.source === sourceFilter;
      return matchSearch && matchMethod && matchSource;
    });
  }, [payments, search, methodFilter, sourceFilter]);

  // KPIs
  const totalCount = payments.length;
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const avgPayment = totalCount ? totalCollected / totalCount : 0;
  const bankMatchedCount = payments.filter((p) => p.source === 'bank_match').length;

  function handlePaymentRecorded(payment: PaymentRecord) {
    setPayments((prev) => [payment, ...prev]);
    setShowModal(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track and manage all payment records
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Payments"
          value={String(totalCount)}
          sub="all time"
        />
        <KPICard
          label="Total Collected"
          value={formatCurrency(totalCollected)}
          sub="across all invoices"
        />
        <KPICard
          label="Average Payment"
          value={formatCurrency(avgPayment)}
          sub="per transaction"
        />
        <KPICard
          label="Bank Matched"
          value={String(bankMatchedCount)}
          sub={`${totalCount ? Math.round((bankMatchedCount / totalCount) * 100) : 0}% of total`}
        />
      </div>

      {/* Filters */}
      <div className="border border-slate-200 shadow-sm rounded-xl bg-white p-4 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by reference, customer, or invoice…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Method Filter */}
        <div className="relative">
          <select
            value={methodFilter}
            onChange={(e) =>
              setMethodFilter(e.target.value as PaymentMethod | 'all')
            }
            className="appearance-none border border-slate-300 rounded-lg px-3 py-2 pr-7 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Methods</option>
            <option value="upi">UPI</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="card">Card</option>
            <option value="cheque">Cheque</option>
          </select>
          <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Source Filter */}
        <div className="relative">
          <select
            value={sourceFilter}
            onChange={(e) =>
              setSourceFilter(
                e.target.value as 'all' | 'manual' | 'bank_match'
              )
            }
            className="appearance-none border border-slate-300 rounded-lg px-3 py-2 pr-7 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Sources</option>
            <option value="manual">Manual</option>
            <option value="bank_match">Bank Matched</option>
          </select>
          <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table / States */}
      <div className="border border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Loading payments…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Receipt className="w-10 h-10" />
            <p className="text-sm font-medium">No payments found</p>
            <p className="text-xs">
              {payments.length === 0
                ? 'Record your first payment to get started.'
                : 'Try adjusting your search or filters.'}
            </p>
            {payments.length === 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-2 inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Record Payment
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {[
                    'Payment Ref',
                    'Invoice #',
                    'Customer',
                    'Date',
                    'Amount',
                    'Method',
                    'Source',
                    'Status',
                  ].map((col) => (
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
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 whitespace-nowrap">
                      {p.payment_reference}
                    </td>
                    <td className="px-4 py-3 text-blue-600 font-medium whitespace-nowrap">
                      {p.invoice_number}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {p.customer_name}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {formatDate(p.paid_on)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-slate-700">
                        {METHOD_ICONS[p.method]}
                        {METHOD_LABELS[p.method]}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.source === 'bank_match' ? (
                        <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                          <span className="bg-teal-600 text-white text-[9px] font-bold px-1 rounded">
                            N3
                          </span>
                          Bank Match
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                          Manual
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <RecordPaymentModal
          invoices={invoices}
          onClose={() => setShowModal(false)}
          onSuccess={handlePaymentRecorded}
        />
      )}
    </div>
  );
};

export default PaymentsPage;
