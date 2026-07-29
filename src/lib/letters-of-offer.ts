import { randomBytes } from 'crypto';
import { sql } from '@/lib/db';

export type LetterOfOfferStatus = 'draft' | 'sent' | 'accepted';

export interface LetterOfOfferSummaryRow {
  id: number;
  status: LetterOfOfferStatus;
  start_date: string;
  created_at: string;
  sent_at: string | null;
  accepted_at: string | null;
  accepted_by_name: string | null;
}

export async function getLettersOfOfferForChild(childId: number): Promise<LetterOfOfferSummaryRow[]> {
  return (await sql`
    SELECT id, status, start_date::text, created_at::text, sent_at::text, accepted_at::text, accepted_by_name
    FROM letters_of_offer WHERE child_id = ${childId}
    ORDER BY created_at DESC
  `) as unknown as LetterOfOfferSummaryRow[];
}

export interface LetterOfOfferData {
  id: number;
  child_id: number;
  status: LetterOfOfferStatus;
  start_date: string;
  programme: string | null;
  class_name: string | null;
  tuition_plan: string | null;
  fees_note: string | null;
  additional_terms: string | null;
  accept_token: string;
  accepted_at: string | null;
  accepted_by_name: string | null;
  created_at: string;
  child_full_name: string;
  parent1_name: string | null;
  parent2_name: string | null;
  primary_contact_email: string | null;
}

export async function getLetterOfOfferById(id: number): Promise<LetterOfOfferData | null> {
  const rows = (await sql`
    SELECT lo.id, lo.child_id, lo.status, lo.start_date::text, lo.programme, lo.class_name, lo.tuition_plan,
      lo.fees_note, lo.additional_terms, lo.accept_token, lo.accepted_at::text, lo.accepted_by_name, lo.created_at::text,
      c.child_full_name, c.parent1_name, c.parent2_name, c.primary_contact_email
    FROM letters_of_offer lo JOIN children c ON c.id = lo.child_id
    WHERE lo.id = ${id}
  `) as unknown as LetterOfOfferData[];
  return rows[0] || null;
}

export async function getLetterOfOfferByToken(token: string): Promise<LetterOfOfferData | null> {
  const rows = (await sql`
    SELECT lo.id, lo.child_id, lo.status, lo.start_date::text, lo.programme, lo.class_name, lo.tuition_plan,
      lo.fees_note, lo.additional_terms, lo.accept_token, lo.accepted_at::text, lo.accepted_by_name, lo.created_at::text,
      c.child_full_name, c.parent1_name, c.parent2_name, c.primary_contact_email
    FROM letters_of_offer lo JOIN children c ON c.id = lo.child_id
    WHERE lo.accept_token = ${token}
  `) as unknown as LetterOfOfferData[];
  return rows[0] || null;
}

export function generateAcceptToken(): string {
  return randomBytes(32).toString('hex');
}
