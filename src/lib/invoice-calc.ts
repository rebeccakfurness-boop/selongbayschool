import type { CreateInvoiceInput } from './validation';

/**
 * Admin enters each child's discount percent directly on the invoice form -- there's no automatic
 * sibling-position calculation anymore (the school found the old fixed 5%/10% schedule, which
 * applied the instant a second child was added and couldn't be overridden, too rigid: it doesn't
 * fit every family's actual agreement, and covers only sibling discounts, not any other reason a
 * discount might apply). The discount percent applies only to that child's line items marked
 * discountEligible -- e.g. a sibling discount can cover tuition while leaving a one-off excursion
 * fee on the same invoice untouched. Shared between invoice creation and editing so the two can
 * never compute a different total for the same input.
 */
export interface InvoiceChildTotal {
  childId: number;
  discountPercent: number;
  lineItems: CreateInvoiceInput['children'][number]['lineItems'];
}

export interface InvoiceTotals {
  subtotal: number;
  siblingDiscountTotal: number;
  total: number;
  childTotals: InvoiceChildTotal[];
}

export function computeInvoiceTotals(children: CreateInvoiceInput['children']): InvoiceTotals {
  let subtotal = 0;
  let siblingDiscountTotal = 0;
  const childTotals: InvoiceChildTotal[] = [];

  children.forEach((child) => {
    const discountPercent = child.discountPercent;
    const childSubtotal = child.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
    const discountEligibleSubtotal = child.lineItems
      .filter((li) => li.discountEligible)
      .reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
    subtotal += childSubtotal;
    siblingDiscountTotal += Math.round((discountEligibleSubtotal * discountPercent) / 100);
    childTotals.push({ childId: child.childId, discountPercent, lineItems: child.lineItems });
  });

  return { subtotal, siblingDiscountTotal, total: subtotal - siblingDiscountTotal, childTotals };
}
