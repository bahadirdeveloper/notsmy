# Notsmy

Kişisel ve ekip için not ve görev yönetim uygulaması.

## Özellikler

- 📅 3 günlük takvim görünümü
- 🔲 4 not tipi: Görev, Toplantı, Fikir, Not
- ⭐ Favori sistemi (favoriler en üste çıkar)
- ✅ Görev tamamlama (üzeri çizilir)
- 🔄 Sürükle-bırak ile öncelik sıralaması
- 🔔 24 saatlik tamamlanmamış görev hatırlatması
- 👥 Workspace bazlı ekip paylaşımı
- 🌙 simay.tech dark mode teması

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Veritabanı:** Neon PostgreSQL + Drizzle ORM
- **Auth:** NextAuth.js v5 (Google & GitHub)
- **UI:** Tailwind CSS v4 + dnd-kit
- **Deploy:** Vercel

## Kurulum

1. Repoyu klonla
2. `.env.local` dosyasını `.env.example`'dan oluştur ve değerleri doldur
3. Neon'da yeni bir proje oluştur ve `DATABASE_URL`'i kopyala
4. Google ve GitHub OAuth uygulamalarını oluştur
5. `npm install` çalıştır
6. `npm run db:push` ile veritabanı şemasını oluştur
7. `npm run dev` ile başlat

## Environment Variables

Bkz: `.env.example`

## Deploy

Vercel'e bağla ve environment variable'ları ekle. Cron job otomatik olarak `vercel.json` üzerinden kurulur.

---

⚡ [simay.tech](https://simay.tech) tarafından
