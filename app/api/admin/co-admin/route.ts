import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import {
  verifyAdminToken,
  wajibkanFullAdmin,
  ambilIpDariRequest,
  AdminAuthError,
} from '@/lib/verify-admin';
import { tulisAuditLog } from '@/lib/audit';

const REGEX_EMAIL = /^\S+@\S+\.\S+$/;

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req);
    wajibkanFullAdmin(admin);
    const snap = await adminDb.collection('admins').orderBy('createdAt', 'desc').get();
    const admins = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    return NextResponse.json({ admins });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Gagal memuat daftar admin.' }, { status: 500 });
  }
}

/** Tambah co-admin baru: akses terbatas Ringkasan, Jadwal Ujian, Rekap & Monitoring. */
export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req);
    wajibkanFullAdmin(admin);
    const body = await req.json();

    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !REGEX_EMAIL.test(email)) {
      return NextResponse.json({ error: 'Email tidak valid.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Kata sandi minimal 6 karakter.' }, { status: 400 });
    }

    const userRecord = await adminAuth.createUser({ email, password });

    await adminDb.collection('admins').doc(userRecord.uid).set({
      email,
      role: 'co_admin',
      createdAt: FieldValue.serverTimestamp(),
      createdBy: admin.email,
    });

    await tulisAuditLog({
      aksi: 'buat_co_admin',
      aktor: admin.email,
      targetId: userRecord.uid,
      detail: { email },
      ip: ambilIpDariRequest(req),
    });

    return NextResponse.json({ uid: userRecord.uid, email }, { status: 201 });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const kode = (err as { code?: string })?.code;
    if (kode === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 });
    }
    if (kode === 'auth/invalid-password') {
      return NextResponse.json(
        { error: 'Kata sandi tidak valid (minimal 6 karakter).' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Gagal menambahkan co-admin.' }, { status: 500 });
  }
}
