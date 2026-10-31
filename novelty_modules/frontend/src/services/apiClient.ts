/**
 * Novelty Modules API Client
 * Targets /api/novelties endpoints on port 8001 via Vite proxy.
 */
import type {
  GuardrailSimulationRequest,
  GuardrailSimulationResult,
  OverrideRequest,
  GuardrailAuditEntry,
  AuditRunResult,
  UploadCSVResponse,
  ReconciliationRecord,
  BankTransaction,
  BillExplanation,
  RenewalSubscription,
  RenewalQuotationDraft,
  ReminderSettings,
  ReminderRunSummary,
  ReminderRecord,
  UpcomingReminder,
} from '@/types';

const BASE_URL = '/api/novelties';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('brightloop_token');
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = `Request failed (${res.status})`;
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }

  return res.json() as Promise<T>;
}

export const noveltyApi = {
  // N1: Discount Guardrail
  simulateDiscount: (data: GuardrailSimulationRequest) =>
    request<GuardrailSimulationResult>('/discount-guardrail/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  submitOverride: (data: OverrideRequest) =>
    request<{ simulation_id: string; override_level: string; approved: boolean; message: string }>(
      '/discount-guardrail/override',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  getGuardrailAuditLog: () =>
    request<{ items: GuardrailAuditEntry[]; total: number }>('/discount-guardrail/audit-log'),

  // N2: Billing Integrity Auditor
  runAudit: () =>
    request<AuditRunResult>('/integrity-auditor/run', { method: 'POST' }),

  getAuditRuns: () =>
    request<{ items: AuditRunResult[]; total: number }>('/integrity-auditor/runs'),

  getAuditRunDetail: (runId: string) =>
    request<AuditRunResult>(`/integrity-auditor/runs/${runId}`),

  // N3: Bank Matcher
  uploadBankCSV: (formData: FormData) =>
    request<UploadCSVResponse>('/bank-matcher/upload-csv', {
      method: 'POST',
      body: formData,
    }),

  getBankTransactions: (status?: string) =>
    request<{ items: BankTransaction[]; total: number }>(
      `/bank-matcher/transactions${status ? `?status=${status}` : ''}`
    ),

  reconcileMatches: (matches: Array<{ transaction_id: string; invoice_ids: string[]; amount_paise: number; confidence: number; match_type: string }>) =>
    request<ReconciliationRecord[]>('/bank-matcher/reconcile', {
      method: 'POST',
      body: JSON.stringify({ matches }),
    }),

  getReconciliationHistory: () =>
    request<{ items: ReconciliationRecord[]; total: number }>('/bank-matcher/history'),

  // N4: Bill Explainer
  explainBill: (prevInvoiceId: string, currInvoiceId: string) =>
    request<BillExplanation>('/bill-explainer/explain', {
      method: 'POST',
      body: JSON.stringify({
        prev_invoice_id: prevInvoiceId,
        curr_invoice_id: currInvoiceId,
      }),
    }),

  // N5: Renewal Radar
  getRenewalSubscriptions: (bucket?: string) =>
    request<{ items: RenewalSubscription[]; total: number }>(
      `/renewal-radar/subscriptions${bucket ? `?bucket=${bucket}` : ''}`
    ),

  createRenewalQuotation: (draft: RenewalQuotationDraft) =>
    request<{ id: string; subscription_id: string; status: string }>(
      '/renewal-radar/quotation',
      {
        method: 'POST',
        body: JSON.stringify(draft),
      }
    ),

  getRenewalQuotations: () =>
    request<{ items: any[]; total: number }>('/renewal-radar/quotations'),

  // N6: Reminder Centre
  getReminderSettings: () =>
    request<ReminderSettings>('/reminder-centre/settings'),

  updateReminderSettings: (settings: Partial<ReminderSettings>) =>
    request<ReminderSettings>('/reminder-centre/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  runReminders: () =>
    request<ReminderRunSummary>('/reminder-centre/run', { method: 'POST' }),

  getReminderHistory: () =>
    request<{ items: ReminderRecord[]; total: number }>('/reminder-centre/history'),

  getUpcomingReminders: () =>
    request<UpcomingReminder[]>('/reminder-centre/upcoming'),
};
