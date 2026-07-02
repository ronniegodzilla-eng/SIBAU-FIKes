'use client';

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { adminFetch, AdminFetchError } from '@/lib/admin-fetch';
import { validasiBarisJadwal, kunciUnikJadwal } from '@/lib/validasi-jadwal';
import type { BarisImportJadwal } from '@/lib/types';

const HEADER_TEMPLATE = [
  'Tanggal (YYYY-MM-DD)',
  'Jam Mulai (HH:MM)',
  'Jam Selesai (HH:MM)',
  'Kode MK',
  'Nama MK',
  'Prodi',
  'Kelas',
  'Dosen Pengajar',
  'Ruangan',
] as const;

const PEMETAAN_FIELD: Record<(typeof HEADER_TEMPLATE)[number], keyof BarisImportJadwal> = {
  'Tanggal (YYYY-MM-DD)': 'tanggalStr',
  'Jam Mulai (HH:MM)': 'jamMulai',
  'Jam Selesai (HH:MM)': 'jamSelesai',
  'Kode MK': 'kodeMK',
  'Nama MK': 'namaMK',
  Prodi: 'prodi',
  Kelas: 'kelas',
  'Dosen Pengajar': 'dosenPengajar',
  Ruangan: 'ruangan',
};

interface BarisPreview {
  baris: number;
  data: BarisImportJadwal;
  errorClient: string | null;
}

interface HasilServer {
  baris: number;
  ok: boolean;
  pesan?: string;
}

function unduhTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    [...HEADER_TEMPLATE],
    ['2026-07-10', '08:00', '09:40', 'KEP101', 'Keperawatan Dasar', 'D3 Keperawatan', 'A', 'Dr. Contoh, S.Kep', 'R.101'],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Jadwal');
  XLSX.writeFile(wb, 'template-jadwal-ujian-sibau.xlsx');
}

export default function ImportExcelModal({
  periodeId,
  onClose,
  onImported,
}: {
  periodeId: string;
  onClose: () => void;
  onImported: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<BarisPreview[]>([]);
  const [error, setError] = useState('');
  const [mengimpor, setMengimpor] = useState(false);
  const [hasilServer, setHasilServer] = useState<HasilServer[] | null>(null);

  function handlePilihFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setHasilServer(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]!];
        const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
          raw: false,
          defval: '',
        });

        const kunciTerlihat = new Set<string>();
        const hasilPreview: BarisPreview[] = rows.map((row, idx) => {
          const baris: BarisImportJadwal = {
            tanggalStr: String(row[HEADER_TEMPLATE[0]] ?? '').trim(),
            jamMulai: String(row[HEADER_TEMPLATE[1]] ?? '').trim(),
            jamSelesai: String(row[HEADER_TEMPLATE[2]] ?? '').trim(),
            kodeMK: String(row[HEADER_TEMPLATE[3]] ?? '').trim(),
            namaMK: String(row[HEADER_TEMPLATE[4]] ?? '').trim(),
            prodi: String(row[HEADER_TEMPLATE[5]] ?? '').trim(),
            kelas: String(row[HEADER_TEMPLATE[6]] ?? '').trim(),
            dosenPengajar: String(row[HEADER_TEMPLATE[7]] ?? '').trim(),
            ruangan: String(row[HEADER_TEMPLATE[8]] ?? '').trim() || null,
          };

          let errorClient = validasiBarisJadwal(baris);
          if (!errorClient) {
            const kunci = kunciUnikJadwal({ periodeId, ...baris });
            if (kunciTerlihat.has(kunci)) {
              errorClient = 'Duplikat di dalam file.';
            } else {
              kunciTerlihat.add(kunci);
            }
          }

          return { baris: idx + 2, data: baris, errorClient };
        });

        setPreview(hasilPreview);
      } catch {
        setError('Gagal membaca file. Pastikan format .xlsx sesuai template.');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleImpor() {
    setError('');
    setMengimpor(true);
    try {
      const res = await adminFetch<{ hasil: HasilServer[]; jumlahBerhasil: number }>(
        '/api/admin/jadwal/import',
        {
          method: 'POST',
          body: JSON.stringify({ periodeId, baris: preview.map((p) => p.data) }),
        }
      );
      setHasilServer(res.hasil);
      if (res.jumlahBerhasil > 0) onImported();
    } catch (err) {
      setError(err instanceof AdminFetchError ? err.message : 'Gagal mengimpor jadwal.');
    } finally {
      setMengimpor(false);
    }
  }

  const jumlahValid = preview.filter((p) => !p.errorClient).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-5 shadow-lg">
        <div className="flex items-start justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            Import Jadwal dari Excel
          </h2>
          <button
            onClick={onClose}
            className="min-h-[36px] min-w-[36px] rounded-lg text-gray-400 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={unduhTemplate}
            className="min-h-[44px] rounded-lg border border-gray-300 px-4 text-sm text-gray-700 hover:bg-gray-50"
          >
            Unduh Template Excel
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="min-h-[44px] rounded-lg border border-gray-300 px-4 text-sm text-gray-700 hover:bg-gray-50"
          >
            Pilih File .xlsx
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handlePilihFile}
            className="hidden"
          />
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {preview.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              {preview.length} baris terbaca, {jumlahValid} valid untuk diimpor.
            </p>
            <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left">Baris</th>
                    <th className="px-2 py-1 text-left">MK</th>
                    <th className="px-2 py-1 text-left">Tanggal/Jam</th>
                    <th className="px-2 py-1 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {preview.map((p) => {
                    const hasil = hasilServer?.find((h) => h.baris === p.baris);
                    const status = hasil
                      ? hasil.ok
                        ? 'Berhasil diimpor'
                        : hasil.pesan
                      : p.errorClient;
                    const ok = hasil ? hasil.ok : !p.errorClient;
                    return (
                      <tr key={p.baris}>
                        <td className="px-2 py-1">{p.baris}</td>
                        <td className="px-2 py-1">
                          {p.data.kodeMK} — {p.data.namaMK}
                        </td>
                        <td className="px-2 py-1">
                          {p.data.tanggalStr} {p.data.jamMulai}
                        </td>
                        <td
                          className={`px-2 py-1 ${ok ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {status ?? 'Valid'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!hasilServer && (
              <button
                onClick={handleImpor}
                disabled={mengimpor || jumlahValid === 0}
                className="mt-4 min-h-[44px] rounded-lg bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {mengimpor ? 'Mengimpor...' : `Impor ${jumlahValid} Baris Valid`}
              </button>
            )}
            {hasilServer && (
              <button
                onClick={onClose}
                className="mt-4 min-h-[44px] rounded-lg bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700"
              >
                Selesai
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
