/**
 * Novelty Modules API Client (N1 - N6)
 * Integrated with the Brightloop central API and authentication.
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
  NoveltyReminderSettings,
  ReminderRunSummary,
  NoveltyReminderRecord,
  UpcomingReminder,
} from '@/types';

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000/api';

const NOVELTIES_BASE = API_BASE.endsWith('/api')
  ? `${API_BASE}/novelties`
  : `${API_BASE}/api/novelties`;

const AUTH_TOKEN_KEY = 'brightloop_auth_token';

function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken() || localStorage.getItem('brightloop_token');
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${NOVELTIES_BASE}${endpoint}`;
  const res = await fetch(url, {
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
    request<NoveltyReminderSettings>('/reminder-centre/settings'),

  updateReminderSettings: (settings: Partial<NoveltyReminderSettings>) =>
    request<NoveltyReminderSettings>('/reminder-centre/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  runReminders: () =>
    request<ReminderRunSummary>('/reminder-centre/run', { method: 'POST' }),

  getReminderHistory: () =>
    request<{ items: NoveltyReminderRecord[]; total: number }>('/reminder-centre/history'),

  getUpcomingReminders: () =>
    request<UpcomingReminder[]>('/reminder-centre/upcoming'),
};

export default noveltyApi;
