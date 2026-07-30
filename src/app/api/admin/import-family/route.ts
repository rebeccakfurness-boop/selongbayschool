import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { parseFamilyWorkbook, runFamilyImport } from '@/lib/family-import';

export async function POST(req: NextRequest) {
  await requireAdmin();

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
  }
  const mode = formData.get('mode') === 'import' ? 'import' : 'preview';
  const clearEnquiries = formData.get('clearEnquiries') === 'true';

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const data = parseFamilyWorkbook(wb);

    if (mode === 'preview') {
      const enquiriesBySource: Record<string, number> = {};
      for (const e of data.enquiries) {
        enquiriesBySource[e.source] = (enquiriesBySource[e.source] || 0) + 1;
      }
      return NextResponse.json({
        mode: 'preview',
        childrenParsed: data.children.length,
        enquiriesParsed: data.enquiries.length,
        forecastParsed: data.forecast.length,
        enquiriesBySource,
        sampleChild: data.children[0] ?? null,
      });
    }

    await ensureSchema();
    const summary = await runFamilyImport(data, { clearExistingEnquiries: clearEnquiries });
    return NextResponse.json({ mode: 'import', ...summary });
  } catch (err) {
    console.error('[api/admin/import-family] failed', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not process that file. Is it a valid .xlsx export of the enrollment spreadsheet?' },
      { status: 400 }
    );
  }
}
