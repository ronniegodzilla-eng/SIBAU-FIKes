'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { adminFetch, AdminFetchError } from '@/lib/admin-fetch';
import { formatTanggalSingkat, tanggalStrWIB } from '@/lib/tanggal';
import type { Periode } from '@/lib/types';

interface PeriodeApi extends Omit<Periode, 'tanggalMulai' | 'tanggalSelesai' | 'createdAt' | 'updatedAt'> {
  tanggalMulai: { _seconds: number } | string;
  tanggalSelesai: { _seconds: number } | string;
}

function keTanggalStr(v: unknown): string {
  if (typeof v === 'string') return v.slice(0, 10);
  if (v && typeof v === 'object' && '_seconds' in (v as any)) {
    return tanggalStrWIB(new Date((v as any)._seconds * 1000));
  }
  return '-';
}

const KOSONG = {
  jenis: 'UTS' as 'UTS' | 'UAS',
  tahunAkademik: '',
  semester: 'Ganjil' as 'Ganjil' | 'Genap',
  tanggalMulai: '',
  tanggalSelesai: '',
  aktif: false,
};

export default function AdminPeriodePage() {
  const [daftar, setDaftar] = useState<PeriodeApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sukses, setSukses] = useState('');
  const [form, setForm] = useState(KOSONG);
  const [menyimpan, setMenyimpan] = useState(false);

  async function muatDaftar() {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch<{ periode: PeriodeApi[] }>('/api/admin/periode');
      setDaftar(data.periode);
    } catch (err) {
      setError(err instanceof AdminFetchError ? err.message : 'Gagal memuat periode.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muatDaftar();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSukses('');

    if (!/^\d{4}\/\d{4}$/.test(form.tahunAkademik)) {
      setError('Tahun akademik harus berformat "2026/2027".');
      return;
    }
    if (!form.tanggalMulai || !form.tanggalSelesai) {
      setError('Tanggal mulai dan selesai wajib diisi.');
      return;
    }
    if (form.tanggalMulai > form.tanggalSelesai) {
      setError('Tanggal mulai tidak boleh setelah tanggal selesai.');
      return;
    }

    setMenyimpan(true);
    try {
      await adminFetch('/api/admin/periode', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSukses('Periode baru berhasil dibuat.');
      setForm(KOSONG);
      await muatDaftar();
    } catch (err) {
      setError(err instanceof AdminFetchError ? err.message : 'Gagal menyimpan periode.');
    } finally {
      setMenyimpan(false);
    }
  }

  async function toggleAktif(p: PeriodeApi) {
    setError('');
    try {
      await adminFetch(`/api/admin/periode/${p.id}`, {
        method: 'PUT',
        body: JSON.stringify({ aktif: !p.aktif }),
      });
      await muatDaftar();
    } catch (err) {
      setError(err instanceof AdminFetchError ? err.message : 'Gagal mengubah status periode.');
    }
  }

  async function hapus(p: PeriodeApi) {
    if (!confirm(`Hapus periode ${p.jenis} ${p.tahunAkademik}?`)) return;
    setError('');
    try {
      await adminFetch(`/api/admin/periode/${p.id}`, { method: 'DELETE' });
      await muatDaftar();
    } catch (err) {
      setError(err instanceof AdminFetchError ? err.message : 'Gagal menghapus periode.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Periode Ujian</h1>
        <p className="mt-1 text-sm text-gray-500">
          Hanya satu periode yang bisa aktif. Dashboard publik hanya menampilkan
          jadwal dari periode aktif.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">Jenis</label>
          <select
            value={form.jenis}
            onChange={(e) => setForm({ ...form, jenis: e.target.value as 'UTS' | 'UAS' })}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
          >
            <option value="UTS">UTS</option>
            <option value="UAS">UAS</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tahun akademik
          </label>
          <input
            value={form.tahunAkademik}
            onChange={(e) => setForm({ ...form, tahunAkademik: e.target.value })}
            placeholder="2026/2027"
            className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Semester</label>
          <select
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: e.target.value as 'Ganjil' | 'Genap' })}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
          >
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tanggal mulai
          </label>
          <input
            type="date"
            value={form.tanggalMulai}
            onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tanggal selesai
          </label>
          <input
            type="date"
            value={form.tanggalSelesai}
            onChange={(e) => setForm({ ...form, tanggalSelesai: e.target.value })}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
          />
        </div>
        <div className="flex items-end gap-2">
          <label className="flex min-h-[44px] items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.aktif}
              onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
            />
            Jadikan periode aktif
          </label>
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          {error && (
            <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {sukses && (
            <p className="mb-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              {sukses}
            </p>
          )}
          <button
            type="submit"
            disabled={menyimpan}
            className="min-h-[44px] rounded-lg bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {menyimpan ? 'Menyimpan...' : 'Buat Periode'}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Periode</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Tanggal</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-2 text-right font-medium text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Memuat...
                </td>
              </tr>
            )}
            {!loading && daftar.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Belum ada periode.
                </td>
              </tr>
            )}
            {daftar.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {p.jenis} {p.semester} {p.tahunAkademik}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatTanggalSingkat(keTanggalStr(p.tanggalMulai))} —{' '}
                  {formatTanggalSingkat(keTanggalStr(p.tanggalSelesai))}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.aktif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {p.aktif ? 'Aktif' : 'Arsip'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleAktif(p)}
                    className="mr-2 min-h-[36px] rounded-lg border border-gray-300 px-3 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    {p.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button
                    onClick={() => hapus(p)}
                    className="min-h-[36px] rounded-lg border border-red-200 px-3 text-xs text-red-600 hover:bg-red-50"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
