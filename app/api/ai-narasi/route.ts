import { NextRequest, NextResponse } from 'next/server';
import { rapikanNarasi } from '@/lib/gemini';

const MAKS_PANJANG_TEKS = 2000;

export async function POST(req: NextRequest) {
  try {
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
