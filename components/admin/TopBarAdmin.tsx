'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { Periode } from '@/lib/types';

const JUDUL: Record<string, string> = {
  '/admin': 'Ringkasan Monitoring',
  '/admin/periode': 'Manajemen Periode Ujian',
  '/admin/jadwal': 'Manajemen Jadwal Ujian',
  '/admin/rekap': 'Rekap & Monitoring',
  '/admin/pengaturan': 'Pengaturan Aplikasi',
};

export default function TopBarAdmin() {
  const pathname = usePathname() ?? '/admin';
  const [periodeAktif, setPeriodeAktif] = useState<Periode | null>(null);

  useEffect(() => {
    async function muat() {
      try {
        const snap = await getDocs(
          query(collection(db, 'periode'), where('aktif', '==', true), limit(1))
        );
        if (!snap.empty) {
          const d = snap.docs[0]!;
          setPeriodeAktif({ id: d.id, ...d.data() } as unknown as Periode);
        }
      } catch {
        // Badge periode bersifat informatif saja — abaikan jika gagal.
      }
    }
    muat();
  }, []);

  const judul = JUDUL[pathname] ?? 'SIBAU Admin';
  const badgeLabel = periodeAktif
    ? `${periodeAktif.jenis} ${periodeAktif.tahunAkademik} · Aktif`
    : 'Tidak ada periode aktif';

  return (
    <div className="flex items-center justify-between border-b border-line bg-white px-[26px] py-4">
      <div className="text-[17px] font-extrabold text-ink">{judul}</div>
      <div className="rounded-full bg-primary-50 px-3 py-1.5 text-[11.5px] font-bold text-primary-600">
        {badgeLabel}
      </div>
    </div>
  );
}
