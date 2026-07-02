import AdminGuard from '@/components/admin/AdminGuard';
import NavAdmin from '@/components/admin/NavAdmin';

export const dynamic = 'force-dynamic';

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        <NavAdmin />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>
    </AdminGuard>
  );
}
