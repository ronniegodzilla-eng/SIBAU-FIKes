'use client';

import { formatTanggalSingkat } from '@/lib/tanggal';
import type { JadwalUjian } from '@/lib/types';

export default function JadwalTable({
  daftar,
  onEdit,
  onHapus,
}: {
  daftar: JadwalUjian[];
  onEdit: (j: JadwalUjian) => void;
  onHapus: (j: JadwalUjian) => void;
}) {
  return (
    <div className="overflow-auto rounded-2xl bg-white shadow-[0_2px_10px_rgba(15,60,30,0.06)]">
      <table className="w-full min-w-[900px] border-collapse text-[12.5px]">
        <thead>
          <tr className="bg-app">
            <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted">TANGGAL</th>
            <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted">JAM</th>
            <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted">MK</th>
            <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted">PRODI/KELAS</th>
            <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted">DOSEN</th>
            <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted">RUANGAN</th>
            <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted">STATUS</th>
            <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold text-muted">AKSI</th>
          </tr>
        </thead>
        <tbody>
          {daftar.length === 0 && (
            <tr>
              <td colSpan={8} className="px-3.5 py-6 text-center text-faint">
                Belum ada jadwal untuk periode ini.
              </td>
            </tr>
          )}
          {daftar.map((j) => (
            <tr key={j.id} className="border-t border-line-soft">
              <td className="whitespace-nowrap px-3.5 py-2.5 text-body">
                {formatTanggalSingkat(j.tanggalStr)}
              </td>
              <td className="whitespace-nowrap px-3.5 py-2.5 text-body">
                {j.jamMulai}–{j.jamSelesai}
              </td>
              <td className="px-3.5 py-2.5">
                <div className="font-bold text-ink">{j.namaMK}</div>
                <div className="text-[11px] text-faint">{j.kodeMK}</div>
              </td>
              <td className="px-3.5 py-2.5 text-body">
                {j.prodi} / {j.kelas}
              </td>
              <td className="px-3.5 py-2.5 text-body">{j.dosenPengajar}</td>
              <td className="px-3.5 py-2.5 text-body">{j.ruangan ?? '—'}</td>
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
              <td className="whitespace-nowrap px-3.5 py-2.5 text-right">
                <button
                  onClick={() => onEdit(j)}
                  disabled={j.status === 'terisi'}
                  className="mr-1.5 min-h-[30px] rounded-lg border border-line-strong px-2.5 text-[11px] font-bold text-body hover:bg-app disabled:opacity-40"
                  title={j.status === 'terisi' ? 'Sudah ada berita acara' : undefined}
                >
                  Edit
                </button>
                <button
                  onClick={() => onHapus(j)}
                  disabled={j.status === 'terisi'}
                  className="min-h-[30px] rounded-lg border border-danger-border px-2.5 text-[11px] font-bold text-danger-text hover:bg-danger-softbg disabled:opacity-40"
                  title={j.status === 'terisi' ? 'Sudah ada berita acara' : undefined}
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
