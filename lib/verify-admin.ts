// Verifikasi Firebase ID token (Bearer) untuk setiap endpoint /api/admin/*.
// Wajib dipanggil di baris pertama tiap handler admin (§8 PRD prinsip #2).
//
// Sejak fitur co-admin: token valid saja tidak cukup — uid harus terdaftar
// di collection `admins` (role 'admin' = akses penuh, 'co_admin' = hanya
// Ringkasan/Jadwal Ujian/Rekap & Monitoring). Endpoint yang eksklusif untuk
// admin utama (Periode, Pengaturan, Kelola Co-Admin) wajib panggil
// wajibkanFullAdmin() setelah verifyAdminToken().

import type { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { AdminRole } from '@/lib/types';

export interface AdminTerverifikasi {
  uid: string;
  email: string;
  role: AdminRole;
}

export class AdminAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Ambil & verifikasi token dari header `Authorization: Bearer <idToken>`,
 * lalu pastikan uid terdaftar di collection `admins`.
 * Lempar AdminAuthError (401/403) jika tidak ada/kadaluarsa/tidak terdaftar.
 */
export async function verifyAdminToken(
  req: NextRequest
): Promise<AdminTerverifikasi> {
  const authHeader = req.headers.get('authorization') ?? '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AdminAuthError('Token admin tidak ditemukan. Silakan login ulang.');
  }

  let uid: string;
  let email: string | undefined;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
    email = decoded.email;
  } catch {
    throw new AdminAuthError('Token admin tidak valid atau sudah kadaluarsa.');
  }

  if (!email) {
    throw new AdminAuthError('Akun admin tidak memiliki email valid.');
  }

  const snap = await adminDb.collection('admins').doc(uid).get();
  if (!snap.exists) {
    throw new AdminAuthError('Akun ini belum terdaftar sebagai admin SIBAU.', 403);
  }

  return { uid, email, role: snap.data()!.role as AdminRole };
}

/** Lempar 403 jika bukan admin utama — pakai di endpoint Periode, Pengaturan,
 *  dan Kelola Co-Admin yang tidak boleh diakses co-admin. */
export function wajibkanFullAdmin(admin: AdminTerverifikasi): void {
  if (admin.role !== 'admin') {
    throw new AdminAuthError('Aksi ini hanya untuk admin utama.', 403);
  }
}

/** Ambil IP client dari header Vercel untuk pencatatan audit_log. */
export function ambilIpDariRequest(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}
