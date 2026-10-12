import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminToken, ambilIpDariRequest, AdminAuthError } from '@/lib/verify-admin';
import { tulisAuditLog } from '@/lib/audit';
import { bersihkanAlias } from '@/lib/pengawas';

// Penggabungan nama pengawas hanya memengaruhi rekap — dokumen BA tidak
// disentuh — jadi co-admin (yang memegang menu Rekap) juga boleh menyimpan.
export async function PUT(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req);
    const data = bersihkanAlias(await req.json());

    await adminDb
      .collection('settings')
      .doc('pengawas')
      .set({ ...data, updatedAt: FieldValue.serverTimestamp(), updatedBy: admin.email });

    await tulisAuditLog({
      aksi: 'update_alias_pengawas',
      aktor: admin.email,
      targetId: 'pengawas',
      detail: {
        alias: Object.keys(data.alias).length,
        abaikan: data.abaikan.length,
        bukanSama: data.bukanSama.length,
      },
      ip: ambilIpDariRequest(req),
    });

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Gagal menyimpan data pengawas.' }, { status: 500 });
  }
}
