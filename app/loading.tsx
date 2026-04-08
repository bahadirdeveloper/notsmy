export default function Loading() {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#10b981] animate-pulse" />
        <span className="text-white/20 text-xs">Yükleniyor...</span>
      </div>
    </div>
  );
}
