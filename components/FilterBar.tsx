'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

const FILTERS = [
  { value: '', label: 'Tümü' },
  { value: 'task', label: '🔲 Görev' },
  { value: 'meeting', label: '📅 Toplantı' },
  { value: 'idea', label: '💡 Fikir' },
  { value: 'note', label: '📝 Not' },
];

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get('type') ?? '';

  function setFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('type', value);
    } else {
      params.delete('type');
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => setFilter(f.value)}
          className={[
            'px-3 py-1 rounded-full text-xs font-medium transition-colors',
            current === f.value
              ? 'bg-[#10b981] text-black'
              : 'bg-white/[0.05] text-white/50 hover:text-white/80 hover:bg-white/[0.08]',
          ].join(' ')}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
