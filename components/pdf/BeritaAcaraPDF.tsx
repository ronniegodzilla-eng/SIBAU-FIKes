import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { formatTanggalIndonesia } from '@/lib/tanggal';
import type { BeritaAcara, JadwalUjian, Periode, SettingsApp } from '@/lib/types';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#111827',
  },
  kop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 8,
  },
  logo: { width: 48, height: 48 },
  kopTeks: { flex: 1, textAlign: 'center' },
  kopUniversitas: { fontSize: 13, fontWeight: 700 },
  kopFakultas: { fontSize: 11, fontWeight: 700 },
  garisGanda: {
    borderBottomWidth: 2,
    borderBottomColor: '#111827',
    marginTop: 4,
    paddingBottom: 2,
    borderBottomStyle: 'solid',
  },
  garisTipis: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#111827',
    marginTop: 2,
  },
  judul: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 700,
  },
  nomorBA: {
    marginTop: 2,
    textAlign: 'center',
    fontSize: 10,
  },
  section: { marginTop: 12 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#374151',
    marginBottom: 4,
  },
  row: { flexDirection: 'row' },
  labelCol: { width: '32%', color: '#374151' },
  colonCol: { width: '3%' },
  valueCol: { width: '65%' },
  rowSpacing: { marginBottom: 3 },
  kejadian: {
    marginTop: 4,
    padding: 6,
    borderWidth: 0.5,
    borderColor: '#d1d5db',
    minHeight: 40,
  },
  fotoGrid: { flexDirection: 'row', gap: 8, marginTop: 6 },
  fotoItem: { width: 120, height: 90, borderWidth: 0.5, borderColor: '#d1d5db' },
  ttdBlok: { flexDirection: 'row', marginTop: 36, justifyContent: 'space-between' },
  ttdKolom: { width: '30%', textAlign: 'center' },
  ttdSpasi: { height: 50 },
  ttdNama: { fontWeight: 700, textDecoration: 'underline' },
});

function Baris({ label, value }: { label: string; value: string }) {
  return (
    <View style={[styles.row, styles.rowSpacing]}>
      <Text style={styles.labelCol}>{label}</Text>
      <Text style={styles.colonCol}>:</Text>
      <Text style={styles.valueCol}>{value}</Text>
    </View>
  );
}

export default function BeritaAcaraPDF({
  ba,
  jadwal,
  periode,
  settings,
}: {
  ba: BeritaAcara;
  jadwal: JadwalUjian;
  periode: Periode;
  settings: SettingsApp;
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
            <Text style={styles.kopUniversitas}>{settings.namaUniversitas.toUpperCase()}</Text>
            <Text style={styles.kopFakultas}>{settings.namaFakultas.toUpperCase()}</Text>
          </View>
          <View style={styles.logo} />
        </View>
        <View style={styles.garisGanda} />
        <View style={styles.garisTipis} />

        <Text style={styles.judul}>
          BERITA ACARA PELAKSANAAN UJIAN {periode.jenis} SEMESTER{' '}
          {periode.semester.toUpperCase()} T.A. {periode.tahunAkademik}
        </Text>
        <Text style={styles.nomorBA}>Nomor: {ba.nomorBA}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identitas Ujian</Text>
          <Baris label="Hari/Tanggal" value={formatTanggalIndonesia(jadwal.tanggalStr)} />
          <Baris label="Jam Terjadwal" value={`${jadwal.jamMulai} - ${jadwal.jamSelesai}`} />
          <Baris label="Mata Kuliah" value={`${jadwal.namaMK} (${jadwal.kodeMK})`} />
          <Baris label="Program Studi" value={jadwal.prodi} />
          <Baris label="Kelas" value={jadwal.kelas} />
          <Baris label="Ruangan" value={jadwal.ruangan ?? '-'} />
          <Baris label="Dosen Pengajar" value={jadwal.dosenPengajar} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pelaksanaan</Text>
          <Baris label="Pengawas 1" value={ba.pengawas1} />
          {ba.pengawas2 && <Baris label="Pengawas 2" value={ba.pengawas2} />}
          <Baris label="Jam Aktual" value={`${ba.jamMulaiAktual} - ${ba.jamSelesaiAktual}`} />
          <Baris label="Peserta Terdaftar" value={String(ba.pesertaTerdaftar)} />
          <Baris label="Peserta Hadir" value={String(ba.pesertaHadir)} />
          <Baris label="Peserta Tidak Hadir" value={String(ba.pesertaTidakHadir)} />
          {ba.daftarTidakHadir && (
            <Baris label="Nama/NIM Tidak Hadir" value={ba.daftarTidakHadir} />
          )}
          {ba.jumlahBerkas != null && (
            <Baris label="Jumlah Berkas Diserahkan" value={String(ba.jumlahBerkas)} />
          )}
          <Baris label="Nama Pengisi" value={ba.namaPengisi} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kejadian Khusus / Catatan Pelanggaran</Text>
          <View style={styles.kejadian}>
            <Text>{ba.kejadianKhusus}</Text>
          </View>
        </View>

        {ba.fotoBukti.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lampiran Foto Bukti</Text>
            <View style={styles.fotoGrid}>
              {ba.fotoBukti.map((f) => (
                // eslint-disable-next-line jsx-a11y/alt-text -- Image dari @react-pdf/renderer, bukan elemen HTML <img>
                <Image key={f.fileId} src={f.url} style={styles.fotoItem} />
              ))}
            </View>
          </View>
        )}

        <View style={styles.ttdBlok}>
          <View style={styles.ttdKolom}>
            <Text>Pengawas 1</Text>
            <View style={styles.ttdSpasi} />
            <Text style={styles.ttdNama}>{ba.pengawas1}</Text>
          </View>
          <View style={styles.ttdKolom}>
            <Text>Pengawas 2</Text>
            <View style={styles.ttdSpasi} />
            <Text style={styles.ttdNama}>{ba.pengawas2 ?? '-'}</Text>
          </View>
          <View style={styles.ttdKolom}>
            <Text>Mengetahui,</Text>
            <Text>{settings.pejabat.jabatan}</Text>
            <View style={styles.ttdSpasi} />
            <Text style={styles.ttdNama}>{settings.pejabat.nama}</Text>
            <Text>NIP. {settings.pejabat.nip}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
