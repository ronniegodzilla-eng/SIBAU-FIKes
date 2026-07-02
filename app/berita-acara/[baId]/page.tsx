'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { formatTanggalIndonesia } from '@/lib/tanggal';
import TombolUnduhPDF from '@/components/pdf/TombolUnduhPDF';
import type { BeritaAcara, JadwalUjian, Periode, SettingsApp } from '@/lib/types';

export default function DetailBeritaAcaraPage({
  params,
}: {
  params: { baId: string };
}) {
  const [ba, setBa] = useState<BeritaAcara | null | undefined>(undefined);
  const [jadwal, setJadwal] = useState<JadwalUjian | null>(null);
  const [periode, setPeriode] = useState<Periode | null>(null);
  const [settings, setSettings] = useState<SettingsApp | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function muat() {
      try {
        const baSnap = await getDoc(doc(db, 'berita_acara', params.baId));
        if (!baSnap.exists()) {
          setBa(null);
          return;
        }
        const baData = { id: baSnap.id, ...baSnap.data() } as unknown as BeritaAcara;
        setBa(baData);

        const jadwalSnap = await getDoc(doc(db, 'jadwal_ujian', baData.jadwalId));
        let periodeId: string | null = null;
        if (jadwalSnap.exists()) {
          const jadwalData = { id: jadwalSnap.id, ...jadwalSnap.data() } as unknown as JadwalUjian;
          setJadwal(jadwalData);
          periodeId = jadwalData.periodeId;
        }

        if (periodeId) {
          const periodeSnap = await getDoc(doc(db, 'periode', periodeId));
          if (periodeSnap.exists()) {
            setPeriode({ id: periodeSnap.id, ...periodeSnap.data() } as unknown as Periode);
          }
        }

        const settingsSnap = await getDoc(doc(db, 'settings', 'app'));
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data() as SettingsApp);
        }
      } catch {
        setError('Gagal memuat berita acara. Periksa koneksi internet Anda.');
      }
    }
    muat();
  }, [params.baId]);

  if (ba === undefined) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center text-sm text-gray-400">
        {error || 'Memuat...'}
      </main>
    );
  }

  if (ba === null) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center text-sm text-gray-600">
        Berita acara tidak ditemukan.
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-16">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
          {ba.nomorBA}
        </p>
        <h1 className="mt-1 text-lg font-semibold text-gray-900">
          Berita Acara Pelaksanaan Ujian
        </h1>
        {jadwal && (
          <p className="mt-1 text-sm text-gray-500">
            {jadwal.namaMK} ({jadwal.kodeMK}) — {formatTanggalIndonesia(jadwal.tanggalStr)}
          </p>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
          {jadwal && (
            <>
              <div>
                <dt className="text-xs text-gray-400">Prodi/Kelas</dt>
                <dd className="text-gray-800">{jadwal.prodi} / {jadwal.kelas}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Ruangan</dt>
                <dd className="text-gray-800">{jadwal.ruangan ?? '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Dosen Pengajar</dt>
                <dd className="text-gray-800">{jadwal.dosenPengajar}</dd>
              </div>
            </>
          )}
          <div>
            <dt className="text-xs text-gray-400">Pengawas 1</dt>
            <dd className="text-gray-800">{ba.pengawas1}</dd>
          </div>
          {ba.pengawas2 && (
            <div>
              <dt className="text-xs text-gray-400">Pengawas 2</dt>
              <dd className="text-gray-800">{ba.pengawas2}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-gray-400">Jam Aktual</dt>
            <dd className="text-gray-800">{ba.jamMulaiAktual}–{ba.jamSelesaiAktual}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Peserta Terdaftar/Hadir</dt>
            <dd className="text-gray-800">{ba.pesertaTerdaftar} / {ba.pesertaHadir}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Peserta Tidak Hadir</dt>
            <dd className="text-gray-800">{ba.pesertaTidakHadir}</dd>
          </div>
          {ba.jumlahBerkas != null && (
            <div>
              <dt className="text-xs text-gray-400">Jumlah Berkas</dt>
              <dd className="text-gray-800">{ba.jumlahBerkas}</dd>
            </div>
          )}
          <div className="col-span-2">
            <dt className="text-xs text-gray-400">Kejadian Khusus</dt>
            <dd className="text-gray-800">{ba.kejadianKhusus}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-gray-400">Nama Pengisi</dt>
            <dd className="text-gray-800">{ba.namaPengisi}</dd>
          </div>
        </dl>

        {ba.fotoBukti.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Foto Bukti
            </p>
            <div className="grid grid-cols-3 gap-2">
              {ba.fotoBukti.map((f) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={f.fileId}
                  src={f.url}
                  alt={f.namaFile}
                  className="aspect-square w-full rounded-lg border border-gray-200 object-cover"
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-5">
          {jadwal && periode && settings ? (
            <TombolUnduhPDF ba={ba} jadwal={jadwal} periode={periode} settings={settings} />
          ) : (
            <button
              disabled
              className="min-h-[44px] w-full rounded-lg bg-gray-200 px-4 text-sm font-medium text-gray-500"
            >
              Memuat data untuk PDF...
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
