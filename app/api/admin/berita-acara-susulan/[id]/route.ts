import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminToken, ambilIpDariRequest, AdminAuthError } from '@/lib/verify-admin';
import { tulisAuditLog } from '@/lib/audit';

/** PATCH: aksi "unlock" (buka kunci agar bisa dikoreksi manual). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminToken(req);
    const body = await req.json();
    const ref = adminDb.collection('berita_acara_susulan').doc(params.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Berita acara susulan tidak ditemukan.' }, { status: 404 });
    }

    if (body.aksi === 'unlock') {
      await ref.update({ locked: false, updatedAt: FieldValue.serverTimestamp() });
      await tulisAuditLog({
        aksi: 'unlock_ba_susulan',
        aktor: admin.email,
        targetId: params.id,
        detail: {},
        ip: ambilIpDariRequest(req),
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenali.' }, { status: 400 });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Gagal memproses berita acara susulan.' }, { status: 500 });
  }
}

/** DELETE: hapus BA susulan (tidak ada jadwal_ujian yang perlu direset). */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminToken(req);
    const ref = adminDb.collection('berita_acara_susulan').doc(params.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Berita acara susulan tidak ditemukan.' }, { status: 404 });
    }
    const data = snap.data()!;
    await ref.delete();

    await tulisAuditLog({
      aksi: 'hapus_ba_susulan',
      aktor: admin.email,
      targetId: params.id,
      detail: { nomorBA: data.nomorBA },
      ip: ambilIpDariRequest(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Gagal menghapus berita acara susulan.' }, { status: 500 });
  }
}
