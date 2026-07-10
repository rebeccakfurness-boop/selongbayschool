import type { Metadata } from 'next';
import AdmissionsGroupPage from '@/components/AdmissionsGroupPage';
import { admissionsGroups } from '@/lib/site-content';

const group = admissionsGroups.find((g) => g.slug === 'primary')!;

export const metadata: Metadata = {
  title: 'Primary Admissions',
  description: 'Primary at Selong Bay School: overview, pricing, curriculum, teachers, and how to enquire for children aged 6-12.',
  openGraph: { title: 'Primary Admissions - Selong Bay School' },
};

export default function PrimaryAdmissionsPage() {
  return <AdmissionsGroupPage group={group} />;
}
