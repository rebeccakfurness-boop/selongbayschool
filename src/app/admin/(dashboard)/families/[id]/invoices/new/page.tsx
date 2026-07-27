import { notFound } from 'next/navigation';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import InvoiceForm from '@/components/admin/InvoiceForm';

export const dynamic = 'force-dynamic';

export default async function NewInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  await requireAdmin();
  await ensureSchema();
  const { id: idParam } = await params;
  const { type } = await searchParams;
  const childId = Number(idParam);
  if (!Number.isInteger(childId)) notFound();

  const rows = await sql`
    SELECT child_full_name, child_nickname, programme, class_name, parent1_name, parent2_name
    FROM children WHERE id = ${childId}
  `;
  const child = rows[0];
  if (!child) notFound();

  const invoiceType = type === 'activity' ? 'activity' : 'tuition';
  const label = (child.child_nickname as string) || (child.child_full_name as string);
  const billedToName = [child.parent1_name, child.parent2_name].filter(Boolean).join(' and ') || '';
  const defaultFirstLineItem =
    invoiceType === 'tuition'
      ? `${label} - ${child.programme || child.class_name || 'Tuition'} Term`
      : '';

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">
        New {invoiceType === 'tuition' ? 'tuition' : 'activity'} invoice — {label}
      </h1>
      <div className="mt-6">
        <InvoiceForm
          initialChildId={childId}
          initialChildLabel={label}
          defaultInvoiceType={invoiceType}
          defaultBilledToName={billedToName}
          defaultFirstLineItem={defaultFirstLineItem}
        />
      </div>
    </section>
  );
}
