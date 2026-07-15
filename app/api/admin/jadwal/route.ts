import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, FieldPath } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminToken, ambilIpDariRequest, AdminAuthError } from '@/lib/verify-admin';
import { tulisAuditLog } from '@/lib/audit';
import { buatTimestampTengahHariWIB } from '@/lib/tanggal';
import { validasiBarisJadwal, kunciUnikJadwal } from '@/lib/validasi-jadwal';

interface RingkasBA {
  nomorBA: string;
  pengawas1: string;
  pengawas2: string | null;
  pesertaTerdaftar: number | null;
  pesertaHadir: number | null;
}

/** Ambil ringkasan BA (nomor + nama pengawas) untuk sekumpulan beritaAcaraId
 *  (chunk 30 sesuai batas query 'in'). */
async function ambilPetaRingkasBA(ids: string[]): Promise<Map<string, RingkasBA>> {
  const peta = new Map<string, RingkasBA>();
  for (let i = 0; i < ids.length; i += 30) {
    const chunk = ids.slice(i, i + 30);
    const snap = await adminDb
      .collection('berita_acara')
      .where(FieldPath.documentId(), 'in', chunk)
      .get();
    snap.docs.forEach((d) => {
      const data = d.data();
      peta.set(d.id, {
        nomorBA: data.nomorBA as string,
        pengawas1: data.pengawas1 as string,
        pengawas2: (data.pengawas2 as string | null) ?? null,
        pesertaTerdaftar: (data.pesertaTerdaftar as number | null) ?? null,
        pesertaHadir: (data.pesertaHadir as number | null) ?? null,
      });
    });
  }
  return peta;
}

export async function GET(req: NextRequest) {
  try {
    await verifyAdminToken(req);
    const periodeId = req.nextUrl.searchParams.get('periodeId');
    let query: FirebaseFirestore.Query = adminDb.collection('jadwal_ujian');
    if (periodeId) query = query.where('periodeId', '==', periodeId);
    const snap = await query.orderBy('tanggalStr', 'asc').get();
    const jadwal = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const idBA = jadwal
      .map((j: any) => j.beritaAcaraId)
      .filter((id: unknown): id is string => typeof id === 'string');
    if (idBA.length > 0) {
      const petaRingkasBA = await ambilPetaRingkasBA(idBA);
      jadwal.forEach((j: any) => {
        const ringkas = j.beritaAcaraId ? petaRingkasBA.get(j.beritaAcaraId) : undefined;
        j.nomorBA = ringkas?.nomorBA ?? null;
        j.pengawas1 = ringkas?.pengawas1 ?? null;
        j.pengawas2 = ringkas?.pengawas2 ?? null;
        j.pesertaTerdaftar = ringkas?.pesertaTerdaftar ?? null;
        j.pesertaHadir = ringkas?.pesertaHadir ?? null;
      });
    }

    return NextResponse.json({ jadwal });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Gagal memuat daftar jadwal.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req);
    const body = await req.json();

    if (!body.periodeId || typeof body.periodeId !== 'string') {
      return NextResponse.json({ error: 'Periode wajib dipilih.' }, { status: 400 });
    }
    const errorValidasi = validasiBarisJadwal(body);
    if (errorValidasi) {
      return NextResponse.json({ error: errorValidasi }, { status: 400 });
    }

    const kunci = kunciUnikJadwal({ periodeId: body.periodeId, ...body });
    const existing = await adminDb
      .collection('jadwal_ujian')
      .where('periodeId', '==', body.periodeId)
      .where('tanggalStr', '==', body.tanggalStr)
      .where('jamMulai', '==', body.jamMulai)
      .where('kodeMK', '==', body.kodeMK)
      .where('prodi', '==', body.prodi)
      .where('kelas', '==', body.kelas)
      .limit(1)
      .get();
    if (!existing.empty) {
      return NextResponse.json(
        { error: 'Jadwal dengan tanggal, jam, MK, prodi, dan kelas yang sama sudah ada.' },
        { status: 409 }
      );
    }

    const docRef = adminDb.collection('jadwal_ujian').doc();
    await docRef.set({
      periodeId: body.periodeId,
      tanggal: buatTimestampTengahHariWIB(body.tanggalStr),
      tanggalStr: body.tanggalStr,
      jamMulai: body.jamMulai,
      jamSelesai: body.jamSelesai,
      kodeMK: body.kodeMK.trim(),
      namaMK: body.namaMK.trim(),
      prodi: body.prodi.trim(),
      kelas: body.kelas.trim(),
      dosenPengajar: body.dosenPengajar.trim(),
      ruangan: body.ruangan?.trim() || null,
      status: 'belum_diisi',
      beritaAcaraId: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await tulisAuditLog({
      aksi: 'crud_jadwal',
      aktor: admin.email,
      targetId: docRef.id,
      detail: { aksi: 'buat', kunci },
      ip: ambilIpDariRequest(req),
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Gagal membuat jadwal.' }, { status: 500 });
  }
}
