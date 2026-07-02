'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminFetch, AdminFetchError } from '@/lib/admin-fetch';
import JadwalForm from '@/components/admin/JadwalForm';
import JadwalTable from '@/components/admin/JadwalTable';
import ImportExcelModal from '@/components/admin/ImportExcelModal';
import type { JadwalUjian, Periode } from '@/lib/types';

interface PeriodeRingkas extends Pick<Periode, 'id' | 'jenis' | 'semester' | 'tahunAkademik' | 'aktif'> {}

export default function AdminJadwalPage() {
  const [daftarPeriode, setDaftarPeriode] = useState<PeriodeRingkas[]>([]);
  const [periodeId, setPeriodeId] = useState('');
  const [daftarJadwal, setDaftarJadwal] = useState<JadwalUjian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [jadwalDiedit, setJadwalDiedit] = useState<JadwalUjian | null>(null);
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
      setError(err instanceof AdminFetchError ? err.message : 'Gagal memuat periode.');
    }
  }

  async function muatJadwal(id: string) {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch<{ jadwal: JadwalUjian[] }>(
        `/api/admin/jadwal?periodeId=${id}`
      );
      setDaftarJadwal(data.jadwal);
    } catch (err) {
      setError(err instanceof AdminFetchError ? err.message : 'Gagal memuat jadwal.');
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

  const jadwalTersaring = useMemo(() => {
    return daftarJadwal.filter((j) => {
      if (filterProdi && j.prodi !== filterProdi) return false;
      if (filterStatus !== 'semua' && j.status !== filterStatus) return false;
      if (cari) {
        const q = cari.toLowerCase();
        const gabungan = `${j.namaMK} ${j.kodeMK} ${j.dosenPengajar} ${j.kelas}`.toLowerCase();
        if (!gabungan.includes(q)) return false;
      }
      return true;
    });
  }, [daftarJadwal, filterProdi, filterStatus, cari]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Jadwal Ujian</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola jadwal per periode. Jadwal yang sudah punya berita acara tidak
            bisa diubah/dihapus langsung.
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
            onClick={() => setShowImport(true)}
            disabled={!periodeId}
            className="min-h-[44px] rounded-lg border border-gray-300 px-4 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Import Excel
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {periodeId && (
        <JadwalForm
          key={jadwalDiedit?.id ?? 'baru'}
          periodeId={periodeId}
          daftarProdi={daftarProdi}
          jadwalDiedit={jadwalDiedit}
          onSelesai={() => {
            setJadwalDiedit(null);
            muatJadwal(periodeId);
          }}
          onBatal={() => setJadwalDiedit(null)}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari MK, kode, dosen, kelas..."
          className="min-h-[44px] flex-1 rounded-lg border border-gray-300 px-3 text-sm"
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
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Memuat jadwal...</p>
      ) : (
        <JadwalTable
          daftar={jadwalTersaring}
          onEdit={setJadwalDiedit}
          onHapus={async (j) => {
            if (!confirm(`Hapus jadwal ${j.namaMK} (${j.kelas})?`)) return;
            try {
              await adminFetch(`/api/admin/jadwal/${j.id}`, { method: 'DELETE' });
              muatJadwal(periodeId);
            } catch (err) {
              setError(err instanceof AdminFetchError ? err.message : 'Gagal menghapus jadwal.');
            }
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
