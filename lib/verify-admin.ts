// Verifikasi Firebase ID token (Bearer) untuk setiap endpoint /api/admin/*.
// Wajib dipanggil di baris pertama tiap handler admin (§8 PRD prinsip #2).

import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export interface AdminTerverifikasi {
  uid: string;
  email: string;
}

export class AdminAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Ambil & verifikasi token dari header `Authorization: Bearer <idToken>`.
 * Lempar AdminAuthError (401) jika tidak ada/kadaluarsa/tidak valid.
 */
export async function verifyAdminToken(
  req: NextRequest
): Promise<AdminTerverifikasi> {
  const authHeader = req.headers.get('authorization') ?? '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AdminAuthError('Token admin tidak ditemukan. Silakan login ulang.');
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded.email) {
      throw new AdminAuthError('Akun admin tidak memiliki email valid.');
    }
    return { uid: decoded.uid, email: decoded.email };
  } catch (err) {
    if (err instanceof AdminAuthError) throw err;
    throw new AdminAuthError('Token admin tidak valid atau sudah kadaluarsa.');
  }
}

/** Ambil IP client dari header Vercel untuk pencatatan audit_log. */
export function ambilIpDariRequest(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}
