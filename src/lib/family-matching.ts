import { sql } from './db';
import { createChild } from './child-lifecycle';

export interface FamilyContactInput {
  parentName: string;
  parentEmail: string;
  parentPhone?: string | null;
  childName?: string | null;
}

/** Finds the existing Family Board card (a `children` row) for this contact, or creates a new
 * status='enquiry' one — the same "log + link" idea already used by the admissions pipeline's
 * "Convert to Family" flow (see convertAdmissionsEnquiry in child-lifecycle.ts), extended here to
 * the public enquiry forms and the Student Enrolment Form. Matches strictly on
 * children.primary_contact_email/primary_contact_phone, not the free-text parent1_name/parent2_name
 * fields, so a near-miss on name spelling never silently merges two different families onto one
 * card. */
export async function findOrCreateFamilyForContact(input: FamilyContactInput): Promise<number> {
  const email = input.parentEmail?.trim().toLowerCase() || null;
  const phone = input.parentPhone?.trim() || null;

  if (email || phone) {
    const rows = (await sql`
      SELECT id FROM children
      WHERE (${email}::text IS NOT NULL AND lower(primary_contact_email) = ${email})
         OR (${phone}::text IS NOT NULL AND primary_contact_phone = ${phone})
      ORDER BY id LIMIT 1
    `) as unknown as { id: number }[];
    if (rows[0]) return rows[0].id;
  }

  return createChild({
    childFullName: input.childName?.trim() || input.parentName,
    parent1Name: input.parentName,
    primaryContactEmail: email,
    primaryContactPhone: phone,
    status: 'enquiry',
    isActive: true,
  });
}

/** Appends to the card's timeline rather than overwriting anything — a family that both enquired
 * and later submitted the enrolment form ends up with both entries visible, in order. */
export async function logFamilyActivity(
  childId: number,
  tag: 'current_enrolment_enquiry' | 'new_student_enrolment_form',
  sourceTable: 'enquiries' | 'enrolment_submissions',
  sourceId: number,
  summary?: string | null
): Promise<void> {
  await sql`
    INSERT INTO family_activity_log (child_id, tag, source_table, source_id, summary)
    VALUES (${childId}, ${tag}, ${sourceTable}, ${sourceId}, ${summary ?? null})
  `;
}
