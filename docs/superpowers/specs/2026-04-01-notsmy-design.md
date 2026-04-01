# Notsmy — Not Tutma Uygulamasi Tasarim Dokumani

## Ozet

Notsmy, kisisel ve ekip kullanimina yonelik bir not tutma uygulamasidir. 3 gunluk takvim gorunumunde notlar/gorevler listelenir, oncelik sirasina gore duzenlenebilir, favoriye alinabilir ve tamamlananlar ustu cizili olarak gosterilir. 24 saat dolmadan tamamlanmayan gorevler icin hatirlatma bildirimi gonderilir.

## Temel Ozellikler

### 3 Gunluk Takvim Gorunumu
- Ana ekran 3 gunluk bir zaman dilimini gosterir (bugun + 2 gun)
- Her gun bir satir olarak listelenir, icindeki notlar dikey kartlar halinde siralanir
- Bugun vurgulu gosterilir (emerald badge)
- Ileri/geri navigasyon ile 3'er gunluk dilimler arasinda gecis yapilir

### Not Tipleri
- **Gorev (Task)** — yapilacak is, tamamlanabilir (checkbox)
- **Toplanti (Meeting)** — toplanti notu, tarih/saat bilgisi ile
- **Fikir (Idea)** — anlik dusunce, hizli not
- **Not (Note)** — genel serbest metin notu

Her tip farkli renk ve ikonla ayirt edilir:
- Gorev: turuncu 🔲
- Toplanti: mor 📅
- Fikir: cyan 💡
- Not: pembe 📝

### Oncelik ve Siralama
- Notlar surukle-birak ile oncelik sirasina gore yeniden duzenlenebilir (dnd-kit)
- `sort_order` integer alani ile siralama veritabaninda saklanir
- Favori notlar otomatik olarak gunun en ustune cikar

### Favori Sistemi
- Her notta yildiz (☆/⭐) toggle butonu
- Favoriye alinan notlar o gun icinde en uste cikarak gorsel olarak one cikar
- Favori notlar emerald kenarligi ile vurgulanir

### Tamamlama
- Gorev tipindeki notlar tamamlanabilir (checkbox tikla)
- Tamamlanan notlarin ustu cizilir (strikethrough)
- Tamamlananlar listenin altina duser ve soluk gosterilir (opacity: 0.5)

### Hatirlatma Sistemi
- Vercel Cron Job saatlik olarak calisir
- 24 saat dolmadan tamamlanmamis gorevleri tespit eder
- `notifications` tablosuna kayit olusturur, kullanici 🔔 ikonunda okunmamis sayi gorur
- `reminder_sent` boolean ile ayni gorev icin tekrar bildirim gonderilmez
- Bildirime tiklaninca ilgili nota yonlendirilir

### Filtre Sistemi
- Ust barda not tipine gore filtre butonlari (Tumu, Gorev, Toplanti, Fikir, Not)
- Aktif filtre emerald rengiyle vurgulanir
- Filtre secimi URL query parametresinde tutulur (paylasabilir linkler)

## Workspace ve Ekip Paylasimi

### Workspace Modeli
- Her kullanici kayit olunca otomatik bir "Kisisel Workspace" olusturulur
- Kullanicilar yeni workspace'ler olusturup ekip uyelerini davet edebilir
- Navbar'dan workspace arasi gecis yapilir
- Herkes ayni workspace'teki notlari gorur ve duzenleyebilir

### Roller
- **Owner** — workspace olusturan, uye davet edebilir, workspace silebilir
- **Member** — not ekleyebilir, duzenleyebilir, gorebilir

## Veritabani Semasi (Neon PostgreSQL)

### users
| Kolon | Tip | Aciklama |
|-------|-----|----------|
| id | uuid PK | Benzersiz kullanici ID |
| name | varchar | Kullanici adi |
| email | varchar unique | E-posta adresi |
| avatar_url | text | Profil resmi URL |
| created_at | timestamp | Olusturulma tarihi |

### workspaces
| Kolon | Tip | Aciklama |
|-------|-----|----------|
| id | uuid PK | Benzersiz workspace ID |
| name | varchar | Workspace adi |
| owner_id | uuid FK → users.id | Olusturan kullanici |
| created_at | timestamp | Olusturulma tarihi |

### workspace_members
| Kolon | Tip | Aciklama |
|-------|-----|----------|
| workspace_id | uuid FK → workspaces.id | Workspace (composite PK) |
| user_id | uuid FK → users.id | Uye (composite PK) |
| role | enum(owner, member) | Rol |
| joined_at | timestamp | Katilma tarihi |

### notifications
| Kolon | Tip | Aciklama |
|-------|-----|----------|
| id | uuid PK | Benzersiz bildirim ID |
| user_id | uuid FK → users.id | Bildirimi alan kullanici |
| note_id | uuid FK → notes.id | Ilgili not |
| message | varchar | Bildirim mesaji |
| is_read | boolean default false | Okundu mu |
| created_at | timestamp | Olusturulma tarihi |

### notes
| Kolon | Tip | Aciklama |
|-------|-----|----------|
| id | uuid PK | Benzersiz not ID |
| workspace_id | uuid FK → workspaces.id | Hangi workspace'e ait |
| created_by | uuid FK → users.id | Olusturan kullanici |
| title | varchar | Not basligi |
| content | text | Detayli icerik (opsiyonel) |
| type | enum(task, meeting, idea, note) | Not tipi |
| date | date | Hangi gune ait |
| is_completed | boolean default false | Tamamlandi mi |
| is_favorite | boolean default false | Favoriye alindi mi |
| sort_order | integer | Oncelik sirasi (kucuk = uste) |
| reminder_sent | boolean default false | Hatirlatma gonderildi mi |
| created_at | timestamp | Olusturulma tarihi |
| updated_at | timestamp | Son guncelleme tarihi |

## Uygulama Mimarisi

### Frontend
- **Next.js 15 App Router** — React 19 ile server/client component ayrimi
- **Tailwind CSS** — simay.tech temasi (emerald green, dark mode)
- **dnd-kit** — surukle-birak ile oncelik siralama
- **Responsive tasarim** — mobilde de kullanilabilir

### API Katmani
- **Next.js Server Actions** — ayri API route'lara gerek yok
- **Drizzle ORM** — type-safe PostgreSQL sorgulari
- **Zod** — input validation

### Auth
- **NextAuth.js v5 (Auth.js)** — Google ve GitHub login
- **JWT session** — stateless, olceklenebilir
- Kayit sirasinda otomatik "Kisisel Workspace" olusturulur

### Hatirlatma
- **Vercel Cron Jobs** — `/api/cron/reminders` endpoint'i saatlik calisir
- Bugunun tarihinde `is_completed = false` ve `reminder_sent = false` olan notlari bulur
- Olusmalarindan 20+ saat gecmis olanlari isaretler
- Uygulama ici bildirim olusturur

### Deploy
- **Vercel** — otomatik CI/CD, preview deployments
- **Neon PostgreSQL** — serverless veritabani

## Tasarim Dili (simay.tech Temasi)

### Renkler
- **Primary (Emerald):** #10b981
- **Background:** #09090b
- **Card Background:** rgba(255,255,255,0.03)
- **Border:** rgba(255,255,255,0.06)
- **Favori Vurgu:** rgba(16,185,129,0.05) bg + rgba(16,185,129,0.15) border
- **Text Primary:** #f1f5f9
- **Text Secondary:** #888

### Tip Renkleri
- Gorev: #f59e0b (turuncu)
- Toplanti: #8b5cf6 (mor)
- Fikir: #06b6d4 (cyan)
- Not: #ec4899 (pembe)

### Tipografi
- **Font:** Inter, Geist, system-ui
- **Baslik:** 600 weight
- **Body:** 400 weight, 13-14px
- **Badge/Label:** 11px, pill-shaped (rounded-full)

### Komponent Stili
- Pill-shaped badge'ler (border-radius: 100px)
- Ince kenarlıklar (1px solid rgba)
- Hover'da subtle renk degisimi
- Dark mode oncelikli

## Kapsam Disi (Sonraki Surumlerde)
- Realtime sync (Pusher/WebSocket ile)
- Dosya/resim ekleme
- Markdown destegi
- Mobil uygulama (PWA olarak eklenebilir)
- Tekrarlayan gorevler
- Etiket/tag sistemi
- Arama fonksiyonu
