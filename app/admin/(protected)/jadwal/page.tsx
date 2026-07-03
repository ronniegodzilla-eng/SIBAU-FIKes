'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminFetch, AdminFetchError } from '@/lib/admin-fetch';
import { useToast } from '@/components/ui/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import JadwalModal from '@/components/admin/JadwalModal';
import JadwalTable from '@/components/admin/JadwalTable';
import ImportExcelModal from '@/components/admin/ImportExcelModal';
import type { JadwalUjian, Periode } from '@/lib/types';

interface PeriodeRingkas extends Pick<Periode, 'id' | 'jenis' | 'semester' | 'tahunAkademik' | 'aktif'> {}

export default function AdminJadwalPage() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [daftarPeriode, setDaftarPeriode] = useState<PeriodeRingkas[]>([]);
  const [periodeId, setPeriodeId] = useState('');
  const [daftarJadwal, setDaftarJadwal] = useState<JadwalUjian[]>([]);
  const [loading, setLoading] = useState(true);
  const [jadwalDiedit, setJadwalDiedit] = useState<JadwalUjian | null | undefined>(undefined);
  const [showImport, setShowImport] = useState(false);
  const [filterProdi, setFilterProdi] = useState('');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'belum_diisi' | 'terisi'>('semua');
  const [cari, setCari] = useState('');

  async function muatPeriode() {
    try {
      const data = await adminFetch<{ periode: PeriodeRingkas[] }>('/api/admin/periode');
      setDaftarPeriode(data.periode);
      if (!periodeId && data.periode.length > 0) {
        const aktif = data.periode.find((p) => p.aktif);
        setPeriodeId((aktif ?? data.periode[0])!.id);
      }
    } catch (err) {
      showToast(err instanceof AdminFetchError ? err.message : 'Gagal memuat periode.', 'error');
    }
  }

  async function muatJadwal(id: string) {
    if (!id) return;
    setLoading(true);
    try {
      const data = await adminFetch<{ jadwal: JadwalUjian[] }>(
        `/api/admin/jadwal?periodeId=${id}`
      );
      setDaftarJadwal(data.jadwal);
    } catch (err) {
      showToast(err instanceof AdminFetchError ? err.message : 'Gagal memuat jadwal.', 'error');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodeId]);

  const daftarProdi = useMemo(
    () => Array.from(new Set(daftarJadwal.map((j) => j.prodi))).sort(),
    [daftarJadwal]
  );

  const jadwalTersaring = daftarJadwal.filter((j) => {
    if (filterProdi && j.prodi !== filterProdi) return false;
    if (filterStatus !== 'semua' && j.status !== filterStatus) return false;
    if (cari) {
      const q = cari.toLowerCase();
      const gabungan = `${j.namaMK} ${j.kodeMK} ${j.dosenPengajar} ${j.kelas}`.toLowerCase();
      if (!gabungan.includes(q)) return false;
    }
    return true;
  });

  async function handleHapus(j: JadwalUjian) {
    const ok = await confirm(`Hapus jadwal "${j.namaMK}" (${j.kelas})?`);
    if (!ok) return;
    try {
      await adminFetch(`/api/admin/jadwal/${j.id}`, { method: 'DELETE' });
      showToast('Jadwal berhasil dihapus.', 'success');
      muatJadwal(periodeId);
    } catch (err) {
      showToast(err instanceof AdminFetchError ? err.message : 'Gagal menghapus jadwal.', 'error');
    }
  }

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap gap-2">
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari MK / dosen / kelas..."
            className="min-h-[40px] w-[220px] rounded-lg border-[1.5px] border-line px-3 text-[13px] text-ink"
          />
          <select
            value={filterProdi}
            onChange={(e) => setFilterProdi(e.target.value)}
            className="min-h-[40px] rounded-lg border-[1.5px] border-line bg-white px-3 text-[13px] text-ink"
          >
            <option value="">Semua Prodi</option>
            {daftarProdi.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="min-h-[40px] rounded-lg border-[1.5px] border-line bg-white px-3 text-[13px] text-ink"
          >
            <option value="semua">Semua Status</option>
            <option value="terisi">Terisi</option>
            <option value="belum_diisi">Belum Diisi</option>
          </select>
          <select
            value={periodeId}
            onChange={(e) => setPeriodeId(e.target.value)}
            className="min-h-[40px] rounded-lg border-[1.5px] border-line bg-white px-3 text-[13px] text-ink"
          >
            {daftarPeriode.map((p) => (
              <option key={p.id} value={p.id}>
                {p.jenis} {p.semester} {p.tahunAkademik} {p.aktif ? '(aktif)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            disabled={!periodeId}
            className="min-h-[40px] rounded-lg border-[1.5px] border-primary-600 bg-white px-3.5 text-[13px] font-bold text-primary-600 hover:bg-primary-50 disabled:opacity-50"
          >
            📥 Import Excel
          </button>
          <button
            onClick={() => setJadwalDiedit(null)}
            disabled={!periodeId}
            className="min-h-[40px] rounded-lg bg-primary-600 px-3.5 text-[13px] font-bold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            + Tambah Jadwal
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-faint">Memuat jadwal...</p>
      ) : (
        <JadwalTable daftar={jadwalTersaring} onEdit={setJadwalDiedit} onHapus={handleHapus} />
      )}

      {jadwalDiedit !== undefined && periodeId && (
        <JadwalModal
          periodeId={periodeId}
          initial={jadwalDiedit}
          onClose={() => setJadwalDiedit(undefined)}
          onSaved={() => {
            setJadwalDiedit(undefined);
            muatJadwal(periodeId);
          }}
        />
      )}

      {showImport && periodeId && (
        <ImportExcelModal
          periodeId={periodeId}
          onClose={() => setShowImport(false)}
          onImported={() => muatJadwal(periodeId)}
        />
      )}
    </div>
  );
}
