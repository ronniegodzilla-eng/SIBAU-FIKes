// Penulisan audit_log — dipanggil dari API Routes (write-only, tidak pernah
// dibaca client; rules audit_log: read/write false untuk client).

import { FieldValue, type Firestore, type Transaction } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import type { AksiAuditLog } from '@/lib/types';

export interface DataAuditLog {
  aksi: AksiAuditLog;
  aktor: string; // "publik" | email admin
  targetId: string;
  detail?: Record<string, unknown>;
  ip: string;
}

/** Tulis audit_log langsung (di luar transaction). */
export async function tulisAuditLog(data: DataAuditLog): Promise<void> {
  await adminDb.collection('audit_log').add({
    aksi: data.aksi,
    aktor: data.aktor,
    targetId: data.targetId,
    detail: data.detail ?? {},
    ip: data.ip,
    timestamp: FieldValue.serverTimestamp(),
  });
}

/** Tulis audit_log di dalam transaction Firestore yang sedang berjalan. */
export function tulisAuditLogDalamTransaksi(
  trx: Transaction,
  db: Firestore,
  data: DataAuditLog
): void {
  const ref = db.collection('audit_log').doc();
  trx.set(ref, {
    aksi: data.aksi,
    aktor: data.aktor,
    targetId: data.targetId,
    detail: data.detail ?? {},
    ip: data.ip,
    timestamp: FieldValue.serverTimestamp(),
  });
}
