'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

function pesanErrorLogin(kode: string): string {
  switch (kode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email atau kata sandi salah.';
    case 'auth/invalid-email':
      return 'Format email tidak valid.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Coba lagi beberapa saat lagi.';
    default:
      return 'Gagal masuk. Periksa kembali email dan kata sandi.';
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSesi, setCheckingSesi] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCheckingSesi(false);
      if (u) router.replace('/admin');
    });
    return unsub;
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/admin');
    } catch (err: any) {
      setError(pesanErrorLogin(err?.code ?? ''));
    } finally {
      setLoading(false);
    }
  }

  if (checkingSesi) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-faint">
        Memeriksa sesi...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-600 to-primary-700 px-5">
      <div className="w-full max-w-[380px] rounded-2xl bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <div className="mb-5 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-uis.png" alt="Logo UIS" className="mb-2.5 h-14 w-14 object-contain" />
          <div className="text-base font-extrabold text-ink">Login Admin Panitia</div>
          <div className="text-[12.5px] font-medium text-faint">SIBAU · FIKes UIS</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-[12.5px] font-bold text-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="box-border min-h-[44px] w-full rounded-[9px] border-[1.5px] border-line px-3 py-2.5 text-sm text-ink"
              placeholder="panitia@fikes-uis.ac.id"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-[12.5px] font-bold text-label">
              Kata sandi
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="box-border min-h-[44px] w-full rounded-[9px] border-[1.5px] border-line px-3 py-2.5 text-sm text-ink"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-danger-accent">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 min-h-[44px] w-full rounded-[10px] bg-primary-600 py-3 text-[14.5px] font-extrabold text-white transition hover:bg-primary-700 disabled:opacity-60"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>

          <a
            href="/"
            className="text-center text-[12.5px] font-semibold text-muted hover:text-primary-600"
          >
            ← Kembali ke halaman publik
          </a>
        </form>
      </div>
    </div>
  );
}
