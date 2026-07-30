import type { CreateInvoiceInput } from './validation';

/**
 * Sibling discount: only applies when 2+ children are billed on the same invoice (per the
 * brief's "when multiple siblings are billed together"); a single-child invoice gets 0%. Among
 * billed children, the first one added gets 5% off their own line items, every additional child
 * gets 10% off theirs — confirmed with the school; nothing in the source spreadsheet or sample
 * invoices defined an actual schedule, so this is the one place that rule is encoded. Shared
 * between invoice creation and editing so the two can never compute a different total for the
 * same input.
 */
function siblingDiscountPercent(index: number, totalChildren: number): number {
  if (totalChildren < 2) return 0;
  return index === 0 ? 5 : 10;
}

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

  children.forEach((child, index) => {
    const discountPercent = siblingDiscountPercent(index, children.length);
    const childSubtotal = child.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
    subtotal += childSubtotal;
    siblingDiscountTotal += Math.round((childSubtotal * discountPercent) / 100);
    childTotals.push({ childId: child.childId, discountPercent, lineItems: child.lineItems });
  });

  return { subtotal, siblingDiscountTotal, total: subtotal - siblingDiscountTotal, childTotals };
}
