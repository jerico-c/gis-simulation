# Geo-Simulasi: Simulator Perancangan Jaringan FTTH


## 📝 Ringkasan Proyek

**Geo-Simulasi** adalah aplikasi web *front-end* yang berfungsi sebagai simulator interaktif untuk merancang dan memvalidasi jaringan Fiber To The Home (FTTH). Aplikasi ini memungkinkan pengguna untuk menempatkan perangkat jaringan secara visual di atas peta geografis nyata (diinisialisasi di Kota Magelang) dan menghubungkannya dengan rute kabel fiber optik.

Tujuan utama aplikasi ini adalah sebagai berikut:
* **Alat Bantu Perancangan**: Memudahkan perancang jaringan untuk membuat skema jaringan awal secara visual.
* **Validasi Real-time**: Memberikan umpan balik instan mengenai kelayakan teknis sebuah desain dengan menghitung total redaman (*link budget*) secara otomatis.
* **Media Pembelajaran**: Menjadi sarana edukasi interaktif untuk memahami konsep-konsep jaringan FTTH, komponen redaman, dan standar teknis yang berlaku.

Aplikasi ini berjalan sepenuhnya di sisi klien (*client-side*), tanpa memerlukan *backend*.

---

## ✨ Fitur Utama

* **Peta Interaktif**: Menggunakan Leaflet.js untuk menampilkan peta dunia nyata.
* **Penempatan Perangkat (Nodes)**: Kemampuan untuk menambah perangkat seperti **STO, ODC, ODP,** dan **Pelanggan** langsung di peta dengan sekali klik.
* **Penggambaran Kabel (Edges)**: Menghubungkan dua perangkat dengan rute kabel dan secara otomatis menghitung jarak geografisnya.
* **Edit & Hapus Perangkat**:
    * **Edit**: Memindahkan perangkat di peta dengan *drag-and-drop*, di mana semua kabel yang terhubung akan ikut menyesuaikan posisinya.
    * **Hapus**: Menghapus perangkat dari peta, beserta semua koneksi kabel yang terhubung dengannya.
* **Kalkulator Link Budget Real-time**: Secara otomatis menghitung total redaman dari pelanggan yang dipilih hingga ke STO setiap kali ada perubahan pada topologi jaringan.
* **Validasi Desain**: Memberikan status visual (✅ **VALID** atau ⚠️ **TIDAK OPTIMAL**) berdasarkan standar redaman maksimal **26 dB** dan memberikan peringatan jika panjang kabel melebihi **8 km**.
* **Pelabelan Otomatis**: Membuat label untuk setiap perangkat baru sesuai dengan pedoman pelabelan PT Telkom (PR.402.04).

---

## 💻 Teknologi yang Digunakan

* **HTML5**
* **CSS3** (dengan Flexbox untuk layout)
* **JavaScript (ES6+ Modules)**
* **Leaflet.js**: Pustaka peta interaktif *open-source*.

---

## 🚀 Cara Menjalankan Aplikasi

Karena aplikasi ini sepenuhnya *client-side*, Anda tidak memerlukan server web yang kompleks. Cukup jalankan di lingkungan server lokal sederhana.

1.  **Prasyarat**:
    * Browser web modern (Chrome, Firefox, Edge).
    * Ekstensi **Live Server** di Visual Studio Code (atau server lokal sederhana lainnya seperti `python -m http.server`).

2.  **Langkah-langkah**:
    * *Clone* atau unduh repositori ini ke komputer Anda.
    * Buka folder proyek (`geo-simulasi/`) di Visual Studio Code.
    * Klik kanan pada file `index.html` dan pilih **"Open with Live Server"**.
    * Aplikasi akan otomatis terbuka di browser Anda.

---

## 📂 Struktur File Proyek

Proyek ini disusun secara modular untuk kemudahan pengembangan dan pemeliharaan.

```

geo-simulasi/
├── index.html          \# File utama struktur HTML
├── style.css           \# File untuk semua styling
└── js/
├── main.js         \# Titik masuk utama aplikasi, mengikat semua modul
├── constants.js    \# Menyimpan nilai-nilai redaman dan konstanta lainnya
├── state.js        \# Mengelola data dan status aplikasi (nodes, edges, mode)
├── ui.js           \# Mengontrol semua elemen UI di luar peta (sidebar, panel)
├── map-logic.js    \# Berisi semua logika yang berinteraksi dengan Leaflet.js
├── link-budget.js  \# Mesin kalkulasi untuk menghitung redaman dan validasi
└── utils.js        \# Fungsi bantuan (seperti pelabelan otomatis)

```

---

## 🔧 Standar Teknis yang Digunakan

Perhitungan *link budget* pada aplikasi ini mengacu pada dokumen **PR.402.08 Pedoman Desain dan Perencanaan i-ODN** dari PT Telkom. Nilai redaman yang digunakan adalah sebagai berikut:

| Elemen Jaringan | Batasan Maksimum | Satuan |
| :--- | :--- | :--- |
| Kabel Fiber Optik | 0.35 | dB/km |
| Sambungan (Splice) | 0.1 | dB |
| Konektor (SC/UPC) | 0.25 | dB |
| Splitter 1:2 | 4.2 | dB |
| Splitter 1:4 | 7.8 | dB |
| Splitter 1:8 | 11.4 | dB |
| Splitter 1:16 | 15.0 | dB |
| Splitter 1:32 | 18.6 | dB |

**Asumsi Tambahan dalam Simulasi:**
* Setiap perangkat pasif (ODC, ODP, Pelanggan) memiliki **2 konektor** (satu di input, satu di output).
* Setiap **3 km** panjang kabel diasumsikan terdapat **1 sambungan (splice)**.
* Batas maksimal redaman yang direkomendasikan untuk desain yang optimal adalah **26 dB**.
* Jarak maksimum kabel feeder + distribusi adalah **8 km**, lebih dari itu disarankan menggunakan Mini OLT

