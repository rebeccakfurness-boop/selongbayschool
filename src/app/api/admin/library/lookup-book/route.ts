import { NextRequest, NextResponse } from 'next/server';
import { getCurrentStaff } from '@/lib/current-staff';

interface LookupResult {
  title: string | null;
  author: string | null;
  description: string | null;
  category: string | null;
  photoUrl: string | null;
  isbn: string | null;
}

function normalizeIsbn(value: string): string {
  return value.replace(/[-\s]/g, '');
}

function isIsbn(value: string): boolean {
  const digits = normalizeIsbn(value);
  return /^\d{9}[\dXx]$/.test(digits) || /^\d{13}$/.test(digits);
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, '').trim();
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  return (await res.json()) as T;
}

/** Open Library's "work" record carries the description almost every edition/search result
 * lacks directly — a free extra hop, but no API key or quota to worry about (unlike Google
 * Books below), so it's worth always trying. Silently returns null on any failure since a
 * missing description is a fine degradation, not worth failing the whole lookup over. */
async function openLibraryDescription(workKey: string): Promise<string | null> {
  try {
    const work = await fetchJson<{ description?: string | { value?: string } }>(`https://openlibrary.org${workKey}.json`);
    const desc = work?.description;
    if (!desc) return null;
    return stripHtml(typeof desc === 'string' ? desc : desc.value || '') || null;
  } catch {
    return null;
  }
}

/** Primary source: no API key, no daily quota, and it's what Libib itself is documented to use
 * for its own ISBN/title lookup. Title/author/cover come back in one call; description needs a
 * second (ISBN) or is available straight off the search result's work key (title search). */
async function lookupOpenLibrary(query: string, byIsbn: boolean): Promise<LookupResult | null> {
  if (byIsbn) {
    const isbn = normalizeIsbn(query);
    const data = await fetchJson<
      Record<string, { title?: string; authors?: { name: string }[]; cover?: { large?: string; medium?: string }; identifiers?: { openlibrary?: string[] } }>
    >(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
    const info = data?.[`ISBN:${isbn}`];
    if (!info) return null;

    let description: string | null = null;
    try {
      const edition = await fetchJson<{ works?: { key: string }[] }>(`https://openlibrary.org/isbn/${isbn}.json`);
      const workKey = edition?.works?.[0]?.key;
      if (workKey) description = await openLibraryDescription(workKey);
    } catch {
      // No description found this way — left null, filled in by Google Books below if possible.
    }

    return {
      title: info.title || null,
      author: info.authors?.map((a) => a.name).join(', ') || null,
      description,
      category: null,
      photoUrl: info.cover?.large || info.cover?.medium || null,
      isbn,
    };
  }

  const search = await fetchJson<{ docs?: { title?: string; author_name?: string[]; cover_i?: number; isbn?: string[]; key?: string }[] }>(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`
  );
  const doc = search?.docs?.[0];
  if (!doc) return null;

  return {
    title: doc.title || null,
    author: doc.author_name?.join(', ') || null,
    description: doc.key ? await openLibraryDescription(doc.key) : null,
    category: null,
    photoUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
    isbn: doc.isbn?.[0] || null,
  };
}

interface GoogleBooksVolume {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    description?: string;
    categories?: string[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    industryIdentifiers?: { type: string; identifier: string }[];
  };
}

/** Secondary source, used only to fill in whatever Open Library couldn't (usually just the
 * description) — Google Books' *unauthenticated* quota is commonly exhausted globally (a known
 * current limitation, confirmed while building this), so treat any failure here as routine, not
 * an error worth surfacing. Set GOOGLE_BOOKS_API_KEY to make this reliable instead of best-effort. */
async function lookupGoogleBooks(query: string, byIsbn: boolean): Promise<LookupResult | null> {
  const searchTerm = byIsbn ? `isbn:${normalizeIsbn(query)}` : `intitle:${query}`;
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  // Without a country, Google's Books API sometimes can't geolocate a server-to-server request
  // and returns a 403 ("Cannot determine user location for geographically restricted operation")
  // instead of results -- passing the school's own country sidesteps that entirely rather than
  // relying on IP geolocation that a serverless function's outbound IP won't reliably supply.
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTerm)}&maxResults=1&country=ID${apiKey ? `&key=${apiKey}` : ''}`;

  const data = await fetchJson<{ items?: GoogleBooksVolume[] }>(url);
  const info = data?.items?.[0]?.volumeInfo;
  if (!info) return null;

  const isbn13 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_13')?.identifier;
  const isbn10 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_10')?.identifier;
  const cover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;

  return {
    title: info.title || null,
    author: info.authors?.join(', ') || null,
    description: info.description ? stripHtml(info.description) : null,
    category: info.categories?.[0] || null,
    photoUrl: cover ? cover.replace(/^http:/, 'https:') : null,
    isbn: isbn13 || isbn10 || null,
  };
}

export interface CoverCandidate {
  title: string | null;
  author: string | null;
  isbn: string | null;
  photoUrl: string | null;
}

/** Several editions of the same title often have quite different cover art (or the single "best
 * match" the plain lookup above picks isn't the edition on the shelf) -- this returns a gallery
 * of candidates by title instead of committing to one, so an admin can pick the actual cover by
 * eye rather than accept whatever the first match happened to be. Open Library's search endpoint
 * already returns several docs per query with a cover_i each, so one call is enough -- no need to
 * also hit Google Books here. */
async function searchBookCovers(query: string): Promise<CoverCandidate[]> {
  const search = await fetchJson<{ docs?: { title?: string; author_name?: string[]; cover_i?: number; isbn?: string[] }[] }>(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12&fields=title,author_name,cover_i,isbn`
  );
  const candidates: CoverCandidate[] = [];
  for (const doc of search?.docs ?? []) {
    if (!doc.cover_i) continue;
    candidates.push({
      title: doc.title || null,
      author: doc.author_name?.join(', ') || null,
      isbn: doc.isbn?.[0] || null,
      photoUrl: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
    });
    if (candidates.length >= 8) break;
  }
  return candidates;
}

/** Looks up a book by ISBN or title so an admin adding it to the catalogue doesn't have to type
 * out the title, author, description and find a cover image by hand — see the "Look up by ISBN
 * or title" field in AddLibraryItemForm.tsx. Open Library is tried first (free, unlimited);
 * Google Books fills in anything still missing (typically the description), best-effort. Any
 * logged-in staff, same access level as the rest of the catalogue.
 *
 * `?covers=true` switches to gallery mode (searchBookCovers above): several candidate covers for
 * a title search instead of one merged best guess, for the "Search for a cover" picker. */
export async function GET(req: NextRequest) {
  await getCurrentStaff();

  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q) {
    return NextResponse.json({ error: 'Enter an ISBN or title to look up.' }, { status: 400 });
  }

  if (req.nextUrl.searchParams.get('covers') === 'true') {
    try {
      const candidates = await searchBookCovers(q);
      return NextResponse.json({ candidates });
    } catch (err) {
      console.error('[api/admin/library/lookup-book] cover search failed', err);
      return NextResponse.json({ error: 'Could not search for covers right now.' }, { status: 502 });
    }
  }

  const byIsbn = isIsbn(q);

  let result: LookupResult | null = null;
  try {
    result = await lookupOpenLibrary(q, byIsbn);
  } catch (err) {
    console.error('[api/admin/library/lookup-book] Open Library lookup failed', err);
  }

  try {
    const google = await lookupGoogleBooks(q, byIsbn);
    if (google) {
      result = result
        ? {
            title: result.title || google.title,
            author: result.author || google.author,
            description: result.description || google.description,
            category: result.category || google.category,
            photoUrl: result.photoUrl || google.photoUrl,
            isbn: result.isbn || google.isbn,
          }
        : google;
    }
  } catch (err) {
    console.error('[api/admin/library/lookup-book] Google Books lookup failed (non-fatal)', err);
  }

  if (!result) {
    return NextResponse.json({ error: 'No book found for that ISBN or title.' }, { status: 404 });
  }

  return NextResponse.json(result);
}
