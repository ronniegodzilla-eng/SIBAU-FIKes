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
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-gray-600">Tanggal</th>
            <th className="px-3 py-2 text-left font-medium text-gray-600">Jam</th>
            <th className="px-3 py-2 text-left font-medium text-gray-600">Mata Kuliah</th>
            <th className="px-3 py-2 text-left font-medium text-gray-600">Prodi/Kelas</th>
            <th className="px-3 py-2 text-left font-medium text-gray-600">Dosen</th>
            <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
            <th className="px-3 py-2 text-right font-medium text-gray-600">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {daftar.length === 0 && (
            <tr>
              <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                Belum ada jadwal untuk periode ini.
              </td>
            </tr>
          )}
          {daftar.map((j) => (
            <tr key={j.id}>
              <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                {formatTanggalSingkat(j.tanggalStr)}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                {j.jamMulai}–{j.jamSelesai}
              </td>
              <td className="px-3 py-2">
                <div className="font-medium text-gray-900">{j.namaMK}</div>
                <div className="text-xs text-gray-500">{j.kodeMK}</div>
              </td>
              <td className="px-3 py-2 text-gray-600">
                {j.prodi} / {j.kelas}
              </td>
              <td className="px-3 py-2 text-gray-600">{j.dosenPengajar}</td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    j.status === 'terisi'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {j.status === 'terisi' ? 'Terisi' : 'Belum Diisi'}
                </span>
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  onClick={() => onEdit(j)}
                  disabled={j.status === 'terisi'}
                  className="mr-2 min-h-[36px] rounded-lg border border-gray-300 px-3 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  title={j.status === 'terisi' ? 'Sudah ada berita acara' : undefined}
                >
                  Ubah
                </button>
                <button
                  onClick={() => onHapus(j)}
                  disabled={j.status === 'terisi'}
                  className="min-h-[36px] rounded-lg border border-red-200 px-3 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
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
