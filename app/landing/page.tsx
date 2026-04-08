import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notsmy — Akıllı Not ve Görev Yönetimi',
  description: 'Kişisel ve ekip kullanımına yönelik not tutma uygulaması. 3 günlük takvim görünümü, görev takibi, favori sistemi ve hatırlatmalar.',
};

// SVG icons as React elements for premium look
const FEATURE_ICONS = {
  calendar: (color: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      <rect x="7" y="14" width="3" height="3" rx="0.5" fill={color} fillOpacity="0.3"/><rect x="14" y="14" width="3" height="3" rx="0.5" fill={color} fillOpacity="0.15"/>
    </svg>
  ),
  layers: (color: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" fill={color} fillOpacity="0.1"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  star: (color: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  bell: (color: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      <circle cx="18" cy="4" r="3" fill={color} fillOpacity="0.3" stroke="none"/>
    </svg>
  ),
  users: (color: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4" fill={color} fillOpacity="0.1"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  device: (color: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
      <rect x="8" y="6" width="8" height="8" rx="1" fill={color} fillOpacity="0.1"/>
    </svg>
  ),
};

const FEATURES = [
  {
    iconKey: 'calendar' as const,
    title: '3 Günlük Takvim',
    desc: 'Bugün ve sonraki 2 günü tek ekranda gör. İleri-geri navigasyonla tüm günlere eriş.',
    color: '#8b5cf6',
  },
  {
    iconKey: 'layers' as const,
    title: '4 Not Tipi',
    desc: 'Görev, toplantı, fikir veya serbest not. Her biri farklı renk ve ikonla ayırt edilir.',
    color: '#f59e0b',
  },
  {
    iconKey: 'star' as const,
    title: 'Favori ve Önceliklendirme',
    desc: 'Önemli notları yıldızla — otomatik üste çıkar. Sürükle-bırak ile sıralamayı kendin belirle.',
    color: '#10b981',
  },
  {
    iconKey: 'bell' as const,
    title: 'Akıllı Hatırlatmalar',
    desc: 'Tamamlanmayan görevler için 24 saat dolmadan otomatik bildirim. Hiçbir şey atlanmaz.',
    color: '#06b6d4',
  },
  {
    iconKey: 'users' as const,
    title: 'Ekip Workspace',
    desc: 'Kişisel workspace\'in otomatik oluşur. Ekip üyelerini davet et, notları birlikte yönet.',
    color: '#ec4899',
  },
  {
    iconKey: 'device' as const,
    title: 'Her Cihazda Çalışır',
    desc: 'PWA desteği ile telefona yükle, masaüstünde kullan. Offline destek ile her yerde erişim.',
    color: '#a78bfa',
  },
];

const STEPS = [
  {
    num: '1',
    title: 'Giriş Yap',
    desc: 'GitHub ile tek tıkla.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
      </svg>
    ),
  },
  {
    num: '2',
    title: 'Not Ekle',
    desc: '+ butonuna tıkla, tipini seç, başlığını yaz.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
  },
  {
    num: '3',
    title: 'Organize Et',
    desc: 'Sürükle-bırak, yıldızla, tamamla.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white/90">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#10b981] flex items-center justify-center text-black font-bold text-sm">N</div>
            <span className="font-semibold text-sm text-white/80">Notsmy</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-white/40 text-sm hover:text-white/70 transition-colors hidden sm:inline">
              Giriş Yap
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-[#10b981] text-black text-sm font-medium rounded-xl hover:bg-[#0ea371] transition-colors shadow-lg shadow-[#10b981]/20"
            >
              Başlayalım
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#10b981]/[0.04] rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[300px] h-[300px] bg-[#8b5cf6]/[0.03] rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
            Ücretsiz ve açık kaynak
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-5">
            Notlarını{' '}
            <span className="text-[#10b981]">akıllıca</span>
            {' '}yönet
          </h1>

          <p className="text-white/35 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            3 günlük takvim görünümünde görevlerini takip et, öncelikleri belirle,
            ekibinle paylaşım yap. Basit, hızlı, karmaşık değil.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link
              href="/login"
              className="px-6 py-3 bg-[#10b981] text-black font-semibold rounded-xl hover:bg-[#0ea371] transition-all shadow-xl shadow-[#10b981]/25 hover:shadow-[#10b981]/40 text-sm sm:text-base"
            >
              Hemen Başla — Ücretsiz
            </Link>
          </div>
        </div>

        {/* Mock preview */}
        <div className="max-w-2xl mx-auto mt-16 relative z-10">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
            {/* Fake navbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04] bg-white/[0.01]">
              <div className="w-5 h-5 rounded bg-[#10b981] flex items-center justify-center text-black text-[8px] font-bold">N</div>
              <span className="text-white/40 text-xs">Kişisel Workspace</span>
              <div className="ml-auto flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-white/10" />
                <div className="w-5 h-5 rounded-full bg-white/10" />
              </div>
            </div>
            {/* Fake days */}
            {[
              { day: 'BUGÜN', notes: [
                { type: '🔲', color: '#f59e0b', title: 'Landing page tasarla', fav: true, done: false },
                { type: '📅', color: '#8b5cf6', title: 'Ekip toplantısı', fav: false, done: false },
                { type: '💡', color: '#06b6d4', title: 'PWA için push notification', fav: false, done: false },
              ]},
              { day: 'YARIN', notes: [
                { type: '🔲', color: '#f59e0b', title: 'Google Play\'e yükle', fav: true, done: false },
                { type: '📝', color: '#ec4899', title: 'Kullanıcı geri bildirimleri', fav: false, done: true },
              ]},
            ].map((day) => (
              <div key={day.day} className="border-b border-white/[0.03] last:border-b-0">
                <div className="px-4 py-2.5 flex items-center gap-2">
                  {day.day === 'BUGÜN' && <span className="bg-[#10b981] text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full">{day.day}</span>}
                  {day.day !== 'BUGÜN' && <span className="text-white/30 text-[10px]">{day.day}</span>}
                </div>
                <div className="px-4 pb-2.5 flex flex-col gap-1">
                  {day.notes.map((n) => (
                    <div key={n.title} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs ${n.fav ? 'bg-[#10b981]/[0.04] border-[#10b981]/15' : 'bg-white/[0.02] border-white/[0.04]'} ${n.done ? 'opacity-40' : ''}`}>
                      <span className="text-white/15 text-[8px]">⠿</span>
                      {n.fav ? <span className="text-[#10b981] text-[10px]">★</span> : <span className="text-white/15 text-[10px]">☆</span>}
                      <span className="text-[10px] px-1 py-0.5 rounded" style={{ color: n.color, backgroundColor: `${n.color}18` }}>{n.type}</span>
                      <span className={`${n.done ? 'line-through text-white/30' : 'text-white/70'}`}>{n.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Glow under card */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-[#10b981]/[0.06] blur-[60px] rounded-full pointer-events-none" />
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Her şey tek yerde</h2>
            <p className="text-white/30 text-sm sm:text-base">Basit ama güçlü özellikler</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1px' }} className="rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.03]">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="relative p-6 bg-[#09090b] hover:bg-white/[0.02] transition-all duration-300 group overflow-hidden"
              >
                {/* Subtle corner glow on hover */}
                <div
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[40px] pointer-events-none"
                  style={{ backgroundColor: f.color + '12' }}
                />

                <div className="relative z-10">
                  {/* Icon with glass container */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 border transition-all duration-300"
                    style={{
                      backgroundColor: f.color + '08',
                      borderColor: f.color + '18',
                      boxShadow: `0 0 0 0 ${f.color}00`,
                    }}
                  >
                    {FEATURE_ICONS[f.iconKey](f.color)}
                  </div>

                  <h3 className="text-white/85 font-medium text-[13px] mb-1.5 tracking-tight">{f.title}</h3>
                  <p className="text-white/30 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">3 adımda başla</h2>
            <p className="text-white/30 text-sm sm:text-base">Kurulum yok, kredi kartı yok</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {STEPS.map((s, i) => (
              <div key={s.num} className="relative text-center p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                {/* Step number as subtle watermark */}
                <div className="absolute top-3 right-4 text-white/[0.04] text-4xl font-bold pointer-events-none">{s.num}</div>

                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#10b981]/10 border border-[#10b981]/15 mb-3">
                    {s.icon}
                  </div>
                  <h3 className="text-white/80 font-medium text-sm mb-1">{s.title}</h3>
                  <p className="text-white/30 text-xs leading-relaxed">{s.desc}</p>
                </div>

                {/* Connector line between steps */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-[9px] w-[18px] h-px bg-white/[0.08]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#10b981]/[0.02]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#10b981]/[0.04] rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-xl mx-auto text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Hemen dene</h2>
          <p className="text-white/30 text-sm mb-8">Ücretsiz, hızlı, basit. Kayıt ol ve notlarını yönetmeye başla.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#10b981] text-black font-semibold rounded-xl hover:bg-[#0ea371] transition-all shadow-xl shadow-[#10b981]/25 hover:shadow-[#10b981]/40"
          >
            Ücretsiz Başla
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#10b981] flex items-center justify-center text-black font-bold text-[9px]">N</div>
            <span className="text-white/30 text-xs">Notsmy</span>
          </div>
          <div className="flex items-center gap-4 text-white/20 text-xs">
            <a href="https://simay.tech" target="_blank" rel="noopener noreferrer" className="hover:text-[#10b981] transition-colors">
              simay.tech
            </a>
            <span>·</span>
            <Link href="/login" className="hover:text-white/50 transition-colors">Giriş Yap</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
