import { NextRequest, NextResponse } from 'next/server';
import { FieldPath } from 'firebase-admin/firestore';
import { getCurrentUser } from '@/lib/auth-admin';
import { getAdminDb } from '@/lib/firebase/admin';

const PAGE_SIZE = 24;
const CACHE_TTL = 5 * 60_000;
type SearchEntry = { id: string; name: string; text: string; approved: boolean; genres: string[] };
let searchCache: { expires: number; entries: SearchEntry[] } | undefined;
let pendingIndex: Promise<SearchEntry[]> | undefined;

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

async function searchIndex(db: NonNullable<Awaited<ReturnType<typeof getAdminDb>>>) {
  if (searchCache && searchCache.expires > Date.now()) return searchCache.entries;
  if (!pendingIndex) {
    pendingIndex = db.collection('eventDjs')
      .select('name', 'alternateName', 'description', 'country', 'genres', 'instagramHandle', 'approved')
      .get()
      .then((snapshot: any) => {
        const entries: SearchEntry[] = snapshot.docs.map((doc: any) => {
          const data = doc.data();
          const genres = Array.isArray(data.genres) ? data.genres : [];
          return {
            id: doc.id, name: data.name || '', approved: Boolean(data.approved), genres,
            text: normalize([data.name, data.alternateName, data.description, data.country, data.instagramHandle, ...genres].filter(Boolean).join(' ')),
          };
        });
        entries.sort((a, b) => a.name.localeCompare(b.name, 'es') || a.id.localeCompare(b.id));
        searchCache = { entries, expires: Date.now() + CACHE_TTL };
        return entries;
      }).finally(() => { pendingIndex = undefined; });
  }
  return pendingIndex!;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 });
  if (!['admin', 'moderator'].includes(user.role)) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  try {
    const db = await getAdminDb();
    if (!db) throw new Error('Base de datos no disponible.');
    const params = request.nextUrl.searchParams;
    if (params.get('refresh') === 'true') {
      // Wait for an older read before invalidating it after an edit.
      await pendingIndex;
      searchCache = undefined;
    }
    const search = normalize((params.get('search') || '').slice(0, 200));
    const status = params.get('status') || 'all';
    const genre = params.get('genre') || 'all';
    if (search || status !== 'all' || genre !== 'all') {
      const entries = await searchIndex(db);
      const words = search.split(/\s+/).filter(Boolean);
      const matches = entries.filter(entry =>
        words.every(word => entry.text.includes(word)) &&
        (status === 'all' || entry.approved === (status === 'approved')) &&
        (genre === 'all' || entry.genres.includes(genre)),
      );
      const offset = Math.max(0, Number(params.get('cursor') || 0));
      if (!Number.isSafeInteger(offset)) return NextResponse.json({ error: 'Página no válida.' }, { status: 400 });
      const selected = matches.slice(offset, offset + PAGE_SIZE);
      const docs = selected.length ? await db.getAll(...selected.map(entry => db.collection('eventDjs').doc(entry.id))) : [];
      return NextResponse.json({
        data: docs.filter((doc: any) => doc.exists).map((doc: any) => ({ ...doc.data(), id: doc.id })),
        hasMore: offset + PAGE_SIZE < matches.length,
        cursor: String(offset + PAGE_SIZE),
        totalResults: matches.length,
        genres: [...new Set(entries.flatMap(entry => entry.genres))].sort(),
      });
    }
    let query = db.collection('eventDjs').orderBy('name').orderBy(FieldPath.documentId()).limit(PAGE_SIZE + 1);
    const cursor = params.get('cursor');
    if (cursor) {
      const value = JSON.parse(cursor);
      if (typeof value.name !== 'string' || typeof value.id !== 'string') throw new Error('Página no válida.');
      query = query.startAfter(value.name, value.id);
    }
    const snapshot = await query.get();
    const docs = snapshot.docs.slice(0, PAGE_SIZE);
    const last = docs.at(-1);
    return NextResponse.json({
      data: docs.map((doc: any) => ({ ...doc.data(), id: doc.id })),
      hasMore: snapshot.docs.length > PAGE_SIZE,
      cursor: last ? JSON.stringify({ name: last.data().name, id: last.id }) : undefined,
    });
  } catch (error) {
    console.error('[Admin DJs] Search failed:', error);
    return NextResponse.json({ error: 'No se pudieron cargar los DJs. Intenta nuevamente.' }, { status: 500 });
  }
}
