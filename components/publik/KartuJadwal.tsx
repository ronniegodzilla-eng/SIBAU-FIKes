import Link from 'next/link';
import type { JadwalUjian } from '@/lib/types';

export default function KartuJadwal({ jadwal }: { jadwal: JadwalUjian }) {
  const terisi = jadwal.status === 'terisi';

  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_4px_14px_rgba(15,60,30,0.06)]">
      <div className="mb-2 flex items-start justify-between gap-2.5">
        <div className="text-[13px] font-bold text-primary-600">
          {jadwal.jamMulai} – {jadwal.jamSelesai}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            terisi ? 'bg-success-bg text-success-text' : 'bg-danger-bg text-danger-text'
          }`}
        >
          {terisi ? 'Terisi' : 'Belum Diisi'}
        </span>
      </div>

      <div className="mb-0.5 text-[15px] font-bold text-ink">{jadwal.namaMK}</div>
      <div className="mb-2.5 text-[12.5px] font-medium text-muted">
        {jadwal.kodeMK} · {jadwal.prodi} · Kelas {jadwal.kelas}
      </div>

      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-body">
        <span>👤 {jadwal.dosenPengajar}</span>
        <span>📍 {jadwal.ruangan ?? '—'}</span>
      </div>

      <Link
        href={terisi ? `/berita-acara/${jadwal.beritaAcaraId}` : `/isi/${jadwal.id}`}
        className={`flex min-h-[44px] items-center justify-center rounded-[10px] border-[1.5px] border-primary-600 text-[13.5px] font-bold ${
          terisi
            ? 'bg-white text-primary-600 hover:bg-primary-50'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        }`}
      >
        {terisi ? 'Lihat / Cetak PDF' : 'Isi Berita Acara'}
      </Link>
    </div>
  );
}
