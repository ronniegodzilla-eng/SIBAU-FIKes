'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { useAdminRole } from '@/components/admin/AdminGuard';

const MENU = [
  { href: '/admin', label: 'Ringkasan' },
  { href: '/admin/periode', label: 'Periode Ujian', fullAdminOnly: true },
  { href: '/admin/jadwal', label: 'Jadwal Ujian' },
  { href: '/admin/rekap', label: 'Rekap & Monitoring' },
  { href: '/admin/pengaturan', label: 'Pengaturan', fullAdminOnly: true },
];

export default function SidebarAdmin() {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useAdminRole();

  async function handleLogout() {
    await signOut(auth);
    router.replace('/admin/login');
  }

  const menuTampil = MENU.filter((item) => !item.fullAdminOnly || role === 'admin');

  return (
    <div className="flex w-[230px] shrink-0 flex-col bg-primary-700 p-3.5 text-white">
      <div className="flex items-center gap-2.5 px-2 pb-[22px] pt-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-uis.png" alt="Logo UIS" className="h-[34px] w-[34px] object-contain" />
        <div>
          <div className="text-[13.5px] font-extrabold">SIBAU Admin</div>
          <div className="text-[10.5px] text-primary-100">
            {role === 'co_admin' ? 'Co-Admin FIKes UIS' : 'Panitia FIKes UIS'}
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-[3px]">
        {menuTampil.map((item) => {
          const aktif =
            item.href === '/admin' ? pathname === '/admin' : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-left text-[13px] font-bold ${
                aktif ? 'bg-white/[0.16] text-[#F2E9A8]' : 'text-[#D7E8DC] hover:bg-white/[0.08]'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  aktif ? 'bg-[#F2E9A8]' : 'bg-[#D7E8DC]'
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <button
        onClick={handleLogout}
        className="rounded-[9px] border border-white/25 px-3 py-2.5 text-left text-[12.5px] font-bold text-white hover:bg-white/10"
      >
        ⎋ Keluar
      </button>
    </div>
  );
}
