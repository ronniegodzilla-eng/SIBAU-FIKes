import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { ambilIpDariRequest } from '@/lib/verify-admin';
import { tulisAuditLogDalamTransaksi } from '@/lib/audit';
import { validasiFormBA } from '@/lib/validasi';
import { formatNomorBA, FORMAT_NOMOR_BA_DEFAULT } from '@/lib/nomor-ba';
import { hariIniStrWIB } from '@/lib/tanggal';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (typeof body.jadwalId !== 'string' || !body.jadwalId) {
      return NextResponse.json({ error: 'Jadwal tidak ditemukan.' }, { status: 400 });
    }
    const errorValidasi = validasiFormBA(body, { wajibkanFoto: true });
    if (errorValidasi) {
      return NextResponse.json({ error: errorValidasi }, { status: 400 });
    }

    const ip = ambilIpDariRequest(req);
    const jadwalRef = adminDb.collection('jadwal_ujian').doc(body.jadwalId);
    const settingsRef = adminDb.collection('settings').doc('app');
    const baRef = adminDb.collection('berita_acara').doc();

    const hasil = await adminDb.runTransaction(async (trx) => {
      const jadwalSnap = await trx.get(jadwalRef);
      if (!jadwalSnap.exists) {
        throw new Error('NOT_FOUND');
      }
      const jadwal = jadwalSnap.data()!;

      if (jadwal.status === 'terisi') {
        throw new Error('SUDAH_DIISI');
      }

      const periodeRef = adminDb.collection('periode').doc(jadwal.periodeId);
      const periodeSnap = await trx.get(periodeRef);
      if (!periodeSnap.exists) {
        throw new Error('PERIODE_TIDAK_DITEMUKAN');
      }
      const periode = periodeSnap.data()!;

      const settingsSnap = await trx.get(settingsRef);
      const formatTemplate = settingsSnap.exists
        ? (settingsSnap.data()!.formatNomorBA as string) || FORMAT_NOMOR_BA_DEFAULT
        : FORMAT_NOMOR_BA_DEFAULT;

      const nomorUrut = (periode.counterBA ?? 0) + 1;
      const sekarangWIB = hariIniStrWIB();
      const [tahunWIB, bulanWIB] = sekarangWIB.split('-').map(Number);
      const nomorBA = formatNomorBA(formatTemplate, {
        nomorUrut,
        jenis: periode.jenis,
        bulanWIB,
        tahunWIB,
      });

      const pesertaTerdaftar = Number(body.pesertaTerdaftar);
      const pesertaHadir = Number(body.pesertaHadir);

      trx.set(baRef, {
        jadwalId: body.jadwalId,
        nomorBA,
        pengawas1: body.pengawas1.trim(),
        pengawas2: body.pengawas2?.trim?.() || null,
        pesertaTerdaftar,
        pesertaHadir,
        pesertaTidakHadir: pesertaTerdaftar - pesertaHadir,
        daftarTidakHadir: body.daftarTidakHadir?.trim?.() || null,
        jamMulaiAktual: body.jamMulaiAktual,
        jamSelesaiAktual: body.jamSelesaiAktual,
        jumlahBerkas:
          body.jumlahBerkas != null && body.jumlahBerkas !== ''
            ? Number(body.jumlahBerkas)
            : null,
        kejadianKhusus: body.kejadianKhusus.trim(),
        narasiDibantuAI: Boolean(body.narasiDibantuAI),
        fotoBukti: Array.isArray(body.fotoBukti) ? body.fotoBukti : [],
        namaPengisi: body.namaPengisi.trim(),
        locked: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      trx.update(jadwalRef, {
        status: 'terisi',
        beritaAcaraId: baRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      });

      trx.update(periodeRef, {
        counterBA: nomorUrut,
        updatedAt: FieldValue.serverTimestamp(),
      });

      tulisAuditLogDalamTransaksi(trx, adminDb, {
        aksi: 'submit_ba',
        aktor: 'publik',
        targetId: baRef.id,
        detail: { jadwalId: body.jadwalId, nomorBA },
        ip,
      });

      return { baId: baRef.id, nomorBA };
    });

    return NextResponse.json(hasil, { status: 201 });
  } catch (err) {
    const kode = err instanceof Error ? err.message : '';
    if (kode === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Jadwal tidak ditemukan.' }, { status: 404 });
    }
    if (kode === 'SUDAH_DIISI') {
      return NextResponse.json(
        { error: 'Berita acara untuk jadwal ini sudah diisi oleh pengawas lain.' },
        { status: 409 }
      );
    }
    if (kode === 'PERIODE_TIDAK_DITEMUKAN') {
      return NextResponse.json({ error: 'Periode ujian tidak ditemukan.' }, { status: 404 });
    }
    console.error('Gagal submit berita acara:', err);
    return NextResponse.json(
      { error: 'Gagal menyimpan berita acara. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
