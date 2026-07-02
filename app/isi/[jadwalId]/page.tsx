'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { formatTanggalIndonesia, jamStrWIB } from '@/lib/tanggal';
import { validasiFormBA } from '@/lib/validasi';
import UploadFotoInput from '@/components/publik/UploadFotoInput';
import type { JadwalUjian, Periode, FotoBukti } from '@/lib/types';

const KEJADIAN_DEFAULT = 'Nihil';

export default function IsiBeritaAcaraPage({
  params,
}: {
  params: { jadwalId: string };
}) {
  const router = useRouter();
  const [jadwal, setJadwal] = useState<JadwalUjian | null | undefined>(undefined);
  const [periode, setPeriode] = useState<Periode | null>(null);
  const [errorMuat, setErrorMuat] = useState('');

  const [pengawas1, setPengawas1] = useState('');
  const [pengawas2, setPengawas2] = useState('');
  const [pesertaTerdaftar, setPesertaTerdaftar] = useState('');
  const [pesertaHadir, setPesertaHadir] = useState('');
  const [daftarTidakHadir, setDaftarTidakHadir] = useState('');
  const [jamMulaiAktual, setJamMulaiAktual] = useState('');
  const [jamSelesaiAktual, setJamSelesaiAktual] = useState('');
  const [jumlahBerkas, setJumlahBerkas] = useState('');
  const [kejadianKhusus, setKejadianKhusus] = useState(KEJADIAN_DEFAULT);
  const [namaPengisi, setNamaPengisi] = useState('');
  const [fotoBukti, setFotoBukti] = useState<FotoBukti[]>([]);

  const [error, setError] = useState('');
  const [mengirim, setMengirim] = useState(false);

  useEffect(() => {
    async function muat() {
      try {
        const jadwalSnap = await getDoc(doc(db, 'jadwal_ujian', params.jadwalId));
        if (!jadwalSnap.exists()) {
          setJadwal(null);
          return;
        }
        const jadwalData = { id: jadwalSnap.id, ...jadwalSnap.data() } as unknown as JadwalUjian;
        setJadwal(jadwalData);
        setJamMulaiAktual(jadwalData.jamMulai || jamStrWIB());

        const periodeSnap = await getDoc(doc(db, 'periode', jadwalData.periodeId));
        if (periodeSnap.exists()) {
          setPeriode({ id: periodeSnap.id, ...periodeSnap.data() } as unknown as Periode);
        }
      } catch {
        setErrorMuat('Gagal memuat data jadwal. Periksa koneksi internet Anda.');
      }
    }
    muat();
  }, [params.jadwalId]);

  const pesertaTidakHadir =
    pesertaTerdaftar !== '' && pesertaHadir !== ''
      ? Math.max(0, Number(pesertaTerdaftar) - Number(pesertaHadir))
      : '';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const payload = {
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

    const errorValidasi = validasiFormBA(payload, { wajibkanFoto: true });
    if (errorValidasi) {
      setError(errorValidasi);
      return;
    }

    setMengirim(true);
    try {
      const res = await fetch('/api/berita-acara', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jadwalId: params.jadwalId, narasiDibantuAI: false, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan berita acara.');
      router.push(`/berita-acara/${data.baId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan berita acara.');
    } finally {
      setMengirim(false);
    }
  }

  if (jadwal === undefined) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center text-sm text-gray-400">
        {errorMuat || 'Memuat...'}
      </main>
    );
  }

  if (jadwal === null) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="text-sm text-gray-600">Jadwal ujian tidak ditemukan.</p>
      </main>
    );
  }

  if (jadwal.status === 'terisi') {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="text-sm text-gray-600">
          Berita acara untuk jadwal ini sudah diisi.
        </p>
        {jadwal.beritaAcaraId && (
          <a
            href={`/berita-acara/${jadwal.beritaAcaraId}`}
            className="mt-3 inline-block min-h-[44px] rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium leading-[28px] text-white hover:bg-primary-700"
          >
            Lihat Berita Acara
          </a>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-16">
      <h1 className="text-lg font-semibold text-gray-900">Isi Berita Acara</h1>

      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 text-sm">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Data Jadwal
        </h2>
        <dl className="grid grid-cols-2 gap-y-2">
          <div className="col-span-2">
            <dt className="text-xs text-gray-400">Periode</dt>
            <dd className="text-gray-800">
              {periode ? `${periode.jenis} ${periode.semester} ${periode.tahunAkademik}` : '-'}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-gray-400">Hari/Tanggal</dt>
            <dd className="text-gray-800">{formatTanggalIndonesia(jadwal.tanggalStr)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Jam Terjadwal</dt>
            <dd className="text-gray-800">{jadwal.jamMulai}–{jadwal.jamSelesai}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Ruangan</dt>
            <dd className="text-gray-800">{jadwal.ruangan ?? '-'}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-gray-400">Mata Kuliah</dt>
            <dd className="text-gray-800">{jadwal.namaMK} ({jadwal.kodeMK})</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Prodi/Kelas</dt>
            <dd className="text-gray-800">{jadwal.prodi} / {jadwal.kelas}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Dosen Pengajar</dt>
            <dd className="text-gray-800">{jadwal.dosenPengajar}</dd>
          </div>
        </dl>
      </section>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nama pengawas 1 *
            </label>
            <input
              value={pengawas1}
              onChange={(e) => setPengawas1(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nama pengawas 2
            </label>
            <input
              value={pengawas2}
              onChange={(e) => setPengawas2(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Peserta terdaftar *
            </label>
            <input
              type="number"
              min={0}
              value={pesertaTerdaftar}
              onChange={(e) => setPesertaTerdaftar(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Peserta hadir *
            </label>
            <input
              type="number"
              min={0}
              value={pesertaHadir}
              onChange={(e) => setPesertaHadir(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Peserta tidak hadir (otomatis)
            </label>
            <input
              disabled
              value={pesertaTidakHadir}
              className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Nama/NIM peserta tidak hadir
            </label>
            <textarea
              value={daftarTidakHadir}
              onChange={(e) => setDaftarTidakHadir(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Jam mulai aktual *
            </label>
            <input
              type="time"
              value={jamMulaiAktual}
              onChange={(e) => setJamMulaiAktual(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Jam selesai aktual *
            </label>
            <input
              type="time"
              value={jamSelesaiAktual}
              onChange={(e) => setJamSelesaiAktual(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Jumlah berkas/lembar jawaban diserahkan
            </label>
            <input
              type="number"
              min={0}
              value={jumlahBerkas}
              onChange={(e) => setJumlahBerkas(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Kejadian khusus / catatan pelanggaran *
            </label>
            <textarea
              value={kejadianKhusus}
              onChange={(e) => setKejadianKhusus(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Foto bukti pelaksanaan *
            </label>
            <div className="mt-1">
              <UploadFotoInput jadwalId={params.jadwalId} onChange={setFotoBukti} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Nama pengisi (penanggung jawab isian) *
            </label>
            <input
              value={namaPengisi}
              onChange={(e) => setNamaPengisi(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={mengirim}
          className="min-h-[44px] w-full rounded-lg bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {mengirim ? 'Menyimpan...' : 'Simpan Berita Acara'}
        </button>
      </form>
    </main>
  );
}
