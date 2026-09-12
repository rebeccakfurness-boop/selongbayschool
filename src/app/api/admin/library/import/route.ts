import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { parseLibibWorkbook, runLibraryImport } from '@/lib/library-import';

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

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const items = parseLibibWorkbook(wb);

    if (mode === 'preview') {
      return NextResponse.json({ mode: 'preview', parsed: items.length, sample: items.slice(0, 5) });
    }

    await ensureSchema();
    const summary = await runLibraryImport(items);
    return NextResponse.json({ mode: 'import', ...summary });
  } catch (err) {
    console.error('[api/admin/library/import] failed', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not process that file. Is it a Libib CSV export?' },
      { status: 400 }
    );
  }
}
