'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastProvider';
import { adminFetch, AdminFetchError } from '@/lib/admin-fetch';
import { validasiBarisJadwal } from '@/lib/validasi-jadwal';
import type { JadwalUjian } from '@/lib/types';

const labelCls = 'mb-1.5 block text-xs font-bold text-label';
const inputCls =
  'box-border w-full rounded-lg border-[1.5px] border-line px-2.5 py-2.5 text-[13.5px] text-ink';

interface JadwalModalNilai {
  id?: string;
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

export default function JadwalModal({
  periodeId,
  daftarProdi,
  initial,
  onClose,
  onSaved,
}: {
  periodeId: string;
  daftarProdi: string[];
  initial: JadwalUjian | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState<JadwalModalNilai>(
    initial
      ? {
          id: initial.id,
          tanggalStr: initial.tanggalStr,
          jamMulai: initial.jamMulai,
          jamSelesai: initial.jamSelesai,
          kodeMK: initial.kodeMK,
          namaMK: initial.namaMK,
          prodi: initial.prodi,
          kelas: initial.kelas,
          dosenPengajar: initial.dosenPengajar,
          ruangan: initial.ruangan ?? '',
        }
      : {
          tanggalStr: '',
          jamMulai: '08:00',
          jamSelesai: '09:40',
          kodeMK: '',
          namaMK: '',
          prodi: daftarProdi[0] ?? '',
          kelas: '',
          dosenPengajar: '',
          ruangan: '',
        }
  );
  const [error, setError] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);

  async function handleSave() {
    setError('');
    const errorValidasi = validasiBarisJadwal(form);
    if (errorValidasi) {
      setError(errorValidasi);
      return;
    }

    setMenyimpan(true);
    try {
      if (form.id) {
        await adminFetch(`/api/admin/jadwal/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        showToast('Jadwal berhasil diperbarui.', 'success');
      } else {
        await adminFetch('/api/admin/jadwal', {
          method: 'POST',
          body: JSON.stringify({ periodeId, ...form }),
        });
        showToast('Jadwal berhasil ditambahkan.', 'success');
      }
      onSaved();
    } catch (err) {
      setError(err instanceof AdminFetchError ? err.message : 'Gagal menyimpan jadwal.');
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <Modal title={form.id ? 'Edit Jadwal' : 'Tambah Jadwal'} onClose={onClose} maxWidthClass="max-w-[560px]">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Tanggal</label>
          <input
            type="date"
            value={form.tanggalStr}
            onChange={(e) => setForm({ ...form, tanggalStr: e.target.value })}
            className={inputCls}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className={labelCls}>Jam Mulai</label>
            <input
              type="time"
              value={form.jamMulai}
              onChange={(e) => setForm({ ...form, jamMulai: e.target.value })}
              className={inputCls}
            />
          </div>
          <div className="flex-1">
            <label className={labelCls}>Jam Selesai</label>
            <input
              type="time"
              value={form.jamSelesai}
              onChange={(e) => setForm({ ...form, jamSelesai: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Kode MK</label>
          <input
            value={form.kodeMK}
            onChange={(e) => setForm({ ...form, kodeMK: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Nama MK</label>
          <input
            value={form.namaMK}
            onChange={(e) => setForm({ ...form, namaMK: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Prodi</label>
          <input
            list="daftar-prodi-modal"
            value={form.prodi}
            onChange={(e) => setForm({ ...form, prodi: e.target.value })}
            className={inputCls}
          />
          <datalist id="daftar-prodi-modal">
            {daftarProdi.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={labelCls}>Kelas</label>
          <input
            value={form.kelas}
            onChange={(e) => setForm({ ...form, kelas: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Dosen Pengajar</label>
          <input
            value={form.dosenPengajar}
            onChange={(e) => setForm({ ...form, dosenPengajar: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Ruangan</label>
          <input
            value={form.ruangan}
            onChange={(e) => setForm({ ...form, ruangan: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>

      {error && <p className="mt-3 text-xs font-semibold text-danger-accent">{error}</p>}

      <div className="mt-5 flex justify-end gap-2.5">
        <button
          onClick={onClose}
          className="min-h-[40px] rounded-lg border-[1.5px] border-line-strong bg-white px-4 text-[13.5px] font-semibold text-body"
        >
          Batal
        </button>
        <button
          onClick={handleSave}
          disabled={menyimpan}
          className="min-h-[40px] rounded-lg bg-primary-600 px-4 text-[13.5px] font-bold text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {menyimpan ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </Modal>
  );
}
