'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { hariIniStrWIB, formatTanggalIndonesia } from '@/lib/tanggal';
import KartuJadwal from '@/components/publik/KartuJadwal';
import PanelBelumDiisi from '@/components/publik/PanelBelumDiisi';
import type { JadwalUjian, Periode } from '@/lib/types';

export default function DashboardPage() {
  const [periodeAktif, setPeriodeAktif] = useState<Periode | null | undefined>(undefined);
  const [tanggal, setTanggal] = useState(hariIniStrWIB());
  const [jadwalHariItu, setJadwalHariItu] = useState<JadwalUjian[]>([]);
  const [belumDiisi, setBelumDiisi] = useState<JadwalUjian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterJam, setFilterJam] = useState('');
  const [filterProdi, setFilterProdi] = useState('');

  useEffect(() => {
    async function muatPeriode() {
      try {
        const snap = await getDocs(
          query(collection(db, 'periode'), where('aktif', '==', true), limit(1))
        );
        if (snap.empty) {
          setPeriodeAktif(null);
        } else {
          const d = snap.docs[0]!;
          setPeriodeAktif({ id: d.id, ...d.data() } as unknown as Periode);
        }
      } catch {
        setError('Gagal memuat data periode. Periksa koneksi internet Anda.');
        setPeriodeAktif(null);
      }
    }
    muatPeriode();
  }, []);

  useEffect(() => {
    if (!periodeAktif) {
      setJadwalHariItu([]);
      setBelumDiisi([]);
      setLoading(false);
      return;
    }

    async function muatJadwal() {
      setLoading(true);
      setError('');
      try {
        const snapHariIni = await getDocs(
          query(
            collection(db, 'jadwal_ujian'),
            where('periodeId', '==', periodeAktif!.id),
            where('tanggalStr', '==', tanggal),
            orderBy('jamMulai', 'asc')
          )
        );
        setJadwalHariItu(
          snapHariIni.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as JadwalUjian)
        );

        const snapTertunggak = await getDocs(
          query(
            collection(db, 'jadwal_ujian'),
            where('periodeId', '==', periodeAktif!.id),
            where('status', '==', 'belum_diisi'),
            where('tanggalStr', '<=', hariIniStrWIB()),
            orderBy('tanggalStr', 'asc')
          )
        );
        setBelumDiisi(
          snapTertunggak.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as JadwalUjian)
        );
      } catch {
        setError('Gagal memuat jadwal ujian. Periksa koneksi internet Anda.');
      } finally {
        setLoading(false);
      }
    }
    muatJadwal();
  }, [periodeAktif, tanggal]);

  const daftarJam = useMemo(
    () => Array.from(new Set(jadwalHariItu.map((j) => j.jamMulai))).sort(),
    [jadwalHariItu]
  );
  const daftarProdi = useMemo(
    () => Array.from(new Set(jadwalHariItu.map((j) => j.prodi))).sort(),
    [jadwalHariItu]
  );

  const jadwalTersaring = jadwalHariItu.filter((j) => {
    if (filterJam && j.jamMulai !== filterJam) return false;
    if (filterProdi && j.prodi !== filterProdi) return false;
    return true;
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-16">
      <header className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">SIBAU</h1>
        <p className="text-sm text-gray-500">
          Sistem Berita Acara Ujian — Fakultas Ilmu Kesehatan UIS
        </p>
      </header>

      {periodeAktif === undefined && (
        <p className="text-sm text-gray-400">Memuat...</p>
      )}

      {periodeAktif === null && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-sm text-gray-600">Tidak ada periode ujian aktif.</p>
          <p className="mt-1 text-xs text-gray-400">
            Hubungi panitia UTS/UAS FIKes UIS jika ini tidak sesuai harapan.
          </p>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {periodeAktif && (
        <div className="space-y-5">
          <PanelBelumDiisi daftar={belumDiisi} />

          <section>
            <div className="flex items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="mt-1 min-h-[44px] rounded-lg border border-gray-300 px-3 text-sm"
                />
              </div>
              <button
                onClick={() => setTanggal(hariIniStrWIB())}
                className="min-h-[44px] rounded-lg border border-gray-300 px-3 text-sm text-gray-600 hover:bg-gray-50"
              >
                Hari ini
              </button>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-700">
              {formatTanggalIndonesia(tanggal)}
            </p>
          </section>

          {jadwalHariItu.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <select
                value={filterJam}
                onChange={(e) => setFilterJam(e.target.value)}
                className="min-h-[44px] rounded-lg border border-gray-300 px-3 text-sm"
              >
                <option value="">Semua jam</option>
                {daftarJam.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
              <select
                value={filterProdi}
                onChange={(e) => setFilterProdi(e.target.value)}
                className="min-h-[44px] rounded-lg border border-gray-300 px-3 text-sm"
              >
                <option value="">Semua prodi</option>
                {daftarProdi.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}

          {loading ? (
            <p className="text-sm text-gray-400">Memuat jadwal...</p>
          ) : jadwalTersaring.length === 0 ? (
            <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              Tidak ada jadwal ujian pada tanggal ini.
            </p>
          ) : (
            <div className="space-y-3">
              {jadwalTersaring.map((j) => (
                <KartuJadwal key={j.id} jadwal={j} />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
