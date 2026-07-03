'use client';

import { useEffect, useState } from 'react';
import { adminFetch, AdminFetchError } from '@/lib/admin-fetch';
import { useToast } from '@/components/ui/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import PeriodeModal, { type PeriodeModalData } from '@/components/admin/PeriodeModal';
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

export default function AdminPeriodePage() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [daftar, setDaftar] = useState<PeriodeApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState<PeriodeModalData | null | undefined>(undefined);

  async function muatDaftar() {
    setLoading(true);
    try {
      const data = await adminFetch<{ periode: PeriodeApi[] }>('/api/admin/periode');
      setDaftar(data.periode);
    } catch (err) {
      showToast(err instanceof AdminFetchError ? err.message : 'Gagal memuat periode.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muatDaftar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleAktif(p: PeriodeApi) {
    try {
      await adminFetch(`/api/admin/periode/${p.id}`, {
        method: 'PUT',
        body: JSON.stringify({ aktif: !p.aktif }),
      });
      showToast('Periode aktif diperbarui.', 'success');
      await muatDaftar();
    } catch (err) {
      showToast(
        err instanceof AdminFetchError ? err.message : 'Gagal mengubah status periode.',
        'error'
      );
    }
  }

  async function hapus(p: PeriodeApi) {
    const ok = await confirm(`Hapus periode ${p.jenis} ${p.semester} ${p.tahunAkademik}?`);
    if (!ok) return;
    try {
      await adminFetch(`/api/admin/periode/${p.id}`, { method: 'DELETE' });
      showToast('Periode berhasil dihapus.', 'success');
      await muatDaftar();
    } catch (err) {
      showToast(err instanceof AdminFetchError ? err.message : 'Gagal menghapus periode.', 'error');
    }
  }

  return (
    <div>
      <div className="mb-3.5 flex justify-end">
        <button
          onClick={() => setModalData(null)}
          className="min-h-[40px] rounded-lg bg-primary-600 px-4 text-[13px] font-bold text-white hover:bg-primary-700"
        >
          + Tambah Periode
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_rgba(15,60,30,0.06)]">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-app">
              <th className="px-4 py-2.5 text-left text-[11.5px] font-semibold text-muted">PERIODE</th>
              <th className="px-4 py-2.5 text-left text-[11.5px] font-semibold text-muted">MULAI</th>
              <th className="px-4 py-2.5 text-left text-[11.5px] font-semibold text-muted">SELESAI</th>
              <th className="px-4 py-2.5 text-left text-[11.5px] font-semibold text-muted">STATUS</th>
              <th className="px-4 py-2.5 text-right text-[11.5px] font-semibold text-muted">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-faint">
                  Memuat...
                </td>
              </tr>
            )}
            {!loading && daftar.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-faint">
                  Belum ada periode.
                </td>
              </tr>
            )}
            {daftar.map((p) => (
              <tr key={p.id} className="border-t border-line-soft">
                <td className="px-4 py-3 font-bold text-ink">
                  {p.jenis} {p.semester} {p.tahunAkademik}
                </td>
                <td className="px-4 py-3 text-body">{formatTanggalSingkat(keTanggalStr(p.tanggalMulai))}</td>
                <td className="px-4 py-3 text-body">{formatTanggalSingkat(keTanggalStr(p.tanggalSelesai))}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      p.aktif ? 'bg-success-bg text-success-text' : 'bg-line-soft text-subtle'
                    }`}
                  >
                    {p.aktif ? 'Aktif' : 'Arsip'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() =>
                      setModalData({
                        id: p.id,
                        jenis: p.jenis,
                        semester: p.semester,
                        tahunAkademik: p.tahunAkademik,
                        tanggalMulai: keTanggalStr(p.tanggalMulai),
                        tanggalSelesai: keTanggalStr(p.tanggalSelesai),
                        aktif: p.aktif,
                      })
                    }
                    className="mr-1.5 min-h-[32px] rounded-lg border border-line-strong px-2.5 text-[11.5px] font-bold text-body hover:bg-app"
                  >
                    Edit
                  </button>
                  {!p.aktif && (
                    <button
                      onClick={() => toggleAktif(p)}
                      className="mr-1.5 min-h-[32px] rounded-lg border border-primary-600 bg-primary-50 px-2.5 text-[11.5px] font-bold text-primary-600 hover:bg-primary-100"
                    >
                      Jadikan Aktif
                    </button>
                  )}
                  <button
                    onClick={() => hapus(p)}
                    className="min-h-[32px] rounded-lg border border-danger-border px-2.5 text-[11.5px] font-bold text-danger-text hover:bg-danger-softbg"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalData !== undefined && (
        <PeriodeModal
          initial={modalData}
          onClose={() => setModalData(undefined)}
          onSaved={() => {
            setModalData(undefined);
            muatDaftar();
          }}
        />
      )}
    </div>
  );
}
