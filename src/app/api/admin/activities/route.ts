import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { createActivitySchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET() {
  try {
    await ensureSchema();
    const rows = await sql`
      SELECT id, slug, name, day, duration, price_idr, price_note,
             default_time, default_capacity, is_active, photo_url
      FROM activities ORDER BY id ASC
    `;
    return NextResponse.json({ activities: rows });
  } catch (err) {
    console.error('[api/admin/activities] failed to load activities', err);
    return NextResponse.json({ error: 'Could not load activities.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = createActivitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid activity data.' }, { status: 400 });
  }
  const input = parsed.data;

  try {
    await ensureSchema();
    const baseSlug = slugify(input.name) || 'activity';
    let slug = baseSlug;
    let suffix = 2;
    while ((await sql`SELECT 1 FROM activities WHERE slug = ${slug}`).length > 0) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const rows = await sql`
      INSERT INTO activities (
        slug, name, day, duration, price_idr, price_note, default_time, default_capacity, description, age_group, photo_url
      ) VALUES (
        ${slug}, ${input.name}, ${input.day || null}, ${input.duration || null},
        ${input.priceIDR ?? null}, ${input.priceNote || null}, ${input.defaultTime || null},
        ${input.defaultCapacity}, ${input.description}, ${input.ageGroup || null}, ${input.photoUrl || null}
      )
      RETURNING id, slug, name, day, duration, price_idr, price_note, default_time, default_capacity, is_active, photo_url
    `;
    return NextResponse.json({ activity: rows[0] });
  } catch (err) {
    console.error('[api/admin/activities] failed to create activity', err);
    return NextResponse.json({ error: 'Could not create activity.' }, { status: 500 });
  }
}
