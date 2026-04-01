export default function Home() {
  // TODO: check if user has any workspaces; create 'Kişisel Workspace' on first login
  // This is deferred from signIn callback because isNewUser is not available in NextAuth v5 beta.30
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090b]">
      <div className="text-center">
        <h1 className="text-4xl font-semibold text-[#10b981]">Notsmy</h1>
        <p className="mt-2 text-[#888]">Yükleniyor...</p>
      </div>
    </main>
  );
}
