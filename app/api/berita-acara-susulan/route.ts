import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { ambilIpDariRequest } from '@/lib/verify-admin';
import { tulisAuditLogDalamTransaksi } from '@/lib/audit';
import { validasiFormSusulan } from '@/lib/validasi-susulan';
import { formatNomorBA, FORMAT_NOMOR_BA_DEFAULT } from '@/lib/nomor-ba';
import { hariIniStrWIB } from '@/lib/tanggal';
import { periksaRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = ambilIpDariRequest(req);
    const limit = periksaRateLimit(`submit-ba-susulan:${ip}`, {
      maksPermintaan: 10,
      jendelaMs: 5 * 60 * 1000,
    });
    if (!limit.diizinkan) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan submit. Coba lagi dalam ${limit.sisaDetikTunggu} detik.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    const errorValidasi = validasiFormSusulan(body, { wajibkanFoto: true });
    if (errorValidasi) {
      return NextResponse.json({ error: errorValidasi }, { status: 400 });
    }

    const periodeRef = adminDb.collection('periode').doc(body.periodeId);
    const settingsRef = adminDb.collection('settings').doc('app');
    const susulanRef = adminDb.collection('berita_acara_susulan').doc();

    const hasil = await adminDb.runTransaction(async (trx) => {
      const periodeSnap = await trx.get(periodeRef);
      if (!periodeSnap.exists) {
        throw new Error('PERIODE_TIDAK_DITEMUKAN');
      }
      const periode = periodeSnap.data()!;

      const settingsSnap = await trx.get(settingsRef);
      const formatTemplate = settingsSnap.exists
        ? (settingsSnap.data()!.formatNomorBA as string) || FORMAT_NOMOR_BA_DEFAULT
        : FORMAT_NOMOR_BA_DEFAULT;

      const nomorUrut = (periode.counterBASusulan ?? 0) + 1;
      const sekarangWIB = hariIniStrWIB();
      const [tahunWIB, bulanWIB] = sekarangWIB.split('-').map(Number);
      const nomorBA =
        formatNomorBA(formatTemplate, {
          nomorUrut,
          jenis: periode.jenis,
          bulanWIB,
          tahunWIB,
        }) + '-SUS';

      const pesertaTerdaftar = Number(body.pesertaTerdaftar);
      const pesertaHadir = Number(body.pesertaHadir);

      trx.set(susulanRef, {
        periodeId: body.periodeId,
        tanggalStr: body.tanggalStr,
        kodeMK: body.kodeMK.trim(),
        namaMK: body.namaMK.trim(),
        prodi: body.prodi.trim(),
        kelas: body.kelas.trim(),
        dosenPengajar: body.dosenPengajar.trim(),
        ruangan: body.ruangan?.trim?.() || null,
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

      trx.update(periodeRef, {
        counterBASusulan: nomorUrut,
        updatedAt: FieldValue.serverTimestamp(),
      });

      tulisAuditLogDalamTransaksi(trx, adminDb, {
        aksi: 'submit_ba_susulan',
        aktor: 'publik',
        targetId: susulanRef.id,
        detail: { periodeId: body.periodeId, nomorBA },
        ip,
      });

      return { id: susulanRef.id, nomorBA };
    });

    return NextResponse.json(hasil, { status: 201 });
  } catch (err) {
    const kode = err instanceof Error ? err.message : '';
    if (kode === 'PERIODE_TIDAK_DITEMUKAN') {
      return NextResponse.json({ error: 'Periode ujian tidak ditemukan.' }, { status: 404 });
    }
    console.error('Gagal submit berita acara susulan:', err);
    return NextResponse.json(
      { error: 'Gagal menyimpan berita acara susulan. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
