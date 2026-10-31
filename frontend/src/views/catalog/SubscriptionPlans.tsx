// Brightloop Subscription Plans Management
import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from 'src/services/apiClient';
import { BillingPeriod, SubscriptionPlan } from 'src/types';
import { formatCurrency, formatDate } from 'src/utils/calculations';
import {
  CalendarDays,
  Plus,
  Search,
  Check,
  X,
  Edit,
  Clock,
  Shield,
  HelpCircle,
  Repeat,
  Pause,
  StopCircle,
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
import { Switch } from 'src/components/ui/switch';
import { toast } from 'sonner';

export const SubscriptionPlans: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'all' | BillingPeriod>('all');
  const [loading, setLoading] = useState(true);

  // Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: 4000,
    period: 'monthly' as BillingPeriod,
    min_qty: 1,
    valid_from: '2026-01-01',
    valid_to: '2027-12-31',
    auto_close: false,
    closable: true,
    pausable: true,
    renewable: true,
    status: 'active' as 'active' | 'inactive',
    description: '',
  });

  const loadPlans = async () => {
    try {
      setLoading(true);
      const list = await apiClient.getPlans();
      setPlans(list);
    } catch {
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchPeriod = periodFilter === 'all' || p.period === periodFilter;
      return matchSearch && matchPeriod;
    });
  }, [plans, searchQuery, periodFilter]);

  const handleOpenAdd = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      price: 3000,
      period: 'monthly',
      min_qty: 1,
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: '2027-12-31',
      auto_close: false,
      closable: true,
      pausable: true,
      renewable: true,
      status: 'active',
      description: '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      period: plan.period,
      min_qty: plan.min_qty,
      valid_from: plan.valid_from,
      valid_to: plan.valid_to,
      auto_close: plan.auto_close,
      closable: plan.closable,
      pausable: plan.pausable,
      renewable: plan.renewable,
      status: plan.status,
      description: plan.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(formData.valid_to) < new Date(formData.valid_from)) {
      toast.error('Availability End Date cannot be earlier than Start Date');
      return;
    }

    try {
      if (editingPlan) {
        const updated = await apiClient.updatePlan(editingPlan.id, formData);
        setPlans(prev => prev.map(p => (p.id === updated.id ? updated : p)));
        toast.success(`Updated plan ${updated.name}`);
      } else {
        const created = await apiClient.createPlan(formData);
        setPlans(prev => [...prev, created]);
        toast.success(`Created plan ${created.name}`);
      }
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
            <CalendarDays className="w-6 h-6 text-blue-600" />
            Subscription Plans & Cadences
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure billing cadences (daily, weekly, monthly, yearly) and enforce lifecycle behaviour rules.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs h-9"
        >
          <Plus className="w-4 h-4" />
          Create Plan
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
              placeholder="Search subscription plans by title or terms..."
              className="text-xs pl-9 h-8 bg-background"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={periodFilter}
            onChange={e => setPeriodFilter(e.target.value as any)}
            className="h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground cursor-pointer focus:outline-none"
          >
            <option value="all">All Cadences</option>
            <option value="daily">Daily Billing</option>
            <option value="weekly">Weekly Billing</option>
            <option value="monthly">Monthly Billing</option>
            <option value="yearly">Yearly Billing</option>
          </select>
          <span className="text-muted-foreground text-xs font-medium">
            Showing <strong className="text-foreground">{filteredPlans.length}</strong> active plans
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
                  <th className="py-3 px-4 font-semibold">Plan Name & Details</th>
                  <th className="py-3 px-4 font-semibold">Billing Frequency</th>
                  <th className="py-3 px-4 font-semibold text-right">Cadence Price</th>
                  <th className="py-3 px-4 font-semibold text-center">Min Qty</th>
                  <th className="py-3 px-4 font-semibold">Availability Dates</th>
                  <th className="py-3 px-4 font-semibold text-center">Behaviour Rules</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPlans.length > 0 ? (
                  filteredPlans.map(plan => (
                    <tr key={plan.id} className="hover:bg-secondary/30 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground text-sm">{plan.name}</div>
                        {plan.description && (
                          <div className="text-[11px] text-muted-foreground truncate max-w-xs mt-0.5">
                            {plan.description}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs uppercase font-semibold">
                          {plan.period}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-foreground text-sm">
                        {formatCurrency(plan.price)}
                      </td>

                      <td className="py-3 px-4 text-center font-mono">
                        {plan.min_qty}
                      </td>

                      <td className="py-3 px-4 text-[11px] text-muted-foreground font-medium">
                        <div>From: <span className="text-foreground">{formatDate(plan.valid_from)}</span></div>
                        <div>To: <span className="text-foreground">{formatDate(plan.valid_to)}</span></div>
                      </td>

                      {/* 4 Behaviour Rules Badges */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-[200px] mx-auto">
                          <span
                            title="Auto-close at end date"
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5 ${
                              plan.auto_close ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            <StopCircle className="w-2.5 h-2.5" />
                            Auto-Close
                          </span>

                          <span
                            title="Allow pause"
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5 ${
                              plan.pausable ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            <Pause className="w-2.5 h-2.5" />
                            Pausable
                          </span>

                          <span
                            title="Allow renewal"
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5 ${
                              plan.renewable ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            <Repeat className="w-2.5 h-2.5" />
                            Renewable
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={plan.status === 'active' ? 'default' : 'secondary'}
                          className="text-[10px] capitalize px-2 py-0"
                        >
                          {plan.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(plan)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
                          title="Edit Plan"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No subscription plans found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Plan Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Plan Name *</Label>
              <Input
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Professional Monthly Tier"
                className="text-xs h-9 mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Cadence Price (₹) *</Label>
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="text-xs h-9 mt-1 font-mono font-bold"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Billing Frequency *</Label>
                <select
                  value={formData.period}
                  onChange={e => setFormData({ ...formData, period: e.target.value as BillingPeriod })}
                  className="w-full h-9 mt-1 px-3 rounded-md border border-border bg-background text-xs"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly (Annual)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold">Min Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.min_qty}
                  onChange={e => setFormData({ ...formData, min_qty: parseInt(e.target.value) || 1 })}
                  className="text-xs h-9 mt-1 font-mono"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Availability From</Label>
                <Input
                  type="date"
                  value={formData.valid_from}
                  onChange={e => setFormData({ ...formData, valid_from: e.target.value })}
                  className="text-xs h-9 mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Availability To</Label>
                <Input
                  type="date"
                  value={formData.valid_to}
                  onChange={e => setFormData({ ...formData, valid_to: e.target.value })}
                  className="text-xs h-9 mt-1"
                />
              </div>
            </div>

            {/* 4 Behaviour Rules Switches */}
            <div className="p-3.5 rounded-lg bg-secondary/60 border border-border space-y-3">
              <span className="text-xs font-bold text-foreground block">
                Subscription Lifecycle Behaviour Rules:
              </span>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold">Auto-Close at End Date</Label>
                  <p className="text-[10px] text-muted-foreground">Automatically terminates subscription on expiry</p>
                </div>
                <Switch
                  checked={formData.auto_close}
                  onCheckedChange={checked => setFormData({ ...formData, auto_close: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold">Allow Early Closure</Label>
                  <p className="text-[10px] text-muted-foreground">Permits cancellation before end date</p>
                </div>
                <Switch
                  checked={formData.closable}
                  onCheckedChange={checked => setFormData({ ...formData, closable: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold">Allow Pause</Label>
                  <p className="text-[10px] text-muted-foreground">Permits temporary billing freeze without cancellation</p>
                </div>
                <Switch
                  checked={formData.pausable}
                  onCheckedChange={checked => setFormData({ ...formData, pausable: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold">Allow Renewal</Label>
                  <p className="text-[10px] text-muted-foreground">Enables 1-click renewal radar actions</p>
                </div>
                <Switch
                  checked={formData.renewable}
                  onCheckedChange={checked => setFormData({ ...formData, renewable: checked })}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Description</Label>
              <Input
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional billing summary"
                className="text-xs h-9 mt-1"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs bg-blue-600 hover:bg-blue-700 text-white">
                {editingPlan ? 'Save Changes' : 'Create Plan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPlans;
