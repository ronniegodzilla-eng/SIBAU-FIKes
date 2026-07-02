import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminToken, ambilIpDariRequest, AdminAuthError } from '@/lib/verify-admin';
import { tulisAuditLog } from '@/lib/audit';
import { buatTimestampTengahHariWIB } from '@/lib/tanggal';
import { validasiBarisJadwal } from '@/lib/validasi-jadwal';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminToken(req);
    const body = await req.json();
    const ref = adminDb.collection('jadwal_ujian').doc(params.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Jadwal tidak ditemukan.' }, { status: 404 });
    }

    const data = snap.data()!;
    if (data.status === 'terisi') {
      return NextResponse.json(
        {
          error:
            'Jadwal ini sudah memiliki berita acara. Buka kunci/hapus berita acara terlebih dahulu sebelum mengubah jadwal.',
        },
        { status: 400 }
      );
    }

    const gabungan = { ...data, ...body };
    const errorValidasi = validasiBarisJadwal(gabungan);
    if (errorValidasi) {
      return NextResponse.json({ error: errorValidasi }, { status: 400 });
    }

    await ref.update({
      tanggal: buatTimestampTengahHariWIB(gabungan.tanggalStr),
      tanggalStr: gabungan.tanggalStr,
      jamMulai: gabungan.jamMulai,
      jamSelesai: gabungan.jamSelesai,
      kodeMK: String(gabungan.kodeMK).trim(),
      namaMK: String(gabungan.namaMK).trim(),
      prodi: String(gabungan.prodi).trim(),
      kelas: String(gabungan.kelas).trim(),
      dosenPengajar: String(gabungan.dosenPengajar).trim(),
      ruangan: gabungan.ruangan?.trim?.() || null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await tulisAuditLog({
      aksi: 'crud_jadwal',
      aktor: admin.email,
      targetId: params.id,
      detail: { aksi: 'ubah' },
      ip: ambilIpDariRequest(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Gagal memperbarui jadwal.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminToken(req);
    const ref = adminDb.collection('jadwal_ujian').doc(params.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Jadwal tidak ditemukan.' }, { status: 404 });
    }
    const data = snap.data()!;
    if (data.status === 'terisi') {
      return NextResponse.json(
        {
          error:
            'Jadwal ini sudah memiliki berita acara dan tidak bisa dihapus langsung. Hapus berita acaranya terlebih dahulu di menu Rekap.',
        },
        { status: 400 }
      );
    }

    await ref.delete();
    await tulisAuditLog({
      aksi: 'crud_jadwal',
      aktor: admin.email,
      targetId: params.id,
      detail: { aksi: 'hapus' },
      ip: ambilIpDariRequest(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Gagal menghapus jadwal.' }, { status: 500 });
  }
}
