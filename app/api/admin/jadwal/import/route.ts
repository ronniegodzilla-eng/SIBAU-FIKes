import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminToken, ambilIpDariRequest, AdminAuthError } from '@/lib/verify-admin';
import { tulisAuditLog } from '@/lib/audit';
import { buatTimestampTengahHariWIB } from '@/lib/tanggal';
import { validasiBarisJadwal, kunciUnikJadwal } from '@/lib/validasi-jadwal';
import type { BarisImportJadwal } from '@/lib/types';

const MAKS_BARIS = 500;

interface HasilBaris {
  baris: number;
  ok: boolean;
  pesan?: string;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req);
    const body = await req.json();
    const periodeId: string = body.periodeId;
    const daftar: BarisImportJadwal[] = body.baris;

    if (!periodeId || typeof periodeId !== 'string') {
      return NextResponse.json({ error: 'Periode wajib dipilih.' }, { status: 400 });
    }
    if (!Array.isArray(daftar) || daftar.length === 0) {
      return NextResponse.json({ error: 'Tidak ada baris untuk diimpor.' }, { status: 400 });
    }
    if (daftar.length > MAKS_BARIS) {
      return NextResponse.json(
        { error: `Maksimal ${MAKS_BARIS} baris per import.` },
        { status: 400 }
      );
    }

    const periodeSnap = await adminDb.collection('periode').doc(periodeId).get();
    if (!periodeSnap.exists) {
      return NextResponse.json({ error: 'Periode tidak ditemukan.' }, { status: 404 });
    }

    // Kunci existing di Firestore untuk periode ini, agar deteksi duplikasi.
    const existingSnap = await adminDb
      .collection('jadwal_ujian')
      .where('periodeId', '==', periodeId)
      .get();
    const kunciExisting = new Set(
      existingSnap.docs.map((d) => {
        const data = d.data();
        return kunciUnikJadwal({
          periodeId,
          tanggalStr: data.tanggalStr,
          jamMulai: data.jamMulai,
          kodeMK: data.kodeMK,
          prodi: data.prodi,
          kelas: data.kelas,
        });
      })
    );

    const hasil: HasilBaris[] = [];
    const kunciDalamBatch = new Set<string>();
    const validUntukDitulis: { baris: number; data: BarisImportJadwal; kunci: string }[] = [];

    daftar.forEach((baris, idx) => {
      const nomorBaris = idx + 2; // baris 1 = header di Excel
      const errorValidasi = validasiBarisJadwal(baris);
      if (errorValidasi) {
        hasil.push({ baris: nomorBaris, ok: false, pesan: errorValidasi });
        return;
      }
      const kunci = kunciUnikJadwal({ periodeId, ...baris });
      if (kunciExisting.has(kunci)) {
        hasil.push({
          baris: nomorBaris,
          ok: false,
          pesan: 'Duplikat: jadwal dengan tanggal/jam/MK/prodi/kelas yang sama sudah ada di database.',
        });
        return;
      }
      if (kunciDalamBatch.has(kunci)) {
        hasil.push({
          baris: nomorBaris,
          ok: false,
          pesan: 'Duplikat di dalam file yang diimpor.',
        });
        return;
      }
      kunciDalamBatch.add(kunci);
      validUntukDitulis.push({ baris: nomorBaris, data: baris, kunci });
      hasil.push({ baris: nomorBaris, ok: true });
    });

    if (validUntukDitulis.length === 0) {
      return NextResponse.json({ hasil, jumlahBerhasil: 0 }, { status: 200 });
    }

    const batch = adminDb.batch();
    validUntukDitulis.forEach(({ data }) => {
      const ref = adminDb.collection('jadwal_ujian').doc();
      batch.set(ref, {
        periodeId,
        tanggal: buatTimestampTengahHariWIB(data.tanggalStr),
        tanggalStr: data.tanggalStr,
        jamMulai: data.jamMulai,
        jamSelesai: data.jamSelesai,
        kodeMK: data.kodeMK.trim(),
        namaMK: data.namaMK.trim(),
        prodi: data.prodi.trim(),
        kelas: data.kelas.trim(),
        dosenPengajar: data.dosenPengajar.trim(),
        ruangan: data.ruangan?.trim() || null,
        status: 'belum_diisi',
        beritaAcaraId: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    await tulisAuditLog({
      aksi: 'import_jadwal',
      aktor: admin.email,
      targetId: periodeId,
      detail: { jumlahBerhasil: validUntukDitulis.length, jumlahGagal: hasil.length - validUntukDitulis.length },
      ip: ambilIpDariRequest(req),
    });

    return NextResponse.json({ hasil, jumlahBerhasil: validUntukDitulis.length });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Gagal mengimpor jadwal.' }, { status: 500 });
  }
}
