// Brightloop Product Catalog Management
import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from 'src/services/apiClient';
import { Product, ProductType } from 'src/types';
import { formatCurrency, calculateMargin } from 'src/utils/calculations';
import {
  Package,
  Plus,
  Search,
  Filter,
  Layers,
  Edit,
  Trash2,
  TrendingUp,
  Archive,
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
import { Link } from 'react-router';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ProductType>('all');
  const [loading, setLoading] = useState(true);

  // Modal
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'software' as ProductType,
    sales_price: 4000,
    cost_price: 1800,
    notes: '',
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const list = await apiClient.getProducts();
      setProducts(list);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchType = typeFilter === 'all' || p.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [products, searchQuery, typeFilter]);

  const liveMargin = useMemo(() => {
    return calculateMargin(formData.sales_price, formData.cost_price);
  }, [formData.sales_price, formData.cost_price]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      type: 'software',
      sales_price: 2000,
      cost_price: 800,
      notes: '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      type: p.type,
      sales_price: p.sales_price,
      cost_price: p.cost_price,
      notes: p.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.sales_price < 0 || formData.cost_price < 0) {
      toast.error('Prices cannot be negative');
      return;
    }

    try {
      if (editingProduct) {
        const updated = await apiClient.updateProduct(editingProduct.id, {
          name: formData.name,
          type: formData.type,
          sales_price: Number(formData.sales_price),
          cost_price: Number(formData.cost_price),
          notes: formData.notes,
        });
        setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
        toast.success(`Updated ${updated.name}`);
      } else {
        const created = await apiClient.createProduct(formData);
        setProducts(prev => [created, ...prev]);
        toast.success(`Created product ${created.name}`);
      }
      setIsDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleToggleArchive = async (p: Product) => {
    const newStatus = p.status === 'active' ? 'archived' : 'active';
    try {
      const updated = await apiClient.updateProduct(p.id, { status: newStatus });
      setProducts(prev => prev.map(item => (item.id === updated.id ? updated : item)));
      toast.success(`${p.name} marked as ${newStatus}`);
    } catch {
      toast.error('Failed to update product status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Product Catalog
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure recurring software items, service tiers, cost baselines, and profit margins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/product-variants">
            <Button variant="outline" size="sm" className="text-xs h-9 gap-1.5 cursor-pointer">
              <Layers className="w-4 h-4 text-teal-600" />
              Manage Variants
            </Button>
          </Link>
          <Button
            onClick={handleOpenAdd}
            className="text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs h-9"
          >
            <Plus className="w-4 h-4" />
            Create Product
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-xl bg-card border border-border shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products by title or notes..."
              className="text-xs pl-9 h-8 bg-background"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground cursor-pointer focus:outline-none"
          >
            <option value="all">All Product Types</option>
            <option value="software">Software Modules</option>
            <option value="addon">Addons</option>
            <option value="service">Professional Services</option>
          </select>
          <span className="text-muted-foreground text-xs font-medium">
            Showing <strong className="text-foreground">{filteredProducts.length}</strong> items
          </span>
        </div>
      </div>

      {/* Product Table */}
      <Card className="border-border shadow-2xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">Product Name</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold text-right">Sales Price</th>
                  <th className="py-3 px-4 font-semibold text-right">Cost Price</th>
                  <th className="py-3 px-4 font-semibold text-right">Gross Margin</th>
                  <th className="py-3 px-4 font-semibold text-center">Variants</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(prod => {
                    const margin = calculateMargin(prod.sales_price, prod.cost_price);
                    const variantCount = prod.variants?.length || 0;

                    return (
                      <tr key={prod.id} className="hover:bg-secondary/30 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground text-sm">{prod.name}</div>
                          {prod.notes && (
                            <div className="text-[11px] text-muted-foreground truncate max-w-sm mt-0.5">
                              {prod.notes}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-[10px] capitalize font-medium">
                            {prod.type}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                          {formatCurrency(prod.sales_price)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                          {formatCurrency(prod.cost_price)}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="font-mono font-bold text-emerald-600">
                            {margin.marginPercent.toFixed(1)}%
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            +{formatCurrency(margin.profit)}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Link to="/product-variants">
                            <Badge
                              variant="secondary"
                              className="font-mono text-[10px] cursor-pointer hover:bg-secondary/80"
                            >
                              {variantCount} variant{variantCount !== 1 ? 's' : ''}
                            </Badge>
                          </Link>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={prod.status === 'active' ? 'default' : 'secondary'}
                            className="text-[10px] capitalize px-2 py-0"
                          >
                            {prod.status}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(prod)}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
                              title="Edit Product"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleArchive(prod)}
                              className="h-7 w-7 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-md"
                              title={prod.status === 'active' ? 'Archive Product' : 'Reactivate Product'}
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No products match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingProduct ? 'Edit Catalog Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Product Title *</Label>
              <Input
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Subscription Billing Platform"
                className="text-xs h-9 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Product Type</Label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as ProductType })}
                className="w-full h-9 mt-1 px-3 rounded-md border border-border bg-background text-xs"
              >
                <option value="software">Software License</option>
                <option value="addon">Subscription Addon</option>
                <option value="service">Professional Service / SLA</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Sales Price (₹) *</Label>
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sales_price}
                  onChange={e => setFormData({ ...formData, sales_price: parseFloat(e.target.value) || 0 })}
                  className="text-xs h-9 mt-1 font-mono font-bold"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Cost Price (₹) *</Label>
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={e => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                  className="text-xs h-9 mt-1 font-mono"
                />
              </div>
            </div>

            {/* Real-time Profit & Margin Calculator Card */}
            <div className="p-3 rounded-lg bg-secondary/70 border border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Margin Preview:</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-emerald-600">
                  {liveMargin.marginPercent.toFixed(1)}% margin
                </span>
                <span className="text-[11px] text-muted-foreground ml-2">
                  (+{formatCurrency(liveMargin.profit)} profit)
                </span>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Product Notes & Description</Label>
              <Input
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional billing or technical specs"
                className="text-xs h-9 mt-1"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs bg-blue-600 hover:bg-blue-700 text-white">
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
