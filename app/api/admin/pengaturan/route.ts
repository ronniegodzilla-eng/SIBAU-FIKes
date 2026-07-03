import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminToken, wajibkanFullAdmin, ambilIpDariRequest, AdminAuthError } from '@/lib/verify-admin';
import { tulisAuditLog } from '@/lib/audit';

function validasiPengaturan(body: any): string | null {
  if (typeof body.namaUniversitas !== 'string' || !body.namaUniversitas.trim()) {
    return 'Nama universitas wajib diisi.';
  }
  if (typeof body.namaFakultas !== 'string' || !body.namaFakultas.trim()) {
    return 'Nama fakultas wajib diisi.';
  }
  if (typeof body.pejabat?.nama !== 'string' || !body.pejabat.nama.trim()) {
    return 'Nama pejabat penandatangan wajib diisi.';
  }
  if (typeof body.pejabat?.nip !== 'string' || !body.pejabat.nip.trim()) {
    return 'NIP pejabat penandatangan wajib diisi.';
  }
  if (typeof body.pejabat?.jabatan !== 'string' || !body.pejabat.jabatan.trim()) {
    return 'Jabatan pejabat penandatangan wajib diisi.';
  }
  if (typeof body.formatNomorBA !== 'string' || !body.formatNomorBA.includes('{nomor}')) {
    return 'Format nomor BA wajib mengandung placeholder {nomor}.';
  }
  return null;
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req);
    wajibkanFullAdmin(admin);
    const body = await req.json();

    const errorValidasi = validasiPengaturan(body);
    if (errorValidasi) {
      return NextResponse.json({ error: errorValidasi }, { status: 400 });
    }

    await adminDb
      .collection('settings')
      .doc('app')
      .set(
        {
          namaUniversitas: body.namaUniversitas.trim(),
          namaFakultas: body.namaFakultas.trim(),
          alamat: body.alamat?.trim() || '',
          logoUrl: body.logoUrl?.trim() || '',
          pejabat: {
            nama: body.pejabat.nama.trim(),
            nip: body.pejabat.nip.trim(),
            jabatan: body.pejabat.jabatan.trim(),
          },
          formatNomorBA: body.formatNomorBA.trim(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    await tulisAuditLog({
      aksi: 'update_pengaturan',
      aktor: admin.email,
      targetId: 'app',
      detail: {},
      ip: ambilIpDariRequest(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan.' }, { status: 500 });
  }
}
