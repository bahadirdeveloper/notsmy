'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-red-400 text-2xl">!</span>
        </div>
        <h2 className="text-white/80 font-medium mb-2">Bir hata oluştu</h2>
        <p className="text-white/30 text-sm mb-6">
          {error.message || 'Beklenmeyen bir hata meydana geldi.'}
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-[#10b981] text-black text-sm font-medium rounded-xl hover:bg-[#0ea371] transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  );
}
