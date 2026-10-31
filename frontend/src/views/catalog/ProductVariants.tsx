// Brightloop Product Variants Management
import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from 'src/services/apiClient';
import { Product, ProductVariant } from 'src/types';
import { formatCurrency } from 'src/utils/calculations';
import {
  Layers,
  Plus,
  Search,
  Package,
  Calculator,
  Edit,
  ArrowRight,
  CheckCircle2,
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

export const ProductVariants: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    attribute: 'Brand Edition',
    value: 'Odoo Brand Edition',
    price_extra: 560,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, vars] = await Promise.all([
        apiClient.getProducts(),
        apiClient.getVariants(),
      ]);
      setProducts(prods);
      setVariants(vars);
      if (prods.length > 0 && !formData.product_id) {
        setFormData(prev => ({ ...prev, product_id: prods[0].id }));
      }
    } catch {
      toast.error('Failed to load variants data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredVariants = useMemo(() => {
    return variants.filter(v => {
      const matchSearch =
        v.attribute.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.value.toLowerCase().includes(searchQuery.toLowerCase());
      const matchProduct = selectedProductId === 'all' || v.product_id === selectedProductId;
      return matchSearch && matchProduct;
    });
  }, [variants, searchQuery, selectedProductId]);

  const selectedProductObj = useMemo(() => {
    return products.find(p => p.id === formData.product_id) || products[0];
  }, [products, formData.product_id]);

  const liveCalculatedPrice = (selectedProductObj?.sales_price || 0) + Number(formData.price_extra || 0);

  const handleOpenAdd = () => {
    setFormData({
      product_id: products[0]?.id || '',
      attribute: 'Brand Edition',
      value: 'Odoo Brand Edition',
      price_extra: 560,
    });
    setIsDialogOpen(true);
  };

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id) {
      toast.error('Please choose a parent product');
      return;
    }

    try {
      const created = await apiClient.createVariant(formData.product_id, {
        attribute: formData.attribute,
        value: formData.value,
        price_extra: Number(formData.price_extra),
      });

      setVariants(prev => [...prev, created]);
      toast.success(`Variant "${created.value}" (+₹${created.price_extra}) added!`);
      setIsDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add variant');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="w-6 h-6 text-teal-600" />
            Product Variants & Surcharges
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage product editions, brands, and price adjustments (e.g., Odoo Brand +₹560).
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="text-xs font-semibold gap-1.5 bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shadow-xs h-9"
        >
          <Plus className="w-4 h-4" />
          Add Variant
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-xl bg-card border border-border shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by attribute or variant value..."
              className="text-xs pl-9 h-8 bg-background"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedProductId}
            onChange={e => setSelectedProductId(e.target.value)}
            className="h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground cursor-pointer focus:outline-none"
          >
            <option value="all">All Parent Products</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <span className="text-muted-foreground text-xs font-medium">
            Showing <strong className="text-foreground">{filteredVariants.length}</strong> variants
          </span>
        </div>
      </div>

      {/* Table */}
      <Card className="border-border shadow-2xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">Variant Value & Attribute</th>
                  <th className="py-3 px-4 font-semibold">Parent Product</th>
                  <th className="py-3 px-4 font-semibold text-right">Base Price</th>
                  <th className="py-3 px-4 font-semibold text-right">Price Extra</th>
                  <th className="py-3 px-4 font-semibold text-right">Final Calculated Price</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVariants.length > 0 ? (
                  filteredVariants.map(v => {
                    const parent = products.find(p => p.id === v.product_id);
                    const basePrice = parent?.sales_price || 0;
                    const finalPrice = basePrice + v.price_extra;

                    return (
                      <tr key={v.id} className="hover:bg-secondary/30 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                            <span>{v.value}</span>
                            {v.value.toLowerCase().includes('odoo') && (
                              <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                                Required Demo Variant
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Attribute: <span className="font-medium text-foreground">{v.attribute}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{parent?.name || 'Unknown Product'}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                          {formatCurrency(basePrice)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-teal-600">
                          +{formatCurrency(v.price_extra)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-base text-foreground">
                          {formatCurrency(finalPrice)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Badge variant="default" className="text-[10px] capitalize px-2 py-0 bg-emerald-600">
                            {v.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No product variants configured yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Variant Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Add Product Variant
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateVariant} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Parent Product *</Label>
              <select
                required
                value={formData.product_id}
                onChange={e => setFormData({ ...formData, product_id: e.target.value })}
                className="w-full h-9 mt-1 px-3 rounded-md border border-border bg-background text-xs"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatCurrency(p.sales_price)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Attribute Name *</Label>
              <Input
                required
                value={formData.attribute}
                onChange={e => setFormData({ ...formData, attribute: e.target.value })}
                placeholder="e.g. Brand, Tier, SLA"
                className="text-xs h-9 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Variant Option Value *</Label>
              <Input
                required
                value={formData.value}
                onChange={e => setFormData({ ...formData, value: e.target.value })}
                placeholder="e.g. Odoo Brand Edition"
                className="text-xs h-9 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Price Adjustment (Price Extra in ₹) *</Label>
              <Input
                required
                type="number"
                step="0.01"
                value={formData.price_extra}
                onChange={e => setFormData({ ...formData, price_extra: parseFloat(e.target.value) || 0 })}
                placeholder="560"
                className="text-xs h-9 mt-1 font-mono font-bold"
              />
            </div>

            {/* Live Calculation Preview Card (Handoff requirement) */}
            <div className="p-3.5 rounded-lg bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-teal-900 dark:text-teal-200">
                <Calculator className="w-4 h-4 text-teal-600" />
                <span>Live Price Calculation:</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground pt-1">
                <span>Base Price:</span>
                <span className="font-semibold text-foreground">{formatCurrency(selectedProductObj?.sales_price || 0)}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] text-teal-700 dark:text-teal-400">
                <span>Variant Extra:</span>
                <span className="font-bold">+{formatCurrency(formData.price_extra)}</span>
              </div>
              <div className="border-t border-teal-200 dark:border-teal-800 pt-1 flex items-center justify-between font-mono text-xs font-bold text-teal-900 dark:text-teal-100">
                <span>Final Invoiced Price:</span>
                <span>{formatCurrency(liveCalculatedPrice)}</span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs bg-teal-600 hover:bg-teal-700 text-white">
                Save Variant
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductVariants;
