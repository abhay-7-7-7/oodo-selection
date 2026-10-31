// Brightloop Financial and Subscription Calculation Utilities
// Consistent calculation engine for billing, taxes, discounts, margins and novelties

import { DiscountSimulationResponse, LineItem } from 'src/types';

/**
 * Format currency with Indian Rupee symbol (₹)
 */
export function formatCurrency(amount: number, options: { includeDecimals?: boolean } = {}): string {
  const { includeDecimals = true } = options;
  const validAmount = isNaN(amount) ? 0 : amount;
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(validAmount);
}

/**
 * Format dates in a crisp, clean business format
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Calculate line item total:
 * base_price + variant_extra - discount_amount + tax_amount
 */
export function calculateLineAmount(
  quantity: number,
  unitPrice: number,
  variantExtra = 0,
  taxRate = 0,
  discountAmount = 0
): {
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
} {
  const effectiveUnitPrice = unitPrice + variantExtra;
  const subtotal = quantity * effectiveUnitPrice;
  const discountTotal = Math.min(discountAmount, subtotal);
  const taxableAmount = Math.max(0, subtotal - discountTotal);
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Calculate totals for a collection of line items
 */
export function calculateTotals(lines: LineItem[]): {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
} {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  for (const line of lines) {
    const calc = calculateLineAmount(
      line.quantity,
      line.base_price || line.unit_price,
      line.variant_extra || 0,
      line.tax_rate || 0,
      line.discount_amount || 0
    );
    subtotal += calc.subtotal;
    discountTotal += calc.discountTotal;
    taxTotal += calc.taxAmount;
  }

  const grandTotal = subtotal - discountTotal + taxTotal;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
}

/**
 * Calculate gross profit and margin percentage
 */
export function calculateMargin(salesPrice: number, costPrice: number): {
  profit: number;
  marginPercent: number;
} {
  const profit = salesPrice - costPrice;
  const marginPercent = salesPrice > 0 ? (profit / salesPrice) * 100 : 0;
  return {
    profit: Math.round(profit * 100) / 100,
    marginPercent: Math.round(marginPercent * 10) / 10,
  };
}

/**
 * NOVELTY N1: Profit-Aware Discount Guardrail Simulator
 */
export function simulateDiscountGuardrail(
  salesPrice: number,
  costPrice: number,
  discountPercent: number,
  marginFloor: number,
  affectedCount = 1
): DiscountSimulationResponse {
  const discountDecimal = discountPercent / 100;
  const discountedPrice = salesPrice * (1 - discountDecimal);
  
  const profitBefore = salesPrice - costPrice;
  const marginBefore = salesPrice > 0 ? (profitBefore / salesPrice) * 100 : 0;

  const profitAfter = discountedPrice - costPrice;
  const marginAfter = discountedPrice > 0 ? (profitAfter / discountedPrice) * 100 : -100;

  const revenueLostPerCycle = (salesPrice - discountedPrice) * affectedCount;
  const breachesFloor = marginAfter < marginFloor;

  let guardrailStatus: 'safe' | 'warning' | 'blocked' = 'safe';
  let message = `Safe: Margin remains healthy at ${marginAfter.toFixed(1)}% (above ${marginFloor}% floor).`;

  if (profitAfter <= 0) {
    guardrailStatus = 'blocked';
    message = `Critical: Discount of ${discountPercent}% causes a net loss of ${formatCurrency(Math.abs(profitAfter))} per unit!`;
  } else if (breachesFloor) {
    guardrailStatus = 'warning';
    message = `Warning: Margin drops to ${marginAfter.toFixed(1)}%, breaching the ${marginFloor}% floor. Requires explicit override.`;
  }

  return {
    affected_subscriptions: affectedCount,
    revenue_lost_next_cycle: Math.round(revenueLostPerCycle * 100) / 100,
    margin_before: Math.round(marginBefore * 10) / 10,
    margin_after: Math.round(marginAfter * 10) / 10,
    selling_price_after: Math.round(discountedPrice * 100) / 100,
    profit_before: Math.round(profitBefore * 100) / 100,
    profit_after: Math.round(profitAfter * 100) / 100,
    breaches_floor: breachesFloor,
    guardrail_status: guardrailStatus,
    message,
  };
}

/**
 * NOVELTY N3: Subset-Sum Matching Algorithm
 * Finds subset of invoices whose outstanding balances sum up to the deposit amount
 */
export function findSubsetSumMatches(
  targetAmount: number,
  openInvoices: Array<{ id: string; number: string; outstanding: number }>
): { matchedIds: string[]; exactMatch: boolean } {
  // Check exact 1-to-1 match first
  const exact = openInvoices.find(inv => Math.abs(inv.outstanding - targetAmount) < 0.01);
  if (exact) {
    return { matchedIds: [exact.id], exactMatch: true };
  }

  // Check 2 to 4 invoice combinations
  const n = Math.min(openInvoices.length, 12);
  const subset = openInvoices.slice(0, n);

  for (let i = 1; i < (1 << n); i++) {
    let sum = 0;
    const currentCombination: string[] = [];

    for (let j = 0; j < n; j++) {
      if ((i & (1 << j)) !== 0) {
        sum += subset[j].outstanding;
        currentCombination.push(subset[j].id);
      }
    }

    if (Math.abs(sum - targetAmount) < 0.01) {
      return { matchedIds: currentCombination, exactMatch: true };
    }
  }

  return { matchedIds: [], exactMatch: false };
}

/**
 * Days difference between two dates
 */
export function getDaysRemaining(targetDate: string): number {
  const target = new Date(targetDate).getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  const diffTime = target - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
