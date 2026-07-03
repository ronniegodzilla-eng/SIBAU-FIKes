import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import {
  verifyAdminToken,
  wajibkanFullAdmin,
  ambilIpDariRequest,
  AdminAuthError,
} from '@/lib/verify-admin';
import { tulisAuditLog } from '@/lib/audit';

/** Hapus akses co-admin. Tidak bisa dipakai untuk menghapus akun admin utama. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const admin = await verifyAdminToken(req);
    wajibkanFullAdmin(admin);

    const ref = adminDb.collection('admins').doc(params.uid);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });
    }
    const data = snap.data()!;
    if (data.role !== 'co_admin') {
      return NextResponse.json(
        { error: 'Tidak bisa menghapus akun admin utama lewat sini.' },
        { status: 400 }
      );
    }

    await ref.delete();
    await adminAuth.deleteUser(params.uid).catch(() => {
      // Akun Auth mungkin sudah terhapus manual sebelumnya — abaikan.
    });

    await tulisAuditLog({
      aksi: 'hapus_co_admin',
      aktor: admin.email,
      targetId: params.uid,
      detail: { email: data.email },
      ip: ambilIpDariRequest(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Gagal menghapus co-admin.' }, { status: 500 });
  }
}
