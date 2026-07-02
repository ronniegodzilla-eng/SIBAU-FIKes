'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { adminFetch, AdminFetchError } from '@/lib/admin-fetch';
import { FORMAT_NOMOR_BA_DEFAULT } from '@/lib/nomor-ba';

const KOSONG = {
  namaUniversitas: 'Universitas Ibnu Sina',
  namaFakultas: 'Fakultas Ilmu Kesehatan',
  logoUrl: '',
  pejabat: { nama: '', nip: '', jabatan: 'Koordinator Panitia UTS/UAS' },
  formatNomorBA: FORMAT_NOMOR_BA_DEFAULT,
};

export default function AdminPengaturanPage() {
  const [form, setForm] = useState(KOSONG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sukses, setSukses] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    async function muat() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'app'));
        if (snap.exists()) {
          const data = snap.data();
          setForm({
            namaUniversitas: data.namaUniversitas ?? KOSONG.namaUniversitas,
            namaFakultas: data.namaFakultas ?? KOSONG.namaFakultas,
            logoUrl: data.logoUrl ?? '',
            pejabat: {
              nama: data.pejabat?.nama ?? '',
              nip: data.pejabat?.nip ?? '',
              jabatan: data.pejabat?.jabatan ?? KOSONG.pejabat.jabatan,
            },
            formatNomorBA: data.formatNomorBA ?? FORMAT_NOMOR_BA_DEFAULT,
          });
        }
      } catch {
        setError('Gagal memuat pengaturan.');
      } finally {
        setLoading(false);
      }
    }
    muat();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSukses('');
    setMenyimpan(true);
    try {
      await adminFetch('/api/admin/pengaturan', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setSukses('Pengaturan berhasil disimpan.');
    } catch (err) {
      setError(err instanceof AdminFetchError ? err.message : 'Gagal menyimpan pengaturan.');
    } finally {
      setMenyimpan(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Memuat pengaturan...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Pengaturan Aplikasi</h1>
        <p className="mt-1 text-sm text-gray-500">
          Data ini dipakai untuk kop dan tanda tangan pada PDF berita acara.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">Nama universitas</label>
          <input
            value={form.namaUniversitas}
            onChange={(e) => setForm({ ...form, namaUniversitas: e.target.value })}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nama fakultas</label>
          <input
            value={form.namaFakultas}
            onChange={(e) => setForm({ ...form, namaFakultas: e.target.value })}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            URL logo (opsional)
          </label>
          <input
            value={form.logoUrl}
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
            placeholder="https://..."
            className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nama pejabat penandatangan
          </label>
          <input
            value={form.pejabat.nama}
            onChange={(e) => setForm({ ...form, pejabat: { ...form.pejabat, nama: e.target.value } })}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">NIP</label>
          <input
            value={form.pejabat.nip}
            onChange={(e) => setForm({ ...form, pejabat: { ...form.pejabat, nip: e.target.value } })}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Jabatan</label>
          <input
            value={form.pejabat.jabatan}
            onChange={(e) => setForm({ ...form, pejabat: { ...form.pejabat, jabatan: e.target.value } })}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Format nomor berita acara
          </label>
          <input
            value={form.formatNomorBA}
            onChange={(e) => setForm({ ...form, formatNomorBA: e.target.value })}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm font-mono"
          />
          <p className="mt-1 text-xs text-gray-400">
            Placeholder: {'{nomor}'}, {'{jenis}'}, {'{bulanRomawi}'}, {'{tahun}'}
          </p>
        </div>

        <div className="sm:col-span-2">
          {error && (
            <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
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
            {menyimpan ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  );
}
