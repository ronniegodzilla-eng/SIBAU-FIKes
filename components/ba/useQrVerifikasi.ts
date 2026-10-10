'use client';

import { useEffect, useState } from 'react';
import { pathVerifikasi } from '@/lib/kode-tte';

/** URL halaman verifikasi BA + gambar QR-nya (data URL, dipakai juga di PDF). */
export function useQrVerifikasi(baId: string | null): { url: string; qr: string } {
  const [url, setUrl] = useState('');
  const [qr, setQr] = useState('');

  useEffect(() => {
    if (!baId) return;
    const tautan = `${window.location.origin}${pathVerifikasi(baId)}`;
    setUrl(tautan);
    let batal = false;
    // Dimuat dinamis: pustaka QR hanya dibutuhkan di halaman dokumen BA.
    void import('qrcode').then((QR) =>
      QR.toDataURL(tautan, { margin: 0, width: 320, errorCorrectionLevel: 'M' }).then((u) => {
        if (!batal) setQr(u);
      })
    );
    return () => {
      batal = true;
    };
  }, [baId]);

  return { url, qr };
}
