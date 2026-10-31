// Brightloop Quotation Templates Management
import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from 'src/services/apiClient';
import { Product, QuotationTemplate, SubscriptionPlan } from 'src/types';
import { formatCurrency } from 'src/utils/calculations';
import {
  FileCheck2,
  Plus,
  Search,
  Copy,
  Eye,
  Edit,
  Package,
  Layers,
  Trash2,
  Check,
  Calendar,
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

export const QuotationTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<QuotationTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    plan_id: '',
    validity_days: 15,
    status: 'active' as 'active' | 'inactive',
    lines: [
      {
        product_id: '',
        product_name: '',
        variant_name: '',
        quantity: 1,
        unit_price: 4000,
      },
    ],
  });

  const loadAll = async () => {
    try {
      setLoading(true);
      const [tList, pList, prodList] = await Promise.all([
        apiClient.getQuotationTemplates(),
        apiClient.getPlans(),
        apiClient.getProducts(),
      ]);
      setTemplates(tList);
      setPlans(pList);
      setProducts(prodList);
      if (pList.length > 0 && !formData.plan_id) {
        setFormData(prev => ({ ...prev, plan_id: pList[0].id }));
      }
    } catch {
      toast.error('Failed to load quotation templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [templates, searchQuery]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      description: '',
      plan_id: plans[0]?.id || '',
      validity_days: 15,
      status: 'active',
      lines: [
        {
          product_id: products[0]?.id || '',
          product_name: products[0]?.name || '',
          variant_name: '',
          quantity: 1,
          unit_price: products[0]?.sales_price || 4000,
        },
      ],
    });
    setIsDialogOpen(true);
  };

  const handleDuplicate = async (tmpl: QuotationTemplate) => {
    try {
      const duplicated = await apiClient.createQuotationTemplate({
        name: `${tmpl.name} (Copy)`,
        description: tmpl.description,
        plan_id: tmpl.plan_id,
        plan_name: tmpl.plan_name,
        validity_days: tmpl.validity_days,
        lines: tmpl.lines,
        status: 'active',
      });
      setTemplates(prev => [...prev, duplicated]);
      toast.success(`Duplicated "${tmpl.name}"`);
    } catch {
      toast.error('Failed to duplicate template');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const plan = plans.find(p => p.id === formData.plan_id);

    try {
      const created = await apiClient.createQuotationTemplate({
        name: formData.name,
        description: formData.description,
        plan_id: formData.plan_id,
        plan_name: plan?.name,
        validity_days: formData.validity_days,
        lines: formData.lines,
        status: formData.status,
      });

      setTemplates(prev => [...prev, created]);
      toast.success(`Template ${created.name} created!`);
      setIsDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-blue-600" />
            Quotation Templates
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pre-configured offer packages with preset product lines, cadences, and standard validity windows.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs h-9"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-3.5 rounded-xl bg-card border border-border shadow-2xs flex items-center justify-between gap-3 text-xs">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search templates by title..."
            className="text-xs pl-9 h-8 bg-background"
          />
        </div>
        <span className="text-muted-foreground text-xs font-medium">
          Showing <strong className="text-foreground">{filteredTemplates.length}</strong> presets
        </span>
      </div>

      {/* Grid Cards for Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map(tmpl => (
          <Card key={tmpl.id} className="border-border shadow-2xs hover:border-blue-300 transition flex flex-col justify-between">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-foreground">{tmpl.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{tmpl.plan_name || 'Standard Plan'}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {tmpl.validity_days} Days Valid
                </Badge>
              </div>

              {tmpl.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tmpl.description}
                </p>
              )}

              {/* Preset Lines Preview */}
              <div className="p-3 rounded-lg bg-secondary/60 border border-border space-y-2">
                <span className="text-[11px] font-bold text-foreground block">
                  Included Product Lines:
                </span>
                <div className="space-y-1.5">
                  {tmpl.lines.map((l, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-foreground truncate max-w-[180px]">
                        {l.quantity}x {l.product_name}
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {formatCurrency(l.unit_price * l.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewTemplate(tmpl)}
                  className="h-8 text-xs gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Preview</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicate(tmpl)}
                  className="h-8 text-xs gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Duplicate</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Template Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">New Quotation Template</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Template Title *</Label>
              <Input
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Enterprise Full-Stack Offer"
                className="text-xs h-9 mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Preset Subscription Plan *</Label>
                <select
                  value={formData.plan_id}
                  onChange={e => setFormData({ ...formData, plan_id: e.target.value })}
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
                <Label className="text-xs font-semibold">Validity Window (Days) *</Label>
                <Input
                  required
                  type="number"
                  min="1"
                  max="180"
                  value={formData.validity_days}
                  onChange={e => setFormData({ ...formData, validity_days: parseInt(e.target.value) || 15 })}
                  className="text-xs h-9 mt-1 font-mono"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Description</Label>
              <Input
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Summary for sales representatives"
                className="text-xs h-9 mt-1"
              />
            </div>

            {/* Line items selector */}
            <div className="space-y-2 pt-2">
              <Label className="text-xs font-semibold block">Preset Products</Label>
              <div className="p-3 rounded-lg border border-border bg-secondary/30 space-y-2">
                <select
                  value={formData.lines[0]?.product_id}
                  onChange={e => {
                    const prod = products.find(p => p.id === e.target.value);
                    if (prod) {
                      setFormData({
                        ...formData,
                        lines: [
                          {
                            product_id: prod.id,
                            product_name: prod.name,
                            variant_name: '',
                            quantity: 1,
                            unit_price: prod.sales_price,
                          },
                        ],
                      });
                    }
                  }}
                  className="w-full h-8 px-2.5 rounded border border-border bg-background text-xs"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatCurrency(p.sales_price)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs bg-blue-600 hover:bg-blue-700 text-white">
                Save Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Template Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={open => !open && setPreviewTemplate(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Template Specification Preview</DialogTitle>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="p-3.5 rounded-lg bg-secondary/50 border border-border space-y-1.5">
                <h4 className="font-bold text-foreground text-sm">{previewTemplate.name}</h4>
                <div className="text-muted-foreground">{previewTemplate.description}</div>
                <div className="pt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Billing Plan: <strong className="text-foreground">{previewTemplate.plan_name}</strong></span>
                  <span>Validity: <strong className="text-foreground">{previewTemplate.validity_days} Days</strong></span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-foreground">Preset Line Breakdown:</span>
                <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                  {previewTemplate.lines.map((l, idx) => (
                    <div key={idx} className="p-2.5 bg-card flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">{l.product_name}</div>
                        <div className="text-[11px] text-muted-foreground">Qty: {l.quantity}</div>
                      </div>
                      <div className="font-mono font-bold text-foreground">
                        {formatCurrency(l.unit_price * l.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button size="sm" onClick={() => setPreviewTemplate(null)} className="text-xs">
                  Close Preview
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotationTemplates;
