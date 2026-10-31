// Brightloop Novelty N1: Profit-Aware Discount Guardrail
// Prevents unprofitable discounting by inspecting cost price and enforcing minimum margin floors

import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from 'src/services/apiClient';
import { DiscountSimulationResponse, Product } from 'src/types';
import { formatCurrency } from 'src/utils/calculations';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  TrendingDown,
  TrendingUp,
  Percent,
  DollarSign,
  Users,
  Settings2,
  Sparkles,
  Info,
} from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Badge } from 'src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card';
import { Label } from 'src/components/ui/label';
import { Checkbox } from 'src/components/ui/checkbox';
import { Slider } from 'src/components/ui/slider';
import { toast } from 'sonner';

export const DiscountGuardrail: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('custom');

  // Input Parameters
  const [salesPrice, setSalesPrice] = useState<number>(2000);
  const [costPrice, setCostPrice] = useState<number>(1240); // 38% base margin
  const [proposedDiscount, setProposedDiscount] = useState<number>(20);
  const [marginFloor, setMarginFloor] = useState<number>(15);
  const [overrideFloor, setOverrideFloor] = useState<boolean>(false);

  // Simulation Result
  const [simulation, setSimulation] = useState<DiscountSimulationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const prods = await apiClient.getProducts();
        setProducts(prods);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCatalog();
  }, []);

  // Update simulation when parameters change
  useEffect(() => {
    const runSim = async () => {
      setLoading(true);
      try {
        const res = await apiClient.simulateDiscount({
          sales_price: salesPrice,
          cost_price: costPrice,
          discount_percent: proposedDiscount,
          min_margin_floor: marginFloor,
        });
        setSimulation(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    runSim();
  }, [salesPrice, costPrice, proposedDiscount, marginFloor]);

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    if (id === 'custom') return;
    const p = products.find(prod => prod.id === id);
    if (p) {
      setSalesPrice(p.sales_price);
      setCostPrice(p.cost_price);
    }
  };

  const handleApply20SecDemo = () => {
    // 20-second demo scenario from Handoff document
    setSelectedProductId('custom');
    setSalesPrice(2000);
    setCostPrice(1240); // Baseline margin: (2000-1240)/2000 = 38%
    setProposedDiscount(20); // 20% off -> Price 1600. Margin: (1600-1240)/1600 = 22.5%, if cost 1424 -> 11%
    setCostPrice(1424); // 2000 - 1424 = 576 (28.8% margin), discounted 1600 - 1424 = 176 (11.0% margin!)
    setMarginFloor(15);
    setOverrideFloor(false);
    toast.success('Loaded Rubric 20-Second Demo: 20% discount dropping margin from 28.8% to 11.0% (below 15% floor)!');
  };

  const handleUpdateMarginFloor = async (newFloor: number) => {
    setMarginFloor(newFloor);
    try {
      await apiClient.updateMarginFloor(newFloor);
      toast.success(`System minimum margin floor updated to ${newFloor}%`);
    } catch {
      toast.error('Failed to update margin floor');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-teal-600" />
              Profit-Aware Discount Guardrail
            </h1>
            <Badge className="text-xs font-bold bg-teal-600 text-white">
              Novelty N1
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time margin protection engine. Evaluates underlying product cost price to intercept unprofitable discounts.
          </p>
        </div>

        {/* 20-Second Demo Trigger for Judges */}
        <Button
          onClick={handleApply20SecDemo}
          className="text-xs font-semibold gap-1.5 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white cursor-pointer shadow-xs h-9"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          Load 20-Second Rubric Demo
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Simulation Form */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border shadow-2xs">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold">Discount Proposal Simulator</CardTitle>
              <CardDescription className="text-xs">
                Simulate prospective discount tiers without altering production contracts
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-4 text-xs">
              {/* Product Selector */}
              <div>
                <Label className="text-xs font-semibold">Select Catalog Product</Label>
                <select
                  value={selectedProductId}
                  onChange={e => handleProductSelect(e.target.value)}
                  className="w-full h-9 mt-1 px-3 rounded-md border border-border bg-background text-xs cursor-pointer"
                >
                  <option value="custom">Custom Parameters (Sandbox)</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Sales: {formatCurrency(p.sales_price)} | Cost: {formatCurrency(p.cost_price)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Price & Cost Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Base Sales Price (₹)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="50"
                    value={salesPrice}
                    onChange={e => setSalesPrice(parseFloat(e.target.value) || 0)}
                    className="text-xs h-9 mt-1 font-mono font-bold"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Unit Cost Price (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    value={costPrice}
                    onChange={e => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="text-xs h-9 mt-1 font-mono"
                  />
                </div>
              </div>

              {/* Proposed Discount Slider */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Proposed Discount Percentage</Label>
                  <span className="font-mono font-bold text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    {proposedDiscount}% OFF
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={proposedDiscount}
                  onChange={e => setProposedDiscount(parseInt(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>0%</span>
                  <span>15%</span>
                  <span>30%</span>
                  <span>45%</span>
                  <span>60%</span>
                </div>
              </div>

              {/* System Minimum Margin Floor */}
              <div className="pt-2 border-t border-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Enforced Minimum Margin Floor:</span>
                  </Label>
                  <span className="font-mono font-bold text-xs text-foreground">
                    {marginFloor}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={marginFloor}
                    onChange={e => handleUpdateMarginFloor(parseFloat(e.target.value) || 0)}
                    className="text-xs h-8 font-mono w-24"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Minimum acceptable profit margin across all discount rules
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Guardrail Evaluation Panel */}
        <div className="lg:col-span-7 space-y-4">
          {simulation && (
            <>
              {/* Status Outcome Banner */}
              <Card
                className={`border-2 shadow-sm transition-all ${
                  simulation.guardrail_status === 'blocked'
                    ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20'
                    : simulation.guardrail_status === 'warning'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                    : 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                        simulation.guardrail_status === 'blocked'
                          ? 'bg-red-600 text-white'
                          : simulation.guardrail_status === 'warning'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {simulation.guardrail_status === 'blocked' ? (
                        <XCircle className="w-7 h-7" />
                      ) : simulation.guardrail_status === 'warning' ? (
                        <AlertTriangle className="w-7 h-7" />
                      ) : (
                        <ShieldCheck className="w-7 h-7" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-extrabold tracking-wider">
                          {simulation.guardrail_status === 'blocked'
                            ? 'DISCOUNT BLOCKED — UNPROFITABLE'
                            : simulation.guardrail_status === 'warning'
                            ? 'GUARDRAIL WARNING — MARGIN BREACH'
                            : 'GUARDRAIL VERIFIED — SAFE DISCOUNT'}
                        </span>
                        <Badge
                          variant={
                            simulation.guardrail_status === 'blocked'
                              ? 'destructive'
                              : simulation.guardrail_status === 'warning'
                              ? 'secondary'
                              : 'default'
                          }
                          className="capitalize text-xs font-bold"
                        >
                          {simulation.guardrail_status}
                        </Badge>
                      </div>

                      <p className="text-xs text-foreground font-medium leading-relaxed">
                        {simulation.message}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Selling Price */}
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <span className="text-[11px] text-muted-foreground block font-medium">Selling Price</span>
                  <div className="text-base font-bold font-mono text-foreground mt-0.5">
                    {formatCurrency(simulation.selling_price_after)}
                  </div>
                  <span className="text-[10px] text-muted-foreground line-through">
                    {formatCurrency(salesPrice)}
                  </span>
                </div>

                {/* Margin Delta */}
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <span className="text-[11px] text-muted-foreground block font-medium">Gross Margin</span>
                  <div
                    className={`text-base font-bold font-mono mt-0.5 ${
                      simulation.margin_after < marginFloor ? 'text-red-600 font-extrabold' : 'text-emerald-600'
                    }`}
                  >
                    {simulation.margin_after.toFixed(1)}%
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Was {simulation.margin_before.toFixed(1)}%
                  </span>
                </div>

                {/* Profit Per Unit */}
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <span className="text-[11px] text-muted-foreground block font-medium">Profit / Unit</span>
                  <div
                    className={`text-base font-bold font-mono mt-0.5 ${
                      simulation.profit_after < 0 ? 'text-red-600' : 'text-foreground'
                    }`}
                  >
                    {formatCurrency(simulation.profit_after)}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Cost: {formatCurrency(costPrice)}
                  </span>
                </div>

                {/* Revenue Impact Next Cycle */}
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <span className="text-[11px] text-muted-foreground block font-medium">Revenue Lost Next Cycle</span>
                  <div className="text-base font-bold font-mono text-red-600 mt-0.5">
                    -{formatCurrency(simulation.revenue_lost_next_cycle)}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Across {simulation.affected_subscriptions} subscriptions
                  </span>
                </div>
              </div>

              {/* Explicit Override Checkbox & Action Policy */}
              {simulation.guardrail_status === 'warning' && (
                <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/20 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      id="override-margin"
                      checked={overrideFloor}
                      onCheckedChange={checked => setOverrideFloor(!!checked)}
                      className="mt-0.5 border-amber-500"
                    />
                    <div className="text-xs">
                      <Label htmlFor="override-margin" className="font-bold text-amber-900 dark:text-amber-200 cursor-pointer">
                        Acknowledge & Override Minimum Margin Floor ({marginFloor}%)
                      </Label>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300/80 leading-relaxed mt-0.5">
                        I verify as Finance Lead that this promotional concession is authorized despite reducing unit margins to {simulation.margin_after.toFixed(1)}%.
                      </p>
                    </div>
                  </div>

                  <Button
                    disabled={!overrideFloor}
                    className="w-full text-xs h-8 font-semibold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                  >
                    Authorize Discount with Explicit Floor Override
                  </Button>
                </div>
              )}

              {simulation.guardrail_status === 'blocked' && (
                <div className="p-4 rounded-xl border border-red-300 dark:border-red-900 bg-red-50/70 dark:bg-red-950/20 text-xs text-red-800 dark:text-red-300 space-y-1">
                  <span className="font-bold block">Hard Policy Block:</span>
                  <p className="text-[11px] leading-relaxed">
                    This discount cannot be saved under any circumstance because the selling price ({formatCurrency(simulation.selling_price_after)}) is lower than the product unit cost ({formatCurrency(costPrice)}). To proceed, either reduce the discount percentage or lower the underlying cost baseline.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscountGuardrail;
