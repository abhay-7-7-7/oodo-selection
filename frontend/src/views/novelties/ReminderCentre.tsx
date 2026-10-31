import React, { useState, useEffect } from 'react';
import {
  Bell,
  Play,
  Settings,
  Mail,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Save,
  Calendar,
} from 'lucide-react';
import { noveltyApi } from '@/services/apiClient';
import { formatDateTime } from '@/utils/formatters';
import type {
  NoveltyReminderSettings as ReminderSettings,
  ReminderRecord,
  UpcomingReminder,
  ReminderRunSummary,
} from '@/types';

export const ReminderCentre: React.FC = () => {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [history, setHistory] = useState<ReminderRecord[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingReminder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [running, setRunning] = useState<boolean>(false);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [runSummary, setRunSummary] = useState<ReminderRunSummary | null>(null);

  // Form edit state
  const [dueDaysStr, setDueDaysStr] = useState<string>('7, 3, 1');
  const [overdueRepeat, setOverdueRepeat] = useState<number>(3);
  const [expiryDaysStr, setExpiryDaysStr] = useState<string>('30, 7');
  const [enabled, setEnabled] = useState<boolean>(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, h, u] = await Promise.all([
        noveltyApi.getReminderSettings(),
        noveltyApi.getReminderHistory(),
        noveltyApi.getUpcomingReminders(),
      ]);
      setSettings(s);
      setDueDaysStr(s.invoice_due_days_before.join(', '));
      setOverdueRepeat(s.overdue_repeat_days);
      setExpiryDaysStr(s.expiry_days_before.join(', '));
      setEnabled(s.enabled);

      setHistory(h.items || []);
      setUpcoming(u || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const parseList = (str: string) =>
        str
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n));

      const updated = await noveltyApi.updateReminderSettings({
        invoice_due_days_before: parseList(dueDaysStr),
        overdue_repeat_days: overdueRepeat,
        expiry_days_before: parseList(expiryDaysStr),
        enabled,
      });
      setSettings(updated);
      alert('Reminder cadence settings updated successfully!');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRunReminders = async () => {
    setRunning(true);
    try {
      const summary = await noveltyApi.runReminders();
      setRunSummary(summary);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to execute reminders run');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            Novelty N6 • Intelligent Notification Cadence
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Automatic Reminder Centre
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Automated billing lifecycle notifications with deduplication safeguards, preventing spam while recovering overdue receivables.
          </p>
        </div>

        <button
          onClick={handleRunReminders}
          disabled={running}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition-colors flex items-center gap-2 shadow-sm shrink-0 disabled:opacity-50"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
          Execute Reminder Dispatch Now
        </button>
      </div>

      {/* Execution Results Feedback */}
      {runSummary && (
        <div className="bg-white rounded-2xl p-6 border border-emerald-200 bg-emerald-50/30 shadow-sm space-y-3">
          <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Reminder Dispatch Batch Completed
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Sent Successfully:</span>
              <span className="text-lg font-bold text-emerald-600">{runSummary.sent}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Deduplicated / Skipped:</span>
              <span className="text-lg font-bold text-slate-700">{runSummary.skipped}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Failed:</span>
              <span className="text-lg font-bold text-rose-600">{runSummary.failed}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cadence Configuration Form */}
        <form
          onSubmit={handleSaveSettings}
          className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5"
        >
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Settings className="w-5 h-5 text-emerald-600" />
            Cadence & Policy Rules
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Invoice Due Notification Days Before
              </label>
              <input
                type="text"
                value={dueDaysStr}
                onChange={(e) => setDueDaysStr(e.target.value)}
                placeholder="e.g. 7, 3, 1"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Comma-separated days before invoice due date</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Overdue Follow-up Frequency (Days)
              </label>
              <input
                type="number"
                min="1"
                value={overdueRepeat}
                onChange={(e) => setOverdueRepeat(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Repeat interval for overdue invoices</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Subscription Expiry Days Before
              </label>
              <input
                type="text"
                value={expiryDaysStr}
                onChange={(e) => setExpiryDaysStr(e.target.value)}
                placeholder="e.g. 30, 7"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Advance notice before subscription term end</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Automated Dispatch</span>
                <span className="text-[11px] text-slate-400">Enable scheduled daily runs</span>
              </div>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Cadence Settings
            </button>
          </div>
        </form>

        {/* Upcoming Dispatch Queue */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Upcoming Scheduled Reminders Queue
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {upcoming.length} Pending In Queue
            </span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {upcoming.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No reminders queued under current cadence policies.
              </div>
            ) : (
              upcoming.map((u, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {u.recipient_email}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          {u.kind.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Target: {u.entity_type} #{u.entity_id}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-slate-600 shrink-0">
                    in {u.days_until} days
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Historical Dispatched Reminders */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-500" />
          Dispatched Notification Audit Log
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Dispatched At</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Reminder Type</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Delivery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No reminders sent yet.
                  </td>
                </tr>
              ) : (
                history.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {formatDateTime(rec.sent_at || rec.created_at)}
                    </td>
                    <td className="py-3 px-4 font-medium">{rec.recipient_email}</td>
                    <td className="py-3 px-4 capitalize font-semibold">
                      {rec.kind.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">
                      {rec.subject}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {rec.entity_type} #{rec.entity_id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        {rec.status}
                      </span>
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


export default ReminderCentre;
