import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { uploadFotoKeAppsScript, folderPathPeriode } from '@/lib/apps-script';

const MIME_DIIZINKAN = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAKS_BYTES = 1_500_000; // ~1.5MB decoded, buffer di atas target kompresi 800KB

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { base64, mimeType, fileName, jadwalId } = body ?? {};

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
    if (typeof jadwalId !== 'string' || !jadwalId) {
      return NextResponse.json({ error: 'Jadwal tidak ditemukan.' }, { status: 400 });
    }

    const perkiraanBytes = Math.floor((base64.length * 3) / 4);
    if (perkiraanBytes > MAKS_BYTES) {
      return NextResponse.json(
        { error: 'Ukuran foto terlalu besar setelah kompresi. Coba foto lain.' },
        { status: 400 }
      );
    }

    const jadwalSnap = await adminDb.collection('jadwal_ujian').doc(jadwalId).get();
    if (!jadwalSnap.exists) {
      return NextResponse.json({ error: 'Jadwal tidak ditemukan.' }, { status: 404 });
    }
    const jadwal = jadwalSnap.data()!;

    const periodeSnap = await adminDb.collection('periode').doc(jadwal.periodeId).get();
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
