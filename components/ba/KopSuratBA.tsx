import type { KopSurat } from '@/lib/kop';

/**
 * Kop surat resmi FIKes UIS, mengikuti tata letak kop SIMANTAP: logo
 * diletakkan mutlak di kiri sementara teks dipusatkan pada SELURUH lebar —
 * bukan pada sisa ruang di kanan logo — supaya judul kop segaris tengah
 * dengan badan dokumen di bawahnya. Padding kiri-kanan selebar logo menjaga
 * teks panjang tidak menabrak logo.
 */
export default function KopSuratBA({ kop }: { kop: KopSurat }) {
  return (
    <header className="relative font-sans">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={kop.logoUrl}
        alt="Logo Universitas Ibnu Sina"
        className="absolute left-0 top-1/2 h-[52px] w-[52px] -translate-y-1/2 object-contain sm:h-[86px] sm:w-[86px]"
      />
      <div className="px-[58px] text-center leading-tight sm:px-[94px]">
        <div className="text-[10px] font-bold uppercase text-primary-600 sm:text-[12.5px]">
          {kop.namaYayasan}
        </div>
        <div className="text-[16px] font-extrabold uppercase leading-[1.15] text-primary-600 sm:text-[23px]">
          {kop.namaUniversitas}
        </div>
        <div className="text-[13px] font-extrabold uppercase leading-[1.2] text-ink sm:text-[18.5px]">
          {kop.namaFakultas}
        </div>
        <div className="mt-0.5 text-[9.5px] text-ink sm:text-[11px]">
          {kop.alamat}. Telp. {kop.telepon}
        </div>
        <div className="text-[9.5px] text-ink sm:text-[11px]">
          Email : <span className="underline underline-offset-2">{kop.email}</span>
        </div>
      </div>
      {/* Garis ganda khas kop: tebal lalu tipis. */}
      <div className="mt-2 h-[3px] w-full bg-primary-600" />
      <div className="mt-[2px] h-[1.5px] w-full bg-primary-600" />
    </header>
  );
}
