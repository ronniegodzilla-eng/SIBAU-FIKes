import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { uploadFotoKeAppsScript, folderPathPeriode } from '@/lib/apps-script';
import { ambilIpDariRequest } from '@/lib/verify-admin';
import { periksaRateLimit } from '@/lib/rate-limit';

const MIME_DIIZINKAN = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAKS_BYTES = 1_500_000; // ~1.5MB decoded, buffer di atas target kompresi 800KB

export async function POST(req: NextRequest) {
  try {
    const limit = periksaRateLimit(`upload-foto:${ambilIpDariRequest(req)}`, {
      maksPermintaan: 20,
      jendelaMs: 5 * 60 * 1000,
    });
    if (!limit.diizinkan) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan unggah foto. Coba lagi dalam ${limit.sisaDetikTunggu} detik.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { base64, mimeType, fileName, jadwalId, periodeId: periodeIdLangsung } = body ?? {};

    if (typeof base64 !== 'string' || !base64) {
      return NextResponse.json({ error: 'Data foto tidak ditemukan.' }, { status: 400 });
    }
    if (typeof mimeType !== 'string' || !MIME_DIIZINKAN.has(mimeType)) {
      return NextResponse.json(
        { error: 'Format foto harus JPG, PNG, atau WEBP.' },
        { status: 400 }
      );
    }
    if (typeof fileName !== 'string' || !fileName.trim()) {
      return NextResponse.json({ error: 'Nama file tidak valid.' }, { status: 400 });
    }
    if (
      (typeof jadwalId !== 'string' || !jadwalId) &&
      (typeof periodeIdLangsung !== 'string' || !periodeIdLangsung)
    ) {
      return NextResponse.json({ error: 'Jadwal atau periode tidak ditemukan.' }, { status: 400 });
    }

    const perkiraanBytes = Math.floor((base64.length * 3) / 4);
    if (perkiraanBytes > MAKS_BYTES) {
      return NextResponse.json(
        { error: 'Ukuran foto terlalu besar setelah kompresi. Coba foto lain.' },
        { status: 400 }
      );
    }

    let periodeId = periodeIdLangsung as string | undefined;
    if (!periodeId && typeof jadwalId === 'string') {
      const jadwalSnap = await adminDb.collection('jadwal_ujian').doc(jadwalId).get();
      if (!jadwalSnap.exists) {
        return NextResponse.json({ error: 'Jadwal tidak ditemukan.' }, { status: 404 });
      }
      periodeId = jadwalSnap.data()!.periodeId as string;
    }

    const periodeSnap = await adminDb.collection('periode').doc(periodeId!).get();
    if (!periodeSnap.exists) {
      return NextResponse.json({ error: 'Periode ujian tidak ditemukan.' }, { status: 404 });
    }
    const periode = periodeSnap.data()!;

    const hasil = await uploadFotoKeAppsScript({
      base64,
      mimeType,
      fileName: fileName.trim(),
      folderPath: folderPathPeriode({
        jenis: periode.jenis,
        tahunAkademik: periode.tahunAkademik,
        semester: periode.semester,
      }),
    });

    return NextResponse.json({
      fileId: hasil.fileId,
      url: hasil.url,
      namaFile: fileName.trim(),
    });
  } catch (err) {
    console.error('Gagal upload foto:', err);
    return NextResponse.json(
      { error: 'Gagal mengunggah foto. Periksa koneksi internet dan coba lagi.' },
      { status: 500 }
    );
  }
}
