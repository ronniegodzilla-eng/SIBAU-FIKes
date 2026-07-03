import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminToken, wajibkanFullAdmin, ambilIpDariRequest, AdminAuthError } from '@/lib/verify-admin';
import { tulisAuditLog } from '@/lib/audit';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminToken(req);
    wajibkanFullAdmin(admin);
    const body = await req.json();
    const ref = adminDb.collection('periode').doc(params.id);

    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Periode tidak ditemukan.' }, { status: 404 });
    }

    const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (body.jenis === 'UTS' || body.jenis === 'UAS') update.jenis = body.jenis;
    if (body.semester === 'Ganjil' || body.semester === 'Genap')
      update.semester = body.semester;
    if (typeof body.tahunAkademik === 'string') update.tahunAkademik = body.tahunAkademik;
    if (body.tanggalMulai && !isNaN(Date.parse(body.tanggalMulai)))
      update.tanggalMulai = new Date(body.tanggalMulai);
    if (body.tanggalSelesai && !isNaN(Date.parse(body.tanggalSelesai)))
      update.tanggalSelesai = new Date(body.tanggalSelesai);

    const setAktif = body.aktif === true;

    await adminDb.runTransaction(async (trx) => {
      if (setAktif) {
        const lain = await trx.get(
          adminDb.collection('periode').where('aktif', '==', true)
        );
        lain.docs.forEach((d) => {
          if (d.id !== params.id) {
            trx.update(d.ref, { aktif: false, updatedAt: FieldValue.serverTimestamp() });
          }
        });
        update.aktif = true;
      } else if (body.aktif === false) {
        update.aktif = false;
      }
      trx.update(ref, update);
    });

    await tulisAuditLog({
      aksi: 'crud_periode',
      aktor: admin.email,
      targetId: params.id,
      detail: { aksi: 'ubah', ...update },
      ip: ambilIpDariRequest(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Gagal memperbarui periode.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminToken(req);
    wajibkanFullAdmin(admin);
    const ref = adminDb.collection('periode').doc(params.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Periode tidak ditemukan.' }, { status: 404 });
    }

    const jadwalTerkait = await adminDb
      .collection('jadwal_ujian')
      .where('periodeId', '==', params.id)
      .limit(1)
      .get();
    if (!jadwalTerkait.empty) {
      return NextResponse.json(
        {
          error:
            'Periode ini masih memiliki jadwal ujian. Arsipkan periode (nonaktifkan) daripada menghapusnya agar data tetap tersimpan untuk kebutuhan akreditasi.',
        },
        { status: 400 }
      );
    }

    await ref.delete();
    await tulisAuditLog({
      aksi: 'crud_periode',
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
    return NextResponse.json({ error: 'Gagal menghapus periode.' }, { status: 500 });
  }
}
