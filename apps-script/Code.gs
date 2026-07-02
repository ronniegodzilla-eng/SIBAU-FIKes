/**
 * SIBAU — Apps Script Web App untuk upload foto bukti berita acara ke
 * Google Drive. File ini HANYA referensi: salin isinya ke
 * script.google.com (akun institusi), lalu deploy sebagai Web App.
 *
 * Cara deploy:
 *   1. script.google.com -> New project -> tempel isi file ini di Code.gs.
 *   2. Ganti nilai SECRET di bawah dengan token acak yang kuat, lalu
 *      simpan nilai yang SAMA PERSIS di env var APPS_SCRIPT_SECRET (Vercel).
 *   3. Deploy -> New deployment -> Type: Web app.
 *      - Execute as: Me (akun institusi)
 *      - Who has access: Anyone
 *   4. Salin URL deployment ke env var APPS_SCRIPT_URL (Vercel).
 *   5. Pastikan minimal 2 orang panitia punya akses ke akun institusi ini
 *      (bus factor) — catat di dokumentasi internal LPMI (§15 keputusan #4).
 */

var SECRET = 'GANTI_DENGAN_TOKEN_RAHASIA_YANG_SAMA_DENGAN_APPS_SCRIPT_SECRET';
var ROOT_FOLDER_NAME = 'SIBAU';

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    if (body.secret !== SECRET) {
      return json({ ok: false, error: 'unauthorized' });
    }
    if (!body.base64 || !body.mimeType || !body.fileName || !body.folderPath) {
      return json({ ok: false, error: 'Parameter tidak lengkap.' });
    }

    var folder = getOrCreateNestedFolder(body.folderPath);
    var blob = Utilities.newBlob(
      Utilities.base64Decode(body.base64),
      body.mimeType,
      body.fileName
    );
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return json({
      ok: true,
      fileId: file.getId(),
      url: 'https://drive.google.com/uc?export=view&id=' + file.getId(),
    });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/** folderPath contoh: "BA-UJIAN/UTS-2026-2027-Ganjil" -> dibuat bertingkat di dalam ROOT_FOLDER_NAME. */
function getOrCreateNestedFolder(folderPath) {
  var current = getOrCreateChildFolder(DriveApp.getRootFolder(), ROOT_FOLDER_NAME);
  var bagian = folderPath.split('/');
  for (var i = 0; i < bagian.length; i++) {
    if (bagian[i]) current = getOrCreateChildFolder(current, bagian[i]);
  }
  return current;
}

function getOrCreateChildFolder(parent, name) {
  var existing = parent.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return parent.createFolder(name);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
