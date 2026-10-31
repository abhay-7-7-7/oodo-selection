import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Percent,
  CheckCircle2,
  AlertTriangle,
  History,
  TrendingDown,
  ArrowRight,
  Send,
  Loader2,
  DollarSign,
} from 'lucide-react';
import { noveltyApi } from '@/services/apiClient';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import type {
  GuardrailSimulationResult,
  GuardrailAuditEntry,
  UserRole,
} from '@/types';

export const DiscountGuardrail: React.FC = () => {
  // Form State
  const [salesPriceRupees, setSalesPriceRupees] = useState<number>(1000);
  const [costPriceRupees, setCostPriceRupees] = useState<number>(650);
  const [discountKind, setDiscountKind] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(15);
  const [quantity, setQuantity] = useState<number>(1);
  const [role, setRole] = useState<UserRole>('staff');

  // Simulation State
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<GuardrailSimulationResult | null>(null);

  // Override State
  const [justification, setJustification] = useState<string>('');
  const [submittingOverride, setSubmittingOverride] = useState<boolean>(false);
  const [overrideMessage, setOverrideMessage] = useState<string | null>(null);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<GuardrailAuditEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await noveltyApi.getGuardrailAuditLog();
      setAuditLogs(data.items || []);
    } catch {
      // ignore
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    runSimulation();
  }, []);

  const runSimulation = async () => {
    setLoading(true);
    setOverrideMessage(null);
    try {
      const sim = await noveltyApi.simulateDiscount({
        sales_price_paise: Math.round(salesPriceRupees * 100),
        cost_price_paise: Math.round(costPriceRupees * 100),
        discount_kind: discountKind,
        discount_value: discountValue,
        quantity,
        requester_role: role,
      });
      setResult(sim);
    } catch (err: any) {
      alert(err.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) return;
    setSubmittingOverride(true);
    try {
      const res = await noveltyApi.submitOverride({
        simulation_id: (result as any).simulation_id,
        justification,
        requested_by_user_id: 1,
      });
      setOverrideMessage(res.message);
      setJustification('');
      fetchAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Override request failed');
    } finally {
      setSubmittingOverride(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            Novelty N1 • Real-Time Margins
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Profit-Aware Discount Guardrail
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Simulates profit margins in real-time, preventing sales reps from applying discounts that breach profitability thresholds.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
          <span>Minimum Margin:</span>
          <span className="font-bold text-slate-800 text-sm">15.0%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Simulation Controls Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Percent className="w-5 h-5 text-blue-600" />
            Discount Simulation Parameters
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Base Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={salesPriceRupees}
                    onChange={(e) => setSalesPriceRupees(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Cost / COGS (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={costPriceRupees}
                    onChange={(e) => setCostPriceRupees(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Discount Type
                </label>
                <select
                  value={discountKind}
                  onChange={(e) => setDiscountKind(e.target.value as 'percent' | 'fixed')}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Discount Value {discountKind === 'percent' ? '(%)' : '(₹)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Requester Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="staff">Sales Staff</option>
                  <option value="admin">Administrator</option>
                  <option value="customer">Customer Portal</option>
                </select>
              </div>
            </div>

            <button
              onClick={runSimulation}
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Run Profitability Simulation'}
            </button>
          </div>
        </div>

        {/* Live Simulation Results */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Profitability & Guardrail Verdict
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Simulation ID: <code className="text-slate-600 font-mono">{(result as any).simulation_id?.slice(0, 8)}...</code>
                  </p>
                </div>
                <div>
                  {result.guardrail_breached ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                      <ShieldAlert className="w-4 h-4" /> Breached (Override Required)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                      <ShieldCheck className="w-4 h-4" /> Safe & Approved
                    </span>
                  )}
                </div>
              </div>

              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Final Price</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {formatCurrency(result.final_price_paise)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Original: {formatCurrency(result.original_price_paise)}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Discount Given</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {formatCurrency(result.discount_amount_paise)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {discountKind === 'percent' ? `${discountValue}% off` : 'Fixed discount'}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Net Profit</div>
                  <div className={`text-lg font-bold mt-1 ${result.profit_paise >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(result.profit_paise)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    COGS: {formatCurrency(result.cost_price_paise)}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${result.margin_percent >= 15 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="text-xs font-medium text-slate-600">Profit Margin</div>
                  <div className={`text-lg font-bold mt-1 ${result.margin_percent >= 15 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {result.margin_percent}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Target: ≥ 15%
                  </div>
                </div>
              </div>

              {/* Margin Bar Meter */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>Margin Meter</span>
                  <span>{result.margin_percent}% (Min: 15%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-500 ${result.margin_percent >= 15 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(100, Math.max(0, result.margin_percent * 2))}%` }}
                  />
                  <div className="absolute top-0 bottom-0 left-[30%] w-0.5 bg-slate-900 opacity-60" title="15% Threshold" />
                </div>
              </div>

              {/* Alert / Warning */}
              {result.guardrail_breached && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Guardrail Threshold Breached</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        {result.warning_message || `Margin is below minimum 15%. Requires ${result.override_level} approval.`}
                      </p>
                    </div>
                  </div>

                  {/* Override Form */}
                  <form onSubmit={handleOverrideSubmit} className="pt-2 border-t border-amber-200/60 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-amber-900 mb-1">
                        Submit Justification for {result.override_level.toUpperCase()} Override
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Enterprise account with guaranteed 2-year expansion commit..."
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                        minLength={10}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingOverride || justification.trim().length < 10}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {submittingOverride ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Submit Override Request
                    </button>
                    {overrideMessage && (
                      <p className="text-xs text-green-700 font-medium flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-4 h-4 text-green-600" /> {overrideMessage}
                      </p>
                    )}
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
              Run a simulation to view margin analysis.
            </div>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            Guardrail Audit Trail
          </h2>
          <button
            onClick={fetchAuditLogs}
            disabled={loadingLogs}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Refresh Logs
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Base Price</th>
                <th className="py-3 px-4">Final Price</th>
                <th className="py-3 px-4">Margin</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Override Level</th>
                <th className="py-3 px-4">Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No simulation audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px]">{formatDateTime(log.created_at)}</td>
                    <td className="py-3 px-4 font-medium">{formatCurrency(log.original_price_paise)}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{formatCurrency(log.final_price_paise)}</td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${log.margin_percent >= 15 ? 'text-green-600' : 'text-red-600'}`}>
                        {log.margin_percent}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {log.guardrail_breached ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                          Breached
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                          Safe
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 capitalize font-medium">{log.override_level}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-500">
                      {log.justification || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
