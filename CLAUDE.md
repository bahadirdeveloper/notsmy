# Notsmy — AI Geliştirici Rehberi

## Proje Özeti
Not tutma uygulaması. 3 günlük takvim görünümü, görev/toplantı/fikir/not tipleri, favori sistemi, hatırlatma.

## Tech Stack
- Next.js 16 App Router + React 19
- Tailwind CSS v4 (CSS-first @theme inline — tailwind.config.ts yok)
- Drizzle ORM + Neon PostgreSQL
- NextAuth.js v5 beta (proxy.ts = middleware in Next.js 16)
- dnd-kit drag-and-drop

## Önemli Notlar
- `proxy.ts` Next.js 16'da middleware'dir (middleware.ts değil)
- Tailwind v4 kullanıyor: renk değişkenleri `app/globals.css` içinde `@theme inline` bloğunda
- searchParams Next.js 16'da Promise — `await searchParams` gerekli
- `notes.updatedAt` otomatik güncellenmez, her update'de `updatedAt: new Date()` gerekli

## Klasör Yapısı
- `app/` — Next.js pages ve API routes
- `components/` — UI bileşenleri
- `actions/` — Server Actions (CRUD)
- `db/` — Drizzle schema + connection
- `types/` — Shared TypeScript types

## Tasarım
- Dark mode first: bg `#09090b`, primary `#10b981` (emerald)
- Not tipleri: task=`#f59e0b`, meeting=`#8b5cf6`, idea=`#06b6d4`, note=`#ec4899`
- Spec: `docs/superpowers/specs/2026-04-01-notsmy-design.md`
