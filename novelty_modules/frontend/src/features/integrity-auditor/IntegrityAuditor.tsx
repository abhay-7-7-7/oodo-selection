import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Play,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileSearch,
  ChevronRight,
  Loader2,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';
import { noveltyApi } from '@/services/apiClient';
import { formatDateTime } from '@/utils/formatters';
import type { AuditRunResult, AuditFinding, AuditSeverity } from '@/types';

export const IntegrityAuditor: React.FC = () => {
  const [runs, setRuns] = useState<AuditRunResult[]>([]);
  const [selectedRun, setSelectedRun] = useState<AuditRunResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [runningScan, setRunningScan] = useState<boolean>(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await noveltyApi.getAuditRuns();
      setRuns(res.items || []);
      if (res.items && res.items.length > 0 && !selectedRun) {
        setSelectedRun(res.items[0]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleRunAudit = async () => {
    setRunningScan(true);
    try {
      const newRun = await noveltyApi.runAudit();
      setSelectedRun(newRun);
      fetchRuns();
    } catch (err: any) {
      alert(err.message || 'Audit run failed');
    } finally {
      setRunningScan(false);
    }
  };

  const findings = selectedRun?.findings || [];
  const filteredFindings = findings.filter((f) => {
    const matchesSev = filterSeverity === 'all' || f.severity === filterSeverity;
    const matchesCat = filterCategory === 'all' || f.category === filterCategory;
    return matchesSev && matchesCat;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
            Novelty N2 • Anomaly Detection
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Billing Integrity Auditor
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Automated reconciliation engine scanning across subscriptions, invoices, and payments to detect double-billing, orphan charges, and financial drift.
          </p>
        </div>

        <button
          onClick={handleRunAudit}
          disabled={runningScan}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-colors flex items-center gap-2 shadow-sm shrink-0 disabled:opacity-50"
        >
          {runningScan ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          Run Full Integrity Scan
        </button>
      </div>

      {/* KPI Cards */}
      {selectedRun && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Findings</div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{selectedRun.total_findings}</div>
            <div className="text-xs text-slate-400 mt-1">Across all categories</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm bg-rose-50/20">
            <div className="text-xs font-medium text-rose-600 uppercase tracking-wider">Critical</div>
            <div className="text-2xl font-bold text-rose-700 mt-2">{selectedRun.critical}</div>
            <div className="text-xs text-rose-400 mt-1">Immediate action needed</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm bg-amber-50/20">
            <div className="text-xs font-medium text-amber-600 uppercase tracking-wider">High Priority</div>
            <div className="text-2xl font-bold text-amber-700 mt-2">{selectedRun.high}</div>
            <div className="text-xs text-amber-500 mt-1">Review within 24 hours</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Medium / Low</div>
            <div className="text-2xl font-bold text-slate-800 mt-2">{selectedRun.medium + selectedRun.low}</div>
            <div className="text-xs text-slate-400 mt-1">Operational anomalies</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Scan Completed</div>
            <div className="text-sm font-bold text-slate-800 mt-3 truncate font-mono">
              {formatDateTime(selectedRun.completed_at || selectedRun.started_at)}
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 4 Audit Rules
            </div>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Past Runs Sidebar */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            Scan History
          </h2>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {runs.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-8">
                No past scans found. Trigger a scan above.
              </div>
            ) : (
              runs.map((r) => {
                const isSelected = selectedRun?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRun(r)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800 font-mono">
                        {r.id.slice(0, 8)}...
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {formatDateTime(r.started_at)}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {r.total_findings} findings
                        </span>
                        {r.critical > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                            {r.critical} critical
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Findings Inspection Panel */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-indigo-600" />
                Audit Findings Details
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Displaying {filteredFindings.length} of {findings.length} findings
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="duplicate_invoice">Duplicate Invoices</option>
                <option value="payment_mismatch">Payment Mismatches</option>
                <option value="subscription_gap">Subscription Gaps</option>
                <option value="orphan_payment">Orphan Payments</option>
              </select>
            </div>
          </div>

          {/* Finding Cards */}
          <div className="space-y-3">
            {filteredFindings.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No integrity violations detected under the current filter.
              </div>
            ) : (
              filteredFindings.map((f) => {
                const isCritical = f.severity === 'critical';
                const isHigh = f.severity === 'high';
                return (
                  <div
                    key={f.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCritical
                        ? 'border-red-200 bg-red-50/20'
                        : isHigh
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-slate-200 bg-slate-50/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {isCritical ? (
                          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        ) : isHigh ? (
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                isCritical
                                  ? 'bg-red-100 text-red-700'
                                  : isHigh
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {f.severity}
                            </span>
                            <span className="text-xs font-semibold text-slate-800 font-mono">
                              {f.category.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Target: {f.entity_type} #{f.entity_id}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-800 mt-1.5">
                            {f.description}
                          </p>
                          {f.detail && Object.keys(f.detail).length > 0 && (
                            <pre className="mt-2 text-[11px] bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-slate-600 overflow-x-auto">
                              {JSON.stringify(f.detail, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
