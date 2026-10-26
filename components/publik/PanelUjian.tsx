'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { formatTanggalSingkat } from '@/lib/tanggal';
import type { JadwalUjian } from '@/lib/types';

// Kelas Tailwind ditulis utuh (bukan dirakit) supaya tidak terbuang saat build.
const TEMA = {
  bahaya: {
    kotak: 'border-danger-border bg-danger-softbg',
    judul: 'text-danger-strong',
    alih: 'text-danger-text',
    garis: 'border-danger-border',
    hover: 'hover:bg-danger-softbg',
    lencana: 'bg-danger-bg text-danger-text',
    aksi: 'bg-primary-600 text-white',
  },
  sukses: {
    kotak: 'border-primary-100 bg-primary-50',
    judul: 'text-primary-700',
    alih: 'text-primary-600',
    garis: 'border-primary-100',
    hover: 'hover:bg-primary-50',
    lencana: 'bg-success-bg text-success-text',
    aksi: 'border border-primary-600 bg-white text-primary-600',
  },
} as const;

/**
 * Panel ringkas berisi daftar ujian — satu baris per ujian (nama MK, kelas,
 * jam, dosen), tinggi dibatasi lalu digulir, dan bisa disembunyikan. Pilihan
 * buka/tutup diingat per browser.
 */
export default function PanelUjian({
  nada,
  judul,
  daftar,
  saring,
  lencana,
  hrefAksi,
  labelAksi,
  kunciSimpan,
  bawaanTerbuka,
}: {
  nada: keyof typeof TEMA;
  judul: (jumlah: number) => ReactNode;
  daftar: JadwalUjian[];
  /** Dievaluasi ulang tiap menit, untuk saringan yang bergantung pada jam. */
  saring?: (j: JadwalUjian) => boolean;
  lencana: (j: JadwalUjian) => string;
  hrefAksi: (j: JadwalUjian) => string;
  labelAksi: string;
  kunciSimpan: string;
  bawaanTerbuka: boolean;
}) {
  const t = TEMA[nada];
  const [terbuka, setTerbuka] = useState(bawaanTerbuka);
  const [, setDetak] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setDetak((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      const v = localStorage.getItem(kunciSimpan);
      if (v === 'tutup' || v === '1') setTerbuka(false);
      else if (v === 'buka') setTerbuka(true);
    } catch {
      // Penyimpanan browser tidak tersedia — pakai keadaan bawaan.
    }
  }, [kunciSimpan]);

  function alihkan() {
    const baru = !terbuka;
    setTerbuka(baru);
    try {
      localStorage.setItem(kunciSimpan, baru ? 'buka' : 'tutup');
    } catch {
      // Abaikan — pilihan hanya tidak diingat.
    }
  }

  const tampil = saring ? daftar.filter(saring) : daftar;
  if (tampil.length === 0) return null;

  return (
    <section className={`mb-[18px] overflow-hidden rounded-2xl border-[1.5px] ${t.kotak}`}>
      <button
        type="button"
        onClick={alihkan}
        aria-expanded={terbuka}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left sm:px-[18px]"
      >
        <span className={`text-[13px] font-extrabold ${t.judul}`}>{judul(tampil.length)}</span>
        <span className={`shrink-0 text-[11.5px] font-bold ${t.alih}`}>
          {terbuka ? 'Sembunyikan ▴' : 'Tampilkan ▾'}
        </span>
      </button>

      {terbuka && (
        <ul
          className={`max-h-[236px] divide-y divide-line-soft overflow-y-auto border-t bg-white ${t.garis}`}
        >
          {tampil.map((j) => (
            <li key={j.id}>
              <Link
                href={hrefAksi(j)}
                className={`flex items-center gap-2.5 px-4 py-2 sm:px-[18px] ${t.hover}`}
              >
                <span
                  className={`hidden w-[50px] shrink-0 rounded-full py-0.5 text-center text-[10.5px] font-extrabold lg:inline-block ${t.lencana}`}
                >
                  {lencana(j)}
                </span>

                <div className="min-w-0 flex-1 lg:grid lg:grid-cols-[150px_minmax(0,1fr)_112px_230px] lg:items-center lg:gap-3">
                  <div className="hidden whitespace-nowrap text-[12px] text-body lg:block">
                    {formatTanggalSingkat(j.tanggalStr)} · {j.jamMulai}–{j.jamSelesai}
                  </div>
                  <div
                    className="line-clamp-2 text-[13px] font-bold leading-snug text-ink lg:line-clamp-1"
                    title={j.namaMK}
                  >
                    {j.namaMK}
                    <span className="font-semibold text-muted lg:hidden"> · Kelas {j.kelas}</span>
                  </div>
                  <div className="hidden whitespace-nowrap text-[12px] font-semibold text-muted lg:block">
                    Kelas {j.kelas}
                  </div>
                  <div
                    className="hidden truncate text-[12px] text-body lg:block"
                    title={j.dosenPengajar}
                  >
                    👤 {j.dosenPengajar}
                  </div>
                  <div className="mt-0.5 text-[11.5px] leading-snug text-body lg:hidden">
                    <span
                      className={`mr-1 rounded-full px-1.5 py-px text-[10px] font-extrabold ${t.lencana}`}
                    >
                      {lencana(j)}
                    </span>
                    {j.jamMulai}–{j.jamSelesai} · 👤 {j.dosenPengajar}
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11.5px] font-bold ${t.aksi}`}
                >
                  {labelAksi}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
