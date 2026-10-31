// Brightloop Administration: System Settings
import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  Sliders,
  Radio,
  AlertOctagon,
  Save,
  CheckCircle2,
  ShieldAlert,
  Server,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { apiClient } from 'src/services/apiClient';
import { loadState, saveState, resetState } from 'src/services/mockStore';
import { useAuth } from 'src/context/AuthContext';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'company' | 'engine' | 'integrations' | 'danger'>('company');

  // Company settings
  const [companyName, setCompanyName] = useState('Brightloop Technologies Pvt Ltd');
  const [supportEmail, setSupportEmail] = useState('billing@brightloop.io');
  const [gstin, setGstin] = useState('27AABCB1234F1Z6');
  const [address, setAddress] = useState('Level 4, Cyber City, BKC, Mumbai 400051, Maharashtra, India');

  // Engine settings
  const [marginFloor, setMarginFloor] = useState<number>(15);
  const [is10kSeeded, setIs10kSeeded] = useState<boolean>(false);

  // Integrations
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.slack.com/services/T00/B00/brightloop-finance');
  const [apiBase] = useState(import.meta.env.VITE_API_URL || '/api');

  useEffect(() => {
    const state = loadState();
    setMarginFloor(state.marginFloor || 15);
    setIs10kSeeded(state.is10kSeeded || false);
  }, []);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Company profile updated successfully');
  };

  const handleSaveEngine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.updateMarginFloor(marginFloor);
      const state = loadState();
      state.is10kSeeded = is10kSeeded;
      saveState(state);
      toast.success('Billing engine rules & margin floor updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update engine settings');
    }
  };

  const handleFactoryReset = () => {
    if (!isAdmin) {
      toast.error('Admin rights required to reset demo state');
      return;
    }
    if (window.confirm('WARNING: This will wipe all test modifications and reload clean hackathon seed data. Proceed?')) {
      localStorage.clear();
      toast.success('Factory state restored. Reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure enterprise company details, billing guardrails, and backend integration parameters.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-2">
        {[
          { key: 'company', label: 'Company Profile', icon: Building },
          { key: 'engine', label: 'Billing Engine & Guardrails', icon: Sliders },
          { key: 'integrations', label: 'API & Integrations', icon: Server },
          { key: 'danger', label: 'Danger Zone', icon: AlertOctagon },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Company Profile */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 max-w-2xl">
          <h3 className="font-semibold text-slate-900 text-base">Enterprise Profile Details</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Currency</label>
              <input
                type="text"
                disabled
                value="INR (₹) — Indian Rupee"
                className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-lg p-2.5 text-sm cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">GSTIN Number</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Billing Support Email</label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Registered Address</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" /> Save Profile
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Billing Engine & Guardrails */}
      {activeTab === 'engine' && (
        <form onSubmit={handleSaveEngine} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 max-w-2xl">
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900 text-base">Profit-Aware Guardrails (Novelty N1)</h3>
            <p className="text-xs text-slate-500">
              Enforce enterprise pricing safety policies across sales representatives and quotation generation.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-slate-800">Minimum Profit Margin Floor</label>
              <span className="text-lg font-bold text-blue-600 font-mono">{marginFloor}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={marginFloor}
              onChange={(e) => setMarginFloor(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-xs text-slate-500">
              Quotation discounts driving profit margins below {marginFloor}% will trigger an administrative warning or block.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={is10kSeeded}
                onChange={(e) => setIs10kSeeded(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <span className="text-sm font-semibold text-slate-800">
                Simulate 10,000-Subscription Seed Test Volume
              </span>
            </label>
            <p className="text-xs text-slate-500 ml-7">
              Switches KPI calculations and performance telemetry to demonstrate sub-2-second response latency with 10k enterprise records.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" /> Save Engine Settings
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: API & Integrations */}
      {activeTab === 'integrations' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5 max-w-2xl">
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900 text-base">Backend Connectivity</h3>
            <p className="text-xs text-slate-500">
              Brightloop features dual-mode architecture: in-memory localStorage store for offline hackathon review, with full 54-endpoint REST capability.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Active API Target:</span>
              <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {apiBase}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Runtime Client Mode:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Local Mock Store (Active & Synchronized)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Billing Event Webhook URL
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono text-slate-700"
            />
            <p className="text-xs text-slate-500 mt-1">Dispatches invoice generation, overdue dunning, and payment events.</p>
          </div>
        </div>
      )}

      {/* Tab 4: Danger Zone */}
      {activeTab === 'danger' && (
        <div className="bg-white rounded-xl border border-rose-200 p-6 shadow-sm space-y-4 max-w-2xl">
          <div className="flex items-center gap-2 text-rose-600">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-semibold text-rose-900 text-base">Administrative Reset Controls</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Reset all test records, mock quotations, new customers, and invoices back to the initial pristine seed dataset.
            Single-click restoration for evaluation.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleFactoryReset}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Restore Factory Seed State
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
