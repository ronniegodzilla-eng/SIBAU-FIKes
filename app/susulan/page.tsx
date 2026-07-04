'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { hariIniStrWIB } from '@/lib/tanggal';
import { DAFTAR_PRODI } from '@/lib/prodi';
import { validasiFormSusulan } from '@/lib/validasi-susulan';
import { useToast } from '@/components/ui/ToastProvider';
import UploadFotoInput from '@/components/publik/UploadFotoInput';
import type { Periode, FotoBukti } from '@/lib/types';

const KEJADIAN_DEFAULT = 'Nihil';

const inputCls =
  'mt-1.5 min-h-[44px] w-full rounded-[9px] border-[1.5px] border-line px-3 py-2.5 text-sm text-ink box-border';
const labelCls = 'block text-[12.5px] font-bold text-label';

interface BarisJadwalRingkas {
  kodeMK: string;
  namaMK: string;
  kelas: string;
  dosenPengajar: string;
}

export default function SusulanPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [periodeAktif, setPeriodeAktif] = useState<Periode | null | undefined>(undefined);

  const [prodi, setProdi] = useState('');
  const [tanggalStr, setTanggalStr] = useState(hariIniStrWIB());
  const [daftarJadwalProdi, setDaftarJadwalProdi] = useState<BarisJadwalRingkas[]>([]);
  const [modeManual, setModeManual] = useState(false);
  const [cariMK, setCariMK] = useState('');
  const [namaMKPilihan, setNamaMKPilihan] = useState('');
  const [kelasPilihan, setKelasPilihan] = useState('');
  const [kodeMK, setKodeMK] = useState('');
  const [namaMK, setNamaMK] = useState('');
  const [kelas, setKelas] = useState('');
  const [dosenPengajar, setDosenPengajar] = useState('');
  const [ruangan, setRuangan] = useState('');

  const [pengawas1, setPengawas1] = useState('');
  const [pengawas2, setPengawas2] = useState('');
  const [pesertaTerdaftar, setPesertaTerdaftar] = useState('');
  const [pesertaHadir, setPesertaHadir] = useState('');
  const [daftarTidakHadir, setDaftarTidakHadir] = useState('');
  const [jamMulaiAktual, setJamMulaiAktual] = useState('');
  const [jamSelesaiAktual, setJamSelesaiAktual] = useState('');
  const [jumlahBerkas, setJumlahBerkas] = useState('');
  const [kejadianKhusus, setKejadianKhusus] = useState(KEJADIAN_DEFAULT);
  const [narasiDibantuAI, setNarasiDibantuAI] = useState(false);
  const [merapikanNarasi, setMerapikanNarasi] = useState(false);
  const [namaPengisi, setNamaPengisi] = useState('');
  const [fotoBukti, setFotoBukti] = useState<FotoBukti[]>([]);
  const [mengirim, setMengirim] = useState(false);

  useEffect(() => {
    async function muatPeriode() {
      try {
        const snap = await getDocs(
          query(collection(db, 'periode'), where('aktif', '==', true), limit(1))
        );
        setPeriodeAktif(snap.empty ? null : ({ id: snap.docs[0]!.id, ...snap.docs[0]!.data() } as unknown as Periode));
      } catch {
        setPeriodeAktif(null);
      }
    }
    muatPeriode();
  }, []);

  useEffect(() => {
    setNamaMKPilihan('');
    setKelasPilihan('');
    setKodeMK('');
    setNamaMK('');
    setKelas('');
    setDosenPengajar('');
    setModeManual(false);
    setCariMK('');
    if (!periodeAktif || !prodi) {
      setDaftarJadwalProdi([]);
      return;
    }
    async function muatMK() {
      try {
        const snap = await getDocs(
          query(
            collection(db, 'jadwal_ujian'),
            where('periodeId', '==', periodeAktif!.id),
            where('prodi', '==', prodi)
          )
        );
        const daftar = snap.docs.map((d) => {
          const j = d.data() as any;
          return {
            kodeMK: j.kodeMK as string,
            namaMK: j.namaMK as string,
            kelas: j.kelas as string,
            dosenPengajar: j.dosenPengajar as string,
          };
        });
        setDaftarJadwalProdi(daftar);
        if (daftar.length === 0) setModeManual(true);
      } catch {
        setDaftarJadwalProdi([]);
        setModeManual(true);
      }
    }
    muatMK();
  }, [periodeAktif, prodi]);

  const daftarNamaMK = useMemo(
    () => Array.from(new Set(daftarJadwalProdi.map((j) => j.namaMK))).sort(),
    [daftarJadwalProdi]
  );

  const daftarNamaMKTersaring = useMemo(() => {
    if (!cariMK.trim()) return daftarNamaMK;
    const q = cariMK.trim().toLowerCase();
    return daftarNamaMK.filter((nm) => nm.toLowerCase().includes(q));
  }, [daftarNamaMK, cariMK]);

  const daftarKelasUntukMK = useMemo(
    () =>
      Array.from(
        new Set(daftarJadwalProdi.filter((j) => j.namaMK === namaMKPilihan).map((j) => j.kelas))
      ).sort(),
    [daftarJadwalProdi, namaMKPilihan]
  );

  function handlePilihNamaMK(nilai: string) {
    setNamaMKPilihan(nilai);
    setNamaMK(nilai);
    setKelasPilihan('');
    setKodeMK('');
    setKelas('');
    setDosenPengajar('');
  }

  function handlePilihKelas(nilai: string) {
    setKelasPilihan(nilai);
    const cocok = daftarJadwalProdi.find(
      (j) => j.namaMK === namaMKPilihan && j.kelas === nilai
    );
    if (cocok) {
      setKodeMK(cocok.kodeMK);
      setKelas(cocok.kelas);
      setDosenPengajar(cocok.dosenPengajar);
    }
  }

  function aktifkanModeManual() {
    setModeManual(true);
    setNamaMKPilihan('');
    setKelasPilihan('');
    setKodeMK('');
    setNamaMK('');
    setKelas('');
    setDosenPengajar('');
  }

  function batalkanModeManual() {
    setModeManual(false);
    setKodeMK('');
    setNamaMK('');
    setKelas('');
    setDosenPengajar('');
  }

  async function handleBantuNarasi() {
    if (!kejadianKhusus.trim() || kejadianKhusus.trim() === KEJADIAN_DEFAULT) return;
    setMerapikanNarasi(true);
    try {
      const res = await fetch('/api/ai-narasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teks: kejadianKhusus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal merapikan narasi.');
      setKejadianKhusus(data.narasi);
      setNarasiDibantuAI(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal merapikan narasi.', 'error');
    } finally {
      setMerapikanNarasi(false);
    }
  }

  const pesertaTidakHadir =
    pesertaTerdaftar !== '' && pesertaHadir !== ''
      ? Math.max(0, Number(pesertaTerdaftar) - Number(pesertaHadir))
      : '—';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!periodeAktif) return;

    const payload = {
      periodeId: periodeAktif.id,
      tanggalStr,
      kodeMK,
      namaMK,
      prodi,
      kelas,
      dosenPengajar,
      ruangan: ruangan || null,
      pengawas1,
      pengawas2: pengawas2 || null,
      pesertaTerdaftar: Number(pesertaTerdaftar),
      pesertaHadir: Number(pesertaHadir),
      daftarTidakHadir: daftarTidakHadir || null,
      jamMulaiAktual,
      jamSelesaiAktual,
      jumlahBerkas: jumlahBerkas || null,
      kejadianKhusus,
      namaPengisi,
      fotoBukti,
    };

    const errorValidasi = validasiFormSusulan(payload, { wajibkanFoto: true });
    if (errorValidasi) {
      showToast(errorValidasi, 'error');
      return;
    }

    setMengirim(true);
    try {
      const res = await fetch('/api/berita-acara-susulan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ narasiDibantuAI, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan berita acara susulan.');
      showToast('Berita acara ujian susulan berhasil disimpan.', 'success');
      router.push(`/berita-acara-susulan/${data.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan berita acara susulan.', 'error');
    } finally {
      setMengirim(false);
    }
  }

  if (periodeAktif === undefined) {
    return (
      <main className="mx-auto max-w-[600px] px-4 py-10 text-center text-sm text-faint">Memuat...</main>
    );
  }

  if (periodeAktif === null) {
    return (
      <main className="mx-auto max-w-[600px] px-4 py-10 text-center text-sm text-faint">
        Tidak ada periode ujian aktif. Ujian susulan tidak dapat diinput saat ini.
      </main>
    );
  }

  return (
    <div className="pb-[60px]">
      <div className="flex items-center gap-3 bg-primary-600 px-[18px] py-4 lg:px-8">
        <Link
          href="/"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-white/[0.14] text-base text-white"
        >
          ←
        </Link>
        <div className="text-[15px] font-extrabold text-white">Berita Acara Ujian Susulan</div>
      </div>

      <div className="p-4 lg:mx-auto lg:grid lg:max-w-3xl lg:gap-5 lg:p-8">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3.5 rounded-2xl bg-white p-4 shadow-[0_4px_14px_rgba(15,60,30,0.06)] sm:px-[18px]"
        >
          <h2 className="text-[11.5px] font-bold uppercase tracking-wide text-primary-600">
            Data Ujian Susulan
          </h2>
          <p className="-mt-2 text-[11.5px] text-faint">
            {periodeAktif.jenis} {periodeAktif.semester} T.A. {periodeAktif.tahunAkademik}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Tanggal Ujian Susulan *</label>
              <input
                type="date"
                value={tanggalStr}
                onChange={(e) => setTanggalStr(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Prodi *</label>
              <select
                value={prodi}
                onChange={(e) => setProdi(e.target.value)}
                className={`${inputCls} bg-white`}
              >
                <option value="">Pilih prodi</option>
                {DAFTAR_PRODI.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {prodi && !modeManual && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Nama Mata Kuliah *</label>
                {daftarNamaMK.length > 0 && (
                  <input
                    type="text"
                    value={cariMK}
                    onChange={(e) => setCariMK(e.target.value)}
                    placeholder="Cari mata kuliah..."
                    className={inputCls}
                  />
                )}
                <select
                  value={namaMKPilihan}
                  onChange={(e) => handlePilihNamaMK(e.target.value)}
                  className={`${inputCls} bg-white`}
                >
                  <option value="" disabled>
                    {daftarNamaMK.length === 0
                      ? 'Tidak ada data jadwal untuk prodi ini'
                      : daftarNamaMKTersaring.length === 0
                        ? 'Tidak ada mata kuliah yang cocok'
                        : 'Pilih mata kuliah dari jadwal'}
                  </option>
                  {daftarNamaMKTersaring.map((nm) => (
                    <option key={nm} value={nm}>
                      {nm}
                    </option>
                  ))}
                </select>
              </div>

              {namaMKPilihan && (
                <div className="col-span-2">
                  <label className={labelCls}>Kelas *</label>
                  <select
                    value={kelasPilihan}
                    onChange={(e) => handlePilihKelas(e.target.value)}
                    className={`${inputCls} bg-white`}
                  >
                    <option value="" disabled>
                      Pilih kelas
                    </option>
                    {daftarKelasUntukMK.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {kelasPilihan && (
                <>
                  <div>
                    <label className={labelCls}>Kode MK</label>
                    <input
                      value={kodeMK}
                      onChange={(e) => setKodeMK(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Dosen Pengajar *</label>
                    <input
                      value={dosenPengajar}
                      onChange={(e) => setDosenPengajar(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Ruangan (opsional)</label>
                    <input
                      value={ruangan}
                      onChange={(e) => setRuangan(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </>
              )}

              <div className="col-span-2">
                <button
                  type="button"
                  onClick={aktifkanModeManual}
                  className="text-[11.5px] font-bold text-primary-600 hover:text-primary-700"
                >
                  Mata kuliah tidak ada di daftar? Isi manual
                </button>
              </div>
            </div>
          )}

          {prodi && modeManual && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Kode MK *</label>
                <input value={kodeMK} onChange={(e) => setKodeMK(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Nama MK *</label>
                <input value={namaMK} onChange={(e) => setNamaMK(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Kelas *</label>
                <input value={kelas} onChange={(e) => setKelas(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Dosen Pengajar *</label>
                <input
                  value={dosenPengajar}
                  onChange={(e) => setDosenPengajar(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Ruangan (opsional)</label>
                <input value={ruangan} onChange={(e) => setRuangan(e.target.value)} className={inputCls} />
              </div>
              {daftarJadwalProdi.length > 0 && (
                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={batalkanModeManual}
                    className="text-[11.5px] font-bold text-primary-600 hover:text-primary-700"
                  >
                    ← Pilih dari daftar mata kuliah
                  </button>
                </div>
              )}
            </div>
          )}

          <h2 className="mt-1 text-[11.5px] font-bold uppercase tracking-wide text-primary-600">
            Diisi Pengawas
          </h2>

          <div>
            <label className={labelCls}>Nama Pengawas 1 *</label>
            <input
              value={pengawas1}
              onChange={(e) => setPengawas1(e.target.value)}
              placeholder="Nama lengkap"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Nama Pengawas 2 (opsional)</label>
            <input
              value={pengawas2}
              onChange={(e) => setPengawas2(e.target.value)}
              placeholder="Nama lengkap"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Peserta Terdaftar *</label>
              <input
                type="number"
                min={0}
                value={pesertaTerdaftar}
                onChange={(e) => setPesertaTerdaftar(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Peserta Hadir *</label>
              <input
                type="number"
                min={0}
                value={pesertaHadir}
                onChange={(e) => setPesertaHadir(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div className="rounded-[9px] bg-app px-3 py-2.5 text-[13px] font-semibold text-body">
            Tidak hadir (otomatis): <span className="font-extrabold text-ink">{pesertaTidakHadir}</span>
          </div>

          <div>
            <label className={labelCls}>Nama / NIM Peserta Tidak Hadir (opsional)</label>
            <textarea
              value={daftarTidakHadir}
              onChange={(e) => setDaftarTidakHadir(e.target.value)}
              rows={2}
              placeholder="mis. Rudi Hartono (2022001102) — sakit"
              className={`${inputCls} resize-y`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Jam Mulai Aktual *</label>
              <input
                type="time"
                value={jamMulaiAktual}
                onChange={(e) => setJamMulaiAktual(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Jam Selesai Aktual *</label>
              <input
                type="time"
                value={jamSelesaiAktual}
                onChange={(e) => setJamSelesaiAktual(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Jumlah Berkas / Lembar Jawaban Diserahkan</label>
            <input
              type="number"
              min={0}
              value={jumlahBerkas}
              onChange={(e) => setJumlahBerkas(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className={labelCls}>Kejadian Khusus / Catatan Pelanggaran *</label>
              <button
                type="button"
                onClick={handleBantuNarasi}
                disabled={
                  merapikanNarasi ||
                  !kejadianKhusus.trim() ||
                  kejadianKhusus.trim() === KEJADIAN_DEFAULT
                }
                className="text-xs font-bold text-primary-600 hover:text-primary-700 disabled:opacity-40"
              >
                {merapikanNarasi ? 'Merapikan...' : '✨ Bantu Narasi'}
              </button>
            </div>
            <textarea
              value={kejadianKhusus}
              onChange={(e) => {
                setKejadianKhusus(e.target.value);
                setNarasiDibantuAI(false);
              }}
              rows={2}
              className={`${inputCls} resize-y`}
            />
            {narasiDibantuAI && (
              <p className="mt-1.5 text-[11.5px] font-semibold text-primary-600">
                Teks dirapikan dengan bantuan AI — silakan tinjau sebelum menyimpan.
              </p>
            )}
          </div>

          <div>
            <label className={labelCls}>Foto Bukti Pelaksanaan * (min 1, maks 3)</label>
            <div className="mt-1.5">
              <UploadFotoInput periodeId={periodeAktif.id} onChange={setFotoBukti} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Nama Pengisi (Penanggung Jawab Isian) *</label>
            <input
              value={namaPengisi}
              onChange={(e) => setNamaPengisi(e.target.value)}
              placeholder="Nama lengkap"
              className={inputCls}
            />
          </div>

          <div className="rounded-[9px] border-[1.5px] border-warn-border bg-warn-bg px-3 py-2.5 text-xs font-semibold text-warn-text">
            Setelah disimpan, berita acara susulan akan terkunci dan tidak dapat diubah kembali
            oleh publik.
          </div>

          <button
            type="submit"
            disabled={mengirim}
            className="min-h-[44px] w-full rounded-[11px] bg-primary-600 py-3.5 text-[15px] font-extrabold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {mengirim ? 'Menyimpan...' : 'Simpan Berita Acara Susulan'}
          </button>
        </form>
      </div>
    </div>
  );
}
