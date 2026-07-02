import Link from 'next/link';
import type { JadwalUjian } from '@/lib/types';

export default function KartuJadwal({ jadwal }: { jadwal: JadwalUjian }) {
  const terisi = jadwal.status === 'terisi';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">{jadwal.namaMK}</p>
          <p className="text-xs text-gray-500">
            {jadwal.kodeMK} · {jadwal.prodi} · Kelas {jadwal.kelas}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            terisi ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {terisi ? 'Terisi' : 'Belum Diisi'}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div>
          <dt className="text-gray-400">Jam</dt>
          <dd>{jadwal.jamMulai}–{jadwal.jamSelesai}</dd>
        </div>
        <div>
          <dt className="text-gray-400">Ruangan</dt>
          <dd>{jadwal.ruangan ?? '-'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-gray-400">Dosen pengajar</dt>
          <dd>{jadwal.dosenPengajar}</dd>
        </div>
      </dl>

      <Link
        href={terisi ? `/berita-acara/${jadwal.beritaAcaraId}` : `/isi/${jadwal.id}`}
        className={`mt-3 flex min-h-[44px] items-center justify-center rounded-lg text-sm font-medium ${
          terisi
            ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        }`}
      >
        {terisi ? 'Lihat / Cetak PDF' : 'Isi Berita Acara'}
      </Link>
    </div>
  );
}
