# Ne Var? — React Native (Expo)

## Vercel’de yayınla

Bu proje Vercel’de **web arayüzü + API** olarak yayınlanır. Daha önce çalışmamasının nedeni: Vercel klasik bir Express sunucusu dinlemez; ayrıca üretimde API `localhost`’a gidiyordu.

1. Kodu GitHub’a yükle (Vercel GitHub’dan çeker).
2. [vercel.com](https://vercel.com) → **Add New → Project** → bu repoyu seç.
3. Ayarlar otomatik `vercel.json`’dan gelir. Ekstra Framework seçme.
4. **Environment Variables** ekle:
   - `JWT_SECRET` = uzun rastgele bir metin
   - `NODE_ENV` = `production`
5. **Deploy**.

Bittiğinde adres `https://proje-adin.vercel.app` olur. Giriş: `admin` / `Admin123`.

Not: Vercel’de `db.json` dosyası kalıcı değildir. Sunucusuz fonksiyon soğuyunca menü/oy verisi seed’e dönebilir. Kalıcı veri için Railway / Render gibi sürekli açık bir sunucu daha uygundur.

Yemek menüsü uygulaması artık **Expo + React Native** istemci ve mevcut **Express API** ile çalışır.

## Yerelde çalıştır

1. [Node.js LTS](https://nodejs.org) kur.
2. Proje klasöründe:
   ```
   npm install
   npm run dev
   ```
3. Expo QR kodunu [Expo Go](https://expo.dev/go) ile oku.

Yönetici: `admin` / `Admin123` (yayına çıkmadan önce değiştir).

API varsayılan olarak `http://127.0.0.1:3001` (Android emülatör: `10.0.2.2:3001`). Fiziksel telefonda aynı Wi‑Fi’de `.env` içine şunu yaz:

```
EXPO_PUBLIC_API_URL=http://BILGISAYARIN-LAN-IP:3001
```

Expo, mümkünse otomatik olarak geliştirme makinesinin IP’sini kullanır.

## Mağaza

- Android: `npx expo prebuild` sonra Android Studio ile imzalı AAB.
- iOS: Mac + Xcode gerekir.

Sunucu hâlâ `npm start` ile `PORT` üzerinden API’yi açar.
