'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { adminFetch, AdminFetchError } from '@/lib/admin-fetch';
import { useToast } from '@/components/ui/ToastProvider';
import { FORMAT_NOMOR_BA_DEFAULT } from '@/lib/nomor-ba';

const KOSONG = {
  namaUniversitas: 'Universitas Ibnu Sina',
  namaFakultas: 'Fakultas Ilmu Kesehatan',
  alamat: 'Batam, Kepulauan Riau',
  logoUrl: '/logo-uis.png',
  pejabat: { nama: '', nip: '', jabatan: 'Koordinator Panitia UTS/UAS' },
  formatNomorBA: FORMAT_NOMOR_BA_DEFAULT,
};

const labelCls = 'mb-1.5 block text-xs font-bold text-label';
const inputCls =
  'box-border w-full rounded-lg border-[1.5px] border-line px-2.5 py-2.5 text-[13.5px] text-ink';

export default function AdminPengaturanPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState(KOSONG);
  const [loading, setLoading] = useState(true);
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
            alamat: data.alamat ?? KOSONG.alamat,
            logoUrl: data.logoUrl ?? KOSONG.logoUrl,
            pejabat: {
              nama: data.pejabat?.nama ?? '',
              nip: data.pejabat?.nip ?? '',
              jabatan: data.pejabat?.jabatan ?? KOSONG.pejabat.jabatan,
            },
            formatNomorBA: data.formatNomorBA ?? FORMAT_NOMOR_BA_DEFAULT,
          });
        }
      } catch {
        showToast('Gagal memuat pengaturan.', 'error');
      } finally {
        setLoading(false);
      }
    }
    muat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMenyimpan(true);
    try {
      await adminFetch('/api/admin/pengaturan', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      showToast('Pengaturan berhasil disimpan.', 'success');
    } catch (err) {
      showToast(
        err instanceof AdminFetchError ? err.message : 'Gagal menyimpan pengaturan.',
        'error'
      );
    } finally {
      setMenyimpan(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-faint">Memuat pengaturan...</p>;
  }

  return (
    <div className="max-w-[640px]">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-2xl bg-white p-[22px] shadow-[0_2px_10px_rgba(15,60,30,0.06)]"
      >
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={form.logoUrl || '/logo-uis.png'}
            alt="Logo"
            className="h-16 w-16 rounded-[10px] border border-line object-contain p-1"
          />
          <div className="flex-1">
            <label className={labelCls}>URL Logo</label>
            <input
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              placeholder="https://..."
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Nama Universitas</label>
            <input
              value={form.namaUniversitas}
              onChange={(e) => setForm({ ...form, namaUniversitas: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Nama Fakultas</label>
            <input
              value={form.namaFakultas}
              onChange={(e) => setForm({ ...form, namaFakultas: e.target.value })}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Alamat</label>
            <input
              value={form.alamat}
              onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Nama Pejabat Penandatangan</label>
            <input
              value={form.pejabat.nama}
              onChange={(e) =>
                setForm({ ...form, pejabat: { ...form.pejabat, nama: e.target.value } })
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>NIP</label>
            <input
              value={form.pejabat.nip}
              onChange={(e) =>
                setForm({ ...form, pejabat: { ...form.pejabat, nip: e.target.value } })
              }
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Jabatan</label>
            <input
              value={form.pejabat.jabatan}
              onChange={(e) =>
                setForm({ ...form, pejabat: { ...form.pejabat, jabatan: e.target.value } })
              }
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Format Nomor Berita Acara</label>
            <input
              value={form.formatNomorBA}
              onChange={(e) => setForm({ ...form, formatNomorBA: e.target.value })}
              className={`${inputCls} font-mono`}
            />
            <p className="mt-1.5 text-[11px] text-faint">
              Placeholder: {'{nomor}'}, {'{jenis}'}, {'{bulanRomawi}'}, {'{tahun}'}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={menyimpan}
          className="min-h-[40px] self-start rounded-lg bg-primary-600 px-5 text-[13.5px] font-bold text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {menyimpan ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </form>
    </div>
  );
}
