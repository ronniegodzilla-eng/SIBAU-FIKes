import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, AdminAuthError } from '@/lib/verify-admin';

/** Dipakai AdminGuard untuk tahu role admin yang sedang login (admin/co_admin). */
export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req);
    return NextResponse.json({ email: admin.email, role: admin.role });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Gagal memuat sesi admin.' }, { status: 500 });
  }
}
