import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import { formatTanggalIndonesia } from '@/lib/tanggal';
import { urlThumbnailFoto } from '@/lib/foto';
import type { BeritaAcara, JadwalUjian, Periode, SettingsApp } from '@/lib/types';

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

const styles = StyleSheet.create({
  page: {
    padding: 34,
    fontSize: 10,
    fontFamily: 'Source Serif 4',
    color: '#1a1a1a',
  },
  kop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    marginBottom: 14,
    borderBottomWidth: 2.5,
    borderBottomColor: HIJAU,
  },
  logo: { width: 50, height: 50, objectFit: 'contain' },
  kopTeks: { flex: 1, textAlign: 'center' },
  kopYayasan: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3 },
  kopUniversitas: { fontSize: 13.5, fontWeight: 700, marginTop: 2 },
  kopFakultas: { fontSize: 11.5, fontWeight: 600, marginTop: 1 },
  kopAlamat: { fontSize: 9, color: '#555', marginTop: 1 },
  judulWrap: { textAlign: 'center', marginBottom: 16 },
  judul: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase' },
  nomorBA: { fontSize: 10, marginTop: 3 },
  tabelWrap: { marginBottom: 10 },
  garisAtas: { borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 8, marginBottom: 10 },
  baris: { flexDirection: 'row', marginBottom: 3 },
  label1: { width: 95, color: '#444' },
  titik1: { width: 10 },
  nilai1: { flex: 1, fontWeight: 600, paddingRight: 8 },
  label2: { width: 75, color: '#444' },
  titik2: { width: 10 },
  nilai2: { flex: 1, fontWeight: 600 },
  labelPenuh: { width: 120, color: '#444' },
  titikPenuh: { width: 10 },
  nilaiPenuh: { flex: 1, fontWeight: 600 },
  section: { marginBottom: 14 },
  sectionLabel: { fontSize: 9.5, color: '#444', marginBottom: 4 },
  kejadian: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#F5F6F1',
    fontSize: 10,
    fontWeight: 600,
  },
  fotoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fotoItem: { width: 120, height: 90, borderRadius: 4, borderWidth: 1, borderColor: '#ddd' },
  ttdBlok: { flexDirection: 'row', marginTop: 30, justifyContent: 'space-between' },
  ttdKolom: { width: '31%', textAlign: 'center' },
  ttdSpasi: { height: 46 },
  ttdGaris: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginHorizontal: 6,
    paddingTop: 5,
    fontWeight: 700,
  },
  ttdKeterangan: { fontSize: 9, color: '#555', marginTop: 2 },
  footer: { marginTop: 16, textAlign: 'center', fontSize: 8.5, color: '#888' },
});

function BarisGanda({
  label1,
  nilai1,
  label2,
  nilai2,
}: {
  label1: string;
  nilai1: string;
  label2: string;
  nilai2: string;
}) {
  return (
    <View style={styles.baris}>
      <Text style={styles.label1}>{label1}</Text>
      <Text style={styles.titik1}>:</Text>
      <Text style={styles.nilai1}>{nilai1}</Text>
      <Text style={styles.label2}>{label2}</Text>
      <Text style={styles.titik2}>:</Text>
      <Text style={styles.nilai2}>{nilai2}</Text>
    </View>
  );
}

function BarisPenuh({ label, nilai }: { label: string; nilai: string }) {
  return (
    <View style={styles.baris}>
      <Text style={styles.labelPenuh}>{label}</Text>
      <Text style={styles.titikPenuh}>:</Text>
      <Text style={styles.nilaiPenuh}>{nilai}</Text>
    </View>
  );
}

export default function BeritaAcaraPDF({
  ba,
  jadwal,
  periode,
  settings,
  susulan = false,
}: {
  ba: BeritaAcara;
  jadwal: JadwalUjian;
  periode: Periode;
  settings: SettingsApp;
  /** Tandai dokumen sebagai berita acara ujian susulan (insidental). */
  susulan?: boolean;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.kop}>
          {settings.logoUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- Image dari @react-pdf/renderer, bukan elemen HTML <img>
            <Image src={settings.logoUrl} style={styles.logo} />
          ) : (
            <View style={styles.logo} />
          )}
          <View style={styles.kopTeks}>
            <Text style={styles.kopYayasan}>YAYASAN UNIVERSITAS IBNU SINA BATAM</Text>
            <Text style={styles.kopUniversitas}>{settings.namaUniversitas}</Text>
            <Text style={styles.kopFakultas}>{settings.namaFakultas}</Text>
            {!!settings.alamat && <Text style={styles.kopAlamat}>{settings.alamat}</Text>}
          </View>
          <View style={styles.logo} />
        </View>

        <View style={styles.judulWrap}>
          <Text style={styles.judul}>
            Berita Acara Pelaksanaan Ujian{susulan ? ' Susulan' : ''} {periode.jenis} Semester{' '}
            {periode.semester.toUpperCase()} T.A. {periode.tahunAkademik}
          </Text>
          <Text style={styles.nomorBA}>Nomor: {ba.nomorBA}</Text>
        </View>

        <View style={styles.tabelWrap}>
          <BarisGanda
            label1="Hari / Tanggal"
            nilai1={formatTanggalIndonesia(jadwal.tanggalStr)}
            label2="Ruangan"
            nilai2={jadwal.ruangan ?? '—'}
          />
          <BarisGanda
            label1="Jam Ujian"
            nilai1={`${jadwal.jamMulai} – ${jadwal.jamSelesai}`}
            label2="Kelas"
            nilai2={jadwal.kelas}
          />
          <BarisPenuh label="Mata Kuliah" nilai={`${jadwal.namaMK} (${jadwal.kodeMK})`} />
          <BarisPenuh label="Program Studi" nilai={jadwal.prodi} />
          <BarisPenuh label="Dosen Pengajar" nilai={jadwal.dosenPengajar} />
        </View>

        <View style={styles.garisAtas}>
          <BarisPenuh label="Peserta Terdaftar" nilai={`${ba.pesertaTerdaftar} orang`} />
          <BarisPenuh label="Peserta Hadir" nilai={`${ba.pesertaHadir} orang`} />
          <BarisPenuh
            label="Peserta Tidak Hadir"
            nilai={`${ba.pesertaTidakHadir} orang${ba.daftarTidakHadir ? ` (${ba.daftarTidakHadir})` : ''}`}
          />
          <BarisPenuh
            label="Jam Mulai / Selesai Aktual"
            nilai={`${ba.jamMulaiAktual} – ${ba.jamSelesaiAktual}`}
          />
          {ba.jumlahBerkas != null && (
            <BarisPenuh label="Jumlah Berkas Diserahkan" nilai={`${ba.jumlahBerkas} lembar`} />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Kejadian Khusus / Catatan Pelanggaran:</Text>
          <View style={styles.kejadian}>
            <Text>{ba.kejadianKhusus}</Text>
          </View>
        </View>

        {ba.fotoBukti.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Lampiran Foto Bukti Pelaksanaan:</Text>
            <View style={styles.fotoGrid}>
              {ba.fotoBukti.map((f) => (
                // eslint-disable-next-line jsx-a11y/alt-text -- Image dari @react-pdf/renderer, bukan elemen HTML <img>
                <Image key={f.fileId} src={urlThumbnailFoto(f.fileId)} style={styles.fotoItem} />
              ))}
            </View>
          </View>
        )}

        <View style={styles.ttdBlok}>
          <View style={styles.ttdKolom}>
            <View style={styles.ttdSpasi} />
            <Text style={styles.ttdGaris}>{ba.pengawas1}</Text>
            <Text style={styles.ttdKeterangan}>Pengawas 1</Text>
          </View>
          <View style={styles.ttdKolom}>
            <View style={styles.ttdSpasi} />
            <Text style={styles.ttdGaris}>{ba.pengawas2 ?? '—'}</Text>
            <Text style={styles.ttdKeterangan}>Pengawas 2</Text>
          </View>
          <View style={styles.ttdKolom}>
            <View style={styles.ttdSpasi} />
            <Text style={styles.ttdGaris}>{settings.pejabat.nama}</Text>
            <Text style={styles.ttdKeterangan}>
              Mengetahui, {settings.pejabat.jabatan}
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Diisi oleh: {ba.namaPengisi} · Dokumen digital SIBAU — sah tanpa tanda tangan basah
          setelah dicetak dan ditandatangani
        </Text>
      </Page>
    </Document>
  );
}
