import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminToken, AdminAuthError } from '@/lib/verify-admin';

const MAKS_LIMIT = 20;

export async function GET(req: NextRequest) {
  try {
    await verifyAdminToken(req);
    const limitParam = Number(req.nextUrl.searchParams.get('limit') ?? '6');
    const limit = Math.min(Math.max(limitParam || 6, 1), MAKS_LIMIT);

    const snap = await adminDb
      .collection('audit_log')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const log = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ log });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Gagal memuat aktivitas terbaru.' }, { status: 500 });
  }
}
