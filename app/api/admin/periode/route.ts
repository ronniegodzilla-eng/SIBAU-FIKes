import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminToken, ambilIpDariRequest, AdminAuthError } from '@/lib/verify-admin';
import { tulisAuditLog } from '@/lib/audit';

function validasiPeriode(body: any): string | null {
  if (body.jenis !== 'UTS' && body.jenis !== 'UAS') {
    return 'Jenis periode harus UTS atau UAS.';
  }
  if (
    typeof body.tahunAkademik !== 'string' ||
    !/^\d{4}\/\d{4}$/.test(body.tahunAkademik)
  ) {
    return 'Tahun akademik harus berformat "2026/2027".';
  }
  if (body.semester !== 'Ganjil' && body.semester !== 'Genap') {
    return 'Semester harus Ganjil atau Genap.';
  }
  if (!body.tanggalMulai || isNaN(Date.parse(body.tanggalMulai))) {
    return 'Tanggal mulai tidak valid.';
  }
  if (!body.tanggalSelesai || isNaN(Date.parse(body.tanggalSelesai))) {
    return 'Tanggal selesai tidak valid.';
  }
  if (new Date(body.tanggalMulai) > new Date(body.tanggalSelesai)) {
    return 'Tanggal mulai tidak boleh setelah tanggal selesai.';
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    await verifyAdminToken(req);
    const snap = await adminDb
      .collection('periode')
      .orderBy('createdAt', 'desc')
      .get();
    const periode = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ periode });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: 'Gagal memuat daftar periode.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req);
    const body = await req.json();

    const errorValidasi = validasiPeriode(body);
    if (errorValidasi) {
      return NextResponse.json({ error: errorValidasi }, { status: 400 });
    }

    const aktif = Boolean(body.aktif);

    const docRef = adminDb.collection('periode').doc();
    await adminDb.runTransaction(async (trx) => {
      if (aktif) {
        const lain = await trx.get(
          adminDb.collection('periode').where('aktif', '==', true)
        );
        lain.docs.forEach((d) => {
          trx.update(d.ref, { aktif: false, updatedAt: FieldValue.serverTimestamp() });
        });
      }
      trx.set(docRef, {
        jenis: body.jenis,
        tahunAkademik: body.tahunAkademik,
        semester: body.semester,
        tanggalMulai: new Date(body.tanggalMulai),
        tanggalSelesai: new Date(body.tanggalSelesai),
        aktif,
        counterBA: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await tulisAuditLog({
      aksi: 'crud_periode',
      aktor: admin.email,
      targetId: docRef.id,
      detail: { aksi: 'buat', jenis: body.jenis, tahunAkademik: body.tahunAkademik },
      ip: ambilIpDariRequest(req),
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: 'Gagal membuat periode baru.' },
      { status: 500 }
    );
  }
}
