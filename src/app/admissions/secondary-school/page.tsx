import type { Metadata } from 'next';
import AdmissionsGroupPage from '@/components/AdmissionsGroupPage';
import { admissionsGroups } from '@/lib/site-content';

const group = admissionsGroups.find((g) => g.slug === 'secondary-school')!;

export const metadata: Metadata = {
  title: 'Secondary School Admissions',
  description: 'Secondary School at Selong Bay School: overview, pricing, curriculum, teachers, and how to enquire for students aged 13-18.',
  openGraph: { title: 'Secondary School Admissions - Selong Bay School' },
};

export default function SecondaryAdmissionsPage() {
  return <AdmissionsGroupPage group={group} />;
}
