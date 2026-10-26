import KopSuratBA from '@/components/ba/KopSuratBA';
import { daftarPengawas, teksDokumen, type DokumenBA } from '@/components/ba/dokumen';
import { urlLihatFoto, urlThumbnailFoto } from '@/lib/foto';
import { kodeVerifikasi } from '@/lib/kode-tte';
import {
  formatTanggalIndonesia,
  formatTanggalJamWIB,
  formatTanggalTanpaHari,
} from '@/lib/tanggal';
import type { KopSurat } from '@/lib/kop';
import type { Pejabat } from '@/lib/types';

/** Dokumen berita acara di layar — struktur sama dengan BeritaAcaraPDF. */
export default function DokumenBeritaAcara({
  dok,
  kop,
  pejabat,
  qr,
  urlVerifikasi,
}: {
  dok: DokumenBA;
  kop: KopSurat;
  pejabat: Pejabat | null;
  qr: string;
  urlVerifikasi: string;
}) {
  const teks = teksDokumen(dok);
  const pengawas = daftarPengawas(dok);
  // BA bertanda tangan ketua panitia memakai identitas yang tersimpan saat
  // ditandatangani, bukan isi Pengaturan saat ini.
  const tp = dok.ttePejabat;
  const mengetahui = tp ? { nama: tp.oleh, nip: tp.nip, jabatan: tp.jabatan } : pejabat;

  return (
    <article className="bg-white px-5 py-6 font-serif text-[13px] leading-relaxed text-[#1a1a1a] shadow-[0_4px_20px_rgba(15,60,30,0.08)] sm:px-[34px] sm:py-[30px]">
      <KopSuratBA kop={kop} />

      <div className="mt-5 text-center">
        <h1 className="text-[14.5px] font-bold uppercase leading-snug tracking-wide sm:text-[15.5px]">
          {teks.judul}
        </h1>
        {teks.subjudul && (
          <div className="text-[13px] font-semibold uppercase">{teks.subjudul}</div>
        )}
        <div className="mt-1">
          Nomor : <span className="font-semibold">{dok.nomorBA}</span>
        </div>
      </div>

      <p className="mt-5 text-justify">
        Pada hari ini, <b>{formatTanggalIndonesia(dok.tanggalStr)}</b>, pukul{' '}
        <b>
          {dok.jamMulaiAktual.replace(':', '.')} – {dok.jamSelesaiAktual.replace(':', '.')} WIB
        </b>
        , telah dilaksanakan {teks.kegiatan} dengan keterangan sebagai berikut:
      </p>

      <Bagian judul="A. Identitas Ujian">
        <Baris k="Mata Kuliah" v={`${dok.namaMK} (${dok.kodeMK})`} />
        <Baris k="Program Studi" v={dok.prodi} />
        <Baris k="Kelas" v={dok.kelas} />
        <Baris k="Dosen Pengampu" v={dok.dosenPengajar} />
        <Baris k="Ruangan" v={dok.ruangan ?? '—'} />
        {dok.jamTerjadwal && <Baris k="Jadwal Ujian" v={`${dok.jamTerjadwal} WIB`} />}
      </Bagian>

      <Bagian judul="B. Pelaksanaan dan Kehadiran">
        <Baris
          k="Waktu Pelaksanaan"
          v={`${dok.jamMulaiAktual} – ${dok.jamSelesaiAktual} WIB`}
        />
        <Baris k="Peserta Terdaftar" v={`${dok.pesertaTerdaftar} orang`} />
        <Baris k="Peserta Hadir" v={`${dok.pesertaHadir} orang`} />
        <Baris k="Peserta Tidak Hadir" v={`${dok.pesertaTidakHadir} orang`} />
        {dok.daftarTidakHadir && <Baris k="Keterangan Tidak Hadir" v={dok.daftarTidakHadir} />}
        {dok.jumlahBerkas != null && (
          <Baris k="Lembar Jawaban Diserahkan" v={`${dok.jumlahBerkas} lembar`} />
        )}
      </Bagian>

      <Bagian judul="C. Kejadian Khusus / Catatan Pelanggaran">
        <div className="whitespace-pre-line rounded-md border border-[#ddd] px-3 py-2">
          {dok.kejadianKhusus}
        </div>
      </Bagian>

      <p className="mt-4 text-justify">
        Demikian berita acara ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana
        mestinya.
      </p>

      <div className="mt-6 flex flex-col items-center gap-8 text-center sm:flex-row sm:items-start sm:justify-between">
        <div className="w-full max-w-[260px]">
          <div className="hidden sm:block">&nbsp;</div>
          <div className="hidden sm:block">&nbsp;</div>
          <div className="font-semibold">Pengawas Ujian,</div>
          {dok.tte ? (
            <BlokTte qr={qr} nomorBA={dok.nomorBA} waktu={dok.tte.ditandatanganiAt} />
          ) : (
            <div className="h-[110px]" />
          )}
          <div className="mt-1.5 font-bold">
            {pengawas.map((nama, i) => (
              <div key={nama}>
                {pengawas.length > 1 ? `${i + 1}. ` : ''}
                {nama}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-[260px]">
          <div>Batam, {formatTanggalTanpaHari(dok.tanggalStr)}</div>
          <div className="font-semibold">
            Mengetahui,
            <br />
            {mengetahui?.jabatan || '—'}
          </div>
          {tp ? (
            <BlokTte qr={qr} nomorBA={dok.nomorBA} waktu={tp.ditandatanganiAt} />
          ) : (
            <div className="h-[86px]" />
          )}
          <div className="mt-1.5 font-bold underline underline-offset-2">
            {mengetahui?.nama || '—'}
          </div>
          {mengetahui?.nip && <div className="text-[12px]">NIP. {mengetahui.nip}</div>}
        </div>
      </div>

      <div className="mt-6 border-t border-[#ccc] pt-2.5 font-sans text-[10.5px] leading-relaxed text-[#666]">
        {dok.tte ? (
          <>
            {tp
              ? `Dokumen ini ditandatangani secara elektronik oleh pengawas ujian dan ${tp.jabatan || 'pejabat yang mengetahui'}`
              : 'Bagian pengawas pada dokumen ini ditandatangani secara elektronik'}{' '}
            melalui SIBAU FIKes UIS dan sah tanpa tanda tangan basah. Keaslian dapat diperiksa
            dengan memindai kode QR atau membuka{' '}
            {urlVerifikasi ? (
              <a href={urlVerifikasi} className="break-all text-primary-700 underline">
                {urlVerifikasi}
              </a>
            ) : (
              'halaman verifikasi SIBAU'
            )}
            . Kode verifikasi:{' '}
            <span className="font-mono font-bold text-[#333]">{kodeVerifikasi(dok.tte.hash)}</span>
          </>
        ) : (
          <>Dokumen ini belum ditandatangani secara elektronik.</>
        )}
        <div>Diisi oleh: {dok.namaPengisi}</div>
      </div>

      {dok.fotoBukti.length > 0 && (
        <section className="mt-6 border-t border-[#ccc] pt-4">
          <h2 className="font-bold">Lampiran — Dokumentasi Pelaksanaan Ujian</h2>
          <div className="mt-2 flex flex-wrap gap-2.5">
            {dok.fotoBukti.map((f) => (
              <a key={f.fileId} href={urlLihatFoto(f.fileId)} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={urlThumbnailFoto(f.fileId)}
                  alt={f.namaFile}
                  className="h-[120px] w-[160px] rounded border border-[#ddd] object-cover"
                />
              </a>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function BlokTte({ qr, nomorBA, waktu }: { qr: string; nomorBA: string; waktu: string }) {
  return (
    <>
      <div className="mt-2 flex justify-center">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt={`QR verifikasi berita acara ${nomorBA}`} className="h-[96px] w-[96px]" />
        ) : (
          <div className="h-[96px] w-[96px]" />
        )}
      </div>
      <div className="mt-1 font-sans text-[10px] leading-snug text-[#555]">
        Ditandatangani secara elektronik
        <br />
        {formatTanggalJamWIB(waktu)}
      </div>
    </>
  );
}

function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h2 className="mb-1 font-bold">{judul}</h2>
      <div className="pl-2 sm:pl-4">{children}</div>
    </section>
  );
}

function Baris({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <div className="w-[118px] shrink-0 sm:w-[190px]">{k}</div>
      <div className="min-w-0 flex-1">: {v}</div>
    </div>
  );
}
