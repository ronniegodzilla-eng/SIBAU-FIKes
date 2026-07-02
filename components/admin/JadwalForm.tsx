'use client';

import { useState, type FormEvent } from 'react';
import { adminFetch, AdminFetchError } from '@/lib/admin-fetch';
import { validasiBarisJadwal } from '@/lib/validasi-jadwal';
import type { JadwalUjian } from '@/lib/types';

export interface JadwalFormNilai {
  tanggalStr: string;
  jamMulai: string;
  jamSelesai: string;
  kodeMK: string;
  namaMK: string;
  prodi: string;
  kelas: string;
  dosenPengajar: string;
  ruangan: string;
}

const KOSONG: JadwalFormNilai = {
  tanggalStr: '',
  jamMulai: '',
  jamSelesai: '',
  kodeMK: '',
  namaMK: '',
  prodi: '',
  kelas: '',
  dosenPengajar: '',
  ruangan: '',
};

export default function JadwalForm({
  periodeId,
  daftarProdi,
  jadwalDiedit,
  onSelesai,
  onBatal,
}: {
  periodeId: string;
  daftarProdi: string[];
  jadwalDiedit?: JadwalUjian | null;
  onSelesai: () => void;
  onBatal?: () => void;
}) {
  const [form, setForm] = useState<JadwalFormNilai>(
    jadwalDiedit
      ? {
          tanggalStr: jadwalDiedit.tanggalStr,
          jamMulai: jadwalDiedit.jamMulai,
          jamSelesai: jadwalDiedit.jamSelesai,
          kodeMK: jadwalDiedit.kodeMK,
          namaMK: jadwalDiedit.namaMK,
          prodi: jadwalDiedit.prodi,
          kelas: jadwalDiedit.kelas,
          dosenPengajar: jadwalDiedit.dosenPengajar,
          ruangan: jadwalDiedit.ruangan ?? '',
        }
      : KOSONG
  );
  const [error, setError] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const errorValidasi = validasiBarisJadwal(form);
    if (errorValidasi) {
      setError(errorValidasi);
      return;
    }

    setMenyimpan(true);
    try {
      if (jadwalDiedit) {
        await adminFetch(`/api/admin/jadwal/${jadwalDiedit.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await adminFetch('/api/admin/jadwal', {
          method: 'POST',
          body: JSON.stringify({ periodeId, ...form }),
        });
        setForm(KOSONG);
      }
      onSelesai();
    } catch (err) {
      setError(err instanceof AdminFetchError ? err.message : 'Gagal menyimpan jadwal.');
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700">Tanggal</label>
        <input
          type="date"
          value={form.tanggalStr}
          onChange={(e) => setForm({ ...form, tanggalStr: e.target.value })}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Jam mulai</label>
        <input
          type="time"
          value={form.jamMulai}
          onChange={(e) => setForm({ ...form, jamMulai: e.target.value })}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Jam selesai</label>
        <input
          type="time"
          value={form.jamSelesai}
          onChange={(e) => setForm({ ...form, jamSelesai: e.target.value })}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Kode MK</label>
        <input
          value={form.kodeMK}
          onChange={(e) => setForm({ ...form, kodeMK: e.target.value })}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700">Nama MK</label>
        <input
          value={form.namaMK}
          onChange={(e) => setForm({ ...form, namaMK: e.target.value })}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Prodi</label>
        <input
          list="daftar-prodi"
          value={form.prodi}
          onChange={(e) => setForm({ ...form, prodi: e.target.value })}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
        />
        <datalist id="daftar-prodi">
          {daftarProdi.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Kelas</label>
        <input
          value={form.kelas}
          onChange={(e) => setForm({ ...form, kelas: e.target.value })}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700">
          Dosen pengajar
        </label>
        <input
          value={form.dosenPengajar}
          onChange={(e) => setForm({ ...form, dosenPengajar: e.target.value })}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Ruangan (opsional)
        </label>
        <input
          value={form.ruangan}
          onChange={(e) => setForm({ ...form, ruangan: e.target.value })}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
        />
      </div>

      <div className="sm:col-span-2 lg:col-span-4">
        {error && (
          <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={menyimpan}
            className="min-h-[44px] rounded-lg bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {menyimpan ? 'Menyimpan...' : jadwalDiedit ? 'Simpan Perubahan' : 'Tambah Jadwal'}
          </button>
          {jadwalDiedit && onBatal && (
            <button
              type="button"
              onClick={onBatal}
              className="min-h-[44px] rounded-lg border border-gray-300 px-4 text-sm text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
