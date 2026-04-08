'use client';

const FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Tümü' },
  { value: 'task', label: '🔲 Görev' },
  { value: 'meeting', label: '📅 Toplantı' },
  { value: 'idea', label: '💡 Fikir' },
  { value: 'note', label: '📝 Not' },
];

interface FilterBarProps {
  current: string;
  onChange: (value: string) => void;
}

export function FilterBar({ current, onChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 -mx-1 px-1">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={[
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0',
            current === f.value
              ? 'bg-[#10b981]/15 text-[#10b981] shadow-sm shadow-[#10b981]/10'
              : 'bg-white/[0.03] text-white/35 hover:text-white/60 hover:bg-white/[0.06] active:bg-white/[0.08]',
          ].join(' ')}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
