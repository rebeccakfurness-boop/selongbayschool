import { randomBytes } from 'crypto';
import { sql } from '@/lib/db';

export type OffboardingLetterStatus = 'sent' | 'completed';

export interface OffboardingLetterSummaryRow {
  id: number;
  status: OffboardingLetterStatus;
  sent_at: string;
  completed_at: string | null;
  experience_rating: number | null;
  recommend_score: number | null;
  marketing_consent: boolean | null;
  feedback_text: string | null;
  completed_by_name: string | null;
}

export async function getOffboardingLettersForChild(childId: number): Promise<OffboardingLetterSummaryRow[]> {
  return (await sql`
    SELECT id, status, sent_at::text, completed_at::text, experience_rating, recommend_score,
      marketing_consent, feedback_text, completed_by_name
    FROM offboarding_letters WHERE child_id = ${childId}
    ORDER BY sent_at DESC
  `) as unknown as OffboardingLetterSummaryRow[];
}

export interface OffboardingLetterData {
  id: number;
  child_id: number;
  status: OffboardingLetterStatus;
  survey_token: string;
  sent_at: string;
  completed_at: string | null;
  child_full_name: string;
  parent1_name: string | null;
  parent2_name: string | null;
  primary_contact_email: string | null;
}

export async function getOffboardingLetterByToken(token: string): Promise<OffboardingLetterData | null> {
  const rows = (await sql`
    SELECT ol.id, ol.child_id, ol.status, ol.survey_token, ol.sent_at::text, ol.completed_at::text,
      c.child_full_name, c.parent1_name, c.parent2_name, c.primary_contact_email
    FROM offboarding_letters ol JOIN children c ON c.id = ol.child_id
    WHERE ol.survey_token = ${token}
  `) as unknown as OffboardingLetterData[];
  return rows[0] || null;
}

export function generateSurveyToken(): string {
  return randomBytes(32).toString('hex');
}
