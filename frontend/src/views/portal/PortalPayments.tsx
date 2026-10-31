// Brightloop Customer Portal: Payment History
import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building,
  Smartphone,
  FileText,
  CheckCircle2,
  DollarSign,
  Download,
} from 'lucide-react';
import { apiClient } from 'src/services/apiClient';
import { useAuth } from 'src/context/AuthContext';
import { PaymentRecord, PaymentMethod } from 'src/types';
import { formatCurrency, formatDate } from 'src/utils/calculations';
import { toast } from 'sonner';

export const PortalPayments: React.FC = () => {
  const { user } = useAuth();
  const customerId = user?.customer_id || 'cust-1';

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const all = await apiClient.getPayments();
      // Filter to this customer
      const mine = all.filter((p) => p.customer_id === customerId);
      setPayments(mine);
    } catch (err: any) {
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [customerId]);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'bank_transfer':
        return <Building className="w-4 h-4 text-slate-500" />;
      case 'upi':
        return <Smartphone className="w-4 h-4 text-emerald-600" />;
      case 'card':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payment History</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review all electronic transactions and settlements credited toward your subscription accounts.
        </p>
      </div>

      {/* KPI Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Payments</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">{payments.length}</div>
          <p className="text-xs text-slate-500 mt-1">Processed transactions</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cumulative Settled</span>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</div>
          <p className="text-xs text-slate-500 mt-1">Total revenue credited</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average Transaction</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(payments.length > 0 ? Math.round(totalPaid / payments.length) : 0)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Per billing cycle</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 text-sm">Settled Transactions</h2>
          <span className="text-xs text-slate-500">Ordered by most recent</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Payment Ref</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Payment Channel</th>
                <th className="py-3 px-4 text-right">Settled Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No payment records found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">{p.payment_reference}</td>
                    <td className="py-3.5 px-4 font-mono text-blue-600">{p.invoice_number}</td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">{formatDate(p.paid_on)}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 capitalize text-slate-700 text-xs">
                        {getMethodIcon(p.method)}
                        <span>{p.method.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 font-mono">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Confirmed
                      </span>
                    </td>
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

export default PortalPayments;
