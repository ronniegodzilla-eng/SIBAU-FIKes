'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import TombolUnduhPDF from '@/components/pdf/TombolUnduhPDF';
import DokumenBeritaAcara from '@/components/ba/DokumenBeritaAcara';
import { dokumenSusulan } from '@/components/ba/dokumen';
import { useQrVerifikasi } from '@/components/ba/useQrVerifikasi';
import { kopDari } from '@/lib/kop';
import type { BeritaAcaraSusulan, Periode, SettingsApp } from '@/lib/types';

export default function DetailBeritaAcaraSusulanPage({
  params,
}: {
  params: { id: string };
}) {
  const [susulan, setSusulan] = useState<BeritaAcaraSusulan | null | undefined>(undefined);
  const [periode, setPeriode] = useState<Periode | null>(null);
  const [settings, setSettings] = useState<SettingsApp | null | undefined>(undefined);
  const [error, setError] = useState('');
  const { url: urlVerifikasi, qr } = useQrVerifikasi(susulan?.tte ? params.id : null);

  useEffect(() => {
    async function muat() {
      try {
        const snap = await getDoc(doc(db, 'berita_acara_susulan', params.id));
        if (!snap.exists()) {
          setSusulan(null);
          return;
        }
        const data = { id: snap.id, ...snap.data() } as unknown as BeritaAcaraSusulan;

        const [periodeSnap, settingsSnap] = await Promise.all([
          getDoc(doc(db, 'periode', data.periodeId)),
          getDoc(doc(db, 'settings', 'app')),
        ]);
        if (periodeSnap.exists()) {
          setPeriode({ id: periodeSnap.id, ...periodeSnap.data() } as unknown as Periode);
        }
        setSettings(settingsSnap.exists() ? (settingsSnap.data() as SettingsApp) : null);
        setSusulan(data);
      } catch {
        setError('Gagal memuat berita acara. Periksa koneksi internet Anda.');
      }
    }
    muat();
  }, [params.id]);

  if (susulan === undefined) {
    return (
      <main className="mx-auto max-w-[760px] px-4 py-10 text-center text-sm text-faint">
        {error || 'Memuat...'}
      </main>
    );
  }

  if (susulan === null) {
    return (
      <main className="mx-auto max-w-[760px] px-4 py-10 text-center text-sm text-faint">
        Berita acara ujian susulan tidak ditemukan.
      </main>
    );
  }

  const dok = dokumenSusulan(susulan, periode);
  const kop = kopDari(settings);
  const pejabat = settings?.pejabat ?? null;
  // PDF baru dirakit setelah QR siap supaya tanda tangan elektroniknya ikut tercetak.
  const siapPdf = settings !== undefined && (!dok.tte || Boolean(qr));

  return (
    <div className="mx-auto max-w-[760px] pb-[60px]">
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
        {siapPdf && (
          <TombolUnduhPDF
            dok={dok}
            kop={kop}
            pejabat={pejabat}
            qr={qr}
            urlVerifikasi={urlVerifikasi}
          />
        )}
      </div>

      <div id="print-area" className="m-3 sm:m-4">
        <DokumenBeritaAcara
          dok={dok}
          kop={kop}
          pejabat={pejabat}
          qr={qr}
          urlVerifikasi={urlVerifikasi}
        />
      </div>

      <div id="no-print" className="mx-4 mb-5 text-center">
        {susulan.locked ? (
          <span className="inline-block rounded-full bg-primary-50 px-3.5 py-2 text-xs font-bold text-primary-600">
            🔒 Berita acara ujian susulan terkunci — hubungi panitia untuk koreksi
          </span>
        ) : (
          <Link
            href={`/susulan?edit=${susulan.id}`}
            className="inline-block rounded-full bg-warn-bg px-3.5 py-2 text-xs font-bold text-warn-text"
          >
            🔓 Kunci dibuka admin — klik untuk edit berita acara susulan
          </Link>
        )}
      </div>
    </div>
  );
}
