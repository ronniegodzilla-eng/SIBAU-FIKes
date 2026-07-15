'use client';

import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { adminFetch, AdminFetchError } from '@/lib/admin-fetch';
import { useToast } from '@/components/ui/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { formatTanggalSingkat } from '@/lib/tanggal';
import { DAFTAR_PRODI } from '@/lib/prodi';
import type { BeritaAcaraSusulan, JadwalUjian, Periode } from '@/lib/types';

interface PeriodeRingkas extends Pick<Periode, 'id' | 'jenis' | 'semester' | 'tahunAkademik' | 'aktif'> {}

export default function AdminRekapPage() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [daftarPeriode, setDaftarPeriode] = useState<PeriodeRingkas[]>([]);
  const [periodeId, setPeriodeId] = useState('');
  const [daftarJadwal, setDaftarJadwal] = useState<JadwalUjian[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTanggal, setFilterTanggal] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'belum_diisi' | 'terisi'>('semua');
  const [cari, setCari] = useState('');
  const [memproses, setMemproses] = useState<string | null>(null);

  const [daftarSusulan, setDaftarSusulan] = useState<BeritaAcaraSusulan[]>([]);
  const [loadingSusulan, setLoadingSusulan] = useState(true);
  const [filterProdiSusulan, setFilterProdiSusulan] = useState('');
  const [memprosesSusulan, setMemprosesSusulan] = useState<string | null>(null);

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
      const data = await adminFetch<{ jadwal: JadwalUjian[] }>(`/api/admin/jadwal?periodeId=${id}`);
      setDaftarJadwal(data.jadwal);
    } catch (err) {
      showToast(err instanceof AdminFetchError ? err.message : 'Gagal memuat rekap.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muatPeriode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function muatSusulan(id: string) {
    if (!id) return;
    setLoadingSusulan(true);
    try {
      const data = await adminFetch<{ susulan: BeritaAcaraSusulan[] }>(
        `/api/admin/berita-acara-susulan?periodeId=${id}`
      );
      setDaftarSusulan(data.susulan);
    } catch (err) {
      showToast(
        err instanceof AdminFetchError ? err.message : 'Gagal memuat rekap ujian susulan.',
        'error'
      );
    } finally {
      setLoadingSusulan(false);
    }
  }

  useEffect(() => {
    if (periodeId) {
      muatJadwal(periodeId);
      muatSusulan(periodeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const tersaringSusulan = useMemo(() => {
    if (!filterProdiSusulan) return daftarSusulan;
    return daftarSusulan.filter((s) => s.prodi === filterProdiSusulan);
  }, [daftarSusulan, filterProdiSusulan]);

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
      'Mahasiswa Terdaftar': j.pesertaTerdaftar ?? '-',
      'Mahasiswa Hadir': j.pesertaHadir ?? '-',
      'Pengawas 1': j.pengawas1 ?? '-',
      'Pengawas 2': j.pengawas2 ?? '-',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap');
    XLSX.writeFile(wb, `rekap-jadwal-ujian-${periodeId}.xlsx`);
    showToast('Rekap berhasil diekspor ke Excel.', 'success');
  }

  function exportExcelSusulan() {
    const rows = tersaringSusulan.map((s) => ({
      Tanggal: s.tanggalStr,
      Jam: `${s.jamMulaiAktual}-${s.jamSelesaiAktual}`,
      'Kode MK': s.kodeMK,
      'Nama MK': s.namaMK,
      Prodi: s.prodi,
      Kelas: s.kelas,
      'Dosen Pengajar': s.dosenPengajar,
      Ruangan: s.ruangan ?? '-',
      'Nomor BA': s.nomorBA,
      'Mahasiswa Terdaftar': s.pesertaTerdaftar,
      'Mahasiswa Hadir': s.pesertaHadir,
      'Pengawas 1': s.pengawas1,
      'Pengawas 2': s.pengawas2 ?? '-',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ujian Susulan');
    XLSX.writeFile(wb, `rekap-ujian-susulan-${periodeId}.xlsx`);
    showToast('Rekap ujian susulan berhasil diekspor ke Excel.', 'success');
  }

  async function bukaKunciSusulan(s: BeritaAcaraSusulan) {
    const ok = await confirm(`Buka kunci berita acara susulan ${s.namaMK} agar dapat diedit ulang?`);
    if (!ok) return;
    setMemprosesSusulan(s.id);
    try {
      await adminFetch(`/api/admin/berita-acara-susulan/${s.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ aksi: 'unlock' }),
      });
      showToast('Berita acara susulan berhasil dibuka kuncinya.', 'success');
      await muatSusulan(periodeId);
    } catch (err) {
      showToast(
        err instanceof AdminFetchError ? err.message : 'Gagal membuka kunci berita acara susulan.',
        'error'
      );
    } finally {
      setMemprosesSusulan(null);
    }
  }

  async function hapusSusulan(s: BeritaAcaraSusulan) {
    const ok = await confirm(`Hapus berita acara susulan ${s.namaMK}?`);
    if (!ok) return;
    setMemprosesSusulan(s.id);
    try {
      await adminFetch(`/api/admin/berita-acara-susulan/${s.id}`, { method: 'DELETE' });
      showToast('Berita acara susulan berhasil dihapus.', 'success');
      await muatSusulan(periodeId);
    } catch (err) {
      showToast(
        err instanceof AdminFetchError ? err.message : 'Gagal menghapus berita acara susulan.',
        'error'
      );
    } finally {
      setMemprosesSusulan(null);
    }
  }

  async function bukaKunci(j: JadwalUjian) {
    if (!j.beritaAcaraId) return;
    const ok = await confirm(`Buka kunci berita acara ${j.namaMK} agar dapat diedit ulang?`);
    if (!ok) return;
    setMemproses(j.id);
    try {
      await adminFetch(`/api/admin/berita-acara/${j.beritaAcaraId}`, {
        method: 'PATCH',
        body: JSON.stringify({ aksi: 'unlock' }),
      });
      showToast('Berita acara berhasil dibuka kuncinya.', 'success');
      await muatJadwal(periodeId);
    } catch (err) {
      showToast(
        err instanceof AdminFetchError ? err.message : 'Gagal membuka kunci berita acara.',
        'error'
      );
    } finally {
      setMemproses(null);
    }
  }

  async function hapusBA(j: JadwalUjian) {
    if (!j.beritaAcaraId) return;
    const ok = await confirm(
      `Hapus berita acara ${j.namaMK}? Status jadwal akan kembali menjadi "Belum Diisi".`
    );
    if (!ok) return;
    setMemproses(j.id);
    try {
      await adminFetch(`/api/admin/berita-acara/${j.beritaAcaraId}`, { method: 'DELETE' });
      showToast('Berita acara berhasil dihapus.', 'success');
      await muatJadwal(periodeId);
    } catch (err) {
      showToast(
        err instanceof AdminFetchError ? err.message : 'Gagal menghapus berita acara.',
        'error'
      );
    } finally {
      setMemproses(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(15,60,30,0.06)]">
          <div className="text-[11px] font-bold text-faint">TOTAL</div>
          <div className="text-[22px] font-extrabold text-ink">{ringkasan.total}</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(15,60,30,0.06)]">
          <div className="text-[11px] font-bold text-faint">TERISI</div>
          <div className="text-[22px] font-extrabold text-success-text">{ringkasan.terisi}</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(15,60,30,0.06)]">
          <div className="text-[11px] font-bold text-faint">BELUM</div>
          <div className="text-[22px] font-extrabold text-danger-text">{ringkasan.belum}</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(15,60,30,0.06)]">
          <div className="text-[11px] font-bold text-faint">KELENGKAPAN</div>
          <div className="text-[22px] font-extrabold text-primary-600">{ringkasan.persentase}%</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap gap-2">
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari MK / dosen..."
            className="min-h-[40px] w-[200px] rounded-lg border-[1.5px] border-line px-3 text-[13px] text-ink"
          />
          <input
            type="date"
            value={filterTanggal}
            onChange={(e) => setFilterTanggal(e.target.value)}
            className="min-h-[40px] rounded-lg border-[1.5px] border-line px-3 text-[13px] text-ink"
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
        <button
          onClick={exportExcel}
          disabled={tersaring.length === 0}
          className="min-h-[40px] whitespace-nowrap rounded-lg bg-primary-600 px-3.5 text-[13px] font-bold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          ⬇ Export Excel
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-faint">Memuat rekap...</p>
      ) : (
        <div className="overflow-auto rounded-2xl bg-white shadow-[0_2px_10px_rgba(15,60,30,0.06)]">
          <table className="w-full min-w-[950px] border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-app">
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted">TANGGAL</th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted">MK</th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted">PRODI/KELAS</th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted">STATUS</th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted">MAHASISWA</th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted">PENGAWAS</th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted">NOMOR BA</th>
                <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold text-muted">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {tersaring.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3.5 py-6 text-center text-faint">
                    Tidak ada data.
                  </td>
                </tr>
              )}
              {tersaring.map((j) => (
                <tr key={j.id} className="border-t border-line-soft">
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-body">
                    {formatTanggalSingkat(j.tanggalStr)} · {j.jamMulai}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <div className="font-bold text-ink">{j.namaMK}</div>
                    <div className="text-[11px] text-faint">{j.kodeMK}</div>
                  </td>
                  <td className="px-3.5 py-2.5 text-body">{j.prodi} / {j.kelas}</td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                        j.status === 'terisi'
                          ? 'bg-success-bg text-success-text'
                          : 'bg-danger-bg text-danger-text'
                      }`}
                    >
                      {j.status === 'terisi' ? 'Terisi' : 'Belum Diisi'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-body">
                    {j.pesertaTerdaftar != null ? (
                      <>
                        <div>Terdaftar: {j.pesertaTerdaftar}</div>
                        <div className="text-[11px] text-faint">Hadir: {j.pesertaHadir ?? 0}</div>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-body">
                    {j.pengawas1 ? (
                      <>
                        <div>{j.pengawas1}</div>
                        {j.pengawas2 && <div className="text-[11px] text-faint">{j.pengawas2}</div>}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-[11.5px] text-body">{j.nomorBA ?? '—'}</td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-right">
                    {j.status === 'terisi' && j.beritaAcaraId ? (
                      <div className="flex justify-end gap-1.5">
                        <a
                          href={`/berita-acara/${j.beritaAcaraId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="min-h-[30px] rounded-lg border border-line-strong px-2.5 py-1 text-[11px] font-bold text-body hover:bg-app"
                        >
                          Lihat
                        </a>
                        <button
                          onClick={() => bukaKunci(j)}
                          disabled={memproses === j.id}
                          className="min-h-[30px] rounded-lg border border-warn-border px-2.5 py-1 text-[11px] font-bold text-warn-text hover:bg-warn-bg disabled:opacity-50"
                        >
                          Unlock
                        </button>
                        <button
                          onClick={() => hapusBA(j)}
                          disabled={memproses === j.id}
                          className="min-h-[30px] rounded-lg border border-danger-border px-2.5 py-1 text-[11px] font-bold text-danger-text hover:bg-danger-softbg disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-faint">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <div className="text-[15px] font-extrabold text-ink">Rekap Ujian Susulan</div>
          <p className="text-[11.5px] text-faint">
            Berita acara insidental yang diinput lewat halaman publik &quot;Ujian Susulan&quot;.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterProdiSusulan}
            onChange={(e) => setFilterProdiSusulan(e.target.value)}
            className="min-h-[40px] rounded-lg border-[1.5px] border-line bg-white px-3 text-[13px] text-ink"
          >
            <option value="">Semua Prodi</option>
            {DAFTAR_PRODI.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            onClick={exportExcelSusulan}
            disabled={tersaringSusulan.length === 0}
            className="min-h-[40px] whitespace-nowrap rounded-lg bg-primary-600 px-3.5 text-[13px] font-bold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            ⬇ Export Excel
          </button>
        </div>
      </div>

      {loadingSusulan ? (
        <p className="text-sm text-faint">Memuat rekap ujian susulan...</p>
      ) : (
        <div className="overflow-auto rounded-2xl bg-white shadow-[0_2px_10px_rgba(15,60,30,0.06)]">
          <table className="w-full min-w-[950px] border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-app">
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted">TANGGAL</th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted">MK</th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted">PRODI/KELAS</th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted">MAHASISWA</th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted">PENGAWAS</th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted">NOMOR BA</th>
                <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold text-muted">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {tersaringSusulan.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3.5 py-6 text-center text-faint">
                    Tidak ada data ujian susulan.
                  </td>
                </tr>
              )}
              {tersaringSusulan.map((s) => (
                <tr key={s.id} className="border-t border-line-soft">
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-body">
                    {formatTanggalSingkat(s.tanggalStr)} · {s.jamMulaiAktual}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <div className="font-bold text-ink">{s.namaMK}</div>
                    <div className="text-[11px] text-faint">{s.kodeMK}</div>
                  </td>
                  <td className="px-3.5 py-2.5 text-body">{s.prodi} / {s.kelas}</td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-body">
                    <div>Terdaftar: {s.pesertaTerdaftar}</div>
                    <div className="text-[11px] text-faint">Hadir: {s.pesertaHadir}</div>
                  </td>
                  <td className="px-3.5 py-2.5 text-body">
                    <div>{s.pengawas1}</div>
                    {s.pengawas2 && <div className="text-[11px] text-faint">{s.pengawas2}</div>}
                  </td>
                  <td className="px-3.5 py-2.5 text-[11.5px] text-body">{s.nomorBA}</td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      <a
                        href={`/berita-acara-susulan/${s.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="min-h-[30px] rounded-lg border border-line-strong px-2.5 py-1 text-[11px] font-bold text-body hover:bg-app"
                      >
                        Lihat
                      </a>
                      <button
                        onClick={() => bukaKunciSusulan(s)}
                        disabled={memprosesSusulan === s.id}
                        className="min-h-[30px] rounded-lg border border-warn-border px-2.5 py-1 text-[11px] font-bold text-warn-text hover:bg-warn-bg disabled:opacity-50"
                      >
                        Unlock
                      </button>
                      <button
                        onClick={() => hapusSusulan(s)}
                        disabled={memprosesSusulan === s.id}
                        className="min-h-[30px] rounded-lg border border-danger-border px-2.5 py-1 text-[11px] font-bold text-danger-text hover:bg-danger-softbg disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
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
