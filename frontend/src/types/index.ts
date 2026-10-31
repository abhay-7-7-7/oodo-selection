// Brightloop Software Subscription Management System - Type Definitions
// Strictly adhering to API Contract and Hackathon Handoff Document

export type UserRole = 'admin' | 'staff' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  customer_id?: string; // Present if role is customer
  phone?: string;
  company?: string;
  is_active?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address?: string;
  active_subscriptions: number;
  total_billed: number;
  outstanding_balance: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export type ProductType = 'software' | 'service' | 'addon';

export interface ProductVariant {
  id: string;
  product_id: string;
  attribute: string; // e.g. "Brand", "Edition"
  value: string; // e.g. "Odoo Brand", "Enterprise"
  price_extra: number; // e.g. 560
  status: 'active' | 'inactive';
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  sales_price: number;
  cost_price: number;
  notes?: string;
  status: 'active' | 'archived';
  variants?: ProductVariant[];
  created_at: string;
}

export type BillingPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: BillingPeriod;
  min_qty: number;
  valid_from: string;
  valid_to: string;
  auto_close: boolean;
  closable: boolean;
  pausable: boolean;
  renewable: boolean;
  status: 'active' | 'inactive';
  description?: string;
}

export interface Tax {
  id: string;
  name: string;
  rate_percent: number;
  applies_to: 'all' | 'software' | 'service' | 'addon';
  status: 'active' | 'inactive';
}

export type DiscountKind = 'fixed' | 'percent';
export type DiscountScope = 'product' | 'subscription';

export interface Discount {
  id: string;
  name: string;
  kind: DiscountKind;
  value: number;
  min_amount: number;
  min_qty: number;
  start_date: string;
  end_date: string;
  usage_limit: number;
  times_used: number;
  scope: DiscountScope;
  product_id?: string;
  status: 'active' | 'expired' | 'exhausted' | 'scheduled';
}

export interface QuotationTemplateLine {
  product_id: string;
  product_name: string;
  variant_id?: string;
  variant_name?: string;
  quantity: number;
  unit_price: number;
}

export interface QuotationTemplate {
  id: string;
  name: string;
  description?: string;
  plan_id: string;
  plan_name?: string;
  validity_days: number;
  lines: QuotationTemplateLine[];
  status: 'active' | 'inactive';
}

export type PaymentTerms = 'due_on_receipt' | 'net_15' | 'net_30';

export interface LineItem {
  id: string;
  product_id: string;
  product_name: string;
  variant_id?: string;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  base_price: number;
  variant_extra: number;
  tax_id?: string;
  tax_rate: number;
  tax_amount: number;
  discount_id?: string;
  discount_amount: number;
  amount: number; // Final line total
}

export type QuotationStatus = 'draft' | 'sent' | 'confirmed' | 'cancelled';

export interface Quotation {
  id: string;
  quotation_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_company: string;
  template_id?: string;
  plan_id: string;
  plan_name: string;
  validity_date: string;
  payment_terms: PaymentTerms;
  lines: LineItem[];
  subtotal: number;
  tax_total: number;
  discount_total: number;
  total: number;
  status: QuotationStatus;
  created_at: string;
  notes?: string;
}

export type SubscriptionStatus = 'draft' | 'quotation' | 'confirmed' | 'active' | 'closed' | 'paused';

export interface SubscriptionAudit {
  id: string;
  subscription_id: string;
  from_status: SubscriptionStatus;
  to_status: SubscriptionStatus;
  user_id: string;
  user_name: string;
  at: string;
  note?: string;
}

export interface Subscription {
  id: string;
  number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_company: string;
  plan_id: string;
  plan_name: string;
  billing_period: BillingPeriod;
  start_date: string;
  expiry_date: string;
  payment_terms: PaymentTerms;
  status: SubscriptionStatus;
  next_billing_date: string;
  lines: LineItem[];
  subtotal: number;
  tax_total: number;
  discount_total: number;
  total: number;
  audit_history: SubscriptionAudit[];
  created_at: string;
  last_billed_at?: string;
  plan_auto_close?: boolean;
  plan_closable?: boolean;
  plan_pausable?: boolean;
  plan_renewable?: boolean;
}

export type InvoiceStatus = 'draft' | 'confirmed' | 'paid' | 'cancelled' | 'overdue' | 'partially_paid';

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  base: number;
  variant_extra: number;
  discount: number;
  tax: number;
  amount: number;
  snapshot?: Record<string, unknown>;
}

export type PaymentMethod = 'upi' | 'bank_transfer' | 'card' | 'cheque';

export interface PaymentRecord {
  id: string;
  payment_reference: string;
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  method: PaymentMethod;
  amount: number;
  paid_on: string;
  note?: string;
  recorded_by: string;
  source: 'manual' | 'bank_match';
  status: 'completed';
}

export interface Invoice {
  id: string;
  number: string;
  subscription_id: string;
  subscription_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_company: string;
  customer_address?: string;
  period_start: string;
  period_end: string;
  issue_date: string;
  due_date: string;
  payment_terms: PaymentTerms;
  status: InvoiceStatus;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;
  paid_total: number;
  lines: InvoiceLine[];
  payments: PaymentRecord[];
  bill_change_explanation?: string; // N4 Novelty
}

export interface BillingRunResultItem {
  subscription_id: string;
  subscription_number: string;
  customer_name: string;
  status: 'created' | 'skipped' | 'failed';
  invoice_number?: string;
  amount?: number;
  reason: string;
}

export interface BillingRun {
  id: string;
  run_number: string;
  run_date: string;
  as_of_date: string;
  dry_run: boolean;
  subscriptions_processed: number;
  invoices_generated: number;
  skipped_records: number;
  failed_records: number;
  total_amount: number;
  status: 'completed' | 'failed';
  items: BillingRunResultItem[];
}

export type OutboxKind = 'password_reset' | 'invoice_due' | 'invoice_overdue' | 'subscription_expiry' | 'quotation' | 'payment_receipt';

export interface OutboxMessage {
  id: string;
  to_email: string;
  subject: string;
  body: string;
  kind: OutboxKind;
  related_id?: string;
  status: 'sent' | 'queued' | 'failed';
  created_at: string;
  sent_at?: string;
  error?: string;
}

// NOVELTY N1: Profit-Aware Discount Guardrail
export interface DiscountSimulationRequest {
  sales_price: number;
  cost_price: number;
  discount_percent: number;
  min_margin_floor: number;
  product_id?: string;
}

export interface DiscountSimulationResponse {
  affected_subscriptions: number;
  revenue_lost_next_cycle: number;
  margin_before: number; // in percent
  margin_after: number; // in percent
  selling_price_after: number;
  profit_before: number;
  profit_after: number;
  breaches_floor: boolean;
  guardrail_status: 'safe' | 'warning' | 'blocked';
  message: string;
}

// NOVELTY N2: Subscription & Billing Integrity Auditor
export interface IntegrityCheckItem {
  name: string;
  status: 'passed' | 'failed';
  anomalies_count: number;
  description: string;
  examples: Array<{
    id: string;
    reference: string;
    detail: string;
    suggested_action: string;
  }>;
}

export interface IntegrityAuditResponse {
  checks: IntegrityCheckItem[];
  audited_at: string;
  total_subscriptions_checked: number;
  total_invoices_checked: number;
  overall_status: 'healthy' | 'issues_detected';
}

export interface ChaosBillingResponse {
  parallel_runs: number;
  invoices_created: number;
  duplicates_found: number;
  unique_guard_held: boolean;
  execution_ms: number;
  message: string;
}

// NOVELTY N3: Split-Payment Bank Matcher
export interface BankTransactionRow {
  row_id?: string;
  id?: string;
  date: string;
  amount: number;
  reference: string;
  payer: string;
}

export interface BankMatchProposal {
  row: BankTransactionRow;
  matched_invoice_ids: string[];
  matched_invoices: Array<{
    id: string;
    number: string;
    customer_name: string;
    total: number;
    outstanding: number;
  }>;
  confidence: number; // 0 - 100
  match_type: 'exact' | 'subset_sum' | 'partial' | 'unmatched';
  reason: string;
}

export interface BankUploadResponse {
  matches: BankMatchProposal[];
  unmatched: BankTransactionRow[];
}

// NOVELTY N4: "Why Did My Bill Change?" Explainer
export interface BillChangeDelta {
  component: 'base_price' | 'variant' | 'discount' | 'tax' | 'quantity' | 'plan';
  description: string;
  old_value: number;
  new_value: number;
  difference: number;
}

export interface BillChangeExplanation {
  invoice_id: string;
  invoice_number: string;
  previous_invoice_id?: string;
  previous_invoice_number?: string;
  previous_total: number;
  current_total: number;
  difference: number;
  summary_sentence: string;
  deltas: BillChangeDelta[];
}

// NOVELTY N5: Renewal Radar
export interface RenewalRadarItem {
  id: string;
  subscription_number: string;
  customer_id: string;
  customer_name: string;
  customer_company: string;
  plan_name: string;
  expiry_date: string;
  days_remaining: number;
  renewable: boolean;
  estimated_renewal_value: number;
  status: SubscriptionStatus;
  urgency: 'critical' | 'high' | 'medium' | 'expired';
}

// Notification type (from backend /api/notifications)
export type NotificationCategory = 'invoice' | 'payment' | 'subscription' | 'quotation' | 'account' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  action_url?: string;
}

// NOVELTY N6: Reminders Settings
export interface ReminderSettings {
  due_soon_days: number;
  overdue_days: number[]; // e.g. [1, 7, 15]
  expiry_days: number[]; // e.g. [30, 7]
  enabled: boolean;
  auto_send_outbox: boolean;
  from_name?: string;
  from_email?: string;
}

// Reporting Summary
export interface FinanceSummaryReport {
  active_subscriptions: number;
  total_subscriptions: number;
  revenue_received: number;
  outstanding_amount: number;
  overdue_invoices_count: number;
  overdue_amount: number;
  payments_count: number;
  mrr: number;
  query_ms: number;
  growth_rate: number;
}

export interface OverdueReportItem {
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  due_date: string;
  days_late: number;
  total_amount: number;
  outstanding_balance: number;
  follow_up_status: 'pending' | 'reminder_sent' | 'escalated';
}


// Export all novelty types
export * from './novelties';
