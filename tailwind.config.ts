import type { Config } from 'tailwindcss';

// Design tokens dari mockup Claude Design (SIBAU.dc.html).
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // primary = hijau brand mockup. Menimpa token lama (biru) supaya
        // semua pemakaian bg-primary-600/hover:bg-primary-700 di seluruh
        // aplikasi otomatis ikut hijau tanpa perlu diedit satu-satu.
        primary: {
          50: '#E6F3EA',
          100: '#CFE8D8',
          500: '#0F6B35',
          600: '#0F6B35',
          700: '#0B4F27',
        },
        ink: '#1C2620',
        body: '#4B564C',
        label: '#3C463D',
        muted: '#667066',
        faint: '#8A9089',
        subtle: '#7A807A',
        line: {
          DEFAULT: '#E3E6E1',
          strong: '#DADFD8',
          soft: '#EEF0EB',
          dashed: '#B7C4B9',
        },
        danger: {
          bg: '#FEE2E2',
          softbg: '#FEF2F2',
          border: '#FCA5A5',
          text: '#B91C1C',
          strong: '#991B1B',
          accent: '#DC2626',
        },
        success: {
          bg: '#DCFCE7',
          text: '#15803D',
        },
        warn: {
          bg: '#FFFBEB',
          border: '#FDE68A',
          text: '#92400E',
          accent: '#F2B705',
        },
        app: '#F5F6F1',
      },
      fontFamily: {
        // Dimuat via <link> Google Fonts di app/layout.tsx (bukan
        // next/font/google) — menghindari fetch banyak weight saat
        // compile dev server yang bisa membuat `next dev` macet di
        // jaringan lambat/terbatas.
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'ui-serif', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
