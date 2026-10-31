// Brightloop Discount Rules Management
import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from 'src/services/apiClient';
import { Discount, DiscountKind, DiscountScope } from 'src/types';
import { formatCurrency, formatDate } from 'src/utils/calculations';
import { useAuth } from 'src/context/AuthContext';
import {
  Percent,
  Plus,
  Search,
  ShieldAlert,
  Calendar,
  Layers,
  Lock,
  Tag,
  AlertTriangle,
  ArrowRight,
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

export const Discounts: React.FC = () => {
  const { role, canCreateDiscounts } = useAuth();

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Discount['status']>('all');
  const [loading, setLoading] = useState(true);

  // Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    kind: 'percent' as DiscountKind,
    value: 10,
    min_amount: 2000,
    min_qty: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '2026-12-31',
    usage_limit: 100,
    scope: 'subscription' as DiscountScope,
    status: 'active' as const,
  });

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      const list = await apiClient.getDiscounts();
      setDiscounts(list);
    } catch {
      toast.error('Failed to load discount rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const filteredDiscounts = useMemo(() => {
    return discounts.filter(d => {
      const matchSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || d.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [discounts, searchQuery, statusFilter]);

  const handleOpenAdd = () => {
    if (!canCreateDiscounts) {
      toast.error('403: Only Administrators can create promotional discounts');
      return;
    }
    setFormData({
      name: '',
      kind: 'percent',
      value: 10,
      min_amount: 2000,
      min_qty: 1,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '2026-12-31',
      usage_limit: 100,
      scope: 'subscription',
      status: 'active',
    });
    setIsDialogOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.kind === 'percent' && (formData.value < 0 || formData.value > 100)) {
      toast.error('Percentage discount must be between 0% and 100%');
      return;
    }
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error('End date cannot be earlier than start date');
      return;
    }

    try {
      const created = await apiClient.createDiscount(formData, role);
      setDiscounts(prev => [...prev, created]);
      toast.success(`Discount voucher ${created.name} activated!`);
      setIsDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Percent className="w-6 h-6 text-blue-600" />
            Discount Rules & Coupon Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Admin-governed concession rules, automatic cart application, and usage limits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Link to Novelty N1 */}
          <Link to="/discount-guardrail">
            <Button variant="outline" size="sm" className="text-xs h-9 gap-1.5 border-teal-300 text-teal-700 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-950/20 cursor-pointer">
              <ShieldAlert className="w-4 h-4 text-teal-600" />
              <span>N1 Margin Guardrail</span>
            </Button>
          </Link>

          <Button
            onClick={handleOpenAdd}
            disabled={!canCreateDiscounts}
            className={`text-xs font-semibold gap-1.5 cursor-pointer shadow-xs h-9 ${
              canCreateDiscounts
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
            title={!canCreateDiscounts ? 'Staff accounts cannot create discounts (Admin only)' : 'Create Discount'}
          >
            {canCreateDiscounts ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            Create Discount Rule
          </Button>
        </div>
      </div>

      {/* Role Enforcement Warning for Staff */}
      {!canCreateDiscounts && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            <strong>RBAC Notice:</strong> You are currently signed in as <strong>Internal Staff</strong>. Only Administrators can create or modify discount rules. Switch to the Admin persona using the top navigation bar to create discounts.
          </span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-3.5 rounded-xl bg-card border border-border shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search discount vouchers by code..."
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
            <option value="all">All Discount Statuses</option>
            <option value="active">Active Rules</option>
            <option value="exhausted">Exhausted (Limit Reached)</option>
            <option value="expired">Expired</option>
            <option value="scheduled">Scheduled</option>
          </select>
          <span className="text-muted-foreground text-xs font-medium">
            Showing <strong className="text-foreground">{filteredDiscounts.length}</strong> rules
          </span>
        </div>
      </div>

      {/* Discounts Table */}
      <Card className="border-border shadow-2xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">Voucher Code</th>
                  <th className="py-3 px-4 font-semibold">Discount Type</th>
                  <th className="py-3 px-4 font-semibold text-right">Value</th>
                  <th className="py-3 px-4 font-semibold">Eligibility Conditions</th>
                  <th className="py-3 px-4 font-semibold">Validity Period</th>
                  <th className="py-3 px-4 font-semibold text-center">Usage Progress</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDiscounts.length > 0 ? (
                  filteredDiscounts.map(d => {
                    const remaining = Math.max(0, d.usage_limit - d.times_used);
                    const usagePercent = Math.min(100, Math.round((d.times_used / d.usage_limit) * 100));

                    return (
                      <tr key={d.id} className="hover:bg-secondary/30 transition">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-blue-600 text-sm flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-blue-600" />
                            <span>{d.name}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground capitalize mt-0.5">
                            Scope: {d.scope}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs uppercase font-semibold">
                            {d.kind}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-base text-foreground">
                          {d.kind === 'percent' ? `${d.value}% OFF` : `-${formatCurrency(d.value)}`}
                        </td>

                        <td className="py-3 px-4 text-[11px] text-muted-foreground">
                          <div>Min Order: <strong className="text-foreground">{formatCurrency(d.min_amount)}</strong></div>
                          <div>Min Seats: <strong className="text-foreground">{d.min_qty}</strong></div>
                        </td>

                        <td className="py-3 px-4 text-[11px] text-muted-foreground">
                          <div>From: <span className="text-foreground">{formatDate(d.start_date)}</span></div>
                          <div>To: <span className="text-foreground">{formatDate(d.end_date)}</span></div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-24 bg-secondary h-1.5 rounded-full overflow-hidden mb-1">
                              <div
                                className={`h-full rounded-full ${
                                  usagePercent >= 100 ? 'bg-red-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {d.times_used} / {d.usage_limit} used ({remaining} left)
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={
                              d.status === 'active'
                                ? 'default'
                                : d.status === 'exhausted'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="text-[10px] capitalize px-2 py-0"
                          >
                            {d.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No discount rules match the query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Discount Modal (Admin Only) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Create Discount Policy</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Discount Code / Name *</Label>
              <Input
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                placeholder="e.g. FESTIVE25"
                className="text-xs h-9 mt-1 font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Discount Type</Label>
                <select
                  value={formData.kind}
                  onChange={e => setFormData({ ...formData, kind: e.target.value as DiscountKind })}
                  className="w-full h-9 mt-1 px-3 rounded-md border border-border bg-background text-xs"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Cash Amount (₹)</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Discount Value *</Label>
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.value}
                  onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                  className="text-xs h-9 mt-1 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Min Purchase Amount (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.min_amount}
                  onChange={e => setFormData({ ...formData, min_amount: parseFloat(e.target.value) || 0 })}
                  className="text-xs h-9 mt-1 font-mono"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Maximum Usage Limit</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.usage_limit}
                  onChange={e => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || 1 })}
                  className="text-xs h-9 mt-1 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  className="text-xs h-9 mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                  className="text-xs h-9 mt-1"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs bg-blue-600 hover:bg-blue-700 text-white">
                Activate Rule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Discounts;
