import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#10b981',    // emerald
          bg: '#09090b',         // dark background
          card: 'rgba(255,255,255,0.03)',
          border: 'rgba(255,255,255,0.06)',
        },
        note: {
          task: '#f59e0b',
          meeting: '#8b5cf6',
          idea: '#06b6d4',
          note: '#ec4899',
        }
      }
    }
  },
  plugins: [],
};

export default config;
