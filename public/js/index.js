/**
 * @file index.js
 * @description Pengendali DOM dan interaksi pengguna pada halaman katalog produk (index.html).
 * Mengintegrasikan fetch.js untuk menampilkan produk secara dinamis, live search, filter,
 * dan modal detail produk.
 * 
 * Mata Kuliah : Praktikum Pemrograman Aplikasi Web (PPAW) - Week 6
 * Mahasiswa   : Andhika Ryan Stito (20240140263)
 */

document.addEventListener('DOMContentLoaded', () => {
  // ================= State Management =================
  let productList = [];
  let filteredList = [];

  // ================= DOM Elements Selection =================
  const elements = {
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    errorMessage: document.getElementById('errorMessage'),
    retryBtn: document.getElementById('retryBtn'),
    productsGrid: document.getElementById('productsGrid'),
    productCount: document.getElementById('productCount'),
    searchInput: document.getElementById('searchInput'),
    categoryFilter: document.getElementById('categoryFilter'),
    reloadBtn: document.getElementById('reloadBtn'),
    
    // Modal Detail Elements
    detailModal: document.getElementById('detailModal'),
    modalBody: document.getElementById('modalBody'),
    modalCloseBtn: document.getElementById('modalCloseBtn')
  };

  // ================= Initializing App =================
  init();

  function init() {
    setupEventListeners();
    loadProducts();
  }

  // ================= Event Listeners Setup =================
  function setupEventListeners() {
    // Event Search input (live filter realtime)
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', handleFilter);
    }

    // Event Kategori dropdown filter
    if (elements.categoryFilter) {
      elements.categoryFilter.addEventListener('change', handleFilter);
    }

    // Event Tombol Segarkan Data
    if (elements.reloadBtn) {
      elements.reloadBtn.addEventListener('click', () => {
        loadProducts();
      });
    }

    // Event Tombol Coba Lagi (Error Retry)
    if (elements.retryBtn) {
      elements.retryBtn.addEventListener('click', () => {
        loadProducts();
      });
    }

    // Event Modal Close
    if (elements.modalCloseBtn) {
      elements.modalCloseBtn.addEventListener('click', closeModal);
    }

    // Close modal ketika klik di luar konten (backdrop click)
    if (elements.detailModal) {
      elements.detailModal.addEventListener('click', (e) => {
        if (e.target === elements.detailModal) {
          closeModal();
        }
      });
    }

    // Keyboard ESC untuk menutup modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && elements.detailModal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  // ================= Core Logic: Load Products =================
  /**
   * Mengambil data produk dari API dan menangani status UI (loading, error, success)
   */
  async function loadProducts() {
    setUIState('loading');

    // Memanggil fungsi dari fetch.js
    const result = await fetchProductsFromAPI(30);

    if (result.success) {
      productList = result.data;
      filteredList = [...productList];
      
      populateCategories(productList);
      renderProductCards(filteredList);
      updateProductCount(filteredList.length, productList.length);
      
      setUIState('success');
    } else {
      if (elements.errorMessage) {
        elements.errorMessage.textContent = result.error || 'Gagal memuat produk. Periksa koneksi internet Anda.';
      }
      setUIState('error');
    }
  }

  // ================= DOM Manipulation: Render Products =================
  /**
   * Merender daftar produk ke dalam grid HTML menggunakan elemen DOM
   * @param {Array<Object>} products - Daftar produk yang akan dirender
   */
  function renderProductCards(products) {
    if (!elements.productsGrid) return;
    elements.productsGrid.innerHTML = '';

    if (products.length === 0) {
      elements.productsGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3 class="state-title">Produk Tidak Ditemukan</h3>
          <p class="state-desc">Tidak ada produk yang cocok dengan kata kunci atau filter yang Anda pilih.</p>
        </div>
      `;
      return;
    }

    // Pembuatan elemen DOM untuk setiap kartu produk
    products.forEach((product) => {
      const card = createProductCardElement(product);
      elements.productsGrid.appendChild(card);
    });
  }

  /**
   * Membuat satu elemen kartu produk secara terstruktur
   * @param {Object} product 
   * @returns {HTMLElement} Elemen kartu produk
   */
  function createProductCardElement(product) {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.setAttribute('data-id', product.id);

    // Format harga mata uang Dollar
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(product.price);

    // Gambar thumbnail aman dengan fallback
    const imageSrc = product.thumbnail || (product.images && product.images[0]) || 'https://via.placeholder.com/300x200?text=No+Image';

    card.innerHTML = `
      <div class="card-image-wrap">
        <img src="${imageSrc}" alt="${escapeHTML(product.title)}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image';">
        <span class="category-badge">${escapeHTML(product.category)}</span>
        ${product.discountPercentage ? `<span class="discount-badge">-${Math.round(product.discountPercentage)}%</span>` : ''}
      </div>
      <div class="card-body">
        <h3 class="product-title" title="${escapeHTML(product.title)}">${escapeHTML(product.title)}</h3>
        <p class="product-desc">${escapeHTML(product.description || '')}</p>
        
        <div class="product-meta">
          <span class="rating">⭐ ${product.rating ? product.rating.toFixed(1) : 'N/A'}</span>
          <span class="stock-status ${product.stock > 0 ? 'in-stock' : ''}">
            ${product.stock > 0 ? `Stok: ${product.stock}` : 'Habis'}
          </span>
        </div>

        <div class="card-footer">
          <div class="price-wrap">
            <span class="price-label">Harga</span>
            <span class="product-price">${formattedPrice}</span>
          </div>
          <div style="display: flex; gap: 0.4rem; align-items: center;">
            <button type="button" class="btn-detail" data-id="${product.id}">
              Detail
            </button>
            <a href="form.html?nama=${encodeURIComponent(product.title)}&harga=${product.price}&diskon=${product.discountPercentage || 0}" class="btn-caption" title="Buat Caption Promosi">
              📝 Caption
            </a>
          </div>
        </div>
      </div>
    `;

    // Event listener pada tombol "Detail" kartu ini
    const detailBtn = card.querySelector('.btn-detail');
    if (detailBtn) {
      detailBtn.addEventListener('click', () => {
        openModalWithProduct(product);
      });
    }

    return card;
  }

  // ================= DOM: Filter & Search Handling =================
  /**
   * Menangani pencarian dan penyaringan kategori secara realtime
   */
  function handleFilter() {
    const searchTerm = (elements.searchInput ? elements.searchInput.value : '').toLowerCase().trim();
    const selectedCategory = elements.categoryFilter ? elements.categoryFilter.value : 'all';

    filteredList = productList.filter((product) => {
      const matchSearch = product.title.toLowerCase().includes(searchTerm) ||
                          (product.description && product.description.toLowerCase().includes(searchTerm)) ||
                          (product.brand && product.brand.toLowerCase().includes(searchTerm));
      
      const matchCategory = selectedCategory === 'all' || product.category === selectedCategory;

      return matchSearch && matchCategory;
    });

    renderProductCards(filteredList);
    updateProductCount(filteredList.length, productList.length);
  }

  /**
   * Mengisi dropdown kategori secara dinamis berdasarkan data produk yang ada
   * @param {Array<Object>} products 
   */
  function populateCategories(products) {
    if (!elements.categoryFilter) return;

    // Ambil list unik kategori
    const categories = Array.from(new Set(products.map(p => p.category))).sort();

    // Reset pilihan tapi pertahankan "Semua Kategori"
    elements.categoryFilter.innerHTML = '<option value="all">Semua Kategori</option>';

    categories.forEach((cat) => {
      const option = document.createElement('option');
      option.value = cat;
      // Format huruf kapital awal
      option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      elements.categoryFilter.appendChild(option);
    });
  }

  function updateProductCount(visibleCount, totalCount) {
    if (elements.productCount) {
      elements.productCount.textContent = `Menampilkan ${visibleCount} dari ${totalCount} produk`;
    }
  }

  // ================= UI State Switching =================
  /**
   * Mengatur tampilan UI berdasarkan status: 'loading', 'error', atau 'success'
   * @param {'loading'|'error'|'success'} state 
   */
  function setUIState(state) {
    if (!elements.loadingState || !elements.errorState || !elements.productsGrid) return;

    if (state === 'loading') {
      elements.loadingState.classList.remove('hidden');
      elements.errorState.classList.add('hidden');
      elements.productsGrid.classList.add('hidden');
    } else if (state === 'error') {
      elements.loadingState.classList.add('hidden');
      elements.errorState.classList.remove('hidden');
      elements.productsGrid.classList.add('hidden');
    } else if (state === 'success') {
      elements.loadingState.classList.add('hidden');
      elements.errorState.classList.add('hidden');
      elements.productsGrid.classList.remove('hidden');
    }
  }

  // ================= Modal Detail Interaksi =================
  function openModalWithProduct(product) {
    if (!elements.detailModal || !elements.modalBody) return;

    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(product.price);

    const imageSrc = product.thumbnail || (product.images && product.images[0]) || 'https://via.placeholder.com/300x200?text=No+Image';

    elements.modalBody.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <img src="${imageSrc}" alt="${escapeHTML(product.title)}" style="max-height: 220px; object-fit: contain; border-radius: 8px;">
      </div>
      <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap;">
        <span class="category-badge" style="position: static;">${escapeHTML(product.category)}</span>
        <span style="background: #f1f5f9; color: #475569; font-size: 0.8rem; padding: 0.2rem 0.6rem; border-radius: 9999px; font-weight: 600;">
          Brand: ${escapeHTML(product.brand || 'Generic')}
        </span>
        <span style="background: #fef3c7; color: #92400e; font-size: 0.8rem; padding: 0.2rem 0.6rem; border-radius: 9999px; font-weight: 600;">
          ⭐ ${product.rating} / 5
        </span>
      </div>
      <h2 style="font-size: 1.4rem; color: #0f172a; margin-bottom: 0.5rem;">${escapeHTML(product.title)}</h2>
      <p style="font-size: 0.95rem; color: #64748b; line-height: 1.6; margin-bottom: 1.25rem;">${escapeHTML(product.description || '-')}</p>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.9rem;">
        <div><strong>Harga:</strong> <span style="color: #2563eb; font-weight: 800; font-size: 1.1rem;">${formattedPrice}</span></div>
        <div><strong>Diskon:</strong> ${product.discountPercentage}%</div>
        <div><strong>Sisa Stok:</strong> ${product.stock} unit</div>
        <div><strong>Garansi:</strong> ${escapeHTML(product.warrantyInformation || 'Tidak ada')}</div>
        <div><strong>Pengiriman:</strong> ${escapeHTML(product.shippingInformation || 'Standar')}</div>
        <div><strong>Status:</strong> ${escapeHTML(product.availabilityStatus || 'Tersedia')}</div>
      </div>
      <div style="text-align: right;">
        <a href="form.html?nama=${encodeURIComponent(product.title)}&harga=${product.price}&diskon=${product.discountPercentage || 0}" class="btn-caption" style="padding: 0.65rem 1.25rem; font-size: 0.95rem;">
          ✨ Buat Caption untuk Produk Ini
        </a>
      </div>
    `;

    elements.detailModal.classList.add('active');
  }

  function closeModal() {
    if (elements.detailModal) {
      elements.detailModal.classList.remove('active');
    }
  }

  // Helper untuk pencegahan XSS sederhana
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
