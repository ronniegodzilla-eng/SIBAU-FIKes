import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { ambilIpDariRequest } from '@/lib/verify-admin';
import { tulisAuditLogDalamTransaksi } from '@/lib/audit';
import { validasiFormSusulan } from '@/lib/validasi-susulan';
import { periksaRateLimit } from '@/lib/rate-limit';
import { tandatanganiBA, isiTteSusulan, pejabatDari } from '@/lib/tte';

/**
 * PUT: pengisian ulang berita acara susulan yang kuncinya sudah dibuka admin
 * (F-09). Publik hanya boleh menulis selama locked === false; setelah
 * tersimpan otomatis terkunci kembali. Nomor BA dan periode tidak berubah.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const susulanRef = adminDb.collection('berita_acara_susulan').doc(params.id);

    // Validasi butuh periodeId; ambil dari dokumen agar periode tidak bisa
    // dipindah lewat endpoint publik ini.
    const awal = await susulanRef.get();
    if (!awal.exists) {
      return NextResponse.json({ error: 'Berita acara susulan tidak ditemukan.' }, { status: 404 });
    }
    const errorValidasi = validasiFormSusulan(
      { ...body, periodeId: awal.data()!.periodeId },
      { wajibkanFoto: true }
    );
    if (errorValidasi) {
      return NextResponse.json({ error: errorValidasi }, { status: 400 });
    }

    await adminDb.runTransaction(async (trx) => {
      const snap = await trx.get(susulanRef);
      if (!snap.exists) {
        throw new Error('NOT_FOUND');
      }
      const susulanLama = snap.data()!;
      if (susulanLama.locked !== false) {
        throw new Error('TERKUNCI');
      }
      const settingsSnap = await trx.get(adminDb.collection('settings').doc('app'));

      const pesertaTerdaftar = Number(body.pesertaTerdaftar);
      const pesertaHadir = Number(body.pesertaHadir);

      const dataBaru = {
        tanggalStr: body.tanggalStr,
        kodeMK: body.kodeMK.trim(),
        namaMK: body.namaMK.trim(),
        prodi: body.prodi.trim(),
        kelas: body.kelas.trim(),
        dosenPengajar: body.dosenPengajar.trim(),
        ruangan: body.ruangan?.trim?.() || null,
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
      };

      // Isi berubah → ditandatangani ulang (pengawas & pejabat); TTE lama
      // tidak lagi mewakili isinya.
      const { tte, ttePejabat } = tandatanganiBA(
        isiTteSusulan(params.id, { ...susulanLama, ...dataBaru }),
        dataBaru.namaPengisi,
        pejabatDari(settingsSnap.data())
      );
      trx.update(susulanRef, {
        ...dataBaru,
        tte,
        ttePejabat: ttePejabat ?? FieldValue.delete(),
        locked: true,
        updatedAt: FieldValue.serverTimestamp(),
      });

      tulisAuditLogDalamTransaksi(trx, adminDb, {
        aksi: 'edit_ba_susulan',
        aktor: 'publik',
        targetId: params.id,
        detail: { viaUnlock: true },
        ip,
      });
    });

    return NextResponse.json({ ok: true, id: params.id });
  } catch (err) {
    const kode = err instanceof Error ? err.message : '';
    if (kode === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Berita acara susulan tidak ditemukan.' }, { status: 404 });
    }
    if (kode === 'TERKUNCI') {
      return NextResponse.json(
        { error: 'Berita acara susulan masih terkunci. Hubungi panitia/admin untuk membuka kunci.' },
        { status: 403 }
      );
    }
    console.error('Gagal memperbarui berita acara susulan:', err);
    return NextResponse.json(
      { error: 'Gagal menyimpan berita acara susulan. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
