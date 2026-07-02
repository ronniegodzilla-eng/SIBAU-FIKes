'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

const MENU = [
  { href: '/admin', label: 'Ringkasan' },
  { href: '/admin/periode', label: 'Periode' },
  { href: '/admin/jadwal', label: 'Jadwal' },
  { href: '/admin/rekap', label: 'Rekap' },
  { href: '/admin/pengaturan', label: 'Pengaturan' },
];

export default function NavAdmin() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth);
    router.replace('/admin/login');
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">SIBAU Admin</p>
          <p className="text-xs text-gray-500">Panitia UTS/UAS FIKes UIS</p>
        </div>
        <button
          onClick={handleLogout}
          className="min-h-[44px] rounded-lg border border-gray-300 px-3 text-sm text-gray-600 hover:bg-gray-50"
        >
          Keluar
        </button>
      </div>
      <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
        {MENU.map((item) => {
          const aktif =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                aktif
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
