import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminToken, AdminAuthError } from '@/lib/verify-admin';

export async function GET(req: NextRequest) {
  try {
    await verifyAdminToken(req);
    const periodeId = req.nextUrl.searchParams.get('periodeId');
    let query: FirebaseFirestore.Query = adminDb.collection('berita_acara_susulan');
    if (periodeId) query = query.where('periodeId', '==', periodeId);
    const snap = await query.orderBy('tanggalStr', 'asc').get();
    const susulan = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ susulan });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Gagal memuat daftar berita acara susulan.' }, { status: 500 });
  }
}
