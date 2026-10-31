// Brightloop Quotations Management & Creation Workflow
import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from 'src/services/apiClient';
import {
  Customer,
  LineItem,
  PaymentTerms,
  Product,
  Quotation,
  QuotationTemplate,
  SubscriptionPlan,
  Tax,
} from 'src/types';
import {
  formatCurrency,
  formatDate,
  calculateLineAmount,
  calculateTotals,
} from 'src/utils/calculations';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Eye,
  Send,
  CheckCircle2,
  Repeat,
  Trash2,
  Calendar,
  Building,
  Printer,
  ArrowRight,
  Download,
} from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Badge } from 'src/components/ui/badge';
import { Card, CardContent } from 'src/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'src/components/ui/dialog';
import { Label } from 'src/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import FullLogo from 'src/layouts/full/shared/logo/FullLogo';

export const Quotations: React.FC = () => {
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Quotation['status']>('all');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<Quotation | null>(null);

  // Create Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [validityDays, setValidityDays] = useState(15);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('net_15');
  const [lines, setLines] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [qList, cList, pList, prodList, tList, tmplList] = await Promise.all([
        apiClient.getQuotations(),
        apiClient.getCustomers(),
        apiClient.getPlans(),
        apiClient.getProducts(),
        apiClient.getTaxes(),
        apiClient.getQuotationTemplates(),
      ]);

      setQuotations(qList);
      setCustomers(cList);
      setPlans(pList);
      setProducts(prodList);
      setTaxes(tList);
      setTemplates(tmplList);

      if (cList.length > 0 && !selectedCustomerId) setSelectedCustomerId(cList[0].id);
      if (pList.length > 0 && !selectedPlanId) setSelectedPlanId(pList[0].id);
    } catch {
      toast.error('Failed to load quotation records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const matchSearch =
        q.quotation_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.customer_company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [quotations, searchQuery, statusFilter]);

  // Handle template selection to pre-fill lines
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const tmpl = templates.find(t => t.id === templateId);
    if (!tmpl) return;

    if (tmpl.plan_id) setSelectedPlanId(tmpl.plan_id);
    setValidityDays(tmpl.validity_days || 15);

    const newLines: LineItem[] = tmpl.lines.map((tl, index) => {
      const prod = products.find(p => p.id === tl.product_id);
      const calc = calculateLineAmount(tl.quantity, tl.unit_price, 0, 18, 0);
      return {
        id: `line-${index}-${Date.now()}`,
        product_id: tl.product_id,
        product_name: tl.product_name,
        variant_name: tl.variant_name || '',
        quantity: tl.quantity,
        unit_price: tl.unit_price,
        base_price: prod?.sales_price || tl.unit_price,
        variant_extra: 0,
        tax_rate: 18,
        tax_amount: calc.taxAmount,
        discount_amount: 0,
        amount: calc.total,
      };
    });

    setLines(newLines);
    toast.info(`Pre-filled products from template "${tmpl.name}"`);
  };

  const handleAddLine = () => {
    const prod = products[0];
    if (!prod) return;
    const calc = calculateLineAmount(1, prod.sales_price, 0, 18, 0);
    const newLine: LineItem = {
      id: `line-${Date.now()}`,
      product_id: prod.id,
      product_name: prod.name,
      quantity: 1,
      unit_price: prod.sales_price,
      base_price: prod.sales_price,
      variant_extra: 0,
      tax_rate: 18,
      tax_amount: calc.taxAmount,
      discount_amount: 0,
      amount: calc.total,
    };
    setLines([...lines, newLine]);
  };

  const handleRemoveLine = (id: string) => {
    setLines(lines.filter(l => l.id !== id));
  };

  const handleLineChange = (id: string, updates: Partial<LineItem>) => {
    setLines(prev =>
      prev.map(l => {
        if (l.id !== id) return l;
        const updated = { ...l, ...updates };
        const calc = calculateLineAmount(
          updated.quantity,
          updated.unit_price,
          updated.variant_extra || 0,
          updated.tax_rate,
          updated.discount_amount || 0
        );
        return {
          ...updated,
          tax_amount: calc.taxAmount,
          amount: calc.total,
        };
      })
    );
  };

  const liveTotals = useMemo(() => {
    return calculateTotals(lines);
  }, [lines]);

  const handleOpenCreate = () => {
    setSelectedTemplateId('');
    setLines([]);
    handleAddLine();
    setIsCreateOpen(true);
  };

  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedCustomerId);
    const plan = plans.find(p => p.id === selectedPlanId);

    if (!cust || !plan) {
      toast.error('Please select both customer and plan');
      return;
    }
    if (lines.length === 0) {
      toast.error('Add at least one product line to the quotation');
      return;
    }

    const validityDate = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      const created = await apiClient.createQuotation({
        customer_id: cust.id,
        customer_name: cust.name,
        customer_email: cust.email,
        customer_company: cust.company,
        plan_id: plan.id,
        plan_name: plan.name,
        validity_date: validityDate,
        payment_terms: paymentTerms,
        lines,
        subtotal: liveTotals.subtotal,
        tax_total: liveTotals.taxTotal,
        discount_total: liveTotals.discountTotal,
        total: liveTotals.grandTotal,
        status: 'sent',
        notes,
      });

      setQuotations(prev => [created, ...prev]);
      toast.success(`Quotation ${created.quotation_number} generated and sent!`);
      setIsCreateOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate quotation');
    }
  };

  const handleConvertToSubscription = async (quote: Quotation) => {
    try {
      const sub = await apiClient.convertQuotationToSubscription(quote.id);
      setQuotations(prev =>
        prev.map(q => (q.id === quote.id ? { ...q, status: 'confirmed' } : q))
      );
      toast.success(`Converted ${quote.quotation_number} into Subscription ${sub.number}!`);
      navigate(`/subscriptions/${sub.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Conversion failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            Quotations & Proposals
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Prepare, preview, and dispatch formal subscription offers and seamlessly convert confirmed quotes into subscriptions.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs h-9"
        >
          <Plus className="w-4 h-4" />
          Create Quotation
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-card border border-border shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search quotation #, customer, or enterprise..."
              className="text-xs pl-9 h-8 bg-background"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground cursor-pointer focus:outline-none"
          >
            <option value="all">All Quotation States</option>
            <option value="sent">Sent / Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span className="text-muted-foreground text-xs font-medium">
            Showing <strong className="text-foreground">{filteredQuotations.length}</strong> proposals
          </span>
        </div>
      </div>

      {/* Quotation Table */}
      <Card className="border-border shadow-2xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">Quote #</th>
                  <th className="py-3 px-4 font-semibold">Client / Enterprise</th>
                  <th className="py-3 px-4 font-semibold">Plan Cadence</th>
                  <th className="py-3 px-4 font-semibold">Valid Until</th>
                  <th className="py-3 px-4 font-semibold text-right">Tax & Subtotal</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Offer (₹)</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredQuotations.length > 0 ? (
                  filteredQuotations.map(quote => (
                    <tr key={quote.id} className="hover:bg-secondary/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        <button
                          onClick={() => setPreviewQuote(quote)}
                          className="hover:underline cursor-pointer text-left"
                        >
                          {quote.quotation_number}
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{quote.customer_company}</div>
                        <div className="text-[11px] text-muted-foreground">{quote.customer_name}</div>
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs">
                          {quote.plan_name}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-muted-foreground">
                        {formatDate(quote.validity_date)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-[11px] text-muted-foreground">
                        <div>Base: {formatCurrency(quote.subtotal)}</div>
                        <div>Tax: +{formatCurrency(quote.tax_total)}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-sm text-foreground">
                        {formatCurrency(quote.total)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={quote.status === 'confirmed' ? 'default' : 'secondary'}
                          className="text-[10px] capitalize px-2 py-0"
                        >
                          {quote.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewQuote(quote)}
                            className="h-7 px-2 text-xs gap-1 cursor-pointer"
                            title="Preview Customer Proposal"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>Preview</span>
                          </Button>

                          {quote.status !== 'confirmed' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConvertToSubscription(quote)}
                              className="h-7 px-2 text-xs gap-1 font-semibold text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                              title="Confirm and convert directly to subscription"
                            >
                              <Repeat className="w-3.5 h-3.5" />
                              <span>Convert</span>
                            </Button>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-semibold px-2">
                              Converted ✓
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No quotations match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Quotation Workflow Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Compose Subscription Quotation</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveQuotation} className="space-y-4 pt-2">
            {/* Quick Template Picker */}
            <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-900 dark:text-blue-300">
                  Load Quotation Template:
                </span>
                <select
                  value={selectedTemplateId}
                  onChange={e => handleTemplateSelect(e.target.value)}
                  className="h-8 px-2.5 rounded border border-blue-300 bg-background text-xs cursor-pointer"
                >
                  <option value="">Start from blank offer...</option>
                  {templates.map(tmpl => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name} ({tmpl.plan_name})
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[11px] text-muted-foreground">Pre-fills products & cadences</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <Label className="text-xs font-semibold">Select Customer *</Label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full h-9 mt-1 px-3 rounded-md border border-border bg-background text-xs"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.company} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Subscription Plan *</Label>
                <select
                  required
                  value={selectedPlanId}
                  onChange={e => setSelectedPlanId(e.target.value)}
                  className="w-full h-9 mt-1 px-3 rounded-md border border-border bg-background text-xs"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.period})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Payment Terms</Label>
                <select
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value as PaymentTerms)}
                  className="w-full h-9 mt-1 px-3 rounded-md border border-border bg-background text-xs"
                >
                  <option value="due_on_receipt">Due on Receipt</option>
                  <option value="net_15">Net 15 Days</option>
                  <option value="net_30">Net 30 Days</option>
                </select>
              </div>
            </div>

            {/* Line items table */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Subscription Product Items & Quantities</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLine}
                  className="h-7 text-xs gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Line Item
                </Button>
              </div>

              <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                {lines.map((line, idx) => (
                  <div key={line.id} className="p-3 bg-card flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex-1 min-w-[200px]">
                      <Label className="text-[10px] text-muted-foreground">Product</Label>
                      <select
                        value={line.product_id}
                        onChange={e => {
                          const p = products.find(prod => prod.id === e.target.value);
                          if (p) {
                            handleLineChange(line.id, {
                              product_id: p.id,
                              product_name: p.name,
                              unit_price: p.sales_price,
                              base_price: p.sales_price,
                            });
                          }
                        }}
                        className="w-full h-8 px-2 rounded border border-border bg-background text-xs mt-0.5"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatCurrency(p.sales_price)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-16">
                      <Label className="text-[10px] text-muted-foreground">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={e => handleLineChange(line.id, { quantity: parseInt(e.target.value) || 1 })}
                        className="h-8 text-xs font-mono mt-0.5"
                      />
                    </div>

                    <div className="w-24">
                      <Label className="text-[10px] text-muted-foreground">Unit Price (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="50"
                        value={line.unit_price}
                        onChange={e => handleLineChange(line.id, { unit_price: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-xs font-mono mt-0.5"
                      />
                    </div>

                    <div className="w-20">
                      <Label className="text-[10px] text-muted-foreground">Tax Rate (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={line.tax_rate}
                        onChange={e => handleLineChange(line.id, { tax_rate: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-xs font-mono mt-0.5"
                      />
                    </div>

                    <div className="w-24 text-right">
                      <Label className="text-[10px] text-muted-foreground">Line Total</Label>
                      <div className="h-8 flex items-center justify-end font-mono font-bold text-foreground">
                        {formatCurrency(line.amount)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveLine(line.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-600 rounded mt-4"
                      title="Remove Line"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations Summary Card */}
            <div className="p-4 rounded-xl bg-secondary/60 border border-border flex justify-end">
              <div className="w-64 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-foreground">{formatCurrency(liveTotals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount:</span>
                  <span className="font-semibold text-emerald-600">-{formatCurrency(liveTotals.discountTotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (GST):</span>
                  <span className="font-semibold text-foreground">+{formatCurrency(liveTotals.taxTotal)}</span>
                </div>
                <div className="border-t border-border pt-1.5 flex justify-between text-sm font-bold text-foreground">
                  <span>Offer Total:</span>
                  <span className="text-blue-600">{formatCurrency(liveTotals.grandTotal)}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                <Send className="w-3.5 h-3.5" />
                Dispatch Quotation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer-Facing Quotation Preview Modal */}
      <Dialog open={!!previewQuote} onOpenChange={open => !open && setPreviewQuote(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {previewQuote && (
            <div className="space-y-6 pt-2 printable-invoice">
              <div className="flex items-start justify-between pb-4 border-b border-border">
                <div>
                  <FullLogo />
                  <div className="text-[11px] text-muted-foreground mt-2">
                    Brightloop Software Pvt Ltd<br />
                    GSTIN: 29AAAAA0000A1Z5<br />
                    Bengaluru, Karnataka
                  </div>
                </div>

                <div className="text-right">
                  <h3 className="text-lg font-bold text-foreground">QUOTATION</h3>
                  <div className="font-mono font-bold text-blue-600 text-sm">{previewQuote.quotation_number}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Date: {formatDate(previewQuote.created_at)}<br />
                    Valid Until: <span className="text-foreground font-semibold">{formatDate(previewQuote.validity_date)}</span>
                  </div>
                </div>
              </div>

              {/* Client Info */}
              <div className="p-3.5 rounded-lg bg-secondary/50 border border-border text-xs">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider mb-1">
                  Prepared For:
                </span>
                <div className="font-bold text-foreground text-sm">{previewQuote.customer_company}</div>
                <div className="text-muted-foreground">{previewQuote.customer_name} ({previewQuote.customer_email})</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Payment Terms: <span className="font-medium text-foreground uppercase">{previewQuote.payment_terms}</span>
                </div>
              </div>

              {/* Quotation Lines Table */}
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider border-y border-border">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Tax</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {previewQuote.lines.map((line, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-sans font-medium text-foreground">
                        {line.product_name} {line.variant_name ? `(${line.variant_name})` : ''}
                      </td>
                      <td className="py-2.5 px-3 text-center">{line.quantity}</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(line.unit_price)}</td>
                      <td className="py-2.5 px-3 text-right">{line.tax_rate}%</td>
                      <td className="py-2.5 px-3 text-right font-bold text-foreground">{formatCurrency(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Calculation */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-foreground">{formatCurrency(previewQuote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax (GST):</span>
                    <span className="font-semibold text-foreground">+{formatCurrency(previewQuote.tax_total)}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between text-base font-bold text-foreground">
                    <span>Total Amount:</span>
                    <span className="text-blue-600">{formatCurrency(previewQuote.total)}</span>
                  </div>
                </div>
              </div>

              {previewQuote.notes && (
                <div className="p-3 rounded-lg bg-secondary/30 border border-border text-[11px] text-muted-foreground">
                  <strong>Proposal Terms:</strong> {previewQuote.notes}
                </div>
              )}

              <DialogFooter className="pt-4 border-t border-border flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="text-xs gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Proposal
                </Button>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPreviewQuote(null)} className="text-xs">
                    Close
                  </Button>
                  {previewQuote.status !== 'confirmed' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        handleConvertToSubscription(previewQuote);
                        setPreviewQuote(null);
                      }}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    >
                      <Repeat className="w-3.5 h-3.5" />
                      Accept & Convert to Subscription
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Quotations;
