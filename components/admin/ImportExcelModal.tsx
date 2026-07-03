'use client';

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastProvider';
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
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<BarisPreview[]>([]);
  const [namaFile, setNamaFile] = useState('');
  const [mengimpor, setMengimpor] = useState(false);
  const [hasilServer, setHasilServer] = useState<HasilServer[] | null>(null);

  function handlePilihFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNamaFile(file.name);
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
        showToast('Gagal membaca file. Pastikan format .xlsx sesuai template.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleImpor() {
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
      if (res.jumlahBerhasil > 0) {
        showToast(`${res.jumlahBerhasil} jadwal berhasil diimpor.`, 'success');
        onImported();
      }
    } catch (err) {
      showToast(
        err instanceof AdminFetchError ? err.message : 'Gagal mengimpor jadwal.',
        'error'
      );
    } finally {
      setMengimpor(false);
    }
  }

  const jumlahValid = preview.filter((p) => !p.errorClient).length;
  const jumlahInvalid = preview.length - jumlahValid;
  const langkah = preview.length > 0 ? 2 : 1;

  return (
    <Modal title="Import Jadwal dari Excel/CSV" onClose={onClose} maxWidthClass="max-w-[640px]">
      {langkah === 1 && (
        <>
          <p className="mb-4 text-[12.5px] text-faint">
            Unduh template, isi jadwal, lalu unggah kembali untuk divalidasi sebelum disimpan.
          </p>
          <button
            onClick={unduhTemplate}
            className="mb-4 rounded-lg border-[1.5px] border-primary-600 px-3.5 py-2 text-[12.5px] font-bold text-primary-600 hover:bg-primary-50"
          >
            ⬇ Unduh Template Excel
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-xl border-2 border-dashed border-line-dashed px-5 py-9 text-center text-body"
          >
            <div className="mb-2 text-[28px]">📄</div>
            <div className="text-[13.5px] font-bold">Klik untuk pilih file jadwal (.xlsx)</div>
            <div className="mt-1 text-[11.5px] text-faint">Format sesuai template di atas</div>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handlePilihFile}
            className="hidden"
          />
        </>
      )}

      {langkah === 2 && (
        <>
          <p className="mb-3.5 text-[12.5px] text-faint">
            {namaFile && <span className="font-semibold text-body">{namaFile} — </span>}
            Ditemukan {preview.length} baris — {jumlahValid} valid, {jumlahInvalid} bermasalah.
          </p>
          <div className="mb-4 max-h-64 overflow-auto rounded-[10px] border border-line">
            <table className="w-full min-w-[560px] border-collapse text-xs">
              <thead>
                <tr className="bg-app">
                  <th className="px-2.5 py-2 text-left">Tanggal</th>
                  <th className="px-2.5 py-2 text-left">MK</th>
                  <th className="px-2.5 py-2 text-left">Prodi/Kelas</th>
                  <th className="px-2.5 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((p) => {
                  const hasil = hasilServer?.find((h) => h.baris === p.baris);
                  const status = hasil
                    ? hasil.ok
                      ? 'Berhasil diimpor'
                      : hasil.pesan
                    : p.errorClient;
                  const ok = hasil ? hasil.ok : !p.errorClient;
                  return (
                    <tr key={p.baris} className="border-t border-line-soft">
                      <td className="px-2.5 py-2">{p.data.tanggalStr}</td>
                      <td className="px-2.5 py-2">
                        {p.data.namaMK} ({p.data.kodeMK})
                      </td>
                      <td className="px-2.5 py-2">
                        {p.data.prodi} / {p.data.kelas}
                      </td>
                      <td
                        className={`px-2.5 py-2 font-bold ${
                          ok ? 'text-success-text' : 'text-danger-text'
                        }`}
                      >
                        {status ?? 'Valid'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex justify-end gap-2.5">
        <button
          onClick={onClose}
          className="min-h-[40px] rounded-lg border-[1.5px] border-line-strong bg-white px-4 text-[13.5px] font-semibold text-body"
        >
          {hasilServer ? 'Tutup' : 'Batal'}
        </button>
        {langkah === 2 && !hasilServer && (
          <button
            onClick={handleImpor}
            disabled={mengimpor || jumlahValid === 0}
            className="min-h-[40px] rounded-lg bg-primary-600 px-4 text-[13.5px] font-bold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {mengimpor ? 'Mengimpor...' : `Impor ${jumlahValid} Jadwal`}
          </button>
        )}
      </div>
    </Modal>
  );
}
