# Zenith AI Backend (Vercel)

Backend terpisah untuk fitur Zenith AI. API key Gemini hanya disimpan sebagai Secret di Vercel, tidak pernah dikirim ke APK.

## Isi

- `POST /api/chat` — chat teks dan analisis foto (JPEG, PNG, WebP).
- `GET /api/health` — pemeriksaan konfigurasi tanpa membocorkan secret.
- Rate limit per IP melalui Upstash Redis: 12 permintaan/10 menit dan 80 permintaan/hari.
- Maksimal 12 pesan riwayat; maksimal 3.000 karakter per pesan.
- Foto maksimal 2,8 MB (agar request tetap di bawah batas payload fungsi).
- Instruksi sistem membatasi AI sebagai asisten pengetahuan/panduan Zenith, bukan editor foto.

## Deploy

1. Buat repository GitHub baru, misalnya `Zenith-AI-Backend`, lalu upload seluruh isi folder ini.
2. Import repository itu di https://vercel.com/new.
3. Di Vercel, buka **Storage** dan buat database Redis melalui integrasi Upstash. Hubungkan database ke project Vercel agar `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` tersedia. Jika tidak otomatis, salin kedua nilai dari dashboard Upstash ke Environment Variables Vercel sebagai **Secret**.
4. Di Vercel → Project → Settings → Environment Variables, tambahkan:
   - `GEMINI_API_KEY` = API key Gemini BARU (type Secret; Production).
   - `GEMINI_MODEL` = `gemini-2.5-flash` (type Config).
   - `ALLOWED_ORIGINS` = `https://localhost,capacitor://localhost,http://localhost` (type Config).
5. Pastikan semua secret berlaku untuk Production, lalu redeploy.
6. Tes `https://DOMAIN-VERCEL-KAMU/api/health`. Harus menampilkan `ok: true` dan `configured: true`.

**Jangan** menaruh API key di source code, APK, file `.env` yang di-commit, `NEXT_PUBLIC_*`, atau kode frontend. Karena key lama pernah dibagikan, buat key baru dan cabut key lama.

## Request dari aplikasi

```js
const response = await fetch("https://DOMAIN-VERCEL-KAMU/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [
      { role: "user", content: "Bagaimana cara memakai fitur downloader?" }
    ],
    image: null
  })
});

const result = await response.json();
if (!response.ok) throw new Error(result.error || "Zenith AI gagal");
console.log(result.answer);
```

Untuk analisis foto, kirim `image` seperti ini:

```js
{
  mimeType: "image/jpeg",
  data: "BASE64_TANPA_PREFIX_DATA_URL"
}
```

`messages` memakai role `user` dan `model`. Simpan riwayat percakapan di aplikasi, lalu kirim maksimal 12 pesan terakhir setiap request.

## Batas keamanan yang perlu dipahami

Aplikasi ini bersifat public, jadi endpoint dapat ditemukan dan dipanggil di luar APK. CORS bukan autentikasi dan sebuah secret yang ditanam di APK tidak bisa melindungi API. Rate limit per IP dan validasi input mengurangi penyalahgunaan, tetapi bukan jaminan anti-abuse sempurna (VPN/proxy dapat mengganti IP).

Sebelum dipakai publik:
- Aktifkan batas penggunaan/alert billing di Google AI Studio/Cloud.
- Pantau pemakaian Gemini dan Upstash.
- Sesuaikan limit jika trafik normal sudah diketahui.
- Untuk kontrol lebih kuat, tambahkan login/token pengguna dan verifikasi di server; jangan membuat satu token rahasia bersama di APK.
- Jangan kirim foto sensitif. Backend meneruskan foto langsung ke Gemini dan tidak menyimpannya sendiri.

## Catatan kompatibilitas

Endpoint memakai Gemini `generateContent` REST dengan dukungan teks dan `inlineData` untuk gambar. Google mendokumentasikan input multimodal melalui endpoint ini. Jika Google mengubah ketersediaan model, ubah `GEMINI_MODEL` di Vercel tanpa mengedit APK.
