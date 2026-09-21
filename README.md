# WAH Silent Exam Monitor

**Pengawas Keheningan & Timer Ujian**
**WAH Official — Wiyanto Abu Hanif**

Aplikasi web untuk membantu guru menciptakan suasana ujian yang tenang, tertib, dan terkontrol di dalam kelas. Seluruh fitur inti berjalan 100% di browser tanpa backend.

---

## 1. Menjalankan Secara Lokal

```bash
npm install      # sekali saja
npm run dev      # mode pengembangan → http://localhost:5173
npm run build    # build produksi → dist/index.html (satu file mandiri)
npm run preview  # pratinjau hasil build
```

> **Penting:** fitur mikrofon memerlukan konteks aman (HTTPS atau `http://localhost`). Jika dibuka lewat IP/jaringan lokal tanpa HTTPS, browser akan menolak akses mikrofon.

Gunakan browser modern: Chrome, Edge, atau Firefox versi terbaru (desktop/laptop disarankan).

## 2. Mengaktifkan Mikrofon

1. Klik tombol **Aktifkan Mikrofon** (di header atau panel kiri).
2. Izinkan akses mikrofon pada dialog browser.
3. Robot langsung merespons tingkat suara kelas; nilai 0–100 adalah **estimasi relatif**.
4. Tombol **Matikan** menghentikan input mikrofon sepenuhnya.

Jika izin ditolak, timer & background tetap berfungsi normal. Buka ikon gembok di bilah alamat browser untuk mengubah izin.

**Privasi:** analisis suara dilakukan lokal via Web Audio API (RMS amplitudo). Tidak ada perekaman, tidak ada audio yang dikirim ke server, tidak ada data siswa yang dikumpulkan.

## 3. Kalibrasi & Ambang Batas (Pengaturan → Mikrofon)

- **Mulai Kalibrasi (5 detik):** minta siswa hening, aplikasi mengukur *baseline* ruangan lalu menyarankan ambang. Guru dapat menerapkan atau mengabaikannya.
- **Ambang Tenang / Terdeteksi / Berisik** dapat digeser manual.
- **Sensitivitas** menyesuaikan karakter mikrofon perangkat (tiap laptop berbeda).
- **Durasi Sebelum Status Berubah** mencegah indikator berubah karena suara singkat.
- **Preset Suasana:** Sangat Tenang · Normal · Lingkungan Ramai.

## 4. Menggunakan Timer Ujian

- Klik **preset durasi** (5–120 menit) atau **Custom** untuk memasukkan jam/menit/detik.
- **Mulai · Pause · Lanjut · Reset** (reset saat berjalan meminta konfirmasi 2 langkah).
- **±1 Menit** untuk penyesuaian cepat (tidak pernah negatif).
- Timer dihitung berbasis **timestamp** sehingga akurat meski tab di-throttle.
- Saat 00:00 muncul **WAKTU HABIS** + bel akhir (dapat dimatikan), dengan tombol **Mulai Ulang** / **Atur Waktu Baru**.
- **Pengingat sisa waktu** otomatis pada 15, 10, 5, dan 1 menit (dapat dimatikan di Pengaturan → Timer).

## 5. Peringatan Audio (Pengaturan → Audio)

Tiga level pengingat Bahasa Indonesia yang berputar sesuai eskalasi:

1. *"Anak-anak, mari kembali tenang."*
2. *"Harap menjaga keheningan selama ujian."*
3. *"Suasana ujian harus tenang. Mohon hentikan percakapan."*

- Jenis: **Suara (TTS id-ID)** · **Beep lembut** · **Keduanya**.
- Volume, **cooldown** (jeda antar peringatan), dan pilihan voice tersedia.
- Tombol **Uji Level 1/2/3** untuk memeriksa audio sebelum ujian.
- Jika browser tak mendukung SpeechSynthesis, otomatis memakai beep.

## 6. Upload Background PNG (Pengaturan → Background)

1. Pilih file **PNG** (disarankan **1920×1080**, rasio 16:9, maks 5 MB).
2. Pratinjau tampil; peringatan muncul bila rasio bukan 16:9 (tetap bisa dipakai).
3. Atur **Cover/Contain**, posisi (Atas/Tengah/Bawah), dan **Overlay Transparan** agar teks tetap terbaca.
4. **Terapkan & Simpan** — gambar disimpan lokal via IndexedDB dan dimuat otomatis.
5. **Hapus Background Kustom** untuk kembali ke ruang kelas default.

## 7. Mode Presentasi / Ujian

Tombol **Mode Presentasi** (bar bawah) menampilkan tampilan minimalis untuk proyektor: robot, status keheningan, meter, dan timer besar — tanpa kontrol teknis. Kontrol muncul saat mouse bergerak; keluar dengan tombol **Keluar** atau **Esc**. Otomatis mencoba fullscreen; tombol **Fullscreen** di header juga tersedia (dengan fallback bila browser menolak).

## 8. Deploy Gratis

Hasil build adalah **satu file `dist/index.html`** yang mandiri, sehingga dapat di-hosting gratis di mana saja:

- **Netlify Drop / Vercel:** seret folder `dist/` (atau hubungkan repo, build command `npm run build`, output `dist`).
- **GitHub Pages:** unggah isi folder `dist/` ke branch `gh-pages`.

Pastikan diakses via **HTTPS** (otomatis di ketiga layanan di atas) agar mikrofon diizinkan.

## 9. Keterbatasan Deteksi Kebisingan

- Nilai 0–100 adalah **estimasi relatif** dari amplitudo RMS mikrofon — **bukan desibel (dB SPL) terkalibrasi**. Akurasi dB membutuhkan mikrofon serta prosedur kalibrasi khusus.
- Karakter mikrofon tiap perangkat berbeda (AGC, jarak, sensitivitas) — selalu lakukan **kalibrasi suasana awal** sebelum ujian.
- Aplikasi adalah **alat bantu pengelolaan kelas**, bukan alat ukur akustik profesional.

## 10. Penyimpanan Lokal

| Data | Lokasi |
|---|---|
| Pengaturan (threshold, volume, timer terakhir, dll.) | `localStorage` |
| Background kustom (blob PNG) | IndexedDB |
| Audio mikrofon | **Tidak pernah disimpan/dikirim** |

Tombol **Reset Semua Pengaturan** (kaki modal pengaturan) mengembalikan semua ke bawaan.

---

© WAH Official — Wiyanto Abu Hanif
