// Brightloop Customer Detail Page
// Shows full customer info, their subscriptions, invoices, and payments in tabs

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { apiClient } from 'src/services/apiClient';
import { Customer, Subscription, Invoice, PaymentRecord } from 'src/types';
import { formatCurrency, formatDate } from 'src/utils/calculations';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  RefreshCw,
  AlertCircle,
  Badge as BadgeIcon,
  CreditCard,
  FileText,
  Repeat,
} from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import { toast } from 'sonner';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [allCustomers, subs, invs, pays] = await Promise.all([
        apiClient.getCustomers(),
        apiClient.getSubscriptions({ customer_id: id }),
        apiClient.getInvoices({ customer_id: id }),
        apiClient.getPayments(),
      ]);
      const found = allCustomers.find(c => c.id === id);
      if (!found) {
        setError('Customer not found');
        return;
      }
      setCustomer(found);
      setSubscriptions(subs);
      setInvoices(invs);
      setPayments(pays.filter(p => p.customer_id === id));
    } catch (err: any) {
      setError(err.message || 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-900',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      paused: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      closed: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
      draft: 'bg-gray-100 text-gray-600 dark:bg-gray-900',
      paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      overdue: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
      cancelled: 'bg-gray-100 text-gray-500',
      partially_paid: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    };
    return (
      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading customer…</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-sm text-destructive font-medium">{error || 'Customer not found'}</p>
        <Button variant="outline" onClick={() => navigate('/customers')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Customers
        </Button>
      </div>
    );
  }

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Back */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/customers" className="hover:text-foreground transition">Customers</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{customer.name}</span>
      </div>

      {/* Customer Info Card */}
      <Card>
        <CardHeader className="p-5 pb-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-700 dark:text-blue-300 text-xl font-bold">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{customer.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{customer.company}</span>
                  <span className="ml-2">{statusBadge(customer.status)}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} className="h-8 text-xs gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{customer.email}</span>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{customer.phone}</span>
              </div>
            )}
            <div className="text-sm">
              <span className="text-muted-foreground">Member since: </span>
              <span className="font-medium">{formatDate(customer.created_at)}</span>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground font-mono">{customer.active_subscriptions}</div>
              <div className="text-[11px] text-muted-foreground mt-1">Active Subscriptions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground font-mono">{invoices.length}</div>
              <div className="text-[11px] text-muted-foreground mt-1">Total Invoices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground font-mono">{formatCurrency(customer.total_billed, { includeDecimals: false })}</div>
              <div className="text-[11px] text-muted-foreground mt-1">Total Billed</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold font-mono ${customer.outstanding_balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {formatCurrency(customer.outstanding_balance, { includeDecimals: false })}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">Outstanding</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="subscriptions">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="subscriptions" className="text-xs gap-1.5">
            <Repeat className="w-3.5 h-3.5" /> Subscriptions ({subscriptions.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Invoices ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs gap-1.5">
            <CreditCard className="w-3.5 h-3.5" /> Payments ({payments.length})
          </TabsTrigger>
        </TabsList>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {subscriptions.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">No subscriptions found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider border-y border-border">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Number</th>
                        <th className="py-2.5 px-4 font-semibold">Plan</th>
                        <th className="py-2.5 px-4 font-semibold">Status</th>
                        <th className="py-2.5 px-4 font-semibold">Start Date</th>
                        <th className="py-2.5 px-4 font-semibold">Next Billing</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {subscriptions.map(sub => (
                        <tr key={sub.id} className="hover:bg-secondary/30 transition">
                          <td className="py-2.5 px-4">
                            <Link to={`/subscriptions/${sub.id}`} className="font-mono font-bold text-blue-600 hover:underline">
                              {sub.number}
                            </Link>
                          </td>
                          <td className="py-2.5 px-4 font-medium">{sub.plan_name}</td>
                          <td className="py-2.5 px-4">{statusBadge(sub.status)}</td>
                          <td className="py-2.5 px-4 text-muted-foreground">{formatDate(sub.start_date)}</td>
                          <td className="py-2.5 px-4 text-muted-foreground">{sub.next_billing_date ? formatDate(sub.next_billing_date) : '—'}</td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold">{formatCurrency(sub.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {invoices.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">No invoices found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider border-y border-border">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Invoice #</th>
                        <th className="py-2.5 px-4 font-semibold">Issue Date</th>
                        <th className="py-2.5 px-4 font-semibold">Due Date</th>
                        <th className="py-2.5 px-4 font-semibold">Status</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Total</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Paid</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-secondary/30 transition">
                          <td className="py-2.5 px-4 font-mono font-bold text-blue-600">{inv.number}</td>
                          <td className="py-2.5 px-4 text-muted-foreground">{formatDate(inv.issue_date)}</td>
                          <td className="py-2.5 px-4 text-muted-foreground">{formatDate(inv.due_date)}</td>
                          <td className="py-2.5 px-4">{statusBadge(inv.status)}</td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold">{formatCurrency(inv.total)}</td>
                          <td className="py-2.5 px-4 text-right font-mono text-emerald-600">{formatCurrency(inv.paid_total)}</td>
                          <td className="py-2.5 px-4 text-right font-mono text-amber-600">{formatCurrency(inv.total - inv.paid_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">No payments found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider border-y border-border">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Reference</th>
                        <th className="py-2.5 px-4 font-semibold">Invoice #</th>
                        <th className="py-2.5 px-4 font-semibold">Method</th>
                        <th className="py-2.5 px-4 font-semibold">Date</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Amount</th>
                        <th className="py-2.5 px-4 font-semibold">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {payments.map(pay => (
                        <tr key={pay.id} className="hover:bg-secondary/30 transition">
                          <td className="py-2.5 px-4 font-mono font-bold text-foreground">{pay.payment_reference}</td>
                          <td className="py-2.5 px-4 font-mono text-blue-600">{pay.invoice_number}</td>
                          <td className="py-2.5 px-4">
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold">{pay.method}</Badge>
                          </td>
                          <td className="py-2.5 px-4 text-muted-foreground">{formatDate(pay.paid_on)}</td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600">+{formatCurrency(pay.amount)}</td>
                          <td className="py-2.5 px-4">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pay.source === 'bank_match' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'}`}>
                              {pay.source === 'bank_match' ? 'Bank Match' : 'Manual'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerDetail;
