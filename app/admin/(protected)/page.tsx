'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch, AdminFetchError } from '@/lib/admin-fetch';
import type { JadwalUjian, Periode } from '@/lib/types';

export default function AdminRingkasanPage() {
  const [periodeAktif, setPeriodeAktif] = useState<Periode | null | undefined>(undefined);
  const [jadwal, setJadwal] = useState<JadwalUjian[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function muat() {
      try {
        const dataPeriode = await adminFetch<{ periode: Periode[] }>('/api/admin/periode');
        const aktif = dataPeriode.periode.find((p) => p.aktif) ?? null;
        setPeriodeAktif(aktif);
        if (aktif) {
          const dataJadwal = await adminFetch<{ jadwal: JadwalUjian[] }>(
            `/api/admin/jadwal?periodeId=${aktif.id}`
          );
          setJadwal(dataJadwal.jadwal);
        }
      } catch (err) {
        setError(err instanceof AdminFetchError ? err.message : 'Gagal memuat ringkasan.');
      }
    }
    muat();
  }, []);

  const total = jadwal.length;
  const terisi = jadwal.filter((j) => j.status === 'terisi').length;
  const persentase = total > 0 ? Math.round((terisi / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Ringkasan Monitoring</h1>
        <p className="mt-1 text-sm text-gray-500">
          Status kelengkapan berita acara periode aktif.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {periodeAktif === undefined && (
        <p className="text-sm text-gray-400">Memuat...</p>
      )}

      {periodeAktif === null && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Belum ada periode aktif.{' '}
          <Link href="/admin/periode" className="text-primary-600 hover:underline">
            Buat periode
          </Link>
        </div>
      )}

      {periodeAktif && (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Periode aktif</p>
            <p className="text-base font-semibold text-gray-900">
              {periodeAktif.jenis} {periodeAktif.semester} {periodeAktif.tahunAkademik}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
              <p className="text-xl font-semibold text-gray-900">{total}</p>
              <p className="text-xs text-gray-500">Total Jadwal</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
              <p className="text-xl font-semibold text-green-600">{terisi}</p>
              <p className="text-xs text-gray-500">Terisi</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
              <p className="text-xl font-semibold text-red-600">{total - terisi}</p>
              <p className="text-xs text-gray-500">Belum Diisi</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
              <p className="text-xl font-semibold text-primary-600">{persentase}%</p>
              <p className="text-xs text-gray-500">Kelengkapan</p>
            </div>
          </div>

          <Link
            href="/admin/rekap"
            className="inline-block min-h-[44px] rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium leading-[28px] text-white hover:bg-primary-700"
          >
            Lihat Rekap Lengkap
          </Link>
        </>
      )}
    </div>
  );
}
