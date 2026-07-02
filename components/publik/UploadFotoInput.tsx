'use client';

import { useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import type { FotoBukti } from '@/lib/types';

interface ItemFoto {
  id: string;
  namaFile: string;
  previewUrl: string;
  status: 'mengompres' | 'mengunggah' | 'sukses' | 'gagal';
  pesanError?: string;
  hasil?: FotoBukti;
  fileTerkompresi?: File;
}

const MAKS_FOTO = 3;

function fileKeBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const hasil = reader.result as string;
      resolve(hasil.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UploadFotoInput({
  jadwalId,
  onChange,
}: {
  jadwalId: string;
  onChange: (foto: FotoBukti[]) => void;
}) {
  const [items, setItems] = useState<ItemFoto[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function laporkanPerubahan(daftar: ItemFoto[]) {
    onChange(daftar.filter((i) => i.status === 'sukses' && i.hasil).map((i) => i.hasil!));
  }

  async function unggahSatu(id: string, file: File) {
    try {
      setItems((prev) => {
        const next = prev.map((i) => (i.id === id ? { ...i, status: 'mengunggah' as const } : i));
        return next;
      });
      const base64 = await fileKeBase64(file);
      const res = await fetch('/api/upload-foto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64,
          mimeType: file.type,
          fileName: file.name,
          jadwalId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah foto.');

      setItems((prev) => {
        const next = prev.map((i) =>
          i.id === id
            ? { ...i, status: 'sukses' as const, hasil: data as FotoBukti }
            : i
        );
        laporkanPerubahan(next);
        return next;
      });
    } catch (err) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                status: 'gagal' as const,
                pesanError: err instanceof Error ? err.message : 'Gagal mengunggah foto.',
              }
            : i
        )
      );
    }
  }

  async function tambahFile(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const sisaSlot = MAKS_FOTO - items.length;
    const filesBaru = Array.from(fileList).slice(0, Math.max(0, sisaSlot));

    for (const file of filesBaru) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const previewUrl = URL.createObjectURL(file);
      setItems((prev) => [
        ...prev,
        { id, namaFile: file.name, previewUrl, status: 'mengompres' },
      ]);

      try {
        const terkompresi = await imageCompression(file, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
        });
        const fileFinal = new File([terkompresi], file.name, { type: terkompresi.type });
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, fileTerkompresi: fileFinal } : i))
        );
        await unggahSatu(id, fileFinal);
      } catch {
        setItems((prev) =>
          prev.map((i) =>
            i.id === id
              ? { ...i, status: 'gagal', pesanError: 'Gagal memproses foto.' }
              : i
          )
        );
      }
    }
  }

  function hapusItem(id: string) {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      laporkanPerubahan(next);
      return next;
    });
  }

  function retryItem(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item?.fileTerkompresi) {
      hapusItem(id);
      return;
    }
    unggahSatu(id, item.fileTerkompresi);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative aspect-square overflow-hidden rounded-lg border border-gray-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.previewUrl}
              alt={item.namaFile}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-center text-xs text-white">
              {item.status === 'mengompres' && <span>Mengompres...</span>}
              {item.status === 'mengunggah' && <span>Mengunggah...</span>}
              {item.status === 'sukses' && (
                <span className="rounded-full bg-green-600 px-2 py-0.5">Berhasil</span>
              )}
              {item.status === 'gagal' && (
                <div className="space-y-1 px-2">
                  <span className="block">{item.pesanError ?? 'Gagal'}</span>
                  <button
                    type="button"
                    onClick={() => retryItem(item.id)}
                    className="min-h-[28px] rounded-full bg-white px-2 text-xs font-medium text-gray-800"
                  >
                    Coba lagi
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => hapusItem(item.id)}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
            >
              ✕
            </button>
          </div>
        ))}

        {items.length < MAKS_FOTO && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square min-h-[44px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-xs text-gray-400 hover:border-primary-500 hover:text-primary-600"
          >
            <span className="text-xl">+</span>
            Tambah Foto
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => {
          tambahFile(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      <p className="mt-2 text-xs text-gray-500">
        Minimal 1 foto, maksimal {MAKS_FOTO} foto. Foto otomatis dikompresi sebelum diunggah.
      </p>
    </div>
  );
}
