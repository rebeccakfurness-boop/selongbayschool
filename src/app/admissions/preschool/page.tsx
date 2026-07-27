import type { Metadata } from 'next';
import AdmissionsGroupPage from '@/components/AdmissionsGroupPage';
import { admissionsGroups } from '@/lib/site-content';

const group = admissionsGroups.find((g) => g.slug === 'preschool')!;

export const metadata: Metadata = {
  title: 'Preschool Admissions',
  description: 'Preschool at Selong Bay School: overview, pricing, curriculum, teachers, and how to enquire for children aged 2-5.',
  openGraph: { title: 'Preschool Admissions - Selong Bay School' },
};

export default function PreschoolAdmissionsPage() {
  return <AdmissionsGroupPage group={group} />;
}
