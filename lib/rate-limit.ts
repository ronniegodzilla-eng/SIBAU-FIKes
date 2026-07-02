// Rate limiting sederhana in-memory per IP (§8, §15 keputusan #1: mitigasi
// kompensasi untuk submit publik tanpa PIN). CATATAN: Vercel serverless
// dapat menjalankan beberapa instance function, sehingga limit ini per
// instance — bukan jaminan global yang ketat, tetapi cukup untuk menahan
// spam/percobaan otomatis pada skala pemakaian kampus (§6.3 PRD: puluhan
// berita acara/hari). Upgrade ke store terpusat (mis. Redis) jika suatu
// saat traffic jauh lebih besar.

interface Entri {
  waktu: number[];
}

const store = new Map<string, Entri>();

export interface HasilRateLimit {
  diizinkan: boolean;
  sisaDetikTunggu?: number;
}

export function periksaRateLimit(
  key: string,
  { maksPermintaan, jendelaMs }: { maksPermintaan: number; jendelaMs: number }
): HasilRateLimit {
  const sekarang = Date.now();
  const entri = store.get(key) ?? { waktu: [] };

  entri.waktu = entri.waktu.filter((t) => sekarang - t < jendelaMs);

  if (entri.waktu.length >= maksPermintaan) {
    const tertua = entri.waktu[0]!;
    store.set(key, entri);
    return {
      diizinkan: false,
      sisaDetikTunggu: Math.ceil((jendelaMs - (sekarang - tertua)) / 1000),
    };
  }

  entri.waktu.push(sekarang);
  store.set(key, entri);
  return { diizinkan: true };
}
