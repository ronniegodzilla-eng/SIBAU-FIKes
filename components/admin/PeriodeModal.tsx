'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastProvider';
import { adminFetch, AdminFetchError } from '@/lib/admin-fetch';
import { hariIniStrWIB } from '@/lib/tanggal';

const labelCls = 'mb-1.5 block text-xs font-bold text-label';
const inputCls =
  'box-border w-full rounded-lg border-[1.5px] border-line px-2.5 py-2.5 text-[13.5px] text-ink';

export interface PeriodeModalData {
  id?: string;
  jenis: 'UTS' | 'UAS';
  semester: 'Ganjil' | 'Genap';
  tahunAkademik: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  aktif: boolean;
}

export default function PeriodeModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: PeriodeModalData | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState<PeriodeModalData>(
    initial ?? {
      jenis: 'UAS',
      semester: 'Genap',
      tahunAkademik: '',
      tanggalMulai: hariIniStrWIB(),
      tanggalSelesai: hariIniStrWIB(),
      aktif: false,
    }
  );
  const [menyimpan, setMenyimpan] = useState(false);

  async function handleSave() {
    if (!/^\d{4}\/\d{4}$/.test(form.tahunAkademik)) {
      showToast('Tahun akademik harus berformat "2026/2027".', 'error');
      return;
    }
    if (form.tanggalMulai > form.tanggalSelesai) {
      showToast('Tanggal mulai tidak boleh setelah tanggal selesai.', 'error');
      return;
    }

    setMenyimpan(true);
    try {
      if (form.id) {
        await adminFetch(`/api/admin/periode/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        showToast('Periode berhasil diperbarui.', 'success');
      } else {
        await adminFetch('/api/admin/periode', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        showToast('Periode berhasil ditambahkan.', 'success');
      }
      onSaved();
    } catch (err) {
      showToast(
        err instanceof AdminFetchError ? err.message : 'Gagal menyimpan periode.',
        'error'
      );
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <Modal title={form.id ? 'Edit Periode' : 'Tambah Periode'} onClose={onClose} maxWidthClass="max-w-[460px]">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Jenis</label>
          <select
            value={form.jenis}
            onChange={(e) => setForm({ ...form, jenis: e.target.value as 'UTS' | 'UAS' })}
            className={`${inputCls} bg-white`}
          >
            <option value="UTS">UTS</option>
            <option value="UAS">UAS</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Semester</label>
          <select
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: e.target.value as 'Ganjil' | 'Genap' })}
            className={`${inputCls} bg-white`}
          >
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Tahun Akademik</label>
          <input
            value={form.tahunAkademik}
            onChange={(e) => setForm({ ...form, tahunAkademik: e.target.value })}
            placeholder="2026/2027"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Tanggal Mulai</label>
          <input
            type="date"
            value={form.tanggalMulai}
            onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Tanggal Selesai</label>
          <input
            type="date"
            value={form.tanggalSelesai}
            onChange={(e) => setForm({ ...form, tanggalSelesai: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>

      <label className="mt-3.5 flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-label">
        <input
          type="checkbox"
          checked={form.aktif}
          onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
        />
        Jadikan periode aktif (periode lain otomatis diarsipkan)
      </label>

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
