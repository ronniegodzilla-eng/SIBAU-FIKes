// Klien Groq API (REST langsung via fetch, kompatibel format OpenAI) untuk
// fitur bantu narasi kejadian khusus. Dipanggil HANYA dari /api/ai-narasi —
// key tidak pernah dikirim ke client (§4 prinsip keamanan). Groq dipilih
// (menggantikan Gemini) karena free tier tanpa kartu kredit/kuota prabayar
// yang bisa habis — keputusan pemilik produk 2026-07-03.
//
// Aturan keras (§5 prinsip keamanan): AI HANYA merapikan tata bahasa/format
// teks yang sudah ditulis pengawas, DILARANG menambah fakta baru. Hasil
// selalu draf yang wajib ditinjau manusia sebelum disimpan (flag
// narasiDibantuAI baru di-set true jika pengawas secara sadar menerima
// saran, lihat app/isi/[jadwalId]/page.tsx).

const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_INSTRUCTION = `Anda adalah asisten yang HANYA merapikan tata bahasa dan format catatan "kejadian khusus" ujian yang ditulis pengawas ujian.

ATURAN KETAT (wajib dipatuhi):
1. DILARANG KERAS menambahkan informasi, fakta, dugaan, nama, angka, atau detail apa pun yang tidak eksplisit ada di teks asli pengawas.
2. DILARANG mengubah makna, kesimpulan, atau tingkat keparahan kejadian yang ditulis pengawas.
3. Jika teks asli adalah "Nihil" atau menyatakan tidak ada kejadian, kembalikan persis "Nihil" tanpa tambahan kalimat apa pun.
4. Hanya perbaiki ejaan, tata bahasa, dan susunan kalimat agar formal dan baku dalam Bahasa Indonesia.
5. Jangan menambahkan komentar, kalimat pembuka, kalimat penutup, atau penjelasan. Langsung berikan hasil rapi saja, tanpa tanda kutip.`;

export async function rapikanNarasi(teksAsli: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY belum diset di environment variables server.');
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: teksAsli },
      ],
      temperature: 0.2,
      max_tokens: 400,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Groq API merespons status ${res.status}. ${detail}`.trim());
  }

  const data = await res.json();
  const teks: string | undefined = data?.choices?.[0]?.message?.content;

  if (!teks || !teks.trim()) {
    throw new Error('Groq API tidak mengembalikan hasil.');
  }

  return teks.trim();
}
