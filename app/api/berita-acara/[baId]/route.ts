import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { ambilIpDariRequest } from '@/lib/verify-admin';
import { tulisAuditLogDalamTransaksi } from '@/lib/audit';
import { validasiFormBA } from '@/lib/validasi';
import { periksaRateLimit } from '@/lib/rate-limit';

/**
 * PUT: pengisian ulang berita acara yang kuncinya sudah dibuka admin (F-09).
 * Publik hanya boleh menulis selama locked === false; setelah tersimpan,
 * berita acara otomatis terkunci kembali. Nomor BA tidak berubah.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { baId: string } }
) {
  try {
    const ip = ambilIpDariRequest(req);
    const limit = periksaRateLimit(`submit-ba:${ip}`, {
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
    const errorValidasi = validasiFormBA(body, { wajibkanFoto: true });
    if (errorValidasi) {
      return NextResponse.json({ error: errorValidasi }, { status: 400 });
    }

    const baRef = adminDb.collection('berita_acara').doc(params.baId);

    await adminDb.runTransaction(async (trx) => {
      const snap = await trx.get(baRef);
      if (!snap.exists) {
        throw new Error('NOT_FOUND');
      }
      if (snap.data()!.locked !== false) {
        throw new Error('TERKUNCI');
      }

      const pesertaTerdaftar = Number(body.pesertaTerdaftar);
      const pesertaHadir = Number(body.pesertaHadir);

      trx.update(baRef, {
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
        updatedAt: FieldValue.serverTimestamp(),
      });

      tulisAuditLogDalamTransaksi(trx, adminDb, {
        aksi: 'edit_ba',
        aktor: 'publik',
        targetId: params.baId,
        detail: { viaUnlock: true },
        ip,
      });
    });

    return NextResponse.json({ ok: true, baId: params.baId });
  } catch (err) {
    const kode = err instanceof Error ? err.message : '';
    if (kode === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Berita acara tidak ditemukan.' }, { status: 404 });
    }
    if (kode === 'TERKUNCI') {
      return NextResponse.json(
        { error: 'Berita acara masih terkunci. Hubungi panitia/admin untuk membuka kunci.' },
        { status: 403 }
      );
    }
    console.error('Gagal memperbarui berita acara:', err);
    return NextResponse.json(
      { error: 'Gagal menyimpan berita acara. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
