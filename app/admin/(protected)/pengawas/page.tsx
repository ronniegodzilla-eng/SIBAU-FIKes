'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { adminFetch, AdminFetchError } from '@/lib/admin-fetch';
import { useToast } from '@/components/ui/ToastProvider';
import { formatTanggalSingkat } from '@/lib/tanggal';
import {
  ALIAS_KOSONG,
  bersihkanAlias,
  formatDurasi,
  kapitalisasi,
  kunciNama,
  kunciOrang,
  pasangan,
  rekapPengawas,
  sarankanGabungan,
  type AliasPengawas,
  type Penugasan,
  type RekapPengawas,
} from '@/lib/pengawas';
import type { BeritaAcaraSusulan, JadwalUjian, Periode } from '@/lib/types';

type PeriodeRingkas = Pick<Periode, 'id' | 'jenis' | 'semester' | 'tahunAkademik' | 'aktif'>;

const kartuCls = 'rounded-2xl bg-white shadow-[0_2px_10px_rgba(15,60,30,0.06)]';
const kontrolCls =
  'min-h-[40px] rounded-lg border-[1.5px] border-line bg-white px-3 text-[13px] text-ink';
const tombolKecilCls =
  'min-h-[30px] rounded-lg border px-2.5 py-1 text-[11px] font-bold disabled:opacity-50';

export default function RekapPengawasPage() {
  const { showToast } = useToast();
  const [daftarPeriode, setDaftarPeriode] = useState<PeriodeRingkas[]>([]);
  const [periodeId, setPeriodeId] = useState('');
  const [jadwal, setJadwal] = useState<JadwalUjian[]>([]);
  const [susulan, setSusulan] = useState<BeritaAcaraSusulan[]>([]);
  const [alias, setAlias] = useState<AliasPengawas>(ALIAS_KOSONG);
  const [loading, setLoading] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);
  const [filterProdi, setFilterProdi] = useState('');
  const [cari, setCari] = useState('');
  const [terbuka, setTerbuka] = useState<string | null>(null);

  useEffect(() => {
    async function muatAwal() {
      try {
        const [dataPeriode, snapAlias] = await Promise.all([
          adminFetch<{ periode: PeriodeRingkas[] }>('/api/admin/periode'),
          getDoc(doc(db, 'settings', 'pengawas')),
        ]);
        setAlias(bersihkanAlias(snapAlias.exists() ? snapAlias.data() : null));
        setDaftarPeriode(dataPeriode.periode);
        const aktif = dataPeriode.periode.find((p) => p.aktif) ?? dataPeriode.periode[0];
        if (aktif) setPeriodeId(aktif.id);
        else setLoading(false);
      } catch (err) {
        showToast(err instanceof AdminFetchError ? err.message : 'Gagal memuat data.', 'error');
        setLoading(false);
      }
    }
    muatAwal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!periodeId) return;
    async function muat() {
      setLoading(true);
      try {
        const [dj, ds] = await Promise.all([
          adminFetch<{ jadwal: JadwalUjian[] }>(`/api/admin/jadwal?periodeId=${periodeId}`),
          adminFetch<{ susulan: BeritaAcaraSusulan[] }>(
            `/api/admin/berita-acara-susulan?periodeId=${periodeId}`
          ),
        ]);
        setJadwal(dj.jadwal);
        setSusulan(ds.susulan);
      } catch (err) {
        showToast(err instanceof AdminFetchError ? err.message : 'Gagal memuat rekap.', 'error');
      } finally {
        setLoading(false);
      }
    }
    muat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodeId]);

  const semuaTugas = useMemo<Penugasan[]>(
    () => [
      ...jadwal
        .filter((j) => j.status === 'terisi' && j.beritaAcaraId)
        .map((j) => ({
          id: j.beritaAcaraId!,
          susulan: false,
          tanggalStr: j.tanggalStr,
          jamMulai: j.jamMulai,
          jamSelesai: j.jamSelesai,
          namaMK: j.namaMK,
          kodeMK: j.kodeMK,
          prodi: j.prodi,
          kelas: j.kelas,
          ruangan: j.ruangan,
          nomorBA: j.nomorBA ?? null,
          pengawas: [j.pengawas1, j.pengawas2],
        })),
      ...susulan.map((s) => ({
        id: s.id,
        susulan: true,
        tanggalStr: s.tanggalStr,
        jamMulai: s.jamMulaiAktual,
        jamSelesai: s.jamSelesaiAktual,
        namaMK: s.namaMK,
        kodeMK: s.kodeMK,
        prodi: s.prodi,
        kelas: s.kelas,
        ruangan: s.ruangan,
        nomorBA: s.nomorBA,
        pengawas: [s.pengawas1, s.pengawas2],
      })),
    ],
    [jadwal, susulan]
  );

  const daftarProdi = useMemo(
    () => Array.from(new Set(semuaTugas.map((t) => t.prodi))).sort(),
    [semuaTugas]
  );

  // Saran & penggabungan selalu dihitung dari SEMUA prodi: satu orang bisa
  // mengawas lintas prodi, dan filter prodi tidak boleh menyembunyikan ejaannya.
  const rekapSemua = useMemo(() => rekapPengawas(semuaTugas, alias), [semuaTugas, alias]);
  const rekapTampil = useMemo(() => {
    const tugas = filterProdi ? semuaTugas.filter((t) => t.prodi === filterProdi) : semuaTugas;
    const { rekap, tanpaNama } = filterProdi ? rekapPengawas(tugas, alias) : rekapSemua;
    const q = cari.trim().toLowerCase();
    return {
      rekap: q ? rekap.filter((r) => `${r.nama} ${r.kunci}`.toLowerCase().includes(q)) : rekap,
      tanpaNama,
      totalTugas: tugas.length,
    };
  }, [semuaTugas, alias, rekapSemua, filterProdi, cari]);

  const petaRekap = useMemo(
    () => new Map(rekapSemua.rekap.map((r) => [r.kunci, r])),
    [rekapSemua]
  );

  const saran = useMemo(
    () =>
      sarankanGabungan(
        new Map(rekapSemua.rekap.map((r) => [r.kunci, r.total])),
        new Set(alias.bukanSama)
      ),
    [rekapSemua, alias.bukanSama]
  );

  async function simpan(baru: AliasPengawas, pesan: string) {
    setMenyimpan(true);
    try {
      // Daftar saran nama di form = nama baku yang sudah ada + semua pengawas
      // periode ini, dirapatkan per orang supaya ejaan lama tidak ikut muncul.
      const { rekap } = rekapPengawas(semuaTugas, baru);
      const abaikan = new Set(baru.abaikan);
      const perOrang = new Map<string, string>();
      for (const nama of baru.daftarNama) {
        const k = kunciOrang(kunciNama(nama), baru.alias);
        if (k && !abaikan.has(k)) perOrang.set(k, nama);
      }
      for (const r of rekap) perOrang.set(r.kunci, r.nama);
      const kirim = { ...baru, daftarNama: [...perOrang.values()] };

      const hasil = await adminFetch<{ data: AliasPengawas }>('/api/admin/pengawas', {
        method: 'PUT',
        body: JSON.stringify(kirim),
      });
      setAlias(bersihkanAlias(hasil.data));
      showToast(pesan, 'success');
    } catch (err) {
      showToast(
        err instanceof AdminFetchError ? err.message : 'Gagal menyimpan perubahan.',
        'error'
      );
    } finally {
      setMenyimpan(false);
    }
  }

  function gabungkan(anggota: string[], tujuan: string, bukanAnggota: string[] = []) {
    const baru = { ...alias, alias: { ...alias.alias } };
    for (const k of anggota) if (k !== tujuan) baru.alias[k] = tujuan;
    // Ejaan yang sengaja tidak dicentang jangan disarankan lagi untuk orang ini.
    if (bukanAnggota.length) {
      const pasang = new Set(alias.bukanSama);
      for (const k of bukanAnggota) pasang.add(pasangan(k, tujuan));
      baru.bukanSama = [...pasang];
    }
    const nama = petaRekap.get(tujuan)?.nama ?? kapitalisasi(tujuan);
    return simpan(baru, `${anggota.length - 1} ejaan digabung ke ${nama}.`);
  }

  function tolak(anggota: string[]) {
    const pasang = new Set(alias.bukanSama);
    for (let i = 0; i < anggota.length; i++)
      for (let j = i + 1; j < anggota.length; j++) pasang.add(pasangan(anggota[i]!, anggota[j]!));
    return simpan({ ...alias, bukanSama: [...pasang] }, 'Ditandai sebagai orang yang berbeda.');
  }

  function pisahkan(kunci: string) {
    const baru = { ...alias, alias: { ...alias.alias } };
    delete baru.alias[kunci];
    return simpan(baru, `${kapitalisasi(kunci)} dipisahkan kembali.`);
  }

  function abaikan(r: RekapPengawas) {
    return simpan(
      { ...alias, abaikan: [...alias.abaikan, r.kunci] },
      `${r.nama} tidak dihitung sebagai pengawas.`
    );
  }

  function pulihkan(kunci: string) {
    return simpan(
      { ...alias, abaikan: alias.abaikan.filter((k) => k !== kunci) },
      `${kapitalisasi(kunci)} dihitung kembali.`
    );
  }

  function ubahNamaBaku(r: RekapPengawas) {
    const nama = window.prompt(
      'Nama baku yang ditampilkan di rekap dan disarankan di form BA (kosongkan untuk otomatis):',
      alias.namaBaku[r.kunci] ?? r.nama
    );
    if (nama === null) return;
    const namaBaku = { ...alias.namaBaku };
    if (nama.trim()) namaBaku[r.kunci] = nama.trim();
    else delete namaBaku[r.kunci];
    return simpan({ ...alias, namaBaku }, 'Nama baku disimpan.');
  }

  function exportExcel() {
    const ringkas = rekapTampil.rekap.map((r, i) => ({
      No: i + 1,
      'Nama Pengawas': r.nama,
      'Ujian Reguler': r.reguler,
      'Ujian Susulan': r.susulan,
      'Total Mengawas': r.total,
      'Total Durasi (jam)': Math.round((r.menit / 60) * 100) / 100,
      'Ejaan Tercatat': r.ejaan.map((e) => `${e.teks} (${e.jumlah})`).join('; '),
    }));
    const detail = rekapTampil.rekap.flatMap((r) =>
      r.tugas
        .filter((t) => !filterProdi || t.prodi === filterProdi)
        .map((t) => ({
          'Nama Pengawas': r.nama,
          Tanggal: t.tanggalStr,
          Jam: `${t.jamMulai}-${t.jamSelesai}`,
          Jenis: t.susulan ? 'Susulan' : 'Reguler',
          'Kode MK': t.kodeMK,
          'Nama MK': t.namaMK,
          Prodi: t.prodi,
          Kelas: t.kelas,
          Ruangan: t.ruangan ?? '-',
          'Nomor BA': t.nomorBA ?? '-',
        }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ringkas), 'Rekap Pengawas');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detail), 'Detail Mengawas');
    XLSX.writeFile(wb, `rekap-pengawas-${periodeId}${filterProdi ? `-${filterProdi}` : ''}.xlsx`);
    showToast('Rekap pengawas berhasil diekspor ke Excel.', 'success');
  }

  const totalMengawas = rekapTampil.rekap.reduce((n, r) => n + r.total, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <Kartu label="PENGAWAS" nilai={rekapTampil.rekap.length} />
        <Kartu label="BERITA ACARA" nilai={rekapTampil.totalTugas} />
        <Kartu label="TOTAL MENGAWAS" nilai={totalMengawas} />
        <Kartu
          label="SARAN GABUNG"
          nilai={saran.length}
          warna={saran.length ? 'text-warn-text' : 'text-success-text'}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap gap-2">
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama pengawas..."
            className={`${kontrolCls} w-[220px]`}
          />
          <select
            value={filterProdi}
            onChange={(e) => setFilterProdi(e.target.value)}
            className={kontrolCls}
          >
            <option value="">Semua Prodi</option>
            {daftarProdi.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={periodeId}
            onChange={(e) => setPeriodeId(e.target.value)}
            className={kontrolCls}
          >
            {daftarPeriode.map((p) => (
              <option key={p.id} value={p.id}>
                {p.jenis} {p.semester} {p.tahunAkademik} {p.aktif ? '(aktif)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => simpan(alias, 'Daftar saran nama di form BA diperbarui.')}
            disabled={menyimpan || loading}
            title="Nama baku dipakai sebagai saran ketikan di kolom pengawas pada form berita acara"
            className="min-h-[40px] whitespace-nowrap rounded-lg border-[1.5px] border-primary-600 px-3.5 text-[13px] font-bold text-primary-600 hover:bg-primary-50 disabled:opacity-50"
          >
            Perbarui saran nama di form ({alias.daftarNama.length})
          </button>
          <button
            onClick={exportExcel}
            disabled={rekapTampil.rekap.length === 0}
            className="min-h-[40px] whitespace-nowrap rounded-lg bg-primary-600 px-3.5 text-[13px] font-bold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            ⬇ Export Excel
          </button>
        </div>
      </div>

      <p className="text-[11.5px] leading-relaxed text-faint">
        Nama pengawas diketik bebas di form BA. Ejaan yang hanya berbeda huruf besar/kecil,
        gelar, tanda baca, atau spasi otomatis dihitung sebagai satu orang. Singkatan dan salah
        ketik perlu Anda setujui lewat saran di bawah. Isi berita acara tidak diubah — penggabungan
        hanya berlaku di rekap ini.
      </p>

      {!loading && saran.length > 0 && (
        <div className={`${kartuCls} border-[1.5px] border-warn-border p-4`}>
          <div className="text-[14px] font-extrabold text-ink">
            Saran penggabungan nama ({saran.length})
          </div>
          <p className="mb-3 text-[11.5px] text-faint">
            Ejaan berikut mirip dan kemungkinan orang yang sama. Pilih nama yang benar, hilangkan
            centang ejaan yang bukan orang tersebut, lalu gabungkan.
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            {saran.map((s) => (
              <KartuSaran
                key={s.anggota.join('|')}
                anggota={s.anggota}
                tujuanAwal={s.tujuan}
                petaRekap={petaRekap}
                menyimpan={menyimpan}
                onGabung={gabungkan}
                onTolak={tolak}
              />
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-faint">Memuat rekap pengawas...</p>
      ) : (
        <div className={`${kartuCls} overflow-auto`}>
          <table className="w-full min-w-[760px] border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-app">
                <Th>NO</Th>
                <Th>NAMA PENGAWAS</Th>
                <Th kanan>REGULER</Th>
                <Th kanan>SUSULAN</Th>
                <Th kanan>TOTAL</Th>
                <Th kanan>DURASI</Th>
                <Th kanan>AKSI</Th>
              </tr>
            </thead>
            <tbody>
              {rekapTampil.rekap.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3.5 py-6 text-center text-faint">
                    Belum ada berita acara terisi pada periode ini.
                  </td>
                </tr>
              )}
              {rekapTampil.rekap.map((r, i) => {
                const buka = terbuka === r.kunci;
                const ejaanGabungan = Array.from(
                  new Set(r.ejaan.map((e) => kunciNama(e.teks)).filter((k) => k !== r.kunci))
                );
                return (
                  <Fragment key={r.kunci}>
                    <tr className="border-t border-line-soft">
                      <td className="px-3.5 py-2.5 text-faint">{i + 1}</td>
                      <td className="px-3.5 py-2.5">
                        <button
                          onClick={() => setTerbuka(buka ? null : r.kunci)}
                          className="text-left font-bold text-ink hover:text-primary-600"
                        >
                          {buka ? '▾' : '▸'} {r.nama}
                        </button>
                        {r.ejaan.length > 1 && (
                          <div className="pl-4 text-[11px] text-faint">
                            {r.ejaan.length} ejaan berbeda
                          </div>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-right text-body">{r.reguler}</td>
                      <td className="px-3.5 py-2.5 text-right text-body">{r.susulan}</td>
                      <td className="px-3.5 py-2.5 text-right text-[14px] font-extrabold text-primary-600">
                        {r.total}
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-2.5 text-right text-body">
                        {formatDurasi(r.menit)}
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-2.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => ubahNamaBaku(r)}
                            disabled={menyimpan}
                            className={`${tombolKecilCls} border-line-strong text-body hover:bg-app`}
                          >
                            Ubah nama
                          </button>
                          <GabungKe
                            r={r}
                            daftar={rekapSemua.rekap}
                            disabled={menyimpan}
                            onPilih={(tujuan) => gabungkan([r.kunci, tujuan], tujuan)}
                          />
                        </div>
                      </td>
                    </tr>
                    {buka && (
                      <tr className="bg-app/60">
                        <td />
                        <td colSpan={6} className="px-3.5 pb-4 pt-1">
                          <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11.5px]">
                            <span className="font-bold text-label">Ejaan tercatat:</span>
                            {r.ejaan.map((e) => (
                              <span
                                key={e.teks}
                                className="rounded-full border border-line bg-white px-2 py-0.5 text-body"
                              >
                                {e.teks} <span className="text-faint">×{e.jumlah}</span>
                              </span>
                            ))}
                          </div>
                          {ejaanGabungan.length > 0 && (
                            <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11.5px]">
                              <span className="font-bold text-label">Digabung manual:</span>
                              {ejaanGabungan.map((k) => (
                                <button
                                  key={k}
                                  onClick={() => pisahkan(k)}
                                  disabled={menyimpan}
                                  className="rounded-full border border-warn-border bg-warn-bg px-2 py-0.5 font-semibold text-warn-text disabled:opacity-50"
                                  title="Pisahkan kembali ejaan ini menjadi orang tersendiri"
                                >
                                  {kapitalisasi(k)} ✕
                                </button>
                              ))}
                            </div>
                          )}
                          <table className="w-full border-collapse text-[11.5px]">
                            <tbody>
                              {r.tugas
                                .filter((t) => !filterProdi || t.prodi === filterProdi)
                                .map((t) => (
                                  <tr key={t.id} className="border-t border-line-soft">
                                    <td className="whitespace-nowrap py-1.5 pr-3 text-body">
                                      {formatTanggalSingkat(t.tanggalStr)} · {t.jamMulai}–
                                      {t.jamSelesai}
                                    </td>
                                    <td className="py-1.5 pr-3 font-semibold text-ink">
                                      {t.namaMK}
                                      {t.susulan && (
                                        <span className="ml-1.5 rounded-full bg-warn-bg px-1.5 text-[10px] font-bold text-warn-text">
                                          Susulan
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-1.5 pr-3 text-body">
                                      {t.prodi} / {t.kelas}
                                    </td>
                                    <td className="py-1.5 pr-3 text-body">{t.ruangan ?? '—'}</td>
                                    <td className="py-1.5 text-right">
                                      <a
                                        href={
                                          t.susulan
                                            ? `/berita-acara-susulan/${t.id}`
                                            : `/berita-acara/${t.id}`
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        className="font-bold text-primary-600 underline underline-offset-2"
                                      >
                                        {t.nomorBA ?? 'Lihat'}
                                      </a>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                          <button
                            onClick={() => abaikan(r)}
                            disabled={menyimpan}
                            className={`${tombolKecilCls} mt-3 border-danger-border text-danger-text hover:bg-danger-softbg`}
                          >
                            Bukan nama pengawas — jangan dihitung
                          </button>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (rekapTampil.tanpaNama > 0 || alias.abaikan.length > 0) && (
        <div className="text-[11.5px] text-faint">
          {rekapTampil.tanpaNama > 0 && (
            <div>
              {rekapTampil.tanpaNama} isian pengawas tidak dihitung karena bukan nama (mis.
              &quot;-&quot;, &quot;0&quot;, &quot;Tdk ada&quot;) atau ditandai bukan pengawas.
            </div>
          )}
          {alias.abaikan.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              Tidak dihitung:
              {alias.abaikan.map((k) => (
                <button
                  key={k}
                  onClick={() => pulihkan(k)}
                  disabled={menyimpan}
                  title="Hitung kembali"
                  className="rounded-full border border-line bg-white px-2 py-0.5 text-body disabled:opacity-50"
                >
                  {kapitalisasi(k)} ↺
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Kartu({ label, nilai, warna = 'text-ink' }: { label: string; nilai: number; warna?: string }) {
  return (
    <div className={`${kartuCls} p-4`}>
      <div className="text-[11px] font-bold text-faint">{label}</div>
      <div className={`text-[22px] font-extrabold ${warna}`}>{nilai}</div>
    </div>
  );
}

function Th({ children, kanan }: { children: React.ReactNode; kanan?: boolean }) {
  return (
    <th
      className={`px-3.5 py-2.5 text-[11px] font-semibold text-muted ${kanan ? 'text-right' : 'text-left'}`}
    >
      {children}
    </th>
  );
}

function GabungKe({
  r,
  daftar,
  disabled,
  onPilih,
}: {
  r: RekapPengawas;
  daftar: RekapPengawas[];
  disabled: boolean;
  onPilih: (tujuan: string) => void;
}) {
  return (
    <select
      value=""
      disabled={disabled}
      onChange={(e) => {
        const tujuan = e.target.value;
        const nama = daftar.find((d) => d.kunci === tujuan)?.nama;
        if (tujuan && window.confirm(`Gabungkan "${r.nama}" ke "${nama}"?`)) onPilih(tujuan);
      }}
      className="min-h-[30px] max-w-[150px] rounded-lg border border-line-strong bg-white px-1.5 text-[11px] font-bold text-body disabled:opacity-50"
    >
      <option value="">Gabungkan ke…</option>
      {daftar
        .filter((d) => d.kunci !== r.kunci)
        .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
        .map((d) => (
          <option key={d.kunci} value={d.kunci}>
            {d.nama}
          </option>
        ))}
    </select>
  );
}

function KartuSaran({
  anggota,
  tujuanAwal,
  petaRekap,
  menyimpan,
  onGabung,
  onTolak,
}: {
  anggota: string[];
  tujuanAwal: string;
  petaRekap: Map<string, RekapPengawas>;
  menyimpan: boolean;
  onGabung: (anggota: string[], tujuan: string, bukanAnggota: string[]) => void;
  onTolak: (anggota: string[]) => void;
}) {
  const [tujuan, setTujuan] = useState(tujuanAwal);
  const [dipilih, setDipilih] = useState<Set<string>>(() => new Set(anggota));
  const terpilih = anggota.filter((k) => dipilih.has(k) || k === tujuan);

  return (
    <div className="rounded-xl border border-line p-3">
      <div className="space-y-1">
        {anggota.map((k) => {
          const r = petaRekap.get(k);
          return (
            <div key={k} className="flex items-center gap-2 text-[12.5px]">
              <input
                type="checkbox"
                checked={dipilih.has(k) || k === tujuan}
                disabled={k === tujuan}
                onChange={(e) => {
                  const baru = new Set(dipilih);
                  if (e.target.checked) baru.add(k);
                  else baru.delete(k);
                  setDipilih(baru);
                }}
                aria-label={`Sertakan ${r?.nama ?? k}`}
              />
              <label className="flex flex-1 cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name={`tujuan-${anggota.join('|')}`}
                  checked={k === tujuan}
                  onChange={() => setTujuan(k)}
                />
                <span className={k === tujuan ? 'font-bold text-ink' : 'text-body'}>
                  {r?.nama ?? kapitalisasi(k)}
                </span>
                <span className="text-[11px] text-faint">
                  {r?.total ?? 0}× · {r?.ejaan.map((e) => e.teks).join(', ')}
                </span>
              </label>
            </div>
          );
        })}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <button
          onClick={() =>
            onGabung(
              terpilih,
              tujuan,
              anggota.filter((k) => !terpilih.includes(k))
            )
          }
          disabled={menyimpan || terpilih.length < 2}
          className={`${tombolKecilCls} border-primary-600 bg-primary-600 text-white hover:bg-primary-700`}
        >
          Gabungkan ke {petaRekap.get(tujuan)?.nama ?? kapitalisasi(tujuan)}
        </button>
        <button
          onClick={() => onTolak(anggota)}
          disabled={menyimpan}
          className={`${tombolKecilCls} border-line-strong text-body hover:bg-app`}
        >
          Bukan orang yang sama
        </button>
      </div>
    </div>
  );
}
