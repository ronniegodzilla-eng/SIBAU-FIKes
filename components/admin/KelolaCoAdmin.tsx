'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { adminFetch, AdminFetchError } from '@/lib/admin-fetch';
import type { AdminAccount } from '@/lib/types';

const labelCls = 'mb-1.5 block text-xs font-bold text-label';
const inputCls =
  'box-border w-full rounded-lg border-[1.5px] border-line px-2.5 py-2.5 text-[13.5px] text-ink';

export default function KelolaCoAdmin() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [daftar, setDaftar] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTambah, setShowTambah] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);
  const [memproses, setMemproses] = useState<string | null>(null);

  async function muat() {
    setLoading(true);
    try {
      const data = await adminFetch<{ admins: AdminAccount[] }>('/api/admin/co-admin');
      setDaftar(data.admins.filter((a) => a.role === 'co_admin'));
    } catch (err) {
      showToast(
        err instanceof AdminFetchError ? err.message : 'Gagal memuat daftar co-admin.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleTambah() {
    setError('');
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Email tidak valid.');
      return;
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }
    setMenyimpan(true);
    try {
      await adminFetch('/api/admin/co-admin', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      showToast('Co-admin berhasil ditambahkan.', 'success');
      setShowTambah(false);
      setEmail('');
      setPassword('');
      muat();
    } catch (err) {
      setError(err instanceof AdminFetchError ? err.message : 'Gagal menambahkan co-admin.');
    } finally {
      setMenyimpan(false);
    }
  }

  async function handleHapus(a: AdminAccount) {
    const ok = await confirm(`Hapus akses co-admin untuk ${a.email}?`);
    if (!ok) return;
    setMemproses(a.uid);
    try {
      await adminFetch(`/api/admin/co-admin/${a.uid}`, { method: 'DELETE' });
      showToast('Co-admin berhasil dihapus.', 'success');
      muat();
    } catch (err) {
      showToast(
        err instanceof AdminFetchError ? err.message : 'Gagal menghapus co-admin.',
        'error'
      );
    } finally {
      setMemproses(null);
    }
  }

  return (
    <div className="mt-4 max-w-[640px] rounded-2xl bg-white p-[22px] shadow-[0_2px_10px_rgba(15,60,30,0.06)]">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div>
          <div className="text-[13.5px] font-extrabold text-ink">Kelola Co-Admin</div>
          <p className="text-[11.5px] text-faint">
            Co-admin hanya bisa mengakses Ringkasan, Jadwal Ujian, dan Rekap &amp; Monitoring.
          </p>
        </div>
        <button
          onClick={() => setShowTambah(true)}
          className="min-h-[36px] whitespace-nowrap rounded-lg bg-primary-600 px-3.5 text-[12.5px] font-bold text-white hover:bg-primary-700"
        >
          + Tambah Co-Admin
        </button>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-faint">Memuat...</p>
      ) : daftar.length === 0 ? (
        <p className="mt-3 text-[12.5px] text-faint">Belum ada co-admin.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {daftar.map((a) => (
            <div
              key={a.uid}
              className="flex items-center justify-between rounded-[9px] bg-app px-3 py-2.5"
            >
              <div className="text-[13px] font-semibold text-ink">{a.email}</div>
              <button
                onClick={() => handleHapus(a)}
                disabled={memproses === a.uid}
                className="min-h-[30px] rounded-lg border border-danger-border px-2.5 text-[11px] font-bold text-danger-text hover:bg-danger-softbg disabled:opacity-50"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}

      {showTambah && (
        <Modal
          title="Tambah Co-Admin"
          onClose={() => setShowTambah(false)}
          maxWidthClass="max-w-[420px]"
        >
          <div className="flex flex-col gap-3">
            <div>
              <label className={labelCls}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@fikes-uis.ac.id"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Kata Sandi Awal</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className={inputCls}
              />
              <p className="mt-1.5 text-[11px] text-faint">
                Sampaikan email &amp; kata sandi ini langsung ke co-admin yang bersangkutan.
              </p>
            </div>
          </div>
          {error && <p className="mt-3 text-xs font-semibold text-danger-accent">{error}</p>}
          <div className="mt-5 flex justify-end gap-2.5">
            <button
              onClick={() => setShowTambah(false)}
              className="min-h-[40px] rounded-lg border-[1.5px] border-line-strong bg-white px-4 text-[13.5px] font-semibold text-body"
            >
              Batal
            </button>
            <button
              onClick={handleTambah}
              disabled={menyimpan}
              className="min-h-[40px] rounded-lg bg-primary-600 px-4 text-[13.5px] font-bold text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {menyimpan ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
