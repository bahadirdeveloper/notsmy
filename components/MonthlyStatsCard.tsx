import type { FC } from 'react';

interface Props {
  completed: number;
  total: number;
  year: number;
  month: number; // 1-12
  variant?: 'full' | 'compact';
}

const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export const MonthlyStatsCard: FC<Props> = ({
  completed,
  total,
  year,
  month,
  variant = 'full',
}) => {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const label = `${MONTH_NAMES_TR[month - 1]} ${year}`;

  if (variant === 'compact') {
    return (
      <div className="bg-white/[0.035] border border-white/[0.09] rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-white/70 text-[12px]">{label}</span>
            <span className="text-white/90 text-[13px] font-semibold tabular-nums">
              {completed}/{total}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full bg-[#10b981] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label="Aylık görev istatistiği"
      className="bg-white/[0.035] border border-white/[0.09] rounded-xl p-4 shadow-xl shadow-black/20"
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-white/70 text-[12px] uppercase tracking-wide font-semibold">
          {label}
        </h3>
        <span className="text-white/90 text-[15px] font-semibold tabular-nums">
          {completed}/{total}
        </span>
      </div>

      {total === 0 ? (
        <p className="mt-2 text-white/40 text-[12px] italic">
          Bu ay henüz görev yok
        </p>
      ) : (
        <>
          <div className="mt-3 h-2 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full bg-[#10b981] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-white/50 text-[11px]">%{pct} tamamlandı</p>
        </>
      )}
    </section>
  );
};
