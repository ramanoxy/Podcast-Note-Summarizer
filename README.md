# SYNTH // Podcast Active Note-Taking & AI Workspace

> **Ruang kerja minimalis eksperimental untuk menyimak video podcast YouTube secara aktif, mencatat dengan sinkronisasi penanda waktu (timestamps), dan merapikan ringkasan menggunakan Google Gemini AI.**

---

## 💡 Filosofi & Mengapa SYNTH Berbeda?

Mayoritas *AI video summarizer* di internet bekerja secara pasif: pengguna menempelkan link video, menunggu beberapa detik, lalu mendapatkan ringkasan teks panjang. Berbagai studi menunjukkan pendekatan pasif ini menghasilkan **retensi memori yang sangat rendah**—kita cepat lupa intisari videonya.

**SYNTH** membalik paradigma tersebut:
- **Active Listening:** Pengguna tetap memegang kendali penuh untuk menyimak video/audio dan mencatat poin-poin pemahaman mereka sendiri.
- **Timestamp Synchronized:** Setiap catatan dapat diikatkan ke detik video yang tepat dengan satu tombol pintasan (`Ctrl+T`).
- **AI as an Editor, Not a Replacement:** AI bertindak sebagai co-pilot editorial yang merapikan coretan kasar menjadi ringkasan terstruktur dengan tata bahasa yang elegan tanpa menghapus atau merusak penanda waktu asli.

---

## ✨ Fitur Utama

- ⚡ **Split-Screen Workspace:** Tata letak dua kolom responsif—pemutar YouTube di sisi kiri dan editor catatan cerdas di sisi kanan.
- ⏱️ **Interactive Clickable Timestamps:** Sisipkan timestamp `[mm:ss]` saat mengetik. Mengklik badge timestamp pada mode pratinjau langsung melompatkan video ke detik tersebut.
- ⌨️ **Global Playback Shortcuts:** Kendalikan pemutar video langsung dari keyboard tanpa memindahkan kursor mouse dari editor catatan:
  - `Ctrl + T` : Sisipkan timestamp video aktif saat ini ke posisi kursor.
  - `Alt + Space` : Play / Pause video.
  - `Alt + ArrowLeft` : Mundur 5 detik.
  - `Alt + ArrowRight` : Maju 5 detik.
- 🤖 **Penyempurnaan Catatan dengan AI (In-Place Overwrite & Undo):**
  - Mengirim catatan kasar ke endpoint server Google Gemini API (`gemini-1.5-flash`).
  - Merapikan struktur kalimat, memperbaiki ejaan, dan mengelompokkan topik dengan tetap **mempertahankan 100% timestamp asli**.
  - Dilengkapi tombol **UNDO AI** untuk membatalkan hasil AI jika pengguna ingin kembali ke draf ketikan awal.
- 📁 **Riwayat Sesi & Drawer Penyimpanan Otomatis:**
  - Auto-save ke browser `localStorage` dengan *debouncing* agar performa mengetik tetap mulus.
  - Drawer samping menampilkan thumbnail video YouTube, judul otomatis via YouTube oEmbed, dan cuplikan catatan.
- 🏴 **Desain Eksperimental Monokrom Minimalis (Anti-Slop):**
  - Mengikuti prinsip desain `design-taste-frontend`: palet murni hitam dan putih (`#000000`, `#121216`, `#ffffff`), tipografi monospace yang tajam, aksen grid scanline subtle, dan *micro-interactions* halus tanpa warna gradien yang mengganggu fokus.
- 📄 **Ekspor Fleksibel:** Unduh dokumen sebagai file Markdown (`.md`) atau salin teks ke *clipboard*.

---

## 🖥️ Panduan Antarmuka & Alur Penggunaan

```text
+---------------------------------------------------------------------------------+
| [= HISTORY (N)]  [Input Link YouTube ...] [LOAD VIDEO]   [+ NEW NOTE] [AUTOSAVE]|
+----------------------------------------+----------------------------------------+
| KIRI: YouTube Player (16:9)            | KANAN: Smart Notes Workspace           |
|                                        |                                        |
| +------------------------------------+ | Toolbar:                               |
| |                                    | | [+ TIMESTAMP (Ctrl+T)] [✨ RAPIKAN AI] |
| |        [ YouTube IFrame ]          | | [UNDO AI] [EDIT | PREVIEW | SPLIT]   |
| |                                    | | [COPY] [EXPORT .MD]                  |
| +------------------------------------+ | -----------------------------------  |
| Status: Playing (04:20 / 45:10)        | Area Catatan (Markdown):               |
| Shortcuts:                             | - [01:15] Pengenalan topik arsitektur  |
| - Alt+Space : Play/Pause               | - [04:20] Masalah utama: bottleneck... |
| - Alt+Left/Right : -/+ 5s              | - [08:35] Solusi strategi optimalisasi |
| - Speed : 0.75x | 1x | 1.25x | 1.5x    |                                        |
|                                        | Status: 120 Words | 3 Timestamps       |
+----------------------------------------+----------------------------------------+
```

### Langkah Penggunaan:
1. **Memuat Video:** Tempelkan URL video YouTube podcast ke kolom input URL di bilah navigasi atas, lalu klik **LOAD VIDEO**.
2. **Mulai Menyimak:** Tekan `Alt + Space` untuk memutar video.
3. **Mencatat Poin Penting:** Ketik ringkasan atau kutipan menarik di editor kanan. Tekan `Ctrl + T` di mana saja untuk menyisipkan penanda waktu saat itu (contoh: `[02:45]`).
4. **Merapikan dengan AI:** Setelah selesai menyimak, klik tombol **✨ RAPIKAN DENGAN AI**. Catatan kasarmu akan dirapikan secara otomatis dengan format headings dan bullet points.
5. **Memeriksa atau Melompat ke Bagian Video:** Buka mode **PREVIEW** atau **SPLIT**. Klik badge timestamp manapun (contoh: `[02:45]`) untuk memutar ulang bagian video tersebut.
6. **Menyimpan & Ekspor:** Catatanmu otomatis tersimpan di browser. Klik **EXPORT .MD** untuk mengunduh catatan sebagai file Markdown.

---

## ⌨️ Daftar Pintasan Keyboard (Shortcuts Cheat Sheet)

| Pintasan Keyboard | Aksi | Keterangan |
|---|---|---|
| `Ctrl + T` | Sisipkan Timestamp | Menyisipkan format `[mm:ss]` atau `[hh:mm:ss]` ke posisi kursor |
| `Alt + Space` | Play / Pause | Memutar atau menjeda video YouTube tanpa kursor keluar dari editor |
| `Alt + ArrowLeft` | Mundur 5 Detik | Lompat mundur 5 detik dari posisi playback saat ini |
| `Alt + ArrowRight` | Maju 5 Detik | Lompat maju 5 detik dari posisi playback saat ini |
| `Escape` | Tutup Drawer | Menutup panel riwayat sesi saat terbuka |

---

## 🛠️ Arsitektur & Teknologi

- **Frontend & Fullstack Framework:** [Nuxt 3](https://nuxt.com/) (Vue 3, Nitro server engine)
- **Bahasa Pemrograman:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) dengan plugin `@tailwindcss/typography`
- **Ikon & Tipografi:** [Lucide Vue Next](https://lucide.dev/), font Google *Plus Jakarta Sans* & *JetBrains Mono*
- **Integrasi AI:** Google Gemini API via SDK `@google/generative-ai`
- **Unit Testing:** [Vitest](https://vitest.dev/) dengan environment `happy-dom`
- **Penyimpanan Lokal:** Browser `localStorage` dengan debounced serialization

---

## 🚀 Memulai Instalasi & Menjalankan

### Kebutuhan Sistem:
- [Node.js](https://nodejs.org/) v18.0.0 atau yang lebih baru
- npm, pnpm, atau yarn

### 1. Kloning Repositori & Masuk ke Direktori
```bash
cd note-resume
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment (Opsional untuk AI)
Salin template environment:
```bash
cp .env.example .env
```
Buka file `.env` dan masukkan API Key Gemini Anda:
```env
GEMINI_API_KEY=AIzaSy...
```
*(Catatan: Jika API key belum diisi, aplikasi tetap dapat digunakan secara penuh dan tombol "Rapikan Catatan" akan menggunakan fallback pemformat struktural lokal).*

### 4. Jalankan Server Pengembangan (Dev Mode)
```bash
npm run dev
```
Buka peramban di [http://localhost:3000](http://localhost:3000).

### 5. Menjalankan Pengujian (Testing)
```bash
npm test
```
Menjalankan seluruh 8 test suites (28 unit tests) untuk utilitas URL, timestamp parsing, session composable, player controller, dan server API.

### 6. Membangun untuk Produksi (Build)
```bash
npm run build
```
Menghasilkan bundle produksi teroptimasi di folder `.output/`.

---

## 📡 Dokumentasi Endpoint Server (`/api/refine`)

### `POST /api/refine`
Menerima draf catatan kasar pengguna dan mengembalikan teks yang telah dirapikan oleh Gemini AI.

#### Request Body:
```json
{
  "notes": "Catatan kasar pembicara [01:23] menjelaskan poin A...",
  "videoTitle": "Podcast Episode 42"
}
```

#### Response (Success 200 OK):
```json
{
  "refinedNotes": "## Ringkasan Eksekutif\n...\n## Poin Kunci & Diskusi Waktu\n- [01:23] Penjelasan konsep A secara mendalam..."
}
```

---

## 📄 Lisensi
Dilisensikan di bawah lisensi MIT. Bebas digunakan untuk produktivitas pribadi maupun pengembangan lebih lanjut.
