'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface ComboboxCariProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  noHasilLabel?: string;
  className?: string;
}

/** Dropdown yang bisa diketik langsung untuk menyaring opsi (combobox),
 *  dipakai untuk daftar panjang seperti nama mata kuliah — beda dari
 *  <select> biasa yang tidak bisa diketik/disaring. */
export default function ComboboxCari({
  value,
  onChange,
  options,
  placeholder = 'Ketik untuk mencari...',
  noHasilLabel = 'Tidak ada hasil.',
  className = '',
}: ComboboxCariProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const tersaring = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  function pilih(opsi: string) {
    onChange(opsi);
    setQuery(opsi);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, tersaring.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && tersaring[highlight]) {
        pilih(tersaring[highlight]!);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery(value);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(0);
          if (e.target.value === '') onChange('');
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-[9px] border-[1.5px] border-line bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          {tersaring.length === 0 ? (
            <div className="px-3 py-2.5 text-[13px] text-faint">{noHasilLabel}</div>
          ) : (
            tersaring.map((opsi, i) => (
              <button
                key={opsi}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pilih(opsi);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`block w-full px-3 py-2.5 text-left text-[13.5px] ${
                  i === highlight ? 'bg-primary-50 text-primary-700' : 'text-ink'
                } ${opsi === value ? 'font-bold' : ''}`}
              >
                {opsi}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
