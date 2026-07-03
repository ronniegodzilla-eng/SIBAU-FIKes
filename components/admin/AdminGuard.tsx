'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { adminFetch } from '@/lib/admin-fetch';
import type { AdminRole } from '@/lib/types';

export interface AdminSesi {
  email: string;
  role: AdminRole;
}

const AdminRoleContext = createContext<AdminSesi | null>(null);

/** Role admin yang sedang login — hanya bisa dipanggil di dalam AdminGuard. */
export function useAdminRole(): AdminSesi {
  const ctx = useContext(AdminRoleContext);
  if (!ctx) {
    throw new Error('useAdminRole harus dipakai di dalam <AdminGuard>.');
  }
  return ctx;
}

/** Halaman yang hanya boleh diakses admin utama — co-admin diarahkan ke /admin. */
const HALAMAN_FULL_ADMIN = ['/admin/periode', '/admin/pengaturan'];

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? '/admin';
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [sesi, setSesi] = useState<AdminSesi | null | undefined>(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setSesi(null);
        router.replace('/admin/login');
        return;
      }
      try {
        const data = await adminFetch<{ email: string; role: AdminRole }>('/api/admin/me');
        setSesi({ email: data.email, role: data.role });
      } catch {
        // Akun login tapi belum terdaftar sebagai admin SIBAU (mis. akun
        // co-admin yang sudah dihapus) — paksa keluar, jangan biarkan macet.
        await signOut(auth);
        setSesi(null);
        router.replace('/admin/login');
      }
    });
    return unsub;
  }, [router]);

  useEffect(() => {
    if (
      sesi &&
      sesi.role === 'co_admin' &&
      HALAMAN_FULL_ADMIN.some((p) => pathname.startsWith(p))
    ) {
      router.replace('/admin');
    }
  }, [sesi, pathname, router]);

  if (user === undefined || sesi === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Memeriksa sesi admin...
      </div>
    );
  }

  if (!user || !sesi) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Mengarahkan ke halaman login...
      </div>
    );
  }

  if (sesi.role === 'co_admin' && HALAMAN_FULL_ADMIN.some((p) => pathname.startsWith(p))) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Mengarahkan...
      </div>
    );
  }

  return (
    <AdminRoleContext.Provider value={sesi}>{children}</AdminRoleContext.Provider>
  );
}
