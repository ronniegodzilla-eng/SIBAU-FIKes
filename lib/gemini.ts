// Klien Gemini API (REST langsung via fetch, tanpa SDK tambahan) untuk fitur
// bantu narasi kejadian khusus. Dipanggil HANYA dari /api/ai-narasi — key
// tidak pernah dikirim ke client (§4 prinsip keamanan).
//
// Aturan keras (§5 prinsip keamanan): AI HANYA merapikan tata bahasa/format
// teks yang sudah ditulis pengawas, DILARANG menambah fakta baru. Hasil
// selalu draf yang wajib ditinjau manusia sebelum disimpan (flag
// narasiDibantuAI baru di-set true jika pengawas secara sadar menerima
// saran, lihat app/isi/[jadwalId]/page.tsx).

const MODEL = 'gemini-2.5-flash';

const SYSTEM_INSTRUCTION = `Anda adalah asisten yang HANYA merapikan tata bahasa dan format catatan "kejadian khusus" ujian yang ditulis pengawas ujian.

ATURAN KETAT (wajib dipatuhi):
1. DILARANG KERAS menambahkan informasi, fakta, dugaan, nama, angka, atau detail apa pun yang tidak eksplisit ada di teks asli pengawas.
2. DILARANG mengubah makna, kesimpulan, atau tingkat keparahan kejadian yang ditulis pengawas.
3. Jika teks asli adalah "Nihil" atau menyatakan tidak ada kejadian, kembalikan persis "Nihil" tanpa tambahan kalimat apa pun.
4. Hanya perbaiki ejaan, tata bahasa, dan susunan kalimat agar formal dan baku dalam Bahasa Indonesia.
5. Jangan menambahkan komentar, kalimat pembuka, kalimat penutup, atau penjelasan. Langsung berikan hasil rapi saja, tanpa tanda kutip.`;

export async function rapikanNarasi(teksAsli: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum diset di environment variables server.');
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: 'user', parts: [{ text: teksAsli }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini API merespons status ${res.status}.`);
  }

  const data = await res.json();
  const teks: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!teks || !teks.trim()) {
    throw new Error('Gemini API tidak mengembalikan hasil.');
  }

  return teks.trim();
}
