// Brightloop Customer Portal: Invoices
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  HelpCircle,
  CreditCard,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { Link } from 'react-router';
import { apiClient } from 'src/services/apiClient';
import { useAuth } from 'src/context/AuthContext';
import { Invoice } from 'src/types';
import { formatCurrency, formatDate } from 'src/utils/calculations';
import { toast } from 'sonner';

export const PortalInvoices: React.FC = () => {
  const { user } = useAuth();
  const customerId = user?.customer_id || 'cust-1';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getPortalInvoices(customerId);
      setInvoices(data);
    } catch (err: any) {
      toast.error('Failed to load customer invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [customerId]);

  const filteredInvoices = invoices.filter(
    (i) => statusFilter === 'all' || i.status === statusFilter
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Invoices & Statements</h1>
          <p className="text-sm text-slate-500 mt-1">
            Download itemized tax invoices, inspect bill change explanations, and review settlement status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['all', 'confirmed', 'paid', 'overdue'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
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

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono font-medium text-blue-600">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="hover:underline font-semibold"
                      >
                        {inv.number}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {formatDate(inv.period_start)} – {formatDate(inv.period_end)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">{formatDate(inv.due_date)}</td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-900">{formatCurrency(inv.total)}</td>
                    <td className="py-3.5 px-4 text-right text-emerald-600 font-medium">{formatCurrency(inv.paid_total)}</td>
                    <td className="py-3.5 px-4 text-right font-bold">
                      {inv.total - inv.paid_total > 0.01 ? (
                        <span className={inv.status === 'overdue' ? 'text-rose-600' : 'text-amber-600'}>
                          {formatCurrency(inv.total - inv.paid_total)}
                        </span>
                      ) : (
                        <span className="text-slate-400">Settled</span>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          title="View Invoice"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {inv.subscription_id && (
                          <Link
                            to={`/bill-explainer?invoice_id=${inv.id}`}
                            title="Why Did My Bill Change? (N4)"
                            className="p-1.5 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded"
                          >
                            <HelpCircle className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 print:hidden">
              <span className="font-semibold text-slate-900 font-mono">{selectedInvoice.number}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6">
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <div className="text-xl font-bold text-blue-600">Brightloop Software</div>
                  <p className="text-xs text-slate-500">Subscription & Billing Engine</p>
                  <p className="text-xs text-slate-400">GSTIN: 27AABCB1234F1Z6</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold font-mono text-slate-900">{selectedInvoice.number}</h2>
                  <p className="text-xs text-slate-500">Date: {formatDate(selectedInvoice.issue_date)}</p>
                  <p className="text-xs text-slate-500">Due: {formatDate(selectedInvoice.due_date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">Billed To</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedInvoice.customer_name}</div>
                  <div className="text-slate-600">{selectedInvoice.customer_company}</div>
                  <div className="text-slate-500">{selectedInvoice.customer_email}</div>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">Billing Period</span>
                  <div className="text-slate-800 mt-0.5">
                    {formatDate(selectedInvoice.period_start)} to {formatDate(selectedInvoice.period_end)}
                  </div>
                  <div className="text-slate-500 mt-1">Payment Terms: {selectedInvoice.payment_terms}</div>
                </div>
              </div>

              {/* Items */}
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <th className="py-2 text-left">Description</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Rate</th>
                    <th className="py-2 text-right">Tax</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.lines.map((l, idx) => (
                    <tr key={idx}>
                      <td className="py-2 text-slate-800 font-medium">{l.description}</td>
                      <td className="py-2 text-center text-slate-600">{l.quantity}</td>
                      <td className="py-2 text-right text-slate-600">{formatCurrency(l.unit_price)}</td>
                      <td className="py-2 text-right text-slate-600">{formatCurrency(l.tax)}</td>
                      <td className="py-2 text-right font-medium text-slate-900">{formatCurrency(l.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end pt-2 border-t border-slate-200">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax (GST):</span>
                    <span>{formatCurrency(selectedInvoice.tax_total)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(selectedInvoice.total)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-emerald-600">
                    <span>Amount Paid:</span>
                    <span>{formatCurrency(selectedInvoice.paid_total)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-300">
                    <span>Remaining Due:</span>
                    <span className={selectedInvoice.total - selectedInvoice.paid_total > 0.01 ? 'text-rose-600' : 'text-emerald-600'}>
                      {formatCurrency(Math.max(0, selectedInvoice.total - selectedInvoice.paid_total))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0 print:hidden">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalInvoices;
