/**
 * @file form.js
 * @description Logika DOM dan Event Handling untuk Generator Caption Sosial Media.
 * Memenuhi spesifikasi Tugas 2:
 * 1. Form HTML interaktif dengan input nama produk, harga, dan template radio button.
 * 2. Manipulasi DOM untuk mengambil nilai input dan merangkai caption promosi dinamis.
 * 3. Penerapan event listener (submit, click, input, reset).
 * 4. Validasi input (nama minimal 3 karakter, harga > 0).
 * 5. Tampilan feedback dinamis (hasil caption, clipboard copy, alert sukses/gagal).
 * 
 * Mata Kuliah : Praktikum Pemrograman Aplikasi Web (PPAW) - Week 6
 * Mahasiswa   : Andhika Ryan Stito (20240140263)
 */

document.addEventListener('DOMContentLoaded', () => {
  // ================= State =================
  let currentCaption = '';
  const captionHistory = [];

  // ================= DOM Elements =================
  const form = document.getElementById('captionForm');
  const btnReset = document.getElementById('btnResetForm');
  const previewArea = document.getElementById('captionPreviewArea');
  const btnCopy = document.getElementById('btnSalinCaption');
  const btnWhatsApp = document.getElementById('btnKirimWhatsApp');
  
  // Feedback Banner
  const feedbackBanner = document.getElementById('feedbackBanner');
  const bannerMessage = document.getElementById('bannerMessage');
  const bannerCloseBtn = document.getElementById('bannerCloseBtn');

  // Input Fields
  const inputs = {
    nama: document.getElementById('namaProduk'),
    harga: document.getElementById('hargaProduk'),
    diskon: document.getElementById('diskonProduk'),
    keunggulan: document.getElementById('keunggulanProduk')
  };

  // Error Messages
  const errors = {
    nama: document.getElementById('namaError'),
    harga: document.getElementById('hargaError')
  };

  // History Elements
  const historyContainer = document.getElementById('historyContainer');
  const historyBadge = document.getElementById('historyBadge');

  // ================= Inisialisasi =================
  init();

  function init() {
    setupEventListeners();
    checkURLParameters();
  }

  // ================= Event Listeners Setup =================
  function setupEventListeners() {
    // 1. Event 'submit' pada Form
    if (form) {
      form.addEventListener('submit', handleFormSubmit);
    }

    // 2. Event 'input' untuk validasi realtime saat mengetik
    if (inputs.nama) {
      inputs.nama.addEventListener('input', () => {
        validateNama();
      });
    }

    if (inputs.harga) {
      inputs.harga.addEventListener('input', () => {
        validateHarga();
      });
    }

    // 3. Event 'click' untuk Salin Caption ke Clipboard
    if (btnCopy) {
      btnCopy.addEventListener('click', handleCopyCaption);
    }

    // 4. Event 'click' untuk Reset Form
    if (btnReset) {
      btnReset.addEventListener('click', handleReset);
    }

    // 5. Event 'click' untuk Tutup Banner Notifikasi
    if (bannerCloseBtn) {
      bannerCloseBtn.addEventListener('click', hideBanner);
    }

    // 6. Event Delegation pada Riwayat Caption
    if (historyContainer) {
      historyContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.history-item-btn');
        if (btn) {
          const index = btn.getAttribute('data-index');
          if (captionHistory[index]) {
            setGeneratedCaption(captionHistory[index].caption, captionHistory[index].nama);
            showBanner(`Caption untuk "${captionHistory[index].nama}" dimuat kembali ke penampil!`, 'success');
          }
        }
      });
    }
  }

  // ================= Cek Parameter URL (Integrasi dari Katalog) =================
  /**
   * Jika user membuka form.html dari tombol "Buat Caption" di katalog produk,
   * ambil query string dan isi form secara otomatis.
   */
  function checkURLParameters() {
    const params = new URLSearchParams(window.location.search);
    const namaParam = params.get('nama');
    const hargaParam = params.get('harga');
    const diskonParam = params.get('diskon');

    if (namaParam) {
      inputs.nama.value = decodeURIComponent(namaParam);
    }
    if (hargaParam) {
      inputs.harga.value = hargaParam;
    }
    if (diskonParam) {
      inputs.diskon.value = Math.round(parseFloat(diskonParam));
    }

    // Jika parameter lengkap, langsung buatkan caption awal
    if (namaParam && hargaParam) {
      generateCaption();
      showBanner(`Data produk "${namaParam}" berhasil dimuat dari katalog!`, 'success');
    }
  }

  // ================= Validasi Input (DOM Manipulation) =================
  function validateNama() {
    const val = inputs.nama.value.trim();
    if (!val || val.length < 3) {
      inputs.nama.classList.add('is-invalid');
      errors.nama.classList.add('show');
      return false;
    } else {
      inputs.nama.classList.remove('is-invalid');
      errors.nama.classList.remove('show');
      return true;
    }
  }

  function validateHarga() {
    const val = parseFloat(inputs.harga.value);
    if (isNaN(val) || val <= 0) {
      inputs.harga.classList.add('is-invalid');
      errors.harga.classList.add('show');
      return false;
    } else {
      inputs.harga.classList.remove('is-invalid');
      errors.harga.classList.remove('show');
      return true;
    }
  }

  // ================= Handler Submit Form =================
  function handleFormSubmit(e) {
    e.preventDefault(); // Mencegah reload halaman secara default

    const isNamaValid = validateNama();
    const isHargaValid = validateHarga();

    if (!isNamaValid || !isHargaValid) {
      showBanner('Mohon lengkapi nama dan harga produk dengan benar.', 'error');
      if (!isNamaValid) inputs.nama.focus();
      else inputs.harga.focus();
      return;
    }

    generateCaption();
  }

  // ================= Logika Generator Caption (DOM Manipulation) =================
  function generateCaption() {
    const nama = inputs.nama.value.trim();
    const hargaRaw = parseFloat(inputs.harga.value);
    const diskon = inputs.diskon ? parseFloat(inputs.diskon.value) : 0;
    const keunggulan = inputs.keunggulan ? inputs.keunggulan.value.trim() : '';

    // Ambil radio button template yang sedang terpilih
    const selectedTemplate = document.querySelector('input[name="gayaTemplate"]:checked')?.value || 'promo';

    // Format harga: jika nilai < 200 anggap USD, jika >= 200 anggap Rupiah
    let formattedPrice = '';
    if (hargaRaw >= 200) {
      formattedPrice = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
      }).format(hargaRaw);
    } else {
      formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(hargaRaw);
    }

    // Buat slug hashtag dari nama produk
    const tagProduk = '#' + nama.replace(/[^a-zA-Z0-9]/g, '');

    let captionText = '';

    // Template 1: Promo Heboh
    if (selectedTemplate === 'promo') {
      const diskonText = diskon > 0 ? ` (Sudah hemat diskon ${diskon}% lho!)` : '';
      const keunggulanText = keunggulan ? `\nKeunggulan spesial: ${keunggulan}.` : '';

      captionText = 
`🎉 DISKON SPESIAL HARI INI! 🎉

Siapa nih yang udah nungguin promo? 
Dapatkan ${nama} yang super premium ini cuma dengan ${formattedPrice} aja!${diskonText}${keunggulanText}

Stok terbatas banget, jangan sampai nyesel kehabisan.
Buruan klik link di bio atau kirim pesan untuk order sekarang juga! 👇

${tagProduk} #PromoSpesial #DiskonHariIni #KatalogOnline #BelanjaHemat`;
    }
    // Template 2: Santai & Kasual
    else if (selectedTemplate === 'santai') {
      const keunggulanText = keunggulan ? `\nPlus ${keunggulan.toLowerCase()}, makin mantap deh!` : '';

      captionText = 
`☕ Hai Sobat! Lagi nyari ${nama}?

Pas banget nih! Sekarang kamu udah bisa bawa pulang produk kece ini dengan harga terjangkau banget, cuma ${formattedPrice} aja.${keunggulanText}

Yuk amankan punyamu sebelum kehabisan! DM atau chat kami langsung ya ✨

${tagProduk} #RekomendasiProduk #BarangBagus #OutfitHarian #BelanjaOnline`;
    }
    // Template 3: Formal & Elegan
    else {
      const keunggulanText = keunggulan ? `\nSpesifikasi utama: ${keunggulan}.` : '';

      captionText = 
`👔 Pilihan Tepat untuk Kualitas Terbaik: ${nama}

Kami menghadirkan ${nama} dengan standar mutu terjamin. Dapatkan penawaran resmi terbaik kami hari ini seharga ${formattedPrice}.${keunggulanText}

Untuk pemesanan resmi dan konsultasi lebih lanjut, silakan hubungi layanan pelanggan kami melalui tautan yang tersedia.

${tagProduk} #OfficialStore #KualitasPremium #ProdukTerpercaya #PilihanCerdas`;
    }

    // Render ke DOM
    setGeneratedCaption(captionText, nama);

    // Simpan ke Riwayat
    addToHistory(nama, selectedTemplate, captionText);

    // Tampilkan Umpan Balik Sukses
    showBanner(`Caption untuk "${nama}" berhasil dibuat!`, 'success');
  }

  /**
   * Menampilkan hasil teks caption ke elemen preview di DOM
   */
  function setGeneratedCaption(captionText, namaProduk) {
    currentCaption = captionText;

    if (previewArea) {
      previewArea.classList.remove('placeholder');
      previewArea.textContent = captionText;
    }

    // Perbarui link WhatsApp
    if (btnWhatsApp) {
      const encoded = encodeURIComponent(captionText);
      btnWhatsApp.href = `https://api.whatsapp.com/send?text=${encoded}`;
    }
  }

  // ================= Salin Caption ke Clipboard =================
  async function handleCopyCaption() {
    if (!currentCaption) {
      showBanner('Belum ada caption untuk disalin. Silakan buat caption terlebih dahulu.', 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(currentCaption);

      // Ubah teks tombol secara dinamis sebagai feedback DOM
      const originalText = btnCopy.innerHTML;
      btnCopy.classList.add('copied');
      btnCopy.innerHTML = '<span>✅</span> Tersalin ke Clipboard!';

      setTimeout(() => {
        btnCopy.classList.remove('copied');
        btnCopy.innerHTML = originalText;
      }, 2000);

      showBanner('Caption berhasil disalin! Siap dipaste ke Instagram atau WhatsApp.', 'success');
    } catch (err) {
      console.error('Gagal menyalin:', err);
      showBanner('Gagal menyalin otomatis. Anda dapat memblok teks lalu tekan Ctrl+C.', 'error');
    }
  }

  // ================= Riwayat Caption (DOM Output) =================
  function addToHistory(nama, gaya, caption) {
    captionHistory.unshift({ nama, gaya, caption, waktu: new Date() });

    renderHistory();
  }

  function renderHistory() {
    if (!historyContainer) return;

    if (historyBadge) {
      historyBadge.textContent = `${captionHistory.length} Caption`;
    }

    if (captionHistory.length === 0) {
      historyContainer.innerHTML = `
        <div class="empty-history">
          Belum ada riwayat caption. Buat caption pertamamu sekarang!
        </div>
      `;
      return;
    }

    historyContainer.innerHTML = '';

    captionHistory.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'history-item';

      div.innerHTML = `
        <div class="history-item-info">
          <h5>${escapeHTML(item.nama)}</h5>
          <span>Gaya: ${item.gaya.toUpperCase()}</span>
        </div>
        <button type="button" class="history-item-btn" data-index="${index}">
          Pakai Lagi
        </button>
      `;

      historyContainer.appendChild(div);
    });
  }

  // ================= Reset Form =================
  function handleReset() {
    form.reset();
    inputs.nama.classList.remove('is-invalid');
    inputs.harga.classList.remove('is-invalid');
    errors.nama.classList.remove('show');
    errors.harga.classList.remove('show');

    previewArea.classList.add('placeholder');
    previewArea.textContent = 'Tekan tombol "Buat Caption" untuk menghasilkan teks promosi otomatis di sini.';
    currentCaption = '';

    if (btnWhatsApp) {
      btnWhatsApp.href = '#';
    }
  }

  // ================= Banner Feedback =================
  function showBanner(message, type = 'success') {
    if (!feedbackBanner || !bannerMessage) return;

    bannerMessage.textContent = message;
    feedbackBanner.className = `feedback-banner ${type}`;
    feedbackBanner.classList.remove('hidden');

    if (type === 'success') {
      setTimeout(() => {
        hideBanner();
      }, 4000);
    }
  }

  function hideBanner() {
    if (feedbackBanner) {
      feedbackBanner.classList.add('hidden');
    }
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
