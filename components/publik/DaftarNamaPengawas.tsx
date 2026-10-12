'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { bersihkanAlias } from '@/lib/pengawas';

export const ID_DAFTAR_PENGAWAS = 'daftar-nama-pengawas';

/**
 * <datalist> nama baku pengawas (dikelola admin di Rekap Pengawas). Input
 * tetap bebas diketik — ini hanya saran supaya ejaan nama seragam.
 */
export default function DaftarNamaPengawas() {
  const [nama, setNama] = useState<string[]>([]);

  useEffect(() => {
    getDoc(doc(db, 'settings', 'pengawas'))
      .then((snap) => setNama(bersihkanAlias(snap.exists() ? snap.data() : null).daftarNama))
      .catch(() => {
        // Saran nama bersifat pelengkap — form tetap bisa diisi tanpanya.
      });
  }, []);

  return (
    <datalist id={ID_DAFTAR_PENGAWAS}>
      {nama.map((n) => (
        <option key={n} value={n} />
      ))}
    </datalist>
  );
}
