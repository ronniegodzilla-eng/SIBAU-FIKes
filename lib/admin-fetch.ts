// Helper client-side untuk memanggil /api/admin/** dengan Bearer ID token
// dari sesi Firebase Auth admin yang sedang login.

import { auth } from '@/lib/firebase-client';

export class AdminFetchError extends Error {}

export async function adminFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const user = auth.currentUser;
  if (!user) {
    throw new AdminFetchError('Sesi admin tidak ditemukan. Silakan login ulang.');
  }

  const token = await user.getIdToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    const pesan =
      (body && typeof body === 'object' && 'error' in body && (body as any).error) ||
      `Permintaan gagal (${res.status}).`;
    throw new AdminFetchError(pesan);
  }

  return body as T;
}
