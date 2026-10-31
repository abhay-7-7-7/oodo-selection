// Novelty Modules — Shared TypeScript Types (N1 - N6)

export interface GuardrailSimulationRequest {
  product_id?: string;
  sales_price_paise: number;        // base selling price in paise
  cost_price_paise: number;         // cost/COGS in paise
  discount_kind: 'fixed' | 'percent';
  discount_value: number;           // paise for fixed, percentage for percent
  quantity?: number;
  requester_role: 'admin' | 'staff' | 'customer';
}

export interface GuardrailSimulationResult {
  simulation_id?: string;
  original_price_paise: number;
  discount_amount_paise: number;
  final_price_paise: number;
  cost_price_paise: number;
  profit_paise: number;
  margin_percent: number;
  min_margin_percent: number;
  guardrail_breached: boolean;
  requires_override: boolean;
  override_level: 'none' | 'manager' | 'director';
  warning_message: string | null;
}

export interface OverrideRequest {
  simulation_id: string;
  justification: string;
  requested_by_user_id: number;
}

export interface GuardrailAuditEntry {
  id: string;
  simulation_id: string;
  product_id: string | null;
  original_price_paise: number;
  final_price_paise: number;
  margin_percent: number;
  guardrail_breached?: boolean;
  override_level: string;
  justification: string;
  approved?: boolean;
  override_approved?: boolean;
  created_at: string;
}

// ── N2: Integrity Auditor ──────────────────────────────────────────────────

export type AuditSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface AuditFinding {
  id: string;
  category: 'duplicate_invoice' | 'payment_mismatch' | 'subscription_gap' | 'orphan_payment' | 'overdue_anomaly' | string;
  severity: AuditSeverity;
  description: string;
  entity_type: string;
  entity_id: string | number;
  detail: Record<string, unknown>;
}

export interface AuditRunResult {
  id: string;
  started_at: string;
  completed_at: string;
  total_findings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  findings: AuditFinding[];
}

// ── N3: Bank Matcher ──────────────────────────────────────────────────────

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount_paise: number;
  reference?: string;
  payer?: string;
  status?: string;
  uploaded_at?: string;
}

export interface InvoiceMatchSuggestion {
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  invoice_amount_paise: number;
  outstanding_paise: number;
  confidence: number;          // 0.0 – 1.0
  match_reason: string;
}

export interface MatchProposal {
  transaction_id: string;
  transaction_amount_paise: number;
  transaction_description: string;
  suggestions: InvoiceMatchSuggestion[];
  multi_invoice_subsets?: InvoiceMatchSuggestion[][];
  match_type: 'exact' | 'subset_sum' | 'unmatched' | string;
}

export interface UploadCSVResponse {
  uploaded: number;
  transactions: BankTransaction[];
  proposals: MatchProposal[];
}

export interface ReconciliationRecord {
  id: string;
  transaction_id: string;
  invoice_id?: string;
  invoice_ids: string[];
  amount_paise: number;
  confidence: number;
  match_type: string;
  reconciled_at: string;
  reconciled_by?: string;
}

// ── N4: Bill Explainer ────────────────────────────────────────────────────

export interface BillLineChange {
  field: string;                  // "quantity" | "unit_price_paise" | "discount_paise" | "tax_paise"
  label: string;
  previous: number | string | null;
  current: number | string | null;
  delta_paise: number;
  explanation: string;
}

export interface BillExplanation {
  previous_invoice_id: string;
  current_invoice_id: string;
  previous_total_paise: number;
  current_total_paise: number;
  total_delta_paise: number;
  changes: BillLineChange[];
  human_summary: string;
}

// ── N5: Renewal Radar ─────────────────────────────────────────────────────

export type RenewalBucket = '7d' | '30d' | '60d' | 'expired';

export interface RenewalSubscription {
  subscription_id: string;
  customer_name: string;
  plan_name: string;
  expires_at: string;
  days_until_expiry: number;
  bucket: RenewalBucket;
  renewable: boolean;
  has_open_renewal_quotation: boolean;
  last_payment_date: string | null;
  outstanding_paise: number;
}

export interface RenewalQuotationDraft {
  subscription_id: string;
  customer_id: string;
  plan_id: string;
  quantity: number;
  notes: string;
}

// ── N6: Reminder Centre ───────────────────────────────────────────────────

export type ReminderKind = 'invoice_due' | 'invoice_overdue' | 'subscription_expiry' | 'subscription_renewal';
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'skipped';

export interface ReminderRecord {
  id: string;
  kind: ReminderKind | string;
  recipient_email: string;
  subject: string;
  status: ReminderStatus | string;
  scheduled_at: string;
  sent_at: string | null;
  error_message: string | null;
  entity_type: string;
  entity_id: string;
  created_at?: string;
}

export type NoveltyReminderRecord = ReminderRecord;

export interface NoveltyReminderSettings {
  invoice_due_days_before: number[];   // e.g. [7, 3, 1]
  overdue_repeat_days: number;
  expiry_days_before: number[];
  enabled: boolean;
}

export interface UpcomingReminder {
  kind: string;
  entity_type: string;
  entity_id: string;
  recipient_email: string;
  scheduled_at: string;
  days_until: number;
}

export interface ReminderRunSummary {
  run_at: string;
  sent: number;
  skipped: number;
  failed: number;
  details: ReminderRecord[];
}
