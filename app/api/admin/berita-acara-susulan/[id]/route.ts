import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminToken, ambilIpDariRequest, AdminAuthError } from '@/lib/verify-admin';
import { tulisAuditLog } from '@/lib/audit';
import { isiTteSusulan, lengkapiTte, pejabatDari } from '@/lib/tte';

/** Waktu BA pertama dikirim — updatedAt tidak dipakai karena ikut berubah saat buka kunci. */
function waktuKirimAwal(ba: FirebaseFirestore.DocumentData): Date {
  return ba.createdAt?.toDate ? ba.createdAt.toDate() : new Date();
}

/** PATCH: aksi "unlock" (buka kunci agar bisa dikoreksi manual) atau "lock" (kunci kembali). */
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

    if (body.aksi === 'lock') {
      // Kunci kembali tanpa menunggu pengawas mengirim ulang. TTE yang belum
      // ada dilengkapi (waktu = saat BA pertama dikirim); TTE yang tidak lagi
      // cocok dengan isi TIDAK diterbitkan ulang — itu wewenang pengawas.
      const hasil = await adminDb.runTransaction(async (trx) => {
        const s = await trx.get(ref);
        const ba = s.data()!;
        const settingsSnap = await trx.get(adminDb.collection('settings').doc('app'));
        const isi = isiTteSusulan(params.id, ba);
        const tte = isi
          ? lengkapiTte(isi, ba, pejabatDari(settingsSnap.data()), waktuKirimAwal(ba))
          : ({ status: 'rusak' } as const);
        trx.update(ref, {
          locked: true,
          ...(tte.status === 'dilengkapi' ? tte.data : {}),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return tte.status;
      });
      await tulisAuditLog({
        aksi: 'lock_ba_susulan',
        aktor: admin.email,
        targetId: params.id,
        detail: { tte: hasil },
        ip: ambilIpDariRequest(req),
      });
      return NextResponse.json({ ok: true, tte: hasil });
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
