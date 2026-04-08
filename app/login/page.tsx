import { signIn } from '@/auth';

async function signInWithGitHub() {
  'use server';
  await signIn('github', { redirectTo: '/' });
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090b] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#10b981]/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-[#8b5cf6]/[0.02] rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#10b981] mb-4 shadow-lg shadow-[#10b981]/20">
            <span className="text-black font-bold text-2xl">N</span>
          </div>
          <h1 className="text-2xl font-semibold text-white/90 tracking-tight">Notsmy</h1>
          <p className="mt-1.5 text-white/30 text-sm">Kişisel ve ekip not yönetimi</p>
        </div>

        {/* Card */}
        <div className="border border-white/[0.08] rounded-2xl p-6 bg-white/[0.02] backdrop-blur-sm">
          <h2 className="text-white/80 font-medium text-sm">Giriş Yap</h2>
          <p className="text-white/25 text-xs mt-1 mb-6">Devam etmek için giriş yapın</p>

          {/* GitHub */}
          <form action={signInWithGitHub}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/80 text-sm hover:bg-white/[0.07] hover:border-white/[0.15] transition-all group"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              GitHub ile Devam Et
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-white/15 text-[10px] mt-6">
          simay.tech tarafından
        </p>
      </div>
    </main>
  );
}
