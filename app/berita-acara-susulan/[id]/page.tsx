'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { formatTanggalIndonesia } from '@/lib/tanggal';
import TombolUnduhPDF from '@/components/pdf/TombolUnduhPDF';
import type { BeritaAcara, BeritaAcaraSusulan, JadwalUjian, Periode, SettingsApp } from '@/lib/types';

/** Adaptasi dokumen susulan (field jadwal + BA digabung jadi satu) ke bentuk
 *  {jadwal, ba} terpisah, supaya bisa memakai ulang TombolUnduhPDF/
 *  BeritaAcaraPDF yang sama dengan BA reguler tanpa duplikasi template. */
function pecahAdapter(s: BeritaAcaraSusulan): { jadwal: JadwalUjian; ba: BeritaAcara } {
  const jadwal: JadwalUjian = {
    id: '',
    periodeId: s.periodeId,
    tanggal: s.tanggalStr,
    tanggalStr: s.tanggalStr,
    jamMulai: s.jamMulaiAktual,
    jamSelesai: s.jamSelesaiAktual,
    kodeMK: s.kodeMK,
    namaMK: s.namaMK,
    prodi: s.prodi,
    kelas: s.kelas,
    dosenPengajar: s.dosenPengajar,
    ruangan: s.ruangan,
    status: 'terisi',
    beritaAcaraId: s.id,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
  const ba: BeritaAcara = {
    id: s.id,
    jadwalId: '',
    nomorBA: s.nomorBA,
    pengawas1: s.pengawas1,
    pengawas2: s.pengawas2,
    pesertaTerdaftar: s.pesertaTerdaftar,
    pesertaHadir: s.pesertaHadir,
    pesertaTidakHadir: s.pesertaTidakHadir,
    daftarTidakHadir: s.daftarTidakHadir,
    jamMulaiAktual: s.jamMulaiAktual,
    jamSelesaiAktual: s.jamSelesaiAktual,
    jumlahBerkas: s.jumlahBerkas,
    kejadianKhusus: s.kejadianKhusus,
    narasiDibantuAI: s.narasiDibantuAI,
    fotoBukti: s.fotoBukti,
    namaPengisi: s.namaPengisi,
    locked: s.locked,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
  return { jadwal, ba };
}

export default function DetailBeritaAcaraSusulanPage({
  params,
}: {
  params: { id: string };
}) {
  const [susulan, setSusulan] = useState<BeritaAcaraSusulan | null | undefined>(undefined);
  const [periode, setPeriode] = useState<Periode | null>(null);
  const [settings, setSettings] = useState<SettingsApp | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function muat() {
      try {
        const snap = await getDoc(doc(db, 'berita_acara_susulan', params.id));
        if (!snap.exists()) {
          setSusulan(null);
          return;
        }
        const data = { id: snap.id, ...snap.data() } as unknown as BeritaAcaraSusulan;
        setSusulan(data);

        const periodeSnap = await getDoc(doc(db, 'periode', data.periodeId));
        if (periodeSnap.exists()) {
          setPeriode({ id: periodeSnap.id, ...periodeSnap.data() } as unknown as Periode);
        }

        const settingsSnap = await getDoc(doc(db, 'settings', 'app'));
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data() as SettingsApp);
        }
      } catch {
        setError('Gagal memuat berita acara. Periksa koneksi internet Anda.');
      }
    }
    muat();
  }, [params.id]);

  if (susulan === undefined) {
    return (
      <main className="mx-auto max-w-[700px] px-4 py-10 text-center text-sm text-faint">
        {error || 'Memuat...'}
      </main>
    );
  }

  if (susulan === null) {
    return (
      <main className="mx-auto max-w-[700px] px-4 py-10 text-center text-sm text-faint">
        Berita acara ujian susulan tidak ditemukan.
      </main>
    );
  }

  const judulPeriode = periode
    ? `${periode.jenis} Semester ${periode.semester} T.A. ${periode.tahunAkademik}`
    : 'Ujian';
  const { jadwal, ba } = pecahAdapter(susulan);

  return (
    <div className="mx-auto max-w-[700px] pb-[60px]">
      <div
        id="no-print"
        className="flex items-center justify-between gap-3 bg-primary-600 px-[18px] py-4"
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-white/[0.14] text-base text-white"
          >
            ←
          </Link>
          <div className="text-[15px] font-extrabold text-white">Detail Berita Acara Susulan</div>
        </div>
        {periode && settings && (
          <TombolUnduhPDF ba={ba} jadwal={jadwal} periode={periode} settings={settings} susulan />
        )}
      </div>

      <div
        id="print-area"
        className="m-4 bg-white p-[30px] font-serif text-[#1a1a1a] shadow-[0_4px_20px_rgba(15,60,30,0.08)] sm:p-[34px]"
      >
        <div className="mb-[18px] flex items-center gap-[18px] border-b-[3px] border-double border-primary-600 pb-3.5">
          {settings?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logoUrl}
              alt="Logo"
              className="h-[66px] w-[66px] shrink-0 object-contain"
            />
          )}
          <div className="flex-1 text-center">
            <div className="text-sm font-bold tracking-wide">
              YAYASAN UNIVERSITAS IBNU SINA BATAM
            </div>
            <div className="text-[17px] font-bold tracking-wide">
              {settings?.namaUniversitas ?? '—'}
            </div>
            <div className="text-[14.5px] font-semibold">{settings?.namaFakultas ?? '—'}</div>
            <div className="text-[11.5px] text-[#555]">{settings?.alamat ?? ''}</div>
          </div>
        </div>

        <div className="mb-5 text-center">
          <div className="text-[15.5px] font-bold uppercase tracking-wide">
            Berita Acara Pelaksanaan Ujian Susulan {judulPeriode}
          </div>
          <div className="mt-1 text-[13px]">Nomor: {ba.nomorBA}</div>
        </div>

        <table className="mb-4 w-full border-collapse text-[13px]">
          <tbody>
            <tr>
              <td className="w-[150px] py-1 pr-2 text-[#444]">Hari / Tanggal</td>
              <td className="w-4 py-1">:</td>
              <td className="py-1 font-semibold">{formatTanggalIndonesia(jadwal.tanggalStr)}</td>
              <td className="w-[110px] py-1 pl-6 pr-2 text-[#444]">Ruangan</td>
              <td className="w-4 py-1">:</td>
              <td className="py-1 font-semibold">{jadwal.ruangan ?? '—'}</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 text-[#444]">Jam Ujian</td>
              <td className="py-1">:</td>
              <td className="py-1 font-semibold">{jadwal.jamMulai} – {jadwal.jamSelesai}</td>
              <td className="py-1 pl-6 pr-2 text-[#444]">Kelas</td>
              <td className="py-1">:</td>
              <td className="py-1 font-semibold">{jadwal.kelas}</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 text-[#444]">Mata Kuliah</td>
              <td className="py-1">:</td>
              <td className="py-1 font-semibold" colSpan={4}>
                {jadwal.namaMK} ({jadwal.kodeMK})
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-2 text-[#444]">Program Studi</td>
              <td className="py-1">:</td>
              <td className="py-1 font-semibold" colSpan={4}>
                {jadwal.prodi}
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-2 text-[#444]">Dosen Pengajar</td>
              <td className="py-1">:</td>
              <td className="py-1 font-semibold" colSpan={4}>
                {jadwal.dosenPengajar}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mb-3.5 border-t border-[#ccc] pt-3">
          <table className="w-full border-collapse text-[13px]">
            <tbody>
              <tr>
                <td className="w-[190px] py-1 pr-2 text-[#444]">Peserta Terdaftar</td>
                <td className="w-4 py-1">:</td>
                <td className="py-1 font-semibold">{ba.pesertaTerdaftar} orang</td>
              </tr>
              <tr>
                <td className="py-1 pr-2 text-[#444]">Peserta Hadir</td>
                <td className="py-1">:</td>
                <td className="py-1 font-semibold">{ba.pesertaHadir} orang</td>
              </tr>
              <tr>
                <td className="py-1 pr-2 text-[#444]">Peserta Tidak Hadir</td>
                <td className="py-1">:</td>
                <td className="py-1 font-semibold">
                  {ba.pesertaTidakHadir} orang
                  {ba.daftarTidakHadir ? ` (${ba.daftarTidakHadir})` : ''}
                </td>
              </tr>
              <tr>
                <td className="py-1 pr-2 text-[#444]">Jam Mulai / Selesai Aktual</td>
                <td className="py-1">:</td>
                <td className="py-1 font-semibold">
                  {ba.jamMulaiAktual} – {ba.jamSelesaiAktual}
                </td>
              </tr>
              {ba.jumlahBerkas != null && (
                <tr>
                  <td className="py-1 pr-2 text-[#444]">Jumlah Berkas Diserahkan</td>
                  <td className="py-1">:</td>
                  <td className="py-1 font-semibold">{ba.jumlahBerkas} lembar</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mb-4">
          <div className="mb-1 text-[12.5px] text-[#444]">Kejadian Khusus / Catatan Pelanggaran:</div>
          <div className="rounded-md bg-app px-2.5 py-2 text-[13px] font-semibold">
            {ba.kejadianKhusus}
          </div>
        </div>

        {ba.fotoBukti.length > 0 && (
          <div className="mb-5">
            <div className="mb-2 text-[12.5px] text-[#444]">Lampiran Foto Bukti Pelaksanaan:</div>
            <div className="flex flex-wrap gap-2.5">
              {ba.fotoBukti.map((f) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={f.fileId}
                  src={f.url}
                  alt={f.namaFile}
                  className="h-[90px] w-[120px] rounded-md border border-[#ddd] object-cover"
                />
              ))}
            </div>
          </div>
        )}

        <table className="mt-9 w-full border-collapse text-center text-[13px]">
          <tbody>
            <tr>
              <td className="w-1/3 align-top">
                <div className="h-[60px]" />
                <div className="mx-3.5 border-t border-[#333] pt-1.5 font-bold">
                  {ba.pengawas1}
                </div>
                <div className="text-[11.5px] text-[#555]">Pengawas 1</div>
              </td>
              <td className="w-1/3 align-top">
                <div className="h-[60px]" />
                <div className="mx-3.5 border-t border-[#333] pt-1.5 font-bold">
                  {ba.pengawas2 ?? '—'}
                </div>
                <div className="text-[11.5px] text-[#555]">Pengawas 2</div>
              </td>
              <td className="w-1/3 align-top">
                <div className="h-[60px]" />
                <div className="mx-3.5 border-t border-[#333] pt-1.5 font-bold">
                  {settings?.pejabat.nama ?? '—'}
                </div>
                <div className="text-[11.5px] text-[#555]">
                  Mengetahui, {settings?.pejabat.jabatan ?? '—'}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="mt-4 text-center text-[11px] text-[#888]">
          Diisi oleh: {ba.namaPengisi} · Dokumen digital SIBAU — sah tanpa tanda tangan basah
          setelah dicetak dan ditandatangani
        </div>
      </div>

      <div id="no-print" className="mx-4 mb-5 text-center">
        <span className="inline-block rounded-full bg-primary-50 px-3.5 py-2 text-xs font-bold text-primary-600">
          🔒 Berita acara ujian susulan terkunci — hubungi panitia untuk koreksi
        </span>
      </div>
    </div>
  );
}
