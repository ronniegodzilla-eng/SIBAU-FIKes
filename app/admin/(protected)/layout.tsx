import AdminGuard from '@/components/admin/AdminGuard';
import SidebarAdmin from '@/components/admin/SidebarAdmin';
import TopBarAdmin from '@/components/admin/TopBarAdmin';

export const dynamic = 'force-dynamic';

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen">
        <SidebarAdmin />
        <div className="min-w-0 flex-1 bg-app">
          <TopBarAdmin />
          <main className="px-[26px] py-6">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}
