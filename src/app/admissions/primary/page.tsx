import { redirect } from 'next/navigation';

export default function PrimaryAdmissionsRedirect() {
  redirect('/admissions#primary');
}
