import Link from 'next/link';
import { formatTanggalSingkat, labelTertunggak } from '@/lib/tanggal';
import type { JadwalUjian } from '@/lib/types';

export default function PanelBelumDiisi({ daftar }: { daftar: JadwalUjian[] }) {
  if (daftar.length === 0) return null;

  return (
    <section className="rounded-xl border border-red-200 bg-red-50 p-4">
      <h2 className="text-sm font-semibold text-red-800">
        Belum Diisi ({daftar.length})
      </h2>
      <p className="mt-0.5 text-xs text-red-700">
        Diurutkan dari yang paling lama tertunggak.
      </p>
      <ul className="mt-3 space-y-2">
        {daftar.map((j) => (
          <li
            key={j.id}
            className="flex items-center justify-between gap-2 rounded-lg bg-white p-3 text-sm shadow-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">{j.namaMK}</p>
              <p className="text-xs text-gray-500">
                {formatTanggalSingkat(j.tanggalStr)} · {j.jamMulai} · {j.prodi}/{j.kelas}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs font-medium text-red-600">
                {labelTertunggak(j.tanggalStr)}
              </span>
              <Link
                href={`/isi/${j.id}`}
                className="min-h-[36px] rounded-lg bg-primary-600 px-3 text-xs font-medium leading-[36px] text-white hover:bg-primary-700"
              >
                Isi
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
