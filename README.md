# DocFormat Studio

Aplikasi web untuk merapikan dan menstandardisasi tata letak dokumen `.docx` (Makalah, Laporan Praktikum, Skripsi, Proposal, Artikel Ilmiah, dan Laporan Dinas) secara otomatis sesuai kaidah penulisan karya tulis ilmiah.

## Arsitektur Sistem

DocFormat Studio menggunakan arsitektur **Hybrid Dual-Engine**:
- **Backend Server (`app.py` & `docx_engine.py`)**: Mesin pemroses dokumen berbasis Python (`Flask` dan `lxml`) untuk memanipulasi struktur internal `.docx` (`word/document.xml`, `word/styles.xml`, relasi header/footer, dan penomoran halaman).
- **Client-Side Browser Engine (`docx_client_engine.js`)**: Mesin pemroses dokumen langsung di browser berbasis Web Streams API (`CompressionStream` / `DecompressionStream`) dan `DOMParser`, sehingga aplikasi tetap dapat menginspeksi dan merapikan dokumen `.docx` meskipun dijalankan sebagai halaman statis tanpa backend aktif.

## Fitur Utama

### 1. Preset Standar Dokumen
Tersedia enam konfigurasi standar yang dapat langsung diterapkan atau disesuaikan kembali:
- **Makalah Akademik**: Kertas A4, margin 4-4-3-3 cm (Atas 4, Kiri 4, Bawah 3, Kanan 3), Times New Roman 12 pt, spasi 1.5, rata kiri-kanan (*justify*), indentasi alenia 1.27 cm.
- **Laporan Praktikum / Resmi**: Kertas A4, margin 4-4-3-3 cm, Times New Roman 12 pt, spasi 1.5, perapian tabel otomatis (10 pt), nomor halaman bawah tengah.
- **Skripsi / Tugas Akhir / Tesis**: Kertas A4, margin 4-4-3-3 cm, Times New Roman 12 pt, spasi 2.0, format judul BAB dua baris (`BAB I` diikuti baris baru judul bab), nomor halaman atas kanan.
- **Proposal Penelitian / PKM**: Kertas A4, margin 3-4-3-3 cm, Times New Roman 12 pt, spasi 1.15.
- **Artikel Ilmiah / Paper**: Kertas A4, margin merata 2.54 cm, Times New Roman 11 pt, spasi 1.15, indentasi 1.0 cm.
- **Laporan Korporat / Dinas**: Kertas A4, margin merata 3-3-3-3 cm, Arial 11 pt, spasi 1.15, paragraf lurus tanpa indentasi baris pertama.

### 2. Kontrol Cakupan dan Mode Perapian Adaptif
- **Cakupan Perapian**: Pilihan dropdown untuk merapikan seluruh komponen dokumen, fokus pada teks dan heading bab saja, hanya tata letak kertas dan nomor halaman, atau mode kustom per komponen.
- **Pembersihan Spasi dan Format Bawaan**: Menghapus spasi ganda di tengah kalimat, spasi manual di awal alenia, karakter tabulasi liar di dalam paragraf, paragraf kosong berlebih, serta me-reset jarak paragraf (*before/after auto-spacing*) bawaan dokumen lama tanpa merusak gambar atau rumus.
- **Standardisasi Heading 1 / 2 / 3**:
  - Mengenali struktur judul bab (`BAB I`, `Kata Pengantar`, `Daftar Pustaka`, termasuk judul bab yang terpisah dalam dua paragraf), sub-bab (`1.1`, `A.`), sub-sub-bab (`1.1.1`), serta sub-judul cetak tebal (*bold*) atau bernomor otomatis.
  - Menerapkan style resmi Microsoft Word (`Heading 1`, `Heading 2`, `Heading 3`, `Heading 4`) lengkap dengan `outlineLvl` agar muncul di *Navigation Pane* dan terintegrasi dengan Daftar Isi.
  - Mendukung opsi *Page Break Before* (mulai setiap BAB di halaman baru), kapitalisasi judul BAB otomatis, serta pilihan tata letak judul BAB 1 baris atau 2 baris.

### 3. Perlindungan Cover Asli dan Generator Cover (Individu / Kelompok)
- **Deteksi dan Proteksi Cover Asli**: Apabila dokumen yang diunggah sudah memiliki halaman sampul (beserta logo, gambar, dan jarak vertikalnya), sistem secara otomatis melindungi halaman sampul tersebut agar tidak terformat menjadi paragraf biasa dan menempatkan Daftar Isi tepat setelah halaman sampul.
- **Generator Cover Otomatis (Individu dan Kelompok)**: Apabila dokumen belum memiliki sampul (atau pengguna memilih untuk membuat sampul baru), tersedia mode penyusun **Sendiri / Individu** maupun **Kelompok** dengan daftar input Nama Lengkap dan NIM/NPM per anggota yang dapat ditambah atau dihapus secara dinamis.

### 4. Daftar Isi (TOC) dan Penomoran Halaman
- **Daftar Isi Otomatis**: Menyusun halaman Daftar Isi lengkap dengan titik-titik penghubung (*dot leader*) dan field `TOC` Word berdasarkan struktur Heading yang terdeteksi.
- **Penomoran Halaman**: Menambahkan field nomor halaman dinamis (`PAGE`) pada posisi bawah kanan, bawah tengah, atau atas kanan, serta menyembunyikan nomor halaman pada halaman sampul (`titlePg`).

### 5. Simulasi Kertas Interaktif
Panel pratinjau langsung (*Live Paper Simulator*) memvisualisasikan rasio kertas (`A4`, `F4`, `Letter`, `Legal`), garis batas margin, hierarki tipografi, spasi baris, indentasi alenia, pratinjau Cover, dan Daftar Isi secara langsung saat pengaturan diubah.

## Struktur Direktori

```text
DocFormat/
├── app.py                   # Server REST API Flask (/api/presets, /api/inspect, /api/format, /api/sample)
├── docx_engine.py           # Mesin pemroses OpenXML berbasis Python & lxml
├── index.html               # Antarmuka utama aplikasi (dapat dijalankan langsung atau via Flask)
├── styles.css               # Konfigurasi tata letak studio 3-kolom dan desain komponen
├── app.js                   # Logika state, kontrol UI adaptif, dan simulator kertas
├── docx_client_engine.js    # Mesin pemroses DOCX/ZIP di sisi browser (client-side fallback)
└── static/                  # Salinan aset statis untuk penyajian melalui Flask
```

## Cara Menjalankan

### Opsi 1: Menggunakan Server Python (Flask)

Pastikan Python 3 beserta paket `flask`, `flask-cors`, dan `lxml` telah terpasang, kemudian jalankan:

```bash
python3 app.py
```

Buka `http://localhost:8090` pada browser.

### Opsi 2: Menggunakan Static Web Server / Live Preview

Karena aplikasi dilengkapi dengan `docx_client_engine.js`, Anda juga dapat menyajikan direktori proyek ini menggunakan server statis apa pun (seperti VS Code Live Server atau `python3 -m http.server`) dengan membuka `index.html`.
