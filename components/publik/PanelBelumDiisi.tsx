import Link from 'next/link';
import { formatTanggalSingkat, labelTertunggak } from '@/lib/tanggal';
import type { JadwalUjian } from '@/lib/types';

export default function PanelBelumDiisi({ daftar }: { daftar: JadwalUjian[] }) {
  if (daftar.length === 0) return null;

  return (
    <section className="mb-[18px] rounded-2xl border-[1.5px] border-danger-border bg-danger-softbg p-4 sm:p-[18px]">
      <h2 className="text-[13.5px] font-extrabold text-danger-strong">
        ⚠ Belum Diisi — Perlu Perhatian
      </h2>
      <p className="mb-3 text-xs font-medium text-danger-text">
        Diurutkan dari yang paling lama tertunggak.
      </p>
      <ul className="flex flex-col gap-2">
        {daftar.map((j) => (
          <li
            key={j.id}
            className="flex items-center justify-between gap-2.5 rounded-[11px] bg-white p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-bold text-ink">{j.namaMK}</p>
              <p className="text-[11.5px] font-medium text-subtle">
                {j.kodeMK} · {j.kelas} · {formatTanggalSingkat(j.tanggalStr)}
              </p>
              <p className="mt-0.5 text-[11px] font-bold text-danger-text">
                {labelTertunggak(j.tanggalStr)}
              </p>
            </div>
            <Link
              href={`/isi/${j.id}`}
              className="flex min-h-[36px] shrink-0 items-center rounded-lg bg-primary-600 px-3.5 text-xs font-bold text-white hover:bg-primary-700"
            >
              Isi Sekarang
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
