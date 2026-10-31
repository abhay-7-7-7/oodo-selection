// Brightloop Tax Management
import React, { useState, useEffect } from 'react';
import { apiClient } from 'src/services/apiClient';
import { Tax } from 'src/types';
import { formatCurrency } from 'src/utils/calculations';
import {
  Receipt,
  Plus,
  Calculator,
  Percent,
  Edit,
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

export const Taxes: React.FC = () => {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Calculator Demo State
  const [calcBase, setCalcBase] = useState<number>(2000);
  const [calcSelectedTaxId, setCalcSelectedTaxId] = useState<string>('');

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rate_percent: 18,
    applies_to: 'all' as Tax['applies_to'],
    status: 'active' as Tax['status'],
  });

  const loadTaxes = async () => {
    try {
      setLoading(true);
      const list = await apiClient.getTaxes();
      setTaxes(list);
      if (list.length > 0 && !calcSelectedTaxId) {
        setCalcSelectedTaxId(list[0].id);
      }
    } catch {
      toast.error('Failed to load tax rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaxes();
  }, []);

  const selectedTax = taxes.find(t => t.id === calcSelectedTaxId) || taxes[0];
  const calculatedTaxAmount = selectedTax ? (calcBase * selectedTax.rate_percent) / 100 : 0;
  const calculatedTotal = calcBase + calculatedTaxAmount;

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.rate_percent < 0 || formData.rate_percent > 100) {
      toast.error('Tax rate must be between 0% and 100%');
      return;
    }

    try {
      const created = await apiClient.createTax(formData);
      setTaxes(prev => [...prev, created]);
      toast.success(`Tax rule ${created.name} (${created.rate_percent}%) created!`);
      setIsDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create tax');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            Tax Configuration & GST Rules
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Administer statutory tax schedules, GST concession brackets, and invoice calculation rates.
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs h-9"
        >
          <Plus className="w-4 h-4" />
          Add Tax Rate
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Taxes Table */}
        <Card className="lg:col-span-2 border-border shadow-2xs">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Tax Schedule Name</th>
                    <th className="py-3 px-4 font-semibold text-right">Tax Rate (%)</th>
                    <th className="py-3 px-4 font-semibold">Applies To</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {taxes.map(tax => (
                    <tr key={tax.id} className="hover:bg-secondary/30 transition">
                      <td className="py-3 px-4 font-semibold text-foreground text-sm">
                        {tax.name}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-base text-foreground">
                        {tax.rate_percent}%
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs capitalize">
                          {tax.applies_to}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge variant="default" className="text-[10px] capitalize px-2 py-0 bg-emerald-600">
                          {tax.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Live Tax Verification Calculator (Handoff requirement) */}
        <Card className="border-border shadow-2xs flex flex-col justify-between">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-2 font-bold text-sm text-foreground">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span>Tax Calculation Sandbox</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Test dynamic invoice tax calculations with the central calculation engine.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <Label className="text-xs font-semibold">Base Invoiced Amount (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={calcBase}
                  onChange={e => setCalcBase(parseFloat(e.target.value) || 0)}
                  className="text-xs h-9 mt-1 font-mono font-bold"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Select Tax Schedule</Label>
                <select
                  value={calcSelectedTaxId}
                  onChange={e => setCalcSelectedTaxId(e.target.value)}
                  className="w-full h-9 mt-1 px-3 rounded-md border border-border bg-background text-xs"
                >
                  {taxes.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.rate_percent}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-2 mt-4">
                <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
                  <span>Base Amount:</span>
                  <span className="font-semibold text-foreground">{formatCurrency(calcBase)}</span>
                </div>
                <div className="flex justify-between font-mono text-[11px] text-blue-700 dark:text-blue-300">
                  <span>Tax Rate:</span>
                  <span className="font-bold">{selectedTax?.rate_percent || 0}%</span>
                </div>
                <div className="flex justify-between font-mono text-[11px] text-blue-700 dark:text-blue-300">
                  <span>Calculated Tax:</span>
                  <span className="font-bold">+{formatCurrency(calculatedTaxAmount)}</span>
                </div>
                <div className="border-t border-blue-200 dark:border-blue-800 pt-2 flex justify-between font-mono text-sm font-bold text-blue-900 dark:text-blue-100">
                  <span>Gross Total:</span>
                  <span>{formatCurrency(calculatedTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Add Tax Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Configure Tax Rate</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateTax} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Tax Schedule Name *</Label>
              <Input
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. GST 18% (Standard SaaS)"
                className="text-xs h-9 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Tax Rate (% 0 to 100) *</Label>
              <Input
                required
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.rate_percent}
                onChange={e => setFormData({ ...formData, rate_percent: parseFloat(e.target.value) || 0 })}
                className="text-xs h-9 mt-1 font-mono font-bold"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Applies To Category</Label>
              <select
                value={formData.applies_to}
                onChange={e => setFormData({ ...formData, applies_to: e.target.value as any })}
                className="w-full h-9 mt-1 px-3 rounded-md border border-border bg-background text-xs"
              >
                <option value="all">All Products & Services</option>
                <option value="software">Software Only</option>
                <option value="service">Services Only</option>
                <option value="addon">Addons Only</option>
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs bg-blue-600 hover:bg-blue-700 text-white">
                Save Tax Rule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Taxes;
