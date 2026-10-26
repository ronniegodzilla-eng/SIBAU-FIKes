// Melengkapi tanda tangan elektronik BA yang dikirim sebelum fitur TTE ada:
// TTE pengawas (bila belum ada) dan TTE pejabat "Mengetahui" dari Pengaturan.
//
// Jalankan dari folder proyek (membaca FIREBASE_SERVICE_ACCOUNT_KEY di .env.local):
//   node_modules/.bin/jiti scripts/lengkapi-tte.ts                  → uji coba, tidak menulis
//   node_modules/.bin/jiti scripts/lengkapi-tte.ts --tulis          → tulis, periode aktif saja
//   node_modules/.bin/jiti scripts/lengkapi-tte.ts --tulis --semua-periode
//
// Bawaan hanya periode aktif, karena pejabat yang dipakai adalah isi
// Pengaturan SAAT INI — belum tentu pejabat yang menjabat di periode lama.
// Waktu tanda tangan = waktu TTE pengawas (atau waktu kirim BA bila belum ada),
// sehingga keduanya tercatat ditandatangani bersamaan saat BA dikirim.

import { readFileSync } from 'fs';
import path from 'path';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore, type DocumentData, type Timestamp } from 'firebase-admin/firestore';
import {
  isiTteReguler,
  isiTteSusulan,
  pejabatDari,
  tandatangani,
  tandatanganiPejabat,
  tteMasihUtuh,
  type IsiTte,
} from '../lib/tte';

const tulis = process.argv.includes('--tulis');
const semuaPeriode = process.argv.includes('--semua-periode');

function bacaServiceAccount() {
  const env = readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
  const baris = env.split('\n').find((b) => b.startsWith('FIREBASE_SERVICE_ACCOUNT_KEY='));
  if (!baris) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY tidak ada di .env.local');
  let nilai = baris.slice('FIREBASE_SERVICE_ACCOUNT_KEY='.length).trim();
  if (/^(['"]).*\1$/.test(nilai)) nilai = nilai.slice(1, -1);
  const sa = JSON.parse(nilai);
  sa.private_key = String(sa.private_key).replace(/\\n/g, '\n');
  return sa;
}

function waktuKirim(d: DocumentData): Date {
  const t = (d.updatedAt ?? d.createdAt) as Timestamp | undefined;
  return t?.toDate ? t.toDate() : new Date();
}

async function main() {
  const db = getFirestore(initializeApp({ credential: cert(bacaServiceAccount()) }));

  const [settingsSnap, periodeSnap, jadwalSnap, baSnap, susulanSnap] = await Promise.all([
    db.collection('settings').doc('app').get(),
    db.collection('periode').get(),
    db.collection('jadwal_ujian').get(),
    db.collection('berita_acara').get(),
    db.collection('berita_acara_susulan').get(),
  ]);

  const pejabat = pejabatDari(settingsSnap.data());
  if (!pejabat) throw new Error('Pejabat penandatangan belum diisi di Pengaturan.');
  const aktif = periodeSnap.docs.find((d) => d.data().aktif === true);
  if (!semuaPeriode && !aktif) throw new Error('Tidak ada periode aktif.');
  const jadwal = new Map(jadwalSnap.docs.map((d) => [d.id, d.data()]));

  console.log(`Pejabat : ${pejabat.nama} — ${pejabat.jabatan} (NIP ${pejabat.nip || '-'})`);
  if (aktif) {
    const p = aktif.data();
    console.log(`Periode : ${semuaPeriode ? 'SEMUA' : `${p.jenis} ${p.semester} ${p.tahunAkademik}`}`);
  }

  const rencana: { ref: FirebaseFirestore.DocumentReference; data: DocumentData; label: string }[] = [];
  const hitung = { periodeLain: 0, terbuka: 0, sudahLengkap: 0, tteRusak: 0, tanpaJadwal: 0 };

  function proses(
    ref: FirebaseFirestore.DocumentReference,
    d: DocumentData,
    periodeId: unknown,
    isi: IsiTte | null
  ) {
    if (!semuaPeriode && periodeId !== aktif?.id) return void hitung.periodeLain++;
    if (d.locked === false) return void hitung.terbuka++;
    if (!isi) return void hitung.tanpaJadwal++;
    if (d.tte && d.ttePejabat) return void hitung.sudahLengkap++;
    // TTE pengawas yang ada tetapi tidak cocok berarti isi BA sudah berubah;
    // jangan biarkan pejabat "mengetahui" isi yang tidak ditandatangani pengawas.
    if (d.tte && !tteMasihUtuh(isi, d.tte)) return void hitung.tteRusak++;

    const tte = d.tte ?? tandatangani(isi, String(d.namaPengisi ?? ''), waktuKirim(d));
    const data: DocumentData = { ttePejabat: tandatanganiPejabat(isi, pejabat!, new Date(tte.ditandatanganiAt)) };
    if (!d.tte) data.tte = tte;
    rencana.push({ ref, data, label: `${d.nomorBA}${d.tte ? '' : ' (+TTE pengawas)'}` });
  }

  for (const doc of baSnap.docs) {
    const d = doc.data();
    const j = jadwal.get(d.jadwalId);
    proses(doc.ref, d, j?.periodeId, j ? isiTteReguler(doc.id, d, j) : null);
  }
  for (const doc of susulanSnap.docs) {
    const d = doc.data();
    proses(doc.ref, d, d.periodeId, isiTteSusulan(doc.id, d));
  }

  console.log(`\nAkan ditandatangani: ${rencana.length} BA`);
  rencana.slice(0, 10).forEach((r) => console.log(`  - ${r.label}`));
  if (rencana.length > 10) console.log(`  … dan ${rencana.length - 10} lainnya`);
  console.log('Dilewati:', hitung);

  if (!tulis) {
    console.log('\nUji coba saja — tambahkan --tulis untuk menyimpan.');
    return;
  }
  for (let i = 0; i < rencana.length; i += 400) {
    const batch = db.batch();
    for (const r of rencana.slice(i, i + 400)) batch.update(r.ref, r.data);
    await batch.commit();
    console.log(`Tersimpan ${Math.min(i + 400, rencana.length)}/${rencana.length}`);
  }
  console.log('Selesai.');
}

main().catch((e) => {
  console.error('Gagal:', e instanceof Error ? e.message : e);
  process.exit(1);
});
