import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center">
        <div className="text-6xl font-bold text-white/10 mb-4">404</div>
        <h2 className="text-white/60 font-medium mb-2">Sayfa bulunamadı</h2>
        <p className="text-white/25 text-sm mb-6">Aradığınız sayfa mevcut değil.</p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-[#10b981] text-black text-sm font-medium rounded-xl hover:bg-[#0ea371] transition-colors"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
