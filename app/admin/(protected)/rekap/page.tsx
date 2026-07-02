'use client';

import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { adminFetch, AdminFetchError } from '@/lib/admin-fetch';
import { formatTanggalSingkat } from '@/lib/tanggal';
import type { JadwalUjian, Periode } from '@/lib/types';

interface PeriodeRingkas extends Pick<Periode, 'id' | 'jenis' | 'semester' | 'tahunAkademik' | 'aktif'> {}

export default function AdminRekapPage() {
  const [daftarPeriode, setDaftarPeriode] = useState<PeriodeRingkas[]>([]);
  const [periodeId, setPeriodeId] = useState('');
  const [daftarJadwal, setDaftarJadwal] = useState<JadwalUjian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterTanggal, setFilterTanggal] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'belum_diisi' | 'terisi'>('semua');
  const [cari, setCari] = useState('');
  const [memproses, setMemproses] = useState<string | null>(null);

  async function muatPeriode() {
    try {
      const data = await adminFetch<{ periode: PeriodeRingkas[] }>('/api/admin/periode');
      setDaftarPeriode(data.periode);
      if (!periodeId && data.periode.length > 0) {
        const aktif = data.periode.find((p) => p.aktif);
        setPeriodeId((aktif ?? data.periode[0])!.id);
      }
    } catch (err) {
      setError(err instanceof AdminFetchError ? err.message : 'Gagal memuat periode.');
    }
  }

  async function muatJadwal(id: string) {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch<{ jadwal: JadwalUjian[] }>(`/api/admin/jadwal?periodeId=${id}`);
      setDaftarJadwal(data.jadwal);
    } catch (err) {
      setError(err instanceof AdminFetchError ? err.message : 'Gagal memuat rekap.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muatPeriode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (periodeId) muatJadwal(periodeId);
  }, [periodeId]);

  const daftarProdi = useMemo(
    () => Array.from(new Set(daftarJadwal.map((j) => j.prodi))).sort(),
    [daftarJadwal]
  );

  const tersaring = useMemo(() => {
    return daftarJadwal.filter((j) => {
      if (filterTanggal && j.tanggalStr !== filterTanggal) return false;
      if (filterProdi && j.prodi !== filterProdi) return false;
      if (filterStatus !== 'semua' && j.status !== filterStatus) return false;
      if (cari) {
        const q = cari.toLowerCase();
        const gabungan = `${j.namaMK} ${j.kodeMK} ${j.dosenPengajar} ${j.kelas}`.toLowerCase();
        if (!gabungan.includes(q)) return false;
      }
      return true;
    });
  }, [daftarJadwal, filterTanggal, filterProdi, filterStatus, cari]);

  const ringkasan = useMemo(() => {
    const total = daftarJadwal.length;
    const terisi = daftarJadwal.filter((j) => j.status === 'terisi').length;
    const persentase = total > 0 ? Math.round((terisi / total) * 100) : 0;
    return { total, terisi, belum: total - terisi, persentase };
  }, [daftarJadwal]);

  function exportExcel() {
    const rows = tersaring.map((j) => ({
      Tanggal: j.tanggalStr,
      Jam: `${j.jamMulai}-${j.jamSelesai}`,
      'Kode MK': j.kodeMK,
      'Nama MK': j.namaMK,
      Prodi: j.prodi,
      Kelas: j.kelas,
      'Dosen Pengajar': j.dosenPengajar,
      Ruangan: j.ruangan ?? '-',
      Status: j.status === 'terisi' ? 'Terisi' : 'Belum Diisi',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap');
    XLSX.writeFile(wb, `rekap-jadwal-ujian-${periodeId}.xlsx`);
  }

  async function bukaKunci(j: JadwalUjian) {
    if (!j.beritaAcaraId) return;
    if (!confirm(`Buka kunci berita acara ${j.namaMK} agar bisa diedit ulang?`)) return;
    setMemproses(j.id);
    setError('');
    try {
      await adminFetch(`/api/admin/berita-acara/${j.beritaAcaraId}`, {
        method: 'PATCH',
        body: JSON.stringify({ aksi: 'unlock' }),
      });
      await muatJadwal(periodeId);
    } catch (err) {
      setError(err instanceof AdminFetchError ? err.message : 'Gagal membuka kunci berita acara.');
    } finally {
      setMemproses(null);
    }
  }

  async function hapusBA(j: JadwalUjian) {
    if (!j.beritaAcaraId) return;
    if (
      !confirm(
        `Hapus berita acara ${j.namaMK}? Status jadwal akan kembali ke "Belum Diisi".`
      )
    )
      return;
    setMemproses(j.id);
    setError('');
    try {
      await adminFetch(`/api/admin/berita-acara/${j.beritaAcaraId}`, { method: 'DELETE' });
      await muatJadwal(periodeId);
    } catch (err) {
      setError(err instanceof AdminFetchError ? err.message : 'Gagal menghapus berita acara.');
    } finally {
      setMemproses(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Rekap &amp; Monitoring</h1>
          <p className="mt-1 text-sm text-gray-500">
            Status kelengkapan berita acara per periode.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600">Periode</label>
            <select
              value={periodeId}
              onChange={(e) => setPeriodeId(e.target.value)}
              className="mt-1 min-h-[44px] rounded-lg border border-gray-300 px-3 text-sm"
            >
              {daftarPeriode.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.jenis} {p.semester} {p.tahunAkademik} {p.aktif ? '(aktif)' : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={exportExcel}
            disabled={tersaring.length === 0}
            className="min-h-[44px] rounded-lg border border-gray-300 px-4 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <p className="text-xl font-semibold text-gray-900">{ringkasan.total}</p>
          <p className="text-xs text-gray-500">Total Jadwal</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <p className="text-xl font-semibold text-green-600">{ringkasan.terisi}</p>
          <p className="text-xs text-gray-500">Terisi</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <p className="text-xl font-semibold text-red-600">{ringkasan.belum}</p>
          <p className="text-xs text-gray-500">Belum Diisi</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <p className="text-xl font-semibold text-primary-600">{ringkasan.persentase}%</p>
          <p className="text-xs text-gray-500">Kelengkapan</p>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          type="date"
          value={filterTanggal}
          onChange={(e) => setFilterTanggal(e.target.value)}
          className="min-h-[44px] rounded-lg border border-gray-300 px-3 text-sm"
        />
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
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="min-h-[44px] rounded-lg border border-gray-300 px-3 text-sm"
        >
          <option value="semua">Semua status</option>
          <option value="belum_diisi">Belum Diisi</option>
          <option value="terisi">Terisi</option>
        </select>
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari MK, kode, dosen, kelas..."
          className="min-h-[44px] flex-1 rounded-lg border border-gray-300 px-3 text-sm"
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Memuat rekap...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Tanggal</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">MK</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Prodi/Kelas</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
                <th className="px-3 py-2 text-right font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tersaring.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                    Tidak ada data.
                  </td>
                </tr>
              )}
              {tersaring.map((j) => (
                <tr key={j.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                    {formatTanggalSingkat(j.tanggalStr)} · {j.jamMulai}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900">{j.namaMK}</div>
                    <div className="text-xs text-gray-500">{j.kodeMK}</div>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{j.prodi} / {j.kelas}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        j.status === 'terisi'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {j.status === 'terisi' ? 'Terisi' : 'Belum Diisi'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {j.status === 'terisi' && j.beritaAcaraId ? (
                      <div className="flex justify-end gap-2">
                        <a
                          href={`/berita-acara/${j.beritaAcaraId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="min-h-[32px] rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          Lihat
                        </a>
                        <button
                          onClick={() => bukaKunci(j)}
                          disabled={memproses === j.id}
                          className="min-h-[32px] rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Buka Kunci
                        </button>
                        <button
                          onClick={() => hapusBA(j)}
                          disabled={memproses === j.id}
                          className="min-h-[32px] rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
