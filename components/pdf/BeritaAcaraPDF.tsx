import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import { daftarPengawas, teksDokumen, type DokumenBA } from '@/components/ba/dokumen';
import { urlThumbnailFoto } from '@/lib/foto';
import { kodeVerifikasi } from '@/lib/kode-tte';
import {
  formatTanggalIndonesia,
  formatTanggalJamWIB,
  formatTanggalTanpaHari,
} from '@/lib/tanggal';
import type { KopSurat } from '@/lib/kop';
import type { Pejabat } from '@/lib/types';

// Font.register butuh URL yang bisa di-fetch saat generate PDF di browser —
// pakai file lokal di public/fonts (bukan hotlink Google Fonts) supaya
// tidak bergantung jaringan eksternal saat unduh PDF.
Font.register({
  family: 'Source Serif 4',
  fonts: [
    { src: '/fonts/SourceSerif4-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/SourceSerif4-SemiBold.ttf', fontWeight: 600 },
    { src: '/fonts/SourceSerif4-Bold.ttf', fontWeight: 700 },
  ],
});

const HIJAU = '#0F6B35';
const LEBAR_LOGO = 62;

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    // Ruang untuk catatan verifikasi TTE yang menempel di dasar setiap halaman.
    paddingBottom: 66,
    paddingHorizontal: 42,
    fontSize: 10.5,
    lineHeight: 1.45,
    fontFamily: 'Source Serif 4',
    color: '#1a1a1a',
  },

  // Kop mengikuti SIMANTAP: logo mutlak di kiri, teks berpusat pada lebar
  // penuh (padding selebar logo di kedua sisi). Huruf sans (Helvetica)
  // seperti kop SIMANTAP; badan dokumen tetap serif.
  kop: { position: 'relative', fontFamily: 'Helvetica' },
  kopLogo: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: LEBAR_LOGO,
    height: LEBAR_LOGO,
    objectFit: 'contain',
  },
  kopTeks: { paddingHorizontal: LEBAR_LOGO + 8, textAlign: 'center', lineHeight: 1.2 },
  kopYayasan: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, lineHeight: 1.2, color: HIJAU, textTransform: 'uppercase' },
  kopUniversitas: { fontFamily: 'Helvetica-Bold', fontSize: 17, lineHeight: 1.2, color: HIJAU, textTransform: 'uppercase' },
  kopFakultas: { fontFamily: 'Helvetica-Bold', fontSize: 14, lineHeight: 1.2, textTransform: 'uppercase' },
  kopAlamat: { fontSize: 8.5, lineHeight: 1.3 },
  garisTebal: { marginTop: 6, height: 2.2, backgroundColor: HIJAU },
  garisTipis: { marginTop: 1.5, height: 0.9, backgroundColor: HIJAU },

  judulWrap: { marginTop: 14, textAlign: 'center' },
  judul: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase' },
  subjudul: { fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase' },
  nomor: { marginTop: 2 },

  paragraf: { marginTop: 12, textAlign: 'justify' },
  tebal: { fontWeight: 700 },

  bagian: { marginTop: 9 },
  bagianJudul: { fontWeight: 700, marginBottom: 2 },
  bagianIsi: { paddingLeft: 12 },
  baris: { flexDirection: 'row' },
  barisLabel: { width: 150 },
  barisTitik: { width: 10 },
  barisNilai: { flex: 1 },
  kotak: { borderWidth: 0.8, borderColor: '#bbb', borderRadius: 3, paddingVertical: 4, paddingHorizontal: 7 },

  ttdBlok: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  ttdKolom: { width: '44%', textAlign: 'center', alignItems: 'center' },
  ttdQr: { width: 74, height: 74, marginTop: 6 },
  ttdKetTte: { fontFamily: 'Helvetica', fontSize: 7.5, lineHeight: 1.3, color: '#555', textAlign: 'center' },
  ttdNama: { fontWeight: 700, marginTop: 4 },
  ttdRuangBasah: { height: 60 },
  ttdNamaPejabat: { fontWeight: 700, textDecoration: 'underline' },

  catatan: {
    position: 'absolute',
    left: 42,
    right: 42,
    bottom: 22,
    paddingTop: 5,
    borderTopWidth: 0.6,
    borderTopColor: '#bbb',
    fontFamily: 'Helvetica',
    fontSize: 7.5,
    color: '#555',
    lineHeight: 1.4,
  },
  catatanKode: { fontFamily: 'Courier-Bold', color: '#222' },

  lampiranJudul: { fontWeight: 700, fontSize: 11 },
  fotoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  fotoItem: { width: 240, height: 180, objectFit: 'cover', borderWidth: 0.6, borderColor: '#ccc' },
});

function Baris({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.baris}>
      <Text style={styles.barisLabel}>{k}</Text>
      <Text style={styles.barisTitik}>:</Text>
      <Text style={styles.barisNilai}>{v}</Text>
    </View>
  );
}

function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <View style={styles.bagian} wrap={false}>
      <Text style={styles.bagianJudul}>{judul}</Text>
      <View style={styles.bagianIsi}>{children}</View>
    </View>
  );
}

export default function BeritaAcaraPDF({
  dok,
  kop,
  pejabat,
  qr,
  urlVerifikasi,
}: {
  dok: DokumenBA;
  kop: KopSurat;
  pejabat: Pejabat | null;
  qr: string;
  urlVerifikasi: string;
}) {
  const teks = teksDokumen(dok);
  const pengawas = daftarPengawas(dok);

  return (
    <Document title={`Berita Acara ${dok.nomorBA}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.kop}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image dari @react-pdf/renderer, bukan elemen HTML <img> */}
          <Image src={kop.logoUrl} style={styles.kopLogo} />
          <View style={styles.kopTeks}>
            <Text style={styles.kopYayasan}>{kop.namaYayasan}</Text>
            <Text style={styles.kopUniversitas}>{kop.namaUniversitas}</Text>
            <Text style={styles.kopFakultas}>{kop.namaFakultas}</Text>
            <Text style={styles.kopAlamat}>
              {kop.alamat}. Telp. {kop.telepon}
            </Text>
            <Text style={styles.kopAlamat}>Email : {kop.email}</Text>
          </View>
          <View style={styles.garisTebal} />
          <View style={styles.garisTipis} />
        </View>

        <View style={styles.judulWrap}>
          <Text style={styles.judul}>{teks.judul}</Text>
          {teks.subjudul ? <Text style={styles.subjudul}>{teks.subjudul}</Text> : null}
          <Text style={styles.nomor}>Nomor : {dok.nomorBA}</Text>
        </View>

        <Text style={styles.paragraf}>
          Pada hari ini, <Text style={styles.tebal}>{formatTanggalIndonesia(dok.tanggalStr)}</Text>,
          pukul{' '}
          <Text style={styles.tebal}>
            {dok.jamMulaiAktual.replace(':', '.')} – {dok.jamSelesaiAktual.replace(':', '.')} WIB
          </Text>
          , telah dilaksanakan {teks.kegiatan} dengan keterangan sebagai berikut:
        </Text>

        <Bagian judul="A. Identitas Ujian">
          <Baris k="Mata Kuliah" v={`${dok.namaMK} (${dok.kodeMK})`} />
          <Baris k="Program Studi" v={dok.prodi} />
          <Baris k="Kelas" v={dok.kelas} />
          <Baris k="Dosen Pengampu" v={dok.dosenPengajar} />
          <Baris k="Ruangan" v={dok.ruangan ?? '—'} />
          {dok.jamTerjadwal ? <Baris k="Jadwal Ujian" v={`${dok.jamTerjadwal} WIB`} /> : null}
        </Bagian>

        <Bagian judul="B. Pelaksanaan dan Kehadiran">
          <Baris k="Waktu Pelaksanaan" v={`${dok.jamMulaiAktual} – ${dok.jamSelesaiAktual} WIB`} />
          <Baris k="Peserta Terdaftar" v={`${dok.pesertaTerdaftar} orang`} />
          <Baris k="Peserta Hadir" v={`${dok.pesertaHadir} orang`} />
          <Baris k="Peserta Tidak Hadir" v={`${dok.pesertaTidakHadir} orang`} />
          {dok.daftarTidakHadir ? (
            <Baris k="Keterangan Tidak Hadir" v={dok.daftarTidakHadir} />
          ) : null}
          {dok.jumlahBerkas != null ? (
            <Baris k="Lembar Jawaban Diserahkan" v={`${dok.jumlahBerkas} lembar`} />
          ) : null}
        </Bagian>

        <Bagian judul="C. Kejadian Khusus / Catatan Pelanggaran">
          <View style={styles.kotak}>
            <Text>{dok.kejadianKhusus}</Text>
          </View>
        </Bagian>

        <Text style={styles.paragraf}>
          Demikian berita acara ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana
          mestinya.
        </Text>

        <View style={styles.ttdBlok} wrap={false}>
          <View style={styles.ttdKolom}>
            <Text> </Text>
            <Text style={styles.tebal}>Pengawas Ujian,</Text>
            {dok.tte ? (
              <>
                {qr ? (
                  // eslint-disable-next-line jsx-a11y/alt-text -- Image dari @react-pdf/renderer
                  <Image src={qr} style={styles.ttdQr} />
                ) : (
                  <View style={styles.ttdQr} />
                )}
                <Text style={[styles.ttdKetTte, { marginTop: 3 }]}>
                  Ditandatangani secara elektronik
                </Text>
                <Text style={styles.ttdKetTte}>
                  {formatTanggalJamWIB(dok.tte.ditandatanganiAt)}
                </Text>
              </>
            ) : (
              <View style={styles.ttdRuangBasah} />
            )}
            {pengawas.map((nama, i) => (
              <Text key={nama} style={i === 0 ? styles.ttdNama : styles.tebal}>
                {pengawas.length > 1 ? `${i + 1}. ` : ''}
                {nama}
              </Text>
            ))}
          </View>

          <View style={styles.ttdKolom}>
            <Text>Batam, {formatTanggalTanpaHari(dok.tanggalStr)}</Text>
            <Text style={styles.tebal}>Mengetahui,</Text>
            <Text style={styles.tebal}>{pejabat?.jabatan || '—'}</Text>
            <View style={styles.ttdRuangBasah} />
            <Text style={styles.ttdNamaPejabat}>{pejabat?.nama || '—'}</Text>
            {pejabat?.nip ? <Text>NIP. {pejabat.nip}</Text> : null}
          </View>
        </View>

        <View style={styles.catatan} fixed>
          {dok.tte ? (
            <Text>
              Bagian pengawas pada dokumen ini ditandatangani secara elektronik melalui SIBAU FIKes
              UIS dan sah tanpa tanda tangan basah. Keaslian dapat diperiksa dengan memindai kode
              QR atau membuka {urlVerifikasi || 'halaman verifikasi SIBAU'}. Kode verifikasi:{' '}
              <Text style={styles.catatanKode}>{kodeVerifikasi(dok.tte.hash)}</Text>
            </Text>
          ) : (
            <Text>Dokumen ini belum ditandatangani secara elektronik.</Text>
          )}
          <Text>Diisi oleh: {dok.namaPengisi}</Text>
        </View>

        {dok.fotoBukti.length > 0 ? (
          <View break>
            <Text style={styles.lampiranJudul}>
              Lampiran Berita Acara Nomor {dok.nomorBA}
            </Text>
            <Text>Dokumentasi Pelaksanaan Ujian</Text>
            <View style={styles.fotoGrid}>
              {dok.fotoBukti.map((f) => (
                // eslint-disable-next-line jsx-a11y/alt-text -- Image dari @react-pdf/renderer
                <Image key={f.fileId} src={urlThumbnailFoto(f.fileId)} style={styles.fotoItem} />
              ))}
            </View>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
