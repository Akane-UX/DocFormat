# DocFormat Studio

Webapp otomatisasi tata letak dan perapi dokumen akademik maupun profesional (`.docx`) berbasis **Python OpenXML (`lxml`) + Flask** dengan antarmuka **Live Paper Simulator**.

## Fitur Utama

1. **Preset Standar Dokumen Cepat**:
   - **Makalah Akademik** (A4, Margin 4-4-3-3, Times New Roman 12pt, Spasi 1.5, Justify)
   - **Laporan Praktikum / Resmi** (A4, Margin 4-4-3-3, Times New Roman 12pt, Spasi 1.5, Tabel Rapi)
   - **Skripsi / Tugas Akhir / Tesis** (A4, Margin 4-4-3-3, Times New Roman 12pt, Spasi 2.0, Nomor Halaman Atas Kanan)
   - **Proposal Penelitian / PKM** (A4, Margin 3-4-3-3, Times New Roman 12pt, Spasi 1.15)
   - **Artikel Ilmiah / Paper** (A4, Margin 2.54 cm merata, Times New Roman 11pt, Spasi 1.15)
   - **Laporan Korporat / Dinas** (A4, Margin 3-3-3-3, Arial 11pt, Spasi 1.15)
2. **Checklist Bagian yang Dirapikan (Granular Modular)**:
   - Pilih bagian tertentu saja atau seluruh bagian dokumen: Margin & Kertas, Jenis Font, Ukuran Teks, Perataan Teks (Rata Kiri, Kanan, Tengah, Rata Kiri-Kanan / Justify), Spasi Baris (1.0, 1.15, 1.5, 2.0), Jarak Antar Paragraf (Before/After pt), Indentasi Baris Pertama (1.27 cm / kustom), Heading BAB & Sub-bab (otomatis *Page Break* & kapitalisasi), Penomoran Halaman (Footer/Header), Perapian Tabel, Pembersih Baris Kosong Berlebih, Daftar Isi Otomatis (TOC), serta **Generator Cover Otomatis** jika dokumen belum memiliki sampul.
3. **Inspeksi Struktur DOCX & Simulasi Kertas Interaktif**:
   - Mendeteksi jumlah paragraf, kata, bab/sub-bab, tabel, margin asal, serta keberadaan cover dan daftar isi secara instan.

## Cara Menjalankan

```bash
python3 app.py
```

Lalu buka `http://localhost:8090` di browser.
