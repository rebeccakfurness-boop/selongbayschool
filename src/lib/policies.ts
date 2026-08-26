import { sql } from '@/lib/db';

export interface SchoolPolicyRow {
  id: number;
  title: string;
  description: string | null;
  file_url: string;
  sort_order: number;
  created_at: string;
}

export async function getSchoolPolicies(): Promise<SchoolPolicyRow[]> {
  return (await sql`
    SELECT id, title, description, file_url, sort_order, created_at::text
    FROM school_policies
    ORDER BY sort_order, created_at
  `) as unknown as SchoolPolicyRow[];
}
