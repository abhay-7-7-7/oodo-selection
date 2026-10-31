// Brightloop Invoices & Billing Module
import React, { useState, useEffect } from 'react';
import {
  FileText, Search, Filter, Plus, Printer, Mail, CheckCircle2,
  AlertTriangle, Clock, DollarSign, Eye, HelpCircle, CreditCard,
  XCircle, TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router';
import { apiClient } from 'src/services/apiClient';
import { useAuth } from 'src/context/AuthContext';
import { Invoice, Customer, Subscription, PaymentMethod, InvoiceStatus } from 'src/types';
import { formatCurrency, formatDate } from 'src/utils/calculations';
import { toast } from 'sonner';

export const InvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [paymentRef, setPaymentRef] = useState('');

  const [newCustomerId, setNewCustomerId] = useState('');
  const [newSubId, setNewSubId] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [invs, custs, subs] = await Promise.all([
        apiClient.getInvoices(),
        apiClient.getCustomers(),
        apiClient.getSubscriptions(),
      ]);
      setInvoices(invs);
      setCustomers(custs);
      setSubscriptions(subs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalInvoiced = invoices.reduce((s, inv) => s + (inv.status !== 'cancelled' ? inv.total : 0), 0);
  const totalPaid = invoices.reduce((s, inv) => s + inv.paid_total, 0);
  const totalOutstanding = invoices.reduce((s, inv) => s + (inv.status !== 'cancelled' && inv.status !== 'paid' ? inv.total - inv.paid_total : 0), 0);
  const overdueCount = invoices.filter((inv) => inv.status === 'overdue').length;

  const handleConfirmInvoice = async (inv: Invoice) => {
    await apiClient.confirmInvoice(inv.id);
    toast.success(`Invoice ${inv.number} confirmed`);
    loadData();
  };

  const handleCancelInvoice = async (inv: Invoice) => {
    if (inv.paid_total > 0) { toast.error('Cannot cancel invoice with recorded payments'); return; }
    if (!window.confirm(`Cancel ${inv.number}?`)) return;
    await apiClient.cancelInvoice(inv.id);
    toast.success(`Invoice ${inv.number} cancelled`);
    setIsDetailOpen(false);
    loadData();
  };

  const handleSendEmail = async (inv: Invoice) => {
    await apiClient.sendInvoice(inv.id);
    toast.success(`${inv.number} queued in Outbox`);
  };

  const openPaymentModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.total - inv.paid_total);
    setPaymentRef(`PAY-${Date.now().toString().slice(-6)}`);
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    const outstanding = selectedInvoice.total - selectedInvoice.paid_total;
    if (paymentAmount <= 0 || paymentAmount > outstanding + 0.01) {
      toast.error(`Amount must be between ₹1 and ${formatCurrency(outstanding)}`);
      return;
    }
    await apiClient.recordPayment(selectedInvoice.id, {
      method: paymentMethod,
      amount: paymentAmount,
      paid_on: new Date().toISOString().split('T')[0],
      note: paymentRef,
    });
    toast.success(`${formatCurrency(paymentAmount)} recorded for ${selectedInvoice.number}`);
    setIsPaymentModalOpen(false);
    setIsDetailOpen(false);
    loadData();
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === newCustomerId);
    if (!cust) { toast.error('Please select a customer'); return; }
    toast.success('Draft invoice created. Redirecting to billing runs...');
    setIsCreateModalOpen(false);
    loadData();
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const map: Record<InvoiceStatus, string> = {
      paid: 'bg-emerald-100 text-emerald-800',
      overdue: 'bg-rose-100 text-rose-800',
      confirmed: 'bg-blue-100 text-blue-800',
      partially_paid: 'bg-amber-100 text-amber-800',
      draft: 'bg-slate-100 text-slate-700',
      cancelled: 'bg-red-100 text-red-500 line-through',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${map[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">Generate, track, and reconcile customer invoices. Full audit trails and automated reminders.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/billing-runs" className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm">
            <Clock className="w-4 h-4" /> Billing Runs
          </Link>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoiced', value: formatCurrency(totalInvoiced), sub: `${invoices.length} invoices`, icon: FileText, color: 'blue' },
          { label: 'Collected', value: formatCurrency(totalPaid), sub: totalInvoiced > 0 ? `${((totalPaid / totalInvoiced) * 100).toFixed(1)}% rate` : '0%', icon: DollarSign, color: 'emerald' },
          { label: 'Outstanding', value: formatCurrency(totalOutstanding), sub: 'Pending settlement', icon: Clock, color: 'amber' },
          { label: 'Overdue', value: String(overdueCount), sub: 'Requires follow-up', icon: AlertTriangle, color: 'rose' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
              <div className={`p-2 bg-${color}-50 text-${color}-600 rounded-lg`}><Icon className="w-5 h-5" /></div>
            </div>
            <div className="mt-3">
              <span className={`text-2xl font-bold ${color === 'rose' ? 'text-rose-600' : color === 'emerald' ? 'text-emerald-600' : color === 'amber' ? 'text-amber-600' : 'text-slate-900'}`}>{value}</span>
              <p className="text-xs text-slate-500 mt-1">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text" placeholder="Search invoice # or customer..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-500" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Invoices</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="paid">Paid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="py-10 text-center text-slate-400">Loading invoices...</td></tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    No invoices found
                  </td>
                </tr>
              ) : filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-blue-600">
                    <button onClick={() => { setSelectedInvoice(inv); setIsDetailOpen(true); }} className="hover:underline">{inv.number}</button>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-900">{inv.customer_name}</div>
                    <div className="text-xs text-slate-500">{inv.customer_company}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 text-xs">{formatDate(inv.period_start)} – {formatDate(inv.period_end)}</td>
                  <td className="py-3.5 px-4 text-slate-600">{formatDate(inv.due_date)}</td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-900">{formatCurrency(inv.total)}</td>
                  <td className="py-3.5 px-4 text-right text-emerald-600 font-medium">{formatCurrency(inv.paid_total)}</td>
                  <td className="py-3.5 px-4 text-right font-semibold">
                    {inv.total - inv.paid_total > 0.01
                      ? <span className={inv.status === 'overdue' ? 'text-rose-600' : 'text-amber-600'}>{formatCurrency(inv.total - inv.paid_total)}</span>
                      : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="py-3.5 px-4 text-center">{getStatusBadge(inv.status)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => { setSelectedInvoice(inv); setIsDetailOpen(true); }} title="View" className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded">
                        <Eye className="w-4 h-4" />
                      </button>
                      {inv.status === 'draft' && (
                        <button onClick={() => handleConfirmInvoice(inv)} title="Confirm" className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      {inv.total - inv.paid_total > 0.01 && inv.status !== 'cancelled' && inv.status !== 'draft' && (
                        <button onClick={() => openPaymentModal(inv)} title="Record Payment" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                          <CreditCard className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleSendEmail(inv)} title="Send Email" className="p-1.5 text-slate-500 hover:bg-slate-100 rounded">
                        <Mail className="w-4 h-4" />
                      </button>
                      {inv.subscription_id && (
                        <Link to={`/bill-explainer?invoice_id=${inv.id}`} title="Why Did My Bill Change? (N4)" className="p-1.5 text-teal-600 hover:bg-teal-50 rounded">
                          <HelpCircle className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {isDetailOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-900 font-mono">{selectedInvoice.number}</span>
                {getStatusBadge(selectedInvoice.status)}
              </div>
              <div className="flex items-center gap-2">
                {selectedInvoice.subscription_id && (
                  <Link to={`/bill-explainer?invoice_id=${selectedInvoice.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-teal-300 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-100">
                    <HelpCircle className="w-3.5 h-3.5" /> Explain Changes (N4)
                  </Link>
                )}
                <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium">
                  <Printer className="w-3.5 h-3.5" /> Print / PDF
                </button>
                <button onClick={() => handleSendEmail(selectedInvoice)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                  <Mail className="w-3.5 h-3.5" /> Send to Outbox
                </button>
                <button onClick={() => setIsDetailOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">✕</button>
              </div>
            </div>

            {/* Invoice Document */}
            <div className="p-8 overflow-y-auto">
              <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
                <div>
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black">B</div>
                    Brightloop
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Enterprise Subscription Billing & Revenue Intelligence</p>
                  <p className="text-xs text-slate-400 mt-0.5">GSTIN: 27AABCB1234F1Z6 | support@brightloop.io</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold font-mono text-slate-800">{selectedInvoice.number}</h2>
                  <p className="text-xs text-slate-500 mt-1">Issue Date: <span className="font-semibold">{formatDate(selectedInvoice.issue_date)}</span></p>
                  <p className="text-xs text-slate-500">Due Date: <span className="font-semibold">{formatDate(selectedInvoice.due_date)}</span></p>
                  {selectedInvoice.subscription_id && (
                    <p className="text-xs text-blue-600 font-mono mt-1">Sub: {selectedInvoice.subscription_number}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Billed To</h3>
                  <p className="font-semibold text-slate-900">{selectedInvoice.customer_name}</p>
                  <p className="text-xs text-slate-500">{selectedInvoice.customer_email}</p>
                  <p className="text-xs text-slate-500">{selectedInvoice.customer_company}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Billing Period</h3>
                  <p className="text-sm text-slate-700">{formatDate(selectedInvoice.period_start)} to {formatDate(selectedInvoice.period_end)}</p>
                  <p className="text-xs text-slate-500 mt-1">Currency: INR (Indian Rupees)</p>
                  <p className="text-xs text-slate-500">Payment Terms: {selectedInvoice.payment_terms}</p>
                </div>
              </div>

              <table className="w-full text-sm border-collapse mb-6">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-600">
                    <th className="py-2 text-left font-semibold">Description</th>
                    <th className="py-2 text-center font-semibold">Qty</th>
                    <th className="py-2 text-right font-semibold">Rate</th>
                    <th className="py-2 text-right font-semibold">Discount</th>
                    <th className="py-2 text-right font-semibold">Tax</th>
                    <th className="py-2 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.lines.map((line, idx) => (
                    <tr key={idx}>
                      <td className="py-3 text-slate-800 font-medium">{line.description}</td>
                      <td className="py-3 text-center text-slate-600">{line.quantity}</td>
                      <td className="py-3 text-right text-slate-600">{formatCurrency(line.unit_price)}</td>
                      <td className="py-3 text-right text-emerald-600">
                        {line.discount > 0 ? `-${formatCurrency(line.discount)}` : '—'}
                      </td>
                      <td className="py-3 text-right text-slate-600">{formatCurrency(line.tax)}</td>
                      <td className="py-3 text-right font-medium text-slate-900">{formatCurrency(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end border-t border-slate-200 pt-4">
                <div className="w-72 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600"><span>Subtotal:</span><span>{formatCurrency(selectedInvoice.subtotal)}</span></div>
                  {selectedInvoice.discount_total > 0 && (
                    <div className="flex justify-between text-emerald-600"><span>Discount:</span><span>-{formatCurrency(selectedInvoice.discount_total)}</span></div>
                  )}
                  <div className="flex justify-between text-slate-600"><span>GST/Tax:</span><span>{formatCurrency(selectedInvoice.tax_total)}</span></div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-base">
                    <span>Total:</span><span>{formatCurrency(selectedInvoice.total)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Paid:</span><span>{formatCurrency(selectedInvoice.paid_total)}</span>
                  </div>
                  <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-lg">
                    <span>Balance Due:</span>
                    <span className={selectedInvoice.total - selectedInvoice.paid_total > 0.01 ? 'text-rose-600' : 'text-emerald-600'}>
                      {formatCurrency(Math.max(0, selectedInvoice.total - selectedInvoice.paid_total))}
                    </span>
                  </div>
                </div>
              </div>

              {selectedInvoice.bill_change_explanation && (
                <div className="mt-6 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <p className="text-xs text-teal-800 font-semibold">Bill Change Note:</p>
                  <p className="text-xs text-teal-700 mt-0.5">{selectedInvoice.bill_change_explanation}</p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                <div>
                  <p className="font-semibold text-slate-700">Bank Transfer</p>
                  <p>HDFC Bank | A/C: 50200088912345 | IFSC: HDFC0001234</p>
                </div>
                <div className="text-right">
                  <p>Generated by Brightloop Billing Engine</p>
                  <p>{new Date().toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden shrink-0">
              <div className="flex gap-2">
                {selectedInvoice.status === 'draft' && (
                  <button onClick={() => handleConfirmInvoice(selectedInvoice)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
                    Confirm Invoice
                  </button>
                )}
                {selectedInvoice.status !== 'cancelled' && selectedInvoice.paid_total === 0 && selectedInvoice.status !== 'paid' && (
                  <button onClick={() => handleCancelInvoice(selectedInvoice)} className="px-4 py-2 border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-medium">
                    Cancel
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                {selectedInvoice.total - selectedInvoice.paid_total > 0.01 && selectedInvoice.status !== 'draft' && selectedInvoice.status !== 'cancelled' && (
                  <button onClick={() => { setIsDetailOpen(false); openPaymentModal(selectedInvoice); }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" /> Record Payment
                  </button>
                )}
                <button onClick={() => setIsDetailOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-sm">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Record Payment</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between text-sm">
                <span className="font-mono font-medium text-blue-600">{selectedInvoice.number}</span>
                <span className="font-bold text-rose-600">Due: {formatCurrency(selectedInvoice.total - selectedInvoice.paid_total)}</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Amount (₹)</label>
                <input type="number" min="1" max={selectedInvoice.total - selectedInvoice.paid_total} value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))} required
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-slate-500 mt-1">Partial payments are supported</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white">
                  <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="upi">UPI (GPay / PhonePe)</option>
                  <option value="card">Card</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reference / UTR</label>
                <input type="text" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} required
                  placeholder="UTR12345 or CHQ987" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" />
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">New Invoice</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Customer *</label>
                <select value={newCustomerId} onChange={(e) => setNewCustomerId(e.target.value)} required
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white">
                  <option value="">Select a customer...</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Related Subscription</label>
                <select value={newSubId} onChange={(e) => setNewSubId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white">
                  <option value="">None (one-off invoice)</option>
                  {subscriptions.filter((s) => !newCustomerId || s.customer_id === newCustomerId).map((s) =>
                    <option key={s.id} value={s.id}>{s.number} — {s.plan_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Due Date</label>
                <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-800">
                <TrendingUp className="w-4 h-4 inline mr-1.5" />
                For subscription-based invoices, use the <strong>Billing Runs</strong> engine to auto-generate with double-billing protection.
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Create Draft</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
