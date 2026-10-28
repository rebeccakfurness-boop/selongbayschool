import { randomBytes } from 'crypto';
import { sql } from './db';
import type { UpsertPartnerDiscountInput } from './validation';

function generateToken(): string {
  return randomBytes(24).toString('hex');
}

/** Lazily generates and stores a customer's discount-card token the first time they open their
 * own card, rather than backfilling every existing row at migration time -- same "generate on
 * first use, not eagerly" shape as the Letter of Offer's accept_token would be if it weren't
 * created at letter-creation time instead (this has no equivalent creation step to hook into).
 * The UPDATE's own WHERE clause keeps it race-safe: a concurrent second call either lands on the
 * now-already-set token (RETURNING would be empty, so it re-selects) or set it itself. */
export async function ensureDiscountCardToken(customerId: number): Promise<string> {
  const existing = (await sql`SELECT discount_card_token FROM customers WHERE id = ${customerId}`) as unknown as { discount_card_token: string | null }[];
  const current = existing[0]?.discount_card_token;
  if (current) return current;

  const token = generateToken();
  const rows = (await sql`
    UPDATE customers SET discount_card_token = ${token} WHERE id = ${customerId} AND discount_card_token IS NULL
    RETURNING discount_card_token
  `) as unknown as { discount_card_token: string }[];
  if (rows[0]) return rows[0].discount_card_token;

  // Lost the race -- someone else's concurrent call set it first; read back whatever won.
  const refetched = (await sql`SELECT discount_card_token FROM customers WHERE id = ${customerId}`) as unknown as { discount_card_token: string | null }[];
  return refetched[0]!.discount_card_token!;
}

export interface FamilyCardPublicData {
  firstName: string;
  adultsInHousehold: number;
  childrenCount: number;
  memberSinceYear: number;
}

/** The public, unauthenticated lookup behind /discount-card/:token -- deliberately returns only
 * what a local business needs to honour the discount (a first name to greet them by, the two
 * counts, and a join year), never a full name, email, phone, or anything about the children
 * themselves. */
export async function getFamilyCardPublicData(token: string): Promise<FamilyCardPublicData | null> {
  const rows = (await sql`
    SELECT id, name, adults_in_household, created_at::text FROM customers WHERE discount_card_token = ${token}
  `) as unknown as { id: number; name: string | null; adults_in_household: number; created_at: string }[];
  const customer = rows[0];
  if (!customer) return null;

  const childrenRows = (await sql`
    SELECT COUNT(*)::int AS count
    FROM guardian_children gc
    JOIN children c ON c.id = gc.child_id
    WHERE gc.customer_id = ${customer.id} AND gc.status = 'approved' AND c.is_active = true
  `) as unknown as { count: number }[];

  return {
    firstName: (customer.name || 'Family').trim().split(/\s+/)[0],
    adultsInHousehold: customer.adults_in_household,
    childrenCount: childrenRows[0]?.count ?? 0,
    memberSinceYear: new Date(customer.created_at).getFullYear(),
  };
}

export async function getAdultsInHousehold(customerId: number): Promise<number> {
  const rows = (await sql`SELECT adults_in_household FROM customers WHERE id = ${customerId}`) as unknown as { adults_in_household: number }[];
  return rows[0]?.adults_in_household ?? 2;
}

export async function updateAdultsInHousehold(customerId: number, count: number): Promise<void> {
  await sql`UPDATE customers SET adults_in_household = ${count} WHERE id = ${customerId}`;
}

export async function getChildrenCountForCustomer(customerId: number): Promise<number> {
  const rows = (await sql`
    SELECT COUNT(*)::int AS count
    FROM guardian_children gc
    JOIN children c ON c.id = gc.child_id
    WHERE gc.customer_id = ${customerId} AND gc.status = 'approved' AND c.is_active = true
  `) as unknown as { count: number }[];
  return rows[0]?.count ?? 0;
}

export interface PartnerDiscount {
  id: number;
  business_name: string;
  category: 'restaurant' | 'activity' | 'other';
  discount_description: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export async function getActivePartnerDiscounts(): Promise<PartnerDiscount[]> {
  return (await sql`
    SELECT id, business_name, category, discount_description, address, phone, website, is_active, sort_order, created_at::text
    FROM local_partner_discounts WHERE is_active = true
    ORDER BY sort_order, business_name
  `) as unknown as PartnerDiscount[];
}

export async function getAllPartnerDiscounts(): Promise<PartnerDiscount[]> {
  return (await sql`
    SELECT id, business_name, category, discount_description, address, phone, website, is_active, sort_order, created_at::text
    FROM local_partner_discounts
    ORDER BY sort_order, business_name
  `) as unknown as PartnerDiscount[];
}

export async function createPartnerDiscount(input: UpsertPartnerDiscountInput, createdByAdminId: number): Promise<number> {
  const rows = (await sql`
    INSERT INTO local_partner_discounts (business_name, category, discount_description, address, phone, website, is_active, created_by)
    VALUES (${input.businessName}, ${input.category}, ${input.discountDescription}, ${input.address || null}, ${input.phone || null}, ${input.website || null}, ${input.isActive}, ${createdByAdminId})
    RETURNING id
  `) as unknown as { id: number }[];
  return rows[0].id;
}

export async function updatePartnerDiscount(id: number, input: UpsertPartnerDiscountInput): Promise<void> {
  await sql`
    UPDATE local_partner_discounts
    SET business_name = ${input.businessName}, category = ${input.category}, discount_description = ${input.discountDescription},
        address = ${input.address || null}, phone = ${input.phone || null}, website = ${input.website || null}, is_active = ${input.isActive},
        updated_at = now()
    WHERE id = ${id}
  `;
}

export async function deletePartnerDiscount(id: number): Promise<void> {
  await sql`DELETE FROM local_partner_discounts WHERE id = ${id}`;
}
