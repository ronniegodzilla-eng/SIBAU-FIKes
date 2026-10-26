'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  formatTanggalSingkat,
  hariIniStrWIB,
  jamStrWIB,
  selisihHariDariSekarang,
} from '@/lib/tanggal';
import type { JadwalUjian } from '@/lib/types';

const KUNCI_TUTUP = 'sibau:panel-belum-diisi-tutup';

export default function PanelBelumDiisi({
  daftar,
  terpotong,
  batas,
}: {
  daftar: JadwalUjian[];
  /** true bila jadwal tertunggak hari-hari sebelumnya lebih banyak dari `batas`. */
  terpotong: boolean;
  batas: number;
}) {
  const [terbuka, setTerbuka] = useState(true);
  // Ujian hari ini masuk daftar begitu jam selesainya lewat — hitung ulang tiap menit.
  const [, setDetak] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDetak((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(KUNCI_TUTUP) === '1') setTerbuka(false);
    } catch {
      // Penyimpanan browser tidak tersedia — panel tetap terbuka.
    }
  }, []);

  function alihkan() {
    const baru = !terbuka;
    setTerbuka(baru);
    try {
      if (baru) localStorage.removeItem(KUNCI_TUTUP);
      else localStorage.setItem(KUNCI_TUTUP, '1');
    } catch {
      // Abaikan — pilihan hanya tidak diingat.
    }
  }

  // Ujian hari ini baru dianggap tertunggak setelah jam selesainya lewat;
  // yang belum berlangsung sudah ada di daftar jadwal di bawah panel ini.
  const hariIni = hariIniStrWIB();
  const sekarang = jamStrWIB();
  const tertunggak = daftar.filter((j) => j.tanggalStr < hariIni || j.jamSelesai <= sekarang);
  if (tertunggak.length === 0) return null;

  return (
    <section className="mb-[18px] overflow-hidden rounded-2xl border-[1.5px] border-danger-border bg-danger-softbg">
      <button
        type="button"
        onClick={alihkan}
        aria-expanded={terbuka}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left sm:px-[18px]"
      >
        <span className="text-[13px] font-extrabold text-danger-strong">
          ⚠ {tertunggak.length}
          {terpotong ? '+' : ''} ujian belum diisi berita acaranya
        </span>
        <span className="shrink-0 text-[11.5px] font-bold text-danger-text">
          {terbuka ? 'Sembunyikan ▴' : 'Tampilkan ▾'}
        </span>
      </button>

      {terbuka && (
        <>
          <ul className="max-h-[236px] divide-y divide-line-soft overflow-y-auto border-t border-danger-border bg-white">
            {tertunggak.map((j) => (
              <li key={j.id}>
                <Link
                  href={`/isi/${j.id}`}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-danger-softbg sm:px-[18px]"
                >
                  <span className="hidden w-[50px] shrink-0 rounded-full bg-danger-bg py-0.5 text-center text-[10.5px] font-extrabold text-danger-text lg:inline-block">
                    {labelHari(j.tanggalStr)}
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
                      <span className="mr-1 rounded-full bg-danger-bg px-1.5 py-px text-[10px] font-extrabold text-danger-text">
                        {labelHari(j.tanggalStr)}
                      </span>
                      {j.jamMulai}–{j.jamSelesai} · 👤 {j.dosenPengajar}
                    </div>
                  </div>

                  <span className="shrink-0 rounded-lg bg-primary-600 px-2.5 py-1.5 text-[11.5px] font-bold text-white">
                    Isi
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {terpotong && (
            <p className="border-t border-danger-border px-4 py-1.5 text-[11px] font-medium text-danger-text sm:px-[18px]">
              Dari hari-hari sebelumnya hanya {batas} jadwal yang paling lama tertunggak yang
              ditampilkan.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function labelHari(tanggalStr: string): string {
  const n = selisihHariDariSekarang(tanggalStr);
  return n <= 0 ? 'Hari ini' : `H+${n}`;
}
