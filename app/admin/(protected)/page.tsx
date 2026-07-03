'use client';

import { useEffect, useState } from 'react';
import { adminFetch, AdminFetchError } from '@/lib/admin-fetch';
import { formatTanggalSingkat, hariIniStrWIB, labelTertunggak } from '@/lib/tanggal';
import type { AuditLog, JadwalUjian, Periode } from '@/lib/types';

const LABEL_AKSI: Record<string, string> = {
  submit_ba: 'Berita acara disimpan',
  edit_ba: 'Berita acara diedit',
  unlock_ba: 'Berita acara dibuka kuncinya',
  hapus_ba: 'Berita acara dihapus',
  submit_ba_susulan: 'Berita acara susulan disimpan',
  unlock_ba_susulan: 'Berita acara susulan dibuka kuncinya',
  hapus_ba_susulan: 'Berita acara susulan dihapus',
  crud_jadwal: 'Jadwal diubah',
  import_jadwal: 'Jadwal diimpor',
  crud_periode: 'Periode diubah',
  update_pengaturan: 'Pengaturan diperbarui',
  login_admin: 'Admin login',
  buat_co_admin: 'Co-admin ditambahkan',
  hapus_co_admin: 'Co-admin dihapus',
};

interface AuditLogApi extends Omit<AuditLog, 'timestamp'> {
  timestamp: { _seconds: number } | string;
}

export default function AdminRingkasanPage() {
  const [periodeAktif, setPeriodeAktif] = useState<Periode | null | undefined>(undefined);
  const [jadwal, setJadwal] = useState<JadwalUjian[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogApi[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function muat() {
      try {
        const dataPeriode = await adminFetch<{ periode: Periode[] }>('/api/admin/periode');
        const aktif = dataPeriode.periode.find((p) => p.aktif) ?? null;
        setPeriodeAktif(aktif);
        if (aktif) {
          const dataJadwal = await adminFetch<{ jadwal: JadwalUjian[] }>(
            `/api/admin/jadwal?periodeId=${aktif.id}`
          );
          setJadwal(dataJadwal.jadwal);
        }
        const dataAudit = await adminFetch<{ log: AuditLogApi[] }>(
          '/api/admin/audit-log?limit=6'
        );
        setAuditLog(dataAudit.log);
      } catch (err) {
        setError(err instanceof AdminFetchError ? err.message : 'Gagal memuat ringkasan.');
      }
    }
    muat();
  }, []);

  const total = jadwal.length;
  const terisi = jadwal.filter((j) => j.status === 'terisi').length;
  const persentase = total > 0 ? Math.round((terisi / total) * 100) : 0;

  const backlogTop = jadwal
    .filter((j) => j.status === 'belum_diisi' && j.tanggalStr <= hariIniStrWIB())
    .sort((a, b) => a.tanggalStr.localeCompare(b.tanggalStr))
    .slice(0, 5);

  function waktuAudit(ts: AuditLogApi['timestamp']): string {
    if (typeof ts === 'string') return formatTanggalSingkat(ts.slice(0, 10));
    if (ts && typeof ts === 'object' && '_seconds' in ts) {
      const d = new Date(ts._seconds * 1000);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return '—';
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text">{error}</p>
      )}

      {periodeAktif === undefined && <p className="text-sm text-faint">Memuat...</p>}

      {periodeAktif === null && (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-faint shadow-[0_2px_10px_rgba(15,60,30,0.06)]">
          Belum ada periode aktif.{' '}
          <a href="/admin/periode" className="font-semibold text-primary-600 hover:underline">
            Buat periode
          </a>
        </div>
      )}

      {periodeAktif && (
        <>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <div className="rounded-2xl bg-white p-[18px] shadow-[0_2px_10px_rgba(15,60,30,0.06)]">
              <div className="mb-1.5 text-[11.5px] font-bold text-faint">TOTAL JADWAL</div>
              <div className="text-[28px] font-extrabold text-ink">{total}</div>
            </div>
            <div className="rounded-2xl bg-white p-[18px] shadow-[0_2px_10px_rgba(15,60,30,0.06)]">
              <div className="mb-1.5 text-[11.5px] font-bold text-faint">TERISI</div>
              <div className="text-[28px] font-extrabold text-success-text">{terisi}</div>
            </div>
            <div className="rounded-2xl bg-white p-[18px] shadow-[0_2px_10px_rgba(15,60,30,0.06)]">
              <div className="mb-1.5 text-[11.5px] font-bold text-faint">BELUM DIISI</div>
              <div className="text-[28px] font-extrabold text-danger-text">{total - terisi}</div>
            </div>
            <div className="rounded-2xl bg-white p-[18px] shadow-[0_2px_10px_rgba(15,60,30,0.06)]">
              <div className="mb-1.5 text-[11.5px] font-bold text-faint">KELENGKAPAN</div>
              <div className="text-[28px] font-extrabold text-primary-600">{persentase}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_10px_rgba(15,60,30,0.06)]">
              <div className="mb-3 text-[13.5px] font-extrabold text-ink">Tunggakan Terlama</div>
              <div className="flex flex-col gap-2.5">
                {backlogTop.length === 0 && (
                  <p className="py-2 text-[12.5px] text-faint">Tidak ada tunggakan. 🎉</p>
                )}
                {backlogTop.map((j) => (
                  <div
                    key={j.id}
                    className="flex items-center justify-between gap-2 rounded-[9px] bg-danger-softbg px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-bold text-ink">{j.namaMK}</div>
                      <div className="text-[11px] text-faint">
                        {j.kodeMK} · {j.kelas} · {formatTanggalSingkat(j.tanggalStr)}
                      </div>
                    </div>
                    <div className="shrink-0 text-[11px] font-extrabold text-danger-text">
                      {labelTertunggak(j.tanggalStr)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_10px_rgba(15,60,30,0.06)]">
              <div className="mb-3 text-[13.5px] font-extrabold text-ink">Aktivitas Terbaru</div>
              <div className="flex flex-col gap-2.5">
                {auditLog.length === 0 && (
                  <p className="py-2 text-[12.5px] text-faint">Belum ada aktivitas.</p>
                )}
                {auditLog.map((log) => (
                  <div key={log.id} className="border-l-[2.5px] border-primary-600 pl-2.5">
                    <div className="text-[12.5px] font-bold text-ink">
                      {LABEL_AKSI[log.aksi] ?? log.aksi}
                    </div>
                    <div className="text-[11px] text-faint">
                      {log.targetId} · {waktuAudit(log.timestamp)} · {log.aktor}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
