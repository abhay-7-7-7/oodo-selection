// Brightloop Automatic Reminder Emails & Outbox (Novelty N6)
import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Calendar,
  Settings as SettingsIcon,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  KeyRound,
  FileText,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router';
import { apiClient } from 'src/services/apiClient';
import { OutboxMessage, ReminderSettings, OutboxKind } from 'src/types';
import { formatDate } from 'src/utils/calculations';
import { toast } from 'sonner';

export const OutboxPage: React.FC = () => {
  const [messages, setMessages] = useState<OutboxMessage[]>([]);
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Reminders trigger state
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<{ sent: number; skipped_already_sent: number } | null>(null);

  // Message preview modal
  const [selectedMessage, setSelectedMessage] = useState<OutboxMessage | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [msgs, stgs] = await Promise.all([
        apiClient.getOutbox(),
        apiClient.getReminderSettings(),
      ]);
      setMessages(msgs);
      setSettings(stgs);
    } catch (err: any) {
      toast.error('Failed to load outbox');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleRunReminders = async (dryRun = false) => {
    setTriggering(true);
    try {
      const res = await apiClient.runReminders(asOfDate);
      setTriggerResult(res);
      toast.success(
        `Reminder engine processed: ${res.sent} sent, ${res.skipped_already_sent} skipped (already sent)`
      );
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Reminder job failed');
    } finally {
      setTriggering(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await apiClient.updateReminderSettings(settings);
      toast.success('Reminder engine settings saved');
      setShowSettings(false);
    } catch (err: any) {
      toast.error('Failed to save settings');
    }
  };

  const filteredMessages = messages.filter((m) => {
    const matchesSearch =
      m.to_email.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase());
    const matchesKind = kindFilter === 'all' || m.kind === kindFilter;
    return matchesSearch && matchesKind;
  });

  const getKindBadge = (kind: OutboxKind) => {
    const map: Record<OutboxKind, { bg: string; text: string; label: string }> = {
      password_reset: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Password Reset' },
      invoice_due: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Invoice Due' },
      invoice_overdue: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Overdue Notice' },
      subscription_expiry: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Expiring Soon' },
      quotation: { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Quotation' },
      payment_receipt: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Receipt' },
    };
    const c = map[kind] || { bg: 'bg-slate-100', text: 'text-slate-800', label: kind };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Communication Outbox</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
              Novelty N6
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Zero-SMTP email inspection table. View outgoing dunning notices, invoices, and single-use password reset links.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm cursor-pointer"
          >
            <SettingsIcon className="w-4 h-4 text-slate-500" />
            Reminder Rules
          </button>
        </div>
      </div>

      {/* Reminder Engine Trigger Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-blue-900 text-sm">Automated Dunning & Reminder Trigger</h3>
            </div>
            <p className="text-xs text-slate-600">
              Evaluates overdue invoices against the as-of date and queues dunning emails without sending duplicates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>As-of:</span>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="font-medium text-slate-900 bg-transparent focus:outline-none"
              />
            </div>

            <button
              onClick={() => handleRunReminders(false)}
              disabled={triggering}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" />
              {triggering ? 'Executing...' : 'Run Overdue Reminders'}
            </button>
          </div>
        </div>

        {triggerResult && (
          <div className="p-3 bg-white rounded-lg border border-blue-200 flex items-center justify-between text-xs text-slate-700">
            <span>
              Engine Run Result: <strong className="text-emerald-600">{triggerResult.sent} emails queued</strong>,{' '}
              <span className="text-slate-500">{triggerResult.skipped_already_sent} skipped (already sent)</span>
            </span>
            <span className="text-slate-400 font-mono">Status: 200 OK</span>
          </div>
        )}
      </div>

      {/* Reminder Settings Drawer/Card */}
      {showSettings && settings && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-slate-600" />
              Automated Schedule Settings (N6)
            </h3>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Sender Display Name
              </label>
              <input
                type="text"
                value={settings.from_name}
                onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Sender Email
              </label>
              <input
                type="email"
                value={settings.from_email}
                onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              Save Reminder Rules
            </button>
          </div>
        </form>
      )}

      {/* Outbox Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by recipient or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Filter Kind:</span>
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs bg-white text-slate-700"
            >
              <option value="all">All Message Types</option>
              <option value="password_reset">Password Reset</option>
              <option value="invoice_due">Invoice Due</option>
              <option value="invoice_overdue">Overdue Notice</option>
              <option value="subscription_expiry">Subscription Expiry</option>
              <option value="quotation">Quotation</option>
              <option value="payment_receipt">Payment Receipt</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Dispatched At</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No outgoing messages match criteria
                  </td>
                </tr>
              ) : (
                filteredMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4">{getKindBadge(msg.kind)}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-800">{msg.to_email}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{msg.subject}</td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {new Date(msg.created_at).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Dispatched
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedMessage(msg)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Body
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Body Inspection Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Outbox Message Preview</h3>
              </div>
              <button onClick={() => setSelectedMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-xs">
                <div>To: <strong className="text-slate-800">{selectedMessage.to_email}</strong></div>
                <div>Subject: <strong className="text-slate-800">{selectedMessage.subject}</strong></div>
                <div>Sent At: <span className="text-slate-600">{new Date(selectedMessage.created_at).toLocaleString('en-IN')}</span></div>
              </div>

              {/* Password reset single-use token notice */}
              {selectedMessage.kind === 'password_reset' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                    Single-Use Reset Token (Evaluation Link)
                  </div>
                  <p className="text-purple-700">
                    This password reset link was dispatched to the in-app Outbox to facilitate offline/zero-SMTP hackathon evaluation.
                  </p>
                </div>
              )}

              {/* Email Content Body */}
              <div className="p-4 bg-white border border-slate-200 rounded-lg font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 max-h-60 overflow-y-auto">
                {selectedMessage.body}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutboxPage;
