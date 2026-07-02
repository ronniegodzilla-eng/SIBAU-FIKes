import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminToken, ambilIpDariRequest, AdminAuthError } from '@/lib/verify-admin';
import { tulisAuditLog } from '@/lib/audit';
import { validasiFormBA } from '@/lib/validasi';

/**
 * PATCH: aksi "unlock" (buka kunci agar bisa diedit ulang) atau "edit"
 * (koreksi langsung field isian, tetap locked). §F-09.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminToken(req);
    const body = await req.json();
    const ref = adminDb.collection('berita_acara').doc(params.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Berita acara tidak ditemukan.' }, { status: 404 });
    }

    if (body.aksi === 'unlock') {
      await ref.update({ locked: false, updatedAt: FieldValue.serverTimestamp() });
      await tulisAuditLog({
        aksi: 'unlock_ba',
        aktor: admin.email,
        targetId: params.id,
        detail: {},
        ip: ambilIpDariRequest(req),
      });
      return NextResponse.json({ ok: true });
    }

    if (body.aksi === 'edit') {
      const data = { ...snap.data(), ...body.data };
      const errorValidasi = validasiFormBA(data, { wajibkanFoto: false });
      if (errorValidasi) {
        return NextResponse.json({ error: errorValidasi }, { status: 400 });
      }
      const pesertaTerdaftar = Number(data.pesertaTerdaftar);
      const pesertaHadir = Number(data.pesertaHadir);

      await ref.update({
        pengawas1: data.pengawas1.trim(),
        pengawas2: data.pengawas2?.trim?.() || null,
        pesertaTerdaftar,
        pesertaHadir,
        pesertaTidakHadir: pesertaTerdaftar - pesertaHadir,
        daftarTidakHadir: data.daftarTidakHadir?.trim?.() || null,
        jamMulaiAktual: data.jamMulaiAktual,
        jamSelesaiAktual: data.jamSelesaiAktual,
        jumlahBerkas:
          data.jumlahBerkas != null && data.jumlahBerkas !== '' ? Number(data.jumlahBerkas) : null,
        kejadianKhusus: data.kejadianKhusus.trim(),
        namaPengisi: data.namaPengisi.trim(),
        locked: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
      await tulisAuditLog({
        aksi: 'edit_ba',
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
    return NextResponse.json({ error: 'Gagal memproses berita acara.' }, { status: 500 });
  }
}

/** DELETE: hapus BA, kembalikan status jadwal ke belum_diisi. §F-09. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminToken(req);
    const ref = adminDb.collection('berita_acara').doc(params.id);
    const ip = ambilIpDariRequest(req);

    await adminDb.runTransaction(async (trx) => {
      const snap = await trx.get(ref);
      if (!snap.exists) {
        throw new Error('NOT_FOUND');
      }
      const ba = snap.data()!;
      const jadwalRef = adminDb.collection('jadwal_ujian').doc(ba.jadwalId);

      trx.delete(ref);
      trx.update(jadwalRef, {
        status: 'belum_diisi',
        beritaAcaraId: null,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const auditRef = adminDb.collection('audit_log').doc();
      trx.set(auditRef, {
        aksi: 'hapus_ba',
        aktor: admin.email,
        targetId: params.id,
        detail: { jadwalId: ba.jadwalId, nomorBA: ba.nomorBA },
        ip,
        timestamp: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Berita acara tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Gagal menghapus berita acara.' }, { status: 500 });
  }
}
