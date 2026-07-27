'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';
import { formatIDR } from '@/lib/site-content';

interface LineItemForm {
  description: string;
  quantity: string;
  unitPrice: string;
}

interface ChildEntry {
  childId: number;
  label: string;
  lineItems: LineItemForm[];
}

interface SearchResult {
  id: number;
  child_full_name: string;
  child_nickname: string | null;
  class_name: string | null;
}

const emptyLineItem = (): LineItemForm => ({ description: '', quantity: '1', unitPrice: '' });

function siblingDiscountPercent(index: number, total: number): number {
  if (total < 2) return 0;
  return index === 0 ? 5 : 10;
}

export default function InvoiceForm({
  initialChildId,
  initialChildLabel,
  defaultInvoiceType,
  defaultBilledToName,
  defaultFirstLineItem,
}: {
  initialChildId: number;
  initialChildLabel: string;
  defaultInvoiceType: 'tuition' | 'activity';
  defaultBilledToName: string;
  defaultFirstLineItem: string;
}) {
  const router = useRouter();
  const [invoiceType, setInvoiceType] = useState<'tuition' | 'activity'>(defaultInvoiceType);
  const [billedToName, setBilledToName] = useState(defaultBilledToName);
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [children, setChildren] = useState<ChildEntry[]>([
    { childId: initialChildId, label: initialChildLabel, lineItems: [{ ...emptyLineItem(), description: defaultFirstLineItem }] },
  ]);
  const [siblingQuery, setSiblingQuery] = useState('');
  const [siblingResults, setSiblingResults] = useState<SearchResult[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function searchSiblings(q: string) {
    setSiblingQuery(q);
    if (q.trim().length < 2) {
      setSiblingResults([]);
      return;
    }
    const res = await fetch(`/api/admin/children/search?q=${encodeURIComponent(q)}`);
    const data = await res.json().catch(() => ({ children: [] }));
    setSiblingResults((data.children as SearchResult[]).filter((c) => !children.some((ch) => ch.childId === c.id)));
  }

  function addSibling(result: SearchResult) {
    setChildren((prev) => [
      ...prev,
      { childId: result.id, label: result.child_nickname || result.child_full_name, lineItems: [emptyLineItem()] },
    ]);
    setSiblingQuery('');
    setSiblingResults([]);
  }

  function removeChild(childId: number) {
    setChildren((prev) => prev.filter((c) => c.childId !== childId));
  }

  function updateLineItem(childId: number, index: number, key: keyof LineItemForm, value: string) {
    setChildren((prev) =>
      prev.map((c) =>
        c.childId === childId
          ? { ...c, lineItems: c.lineItems.map((li, i) => (i === index ? { ...li, [key]: value } : li)) }
          : c
      )
    );
  }

  function addLineItem(childId: number, prefill?: Partial<LineItemForm>) {
    setChildren((prev) =>
      prev.map((c) => (c.childId === childId ? { ...c, lineItems: [...c.lineItems, { ...emptyLineItem(), ...prefill }] } : c))
    );
  }

  function removeLineItem(childId: number, index: number) {
    setChildren((prev) =>
      prev.map((c) => (c.childId === childId ? { ...c, lineItems: c.lineItems.filter((_, i) => i !== index) } : c))
    );
  }

  const preview = children.map((c, index) => {
    const subtotal = c.lineItems.reduce((sum, li) => sum + (Number(li.quantity) || 0) * (Number(li.unitPrice) || 0), 0);
    const discountPercent = siblingDiscountPercent(index, children.length);
    const discount = Math.round((subtotal * discountPercent) / 100);
    return { childId: c.childId, subtotal, discountPercent, discount, total: subtotal - discount };
  });
  const grandSubtotal = preview.reduce((s, p) => s + p.subtotal, 0);
  const grandDiscount = preview.reduce((s, p) => s + p.discount, 0);
  const grandTotal = grandSubtotal - grandDiscount;

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        invoiceType,
        billedToName,
        issueDate,
        children: children.map((c) => ({
          childId: c.childId,
          lineItems: c.lineItems
            .filter((li) => li.description.trim())
            .map((li) => ({
              description: li.description,
              quantity: li.quantity === '' ? 0 : Number(li.quantity),
              unitPrice: li.unitPrice === '' ? 0 : Number(li.unitPrice),
            })),
        })),
      };
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice');
      router.push(`/admin/families/${initialChildId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Invoice type" htmlFor="inv-type">
            <select
              id="inv-type"
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value as 'tuition' | 'activity')}
              className="rounded-sm border border-sand-line bg-white px-4 py-2.5 text-[15px] text-ink"
            >
              <option value="tuition">Tuition</option>
              <option value="activity">Activity</option>
            </select>
          </Field>
          <Field label="Billed to (parent name)" htmlFor="inv-billed-to" required>
            <TextInput id="inv-billed-to" required value={billedToName} onChange={(e) => setBilledToName(e.target.value)} />
          </Field>
          <Field label="Issue date" htmlFor="inv-issue-date" required>
            <TextInput id="inv-issue-date" type="date" required value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Add a sibling to bill together (optional)" htmlFor="inv-sibling-search">
            <TextInput id="inv-sibling-search" value={siblingQuery} onChange={(e) => searchSiblings(e.target.value)} placeholder="Search by child name…" />
          </Field>
          {siblingResults.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1 rounded-sm border border-sand-line bg-white p-2">
              {siblingResults.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => addSibling(r)} className="text-sm font-semibold text-teal-deep hover:underline">
                    {r.child_nickname || r.child_full_name} {r.class_name ? `(${r.class_name})` : ''}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {children.map((child, index) => {
        const p = preview[index];
        return (
          <div key={child.childId} className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-ink">
                {child.label}
                {p.discountPercent > 0 && (
                  <span className="ml-2 text-xs font-bold text-teal-deep">({p.discountPercent}% sibling discount)</span>
                )}
              </h3>
              {children.length > 1 && (
                <button type="button" onClick={() => removeChild(child.childId)} className="text-xs font-semibold text-orange-deep hover:underline">
                  Remove
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {child.lineItems.map((li, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <div className="col-span-6">
                    <TextInput
                      value={li.description}
                      onChange={(e) => updateLineItem(child.childId, i, 'description', e.target.value)}
                      placeholder="Description"
                    />
                  </div>
                  <div className="col-span-2">
                    <TextInput
                      type="number"
                      min={0}
                      value={li.quantity}
                      onChange={(e) => updateLineItem(child.childId, i, 'quantity', e.target.value)}
                      placeholder="Qty"
                    />
                  </div>
                  <div className="col-span-3">
                    <TextInput
                      type="number"
                      min={0}
                      step={1000}
                      value={li.unitPrice}
                      onChange={(e) => updateLineItem(child.childId, i, 'unitPrice', e.target.value)}
                      placeholder="Price (IDR)"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <button type="button" onClick={() => removeLineItem(child.childId, i)} className="text-xs font-semibold text-orange-deep hover:underline">
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" onClick={() => addLineItem(child.childId)} className="text-xs font-semibold text-teal-deep hover:underline">
                + Add line item
              </button>
              <button
                type="button"
                onClick={() => addLineItem(child.childId, { description: 'Lunches - provided by parents', quantity: '0', unitPrice: '0' })}
                className="text-xs font-semibold text-teal-deep hover:underline"
              >
                + Add &quot;Lunches - provided by parents&quot; note
              </button>
              <button
                type="button"
                onClick={() =>
                  addLineItem(child.childId, {
                    description: 'Activities (prior written information will be given if any activities incur a surcharge).',
                    quantity: '0',
                    unitPrice: '0',
                  })
                }
                className="text-xs font-semibold text-teal-deep hover:underline"
              >
                + Add activities note
              </button>
            </div>

            <div className="mt-3 text-sm text-ink-soft">
              Subtotal {formatIDR(p.subtotal)}
              {p.discount > 0 && <> · Discount -{formatIDR(p.discount)}</>} · <span className="font-semibold text-ink">Total {formatIDR(p.total)}</span>
            </div>
          </div>
        );
      })}

      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <div className="flex items-center justify-between text-lg">
          <span className="font-display font-semibold text-ink">Invoice total</span>
          <span className="font-display font-semibold text-teal-deep">{formatIDR(grandTotal)}</span>
        </div>
        {grandDiscount > 0 && (
          <p className="mt-1 text-sm text-ink-soft">
            Subtotal {formatIDR(grandSubtotal)} · Sibling discount -{formatIDR(grandDiscount)}
          </p>
        )}
      </div>

      {error && <p role="alert" className="font-semibold text-orange-deep">{error}</p>}
      <div className="flex gap-3">
        <Button type="button" variant="primary" onClick={submit} disabled={saving || !billedToName.trim() || grandTotal < 0}>
          {saving ? 'Creating…' : 'Create invoice'}
        </Button>
        <Button href={`/admin/families/${initialChildId}`} variant="ghost">
          Cancel
        </Button>
      </div>
    </div>
  );
}
