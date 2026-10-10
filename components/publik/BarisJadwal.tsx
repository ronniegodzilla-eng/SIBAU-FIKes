import Link from 'next/link';
import type { JadwalUjian } from '@/lib/types';

export default function BarisJadwal({ jadwal }: { jadwal: JadwalUjian }) {
  const terisi = jadwal.status === 'terisi';

  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-[18px]">
      <div className="w-[72px] shrink-0 sm:w-[104px]">
        <div className="text-[12.5px] font-bold text-primary-600">
          {jadwal.jamMulai}
          <span className="hidden sm:inline"> – {jadwal.jamSelesai}</span>
        </div>
        <span
          className={`mt-1 inline-block whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-bold sm:px-2 ${
            terisi ? 'bg-success-bg text-success-text' : 'bg-danger-bg text-danger-text'
          }`}
        >
          {terisi ? 'Terisi' : 'Belum Diisi'}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div
          className="line-clamp-2 text-[14px] font-bold leading-snug text-ink lg:line-clamp-1"
          title={jadwal.namaMK}
        >
          {jadwal.namaMK}
        </div>
        <div className="truncate text-[11.5px] font-medium text-muted">
          Kelas {jadwal.kelas} · {jadwal.kodeMK} · {jadwal.prodi}
        </div>
        <div className="truncate text-[11.5px] text-body lg:hidden">
          📍 {jadwal.ruangan ?? '—'} · 👤 {jadwal.dosenPengajar}
        </div>
      </div>

      <div className="hidden w-[260px] shrink-0 text-[12px] text-body lg:block">
        <div className="truncate" title={jadwal.dosenPengajar}>👤 {jadwal.dosenPengajar}</div>
        <div className="truncate">📍 {jadwal.ruangan ?? '—'}</div>
      </div>

      <Link
        href={terisi ? `/berita-acara/${jadwal.beritaAcaraId}` : `/isi/${jadwal.id}`}
        className={`flex min-h-[38px] shrink-0 items-center justify-center whitespace-nowrap rounded-[9px] border-[1.5px] border-primary-600 px-3 text-[12.5px] font-bold sm:px-3.5 ${
          terisi
            ? 'bg-white text-primary-600 hover:bg-primary-50'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        }`}
      >
        <span className="sm:hidden">{terisi ? 'Lihat' : 'Isi'}</span>
        <span className="hidden sm:inline">
          {terisi ? 'Lihat / Cetak PDF' : 'Isi Berita Acara'}
        </span>
      </Link>
    </li>
  );
}
