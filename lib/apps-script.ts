// Klien server-to-server ke Google Apps Script Web App (upload foto ke
// Drive). Dipanggil HANYA dari /api/upload-foto — tidak pernah dari browser
// langsung, agar APPS_SCRIPT_SECRET tidak pernah terekspos ke client (§4,§8).

export interface UploadFotoParams {
  base64: string;
  mimeType: string;
  fileName: string;
  folderPath: string;
}

export interface UploadFotoResult {
  fileId: string;
  url: string;
}

export async function uploadFotoKeAppsScript(
  params: UploadFotoParams
): Promise<UploadFotoResult> {
  const url = process.env.APPS_SCRIPT_URL;
  const secret = process.env.APPS_SCRIPT_SECRET;
  if (!url || !secret) {
    throw new Error(
      'APPS_SCRIPT_URL / APPS_SCRIPT_SECRET belum diset di environment variables server.'
    );
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ secret, ...params }),
  });

  if (!res.ok) {
    throw new Error(`Apps Script merespons status ${res.status}.`);
  }

  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.error || 'Upload foto ke Google Drive gagal.');
  }

  return { fileId: data.fileId, url: data.url };
}

/** Folder Drive per periode, mis. "BA-UJIAN/UTS-2026-2027-Ganjil". */
export function folderPathPeriode(periode: {
  jenis: string;
  tahunAkademik: string;
  semester: string;
}): string {
  const tahun = periode.tahunAkademik.replace('/', '-');
  return `BA-UJIAN/${periode.jenis}-${tahun}-${periode.semester}`;
}
