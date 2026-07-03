import { NextRequest, NextResponse } from 'next/server';
import { rapikanNarasi } from '@/lib/groq';
import { ambilIpDariRequest } from '@/lib/verify-admin';
import { periksaRateLimit } from '@/lib/rate-limit';

const MAKS_PANJANG_TEKS = 2000;

export async function POST(req: NextRequest) {
  try {
    const limit = periksaRateLimit(`ai-narasi:${ambilIpDariRequest(req)}`, {
      maksPermintaan: 15,
      jendelaMs: 5 * 60 * 1000,
    });
    if (!limit.diizinkan) {
      return NextResponse.json(
        { error: `Terlalu banyak percobaan. Coba lagi dalam ${limit.sisaDetikTunggu} detik.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const teks = body?.teks;

    if (typeof teks !== 'string' || !teks.trim()) {
      return NextResponse.json({ error: 'Teks kejadian khusus kosong.' }, { status: 400 });
    }
    if (teks.length > MAKS_PANJANG_TEKS) {
      return NextResponse.json(
        { error: `Teks terlalu panjang (maksimal ${MAKS_PANJANG_TEKS} karakter).` },
        { status: 400 }
      );
    }

    const narasi = await rapikanNarasi(teks.trim());
    return NextResponse.json({ narasi });
  } catch (err) {
    console.error('Gagal merapikan narasi:', err);
    return NextResponse.json(
      { error: 'Gagal memproses narasi. Anda tetap bisa mengisi manual.' },
      { status: 500 }
    );
  }
}
