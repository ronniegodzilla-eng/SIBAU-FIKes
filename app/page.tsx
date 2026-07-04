'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
  const [cari, setCari] = useState('');

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
    if (cari) {
      const q = cari.toLowerCase();
      const gabungan = `${j.namaMK} ${j.dosenPengajar}`.toLowerCase();
      if (!gabungan.includes(q)) return false;
    }
    return true;
  });

  const periodeAktifLabel = periodeAktif
    ? `${periodeAktif.jenis} ${periodeAktif.semester} T.A. ${periodeAktif.tahunAkademik}`
    : '';
  const todayHeaderLabel =
    tanggal === hariIniStrWIB() ? 'Ujian Hari Ini' : formatTanggalIndonesia(tanggal);

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 px-4 pb-[46px] pt-[22px] lg:px-8">
        <div className="mx-auto flex max-w-[600px] items-center justify-between gap-3 lg:max-w-6xl">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-uis.png" alt="Logo UIS" className="h-[42px] w-[42px] object-contain" />
            <div>
              <div className="text-[15px] font-extrabold tracking-tight text-white">
                SIBAU FIKes UIS
              </div>
              <div className="text-[11.5px] font-medium text-primary-100">
                Sistem Berita Acara Ujian
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <Link
              href="/susulan"
              className="whitespace-nowrap rounded-lg bg-warn-accent px-4 py-2.5 text-sm font-extrabold text-[#3D2E00] shadow-[0_3px_12px_rgba(0,0,0,0.18)] hover:brightness-95"
            >
              + Ujian Susulan
            </Link>
            <Link
              href="/admin/login"
              className="whitespace-nowrap rounded-lg border border-white/35 bg-white/[0.14] px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/25"
            >
              Login Admin
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto -mt-[30px] max-w-[600px] px-4 pb-12 lg:max-w-6xl lg:px-8">
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(15,60,30,0.10)] sm:px-[18px]">
          {periodeAktif ? (
            <>
              <div className="mb-2.5 text-[11.5px] font-bold uppercase tracking-wide text-primary-600">
                {periodeAktifLabel}
              </div>
              <div className="mb-2.5">
                <input
                  type="text"
                  value={cari}
                  onChange={(e) => setCari(e.target.value)}
                  placeholder="Cari mata kuliah atau nama dosen..."
                  className="w-full rounded-[9px] border-[1.5px] border-line px-3 py-2.5 text-[13.5px] text-ink"
                />
              </div>
              <div className="flex flex-wrap items-end gap-2.5">
                <div className="min-w-[150px] flex-1">
                  <label className="mb-1.5 block text-[11.5px] font-semibold text-muted">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full rounded-[9px] border-[1.5px] border-line px-2.5 py-2.5 text-[13.5px] font-semibold text-ink"
                  />
                </div>
                <div className="min-w-[120px]">
                  <label className="mb-1.5 block text-[11.5px] font-semibold text-muted">
                    Sesi
                  </label>
                  <select
                    value={filterJam}
                    onChange={(e) => setFilterJam(e.target.value)}
                    className="w-full rounded-[9px] border-[1.5px] border-line bg-white px-2.5 py-2.5 text-[13px] font-semibold text-ink"
                  >
                    <option value="">Semua Sesi</option>
                    {daftarJam.map((j) => (
                      <option key={j} value={j}>
                        Sesi · {j}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-[150px] flex-1">
                  <label className="mb-1.5 block text-[11.5px] font-semibold text-muted">
                    Prodi
                  </label>
                  <select
                    value={filterProdi}
                    onChange={(e) => setFilterProdi(e.target.value)}
                    className="w-full rounded-[9px] border-[1.5px] border-line bg-white px-2.5 py-2.5 text-[13px] font-semibold text-ink"
                  >
                    <option value="">Semua Prodi</option>
                    {daftarProdi.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : periodeAktif === null ? (
            <div className="py-2.5 text-center text-[13.5px] font-semibold text-faint">
              Tidak ada periode ujian aktif.
            </div>
          ) : (
            <div className="py-2.5 text-center text-[13.5px] font-semibold text-faint">
              Memuat...
            </div>
          )}
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">
            {error}
          </p>
        )}

        {periodeAktif && (
          <>
            <PanelBelumDiisi daftar={belumDiisi} />

            <div className="mb-[11px] flex items-center justify-between">
              <div className="text-[15px] font-extrabold text-ink">{todayHeaderLabel}</div>
              <div className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-600">
                {jadwalTersaring.length} ujian
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-faint">Memuat jadwal...</p>
            ) : jadwalTersaring.length === 0 ? (
              <p className="rounded-2xl bg-white p-[30px] text-center text-[13.5px] font-semibold text-faint">
                Tidak ada jadwal ujian untuk filter ini.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {jadwalTersaring.map((j) => (
                  <KartuJadwal key={j.id} jadwal={j} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
