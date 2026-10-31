// Brightloop Subscription Detail & State Machine View
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { apiClient } from 'src/services/apiClient';
import { Invoice, PaymentRecord, Subscription, SubscriptionStatus } from 'src/types';
import { formatCurrency, formatDate } from 'src/utils/calculations';
import {
  Repeat,
  ArrowLeft,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  StopCircle,
  History,
  FileText,
  CreditCard,
  Layers,
  AlertCircle,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import { toast } from 'sonner';

export const SubscriptionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const sub = await apiClient.getSubscriptionById(id);
      setSubscription(sub);

      const allInvs = await apiClient.getInvoices();
      const subInvs = allInvs.filter(i => i.subscription_id === id);
      setInvoices(subInvs);

      const allPays = await apiClient.getPayments();
      const subPays = allPays.filter(p => subInvs.some(inv => inv.id === p.invoice_id));
      setPayments(subPays);
    } catch (err) {
      console.error(err);
      toast.error('Subscription not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleTransition = async (target: SubscriptionStatus) => {
    if (!subscription) return;
    try {
      await apiClient.transitionSubscriptionStatus(subscription.id, target);
      toast.success(`Subscription moved to ${target.toUpperCase()}`);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Transition rejected');
    }
  };

  const handlePause = async () => {
    if (!subscription) return;
    try {
      await apiClient.pauseSubscription(subscription.id);
      toast.success('Subscription paused');
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Pause failed');
    }
  };

  const handleClose = async () => {
    if (!subscription) return;
    try {
      await apiClient.closeSubscription(subscription.id, 'Customer cancellation request');
      toast.success('Subscription closed');
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Close failed');
    }
  };

  const handleRenew = async () => {
    if (!subscription) return;
    try {
      const renewed = await apiClient.renewSubscription(subscription.id);
      toast.success(`Generated renewed subscription ${renewed.number}`);
      navigate(`/subscriptions/${renewed.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Renewal failed');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-muted-foreground">
        Loading subscription telemetry...
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="py-20 text-center space-y-3">
        <h3 className="text-lg font-bold">Subscription Not Found</h3>
        <Link to="/subscriptions">
          <Button variant="outline" size="sm" className="text-xs">
            Return to Subscriptions List
          </Button>
        </Link>
      </div>
    );
  }

  const steps: SubscriptionStatus[] = ['draft', 'quotation', 'confirmed', 'active', 'closed'];
  const currentStepIdx = steps.indexOf(subscription.status === 'paused' ? 'active' : subscription.status);

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center gap-2">
        <Link
          to="/subscriptions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to all subscriptions
        </Link>
      </div>

      {/* Main Header Banner */}
      <div className="p-6 rounded-xl bg-card border border-border shadow-2xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {subscription.number}
              </h1>
              <Badge
                variant={
                  subscription.status === 'active'
                    ? 'default'
                    : subscription.status === 'confirmed'
                    ? 'outline'
                    : subscription.status === 'paused'
                    ? 'secondary'
                    : 'destructive'
                }
                className="text-xs uppercase font-bold px-2.5 py-0.5 tracking-wider"
              >
                {subscription.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <Building className="w-3.5 h-3.5" />
              <strong className="text-foreground">{subscription.customer_company}</strong>
              <span>({subscription.customer_name})</span>
            </p>
          </div>

          {/* Lifecycle Action Buttons strictly respecting plan flags */}
          <div className="flex flex-wrap items-center gap-2">
            {subscription.status === 'draft' && (
              <Button
                size="sm"
                onClick={() => handleTransition('quotation')}
                className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Issue Quotation
              </Button>
            )}

            {subscription.status === 'quotation' && (
              <Button
                size="sm"
                onClick={() => handleTransition('confirmed')}
                className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Confirm Subscription
              </Button>
            )}

            {subscription.status === 'confirmed' && (
              <Button
                size="sm"
                onClick={() => handleTransition('active')}
                className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                <Play className="w-3.5 h-3.5" />
                Activate Contract
              </Button>
            )}

            {subscription.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                disabled={subscription.plan_pausable === false}
                onClick={handlePause}
                className={`text-xs h-8 gap-1 ${
                  subscription.plan_pausable !== false
                    ? 'text-amber-700 dark:text-amber-400 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                    : 'opacity-40 cursor-not-allowed'
                }`}
                title={subscription.plan_pausable !== false ? 'Pause subscription' : 'Plan does not allow pause'}
              >
                <Pause className="w-3.5 h-3.5" />
                Pause
              </Button>
            )}

            {subscription.status === 'paused' && (
              <Button
                size="sm"
                onClick={() => handleTransition('active')}
                className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                <Play className="w-3.5 h-3.5" />
                Resume Contract
              </Button>
            )}

            {subscription.status !== 'closed' && (
              <Button
                variant="outline"
                size="sm"
                disabled={subscription.plan_closable === false}
                onClick={handleClose}
                className={`text-xs h-8 gap-1 ${
                  subscription.plan_closable !== false
                    ? 'text-red-700 dark:text-red-400 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30'
                    : 'opacity-40 cursor-not-allowed'
                }`}
                title={subscription.plan_closable !== false ? 'Close subscription early' : 'Plan does not allow early closure'}
              >
                <StopCircle className="w-3.5 h-3.5" />
                Close
              </Button>
            )}

            {subscription.plan_renewable !== false && (
              <Button
                size="sm"
                onClick={handleRenew}
                className="text-xs h-8 bg-teal-600 hover:bg-teal-700 text-white gap-1"
              >
                <Repeat className="w-3.5 h-3.5" />
                Renew
              </Button>
            )}
          </div>
        </div>

        {/* Status Lifecycle Stepper Visualisation */}
        <div className="pt-4 border-t border-border">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
            State Machine Progress:
          </span>
          <div className="grid grid-cols-5 gap-2">
            {steps.map((st, i) => {
              const isPast = currentStepIdx >= i;
              const isCurrent = subscription.status === st;

              return (
                <div key={st} className="flex flex-col items-center text-center">
                  <div
                    className={`w-full h-1.5 rounded-full mb-2 ${
                      isPast
                        ? 'bg-blue-600'
                        : 'bg-secondary'
                    }`}
                  />
                  <span
                    className={`text-[11px] capitalize font-medium ${
                      isCurrent
                        ? 'text-blue-600 font-bold'
                        : isPast
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {st}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Key Metadata Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-[11px] text-muted-foreground font-medium block">Subscription Plan</span>
          <span className="text-base font-bold text-foreground mt-0.5 block">{subscription.plan_name}</span>
          <span className="text-[11px] text-muted-foreground uppercase font-mono font-semibold">
            {subscription.billing_period} Billing Cadence
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-[11px] text-muted-foreground font-medium block">Cadence Value</span>
          <span className="text-base font-bold font-mono text-foreground mt-0.5 block">
            {formatCurrency(subscription.total)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Tax: +{formatCurrency(subscription.tax_total)}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-[11px] text-muted-foreground font-medium block">Next Scheduled Bill</span>
          <span className="text-base font-bold text-foreground mt-0.5 block">
            {formatDate(subscription.next_billing_date)}
          </span>
          <span className="text-[11px] text-muted-foreground">Automated Billing Engine</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-[11px] text-muted-foreground font-medium block">Contract Expiry</span>
          <span className="text-base font-bold text-foreground mt-0.5 block">
            {formatDate(subscription.expiry_date)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Terms: {subscription.payment_terms.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="lines" className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-10 max-w-xl">
          <TabsTrigger value="lines" className="text-xs">Product Lines</TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="audit" className="text-xs">Audit History</TabsTrigger>
        </TabsList>

        {/* Tab 1: Product Lines */}
        <TabsContent value="lines" className="pt-4">
          <Card className="border-border shadow-2xs">
            <CardContent className="p-0">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Product Description</th>
                    <th className="py-3 px-4 font-semibold text-center">Quantity</th>
                    <th className="py-3 px-4 font-semibold text-right">Unit Price</th>
                    <th className="py-3 px-4 font-semibold text-right">Variant Extra</th>
                    <th className="py-3 px-4 font-semibold text-right">Tax Rate</th>
                    <th className="py-3 px-4 font-semibold text-right">Line Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {subscription.lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-secondary/30 transition">
                      <td className="py-3 px-4 font-sans">
                        <div className="font-semibold text-foreground text-sm">{line.product_name}</div>
                        {line.variant_name && (
                          <div className="text-[11px] text-teal-700 dark:text-teal-400 mt-0.5">
                            Edition: {line.variant_name}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{line.quantity}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{formatCurrency(line.unit_price)}</td>
                      <td className="py-3 px-4 text-right text-teal-600">+{formatCurrency(line.variant_extra)}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{line.tax_rate}%</td>
                      <td className="py-3 px-4 text-right font-bold text-foreground text-sm">{formatCurrency(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-4 border-t border-border flex justify-end bg-secondary/20">
                <div className="w-64 space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-foreground">{formatCurrency(subscription.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax (GST):</span>
                    <span className="font-semibold text-foreground">+{formatCurrency(subscription.tax_total)}</span>
                  </div>
                  <div className="border-t border-border pt-1.5 flex justify-between text-sm font-bold text-foreground">
                    <span>Cadence Grand Total:</span>
                    <span className="text-blue-600">{formatCurrency(subscription.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Invoices */}
        <TabsContent value="invoices" className="pt-4 space-y-3">
          <Card className="border-border shadow-2xs">
            <CardContent className="p-0">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Invoice #</th>
                    <th className="py-3 px-4 font-semibold">Period</th>
                    <th className="py-3 px-4 font-semibold">Due Date</th>
                    <th className="py-3 px-4 font-semibold text-right">Invoice Total</th>
                    <th className="py-3 px-4 font-semibold text-right">Paid Total</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.length > 0 ? (
                    invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-secondary/30 transition">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">
                          <Link to="/invoices" className="hover:underline">
                            {inv.number}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatDate(inv.period_start)} to {formatDate(inv.period_end)}
                        </td>
                        <td className="py-3 px-4">{formatDate(inv.due_date)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-foreground">{formatCurrency(inv.total)}</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 font-semibold">{formatCurrency(inv.paid_total)}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={inv.status === 'paid' ? 'default' : 'secondary'}
                            className="text-[10px] capitalize px-2 py-0"
                          >
                            {inv.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No invoices billed yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Payments */}
        <TabsContent value="payments" className="pt-4 space-y-3">
          <Card className="border-border shadow-2xs">
            <CardContent className="p-0">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Payment Ref</th>
                    <th className="py-3 px-4 font-semibold">Method</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold text-right">Amount</th>
                    <th className="py-3 px-4 font-semibold">Note / Reconciled ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.length > 0 ? (
                    payments.map(pay => (
                      <tr key={pay.id} className="hover:bg-secondary/30 transition">
                        <td className="py-3 px-4 font-mono font-bold text-foreground">{pay.payment_reference}</td>
                        <td className="py-3 px-4 uppercase font-semibold text-muted-foreground">{pay.method}</td>
                        <td className="py-3 px-4">{formatDate(pay.paid_on)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">+{formatCurrency(pay.amount)}</td>
                        <td className="py-3 px-4 text-muted-foreground text-[11px]">{pay.note || 'Direct payment'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No payments recorded for this subscription yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Audit History Timeline */}
        <TabsContent value="audit" className="pt-4">
          <Card className="border-border shadow-2xs">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                Immutable Subscription Status Audit Log
              </CardTitle>
              <CardDescription className="text-xs">
                Every state machine step recorded per contest specifications
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <div className="space-y-4">
                {subscription.audit_history.length > 0 ? (
                  subscription.audit_history.map((aud, index) => (
                    <div key={aud.id || index} className="flex items-start gap-3 text-xs">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div className="flex-1 p-3 rounded-lg bg-secondary/40 border border-border">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">
                            Transitioned from <Badge variant="outline" className="capitalize text-[10px] px-1 py-0">{aud.from_status}</Badge> to{' '}
                            <Badge variant="default" className="capitalize text-[10px] px-1 py-0">{aud.to_status}</Badge>
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {formatDate(aud.at)}
                          </span>
                        </div>
                        {aud.note && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {aud.note}
                          </p>
                        )}
                        <span className="text-[10px] text-muted-foreground/80 mt-1 block">
                          Recorded by: <strong>{aud.user_name || 'System'}</strong>
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    Initial state recorded.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscriptionDetail;
