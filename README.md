# Ne Var?

Mobil öncelikli yemek menüsü. Kullanıcılar hesap açar; yönetici sunucudaki ayrı hesapla menüyü yönetir.

```
npm install
npm run dev
```

Tarayıcı: http://localhost:5173/

**Yönetici:** aynı giriş formuna `admin` / `Admin123` yaz. Admin sekmesi açılır.

**Kullanıcı:** Kayıt ol → kendi kullanıcı adı ve şifren. `admin` adı alınamaz.

API: http://localhost:3001 — veriler `data/db.json` dosyasında, şifreler hash’li saklanır.
