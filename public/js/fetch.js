/**
 * @file fetch.js
 * @description Modul untuk mengambil data produk dari endpoint DummyJSON API.
 * Memenuhi spesifikasi Tugas 1: Fetch API, async/await, response processing,
 * serta penanganan loading dan error.
 * 
 * Mata Kuliah : Praktikum Pemrograman Aplikasi Web (PPAW) - Week 6
 * Mahasiswa   : Andhika Ryan Stito (20240140263)
 */

const API_ENDPOINT = 'https://dummyjson.com/products';

/**
 * Mengambil daftar produk dari DummyJSON API.
 * @async
 * @function fetchProductsFromAPI
 * @param {number} [limit=30] - Batas jumlah produk yang diambil.
 * @returns {Promise<{success: boolean, data?: Array<Object>, error?: string}>}
 */
async function fetchProductsFromAPI(limit = 30) {
  try {
    const url = `${API_ENDPOINT}?limit=${limit}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    // Validasi status HTTP response
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }

    // Mengurai respons format JSON
    const result = await response.json();

    if (!result || !Array.isArray(result.products)) {
      throw new Error('Format data produk yang diterima tidak sesuai ekspektasi.');
    }

    return {
      success: true,
      data: result.products,
      total: result.total || result.products.length
    };
  } catch (error) {
    console.error('Fetch Error:', error);
    return {
      success: false,
      error: error.message || 'Terjadi kesalahan saat memuat data dari server.'
    };
  }
}

/**
 * Mengambil detail produk tunggal berdasarkan ID.
 * @async
 * @function fetchProductById
 * @param {number|string} productId - ID produk yang akan dicari.
 * @returns {Promise<{success: boolean, product?: Object, error?: string}>}
 */
async function fetchProductById(productId) {
  try {
    const response = await fetch(`${API_ENDPOINT}/${productId}`);
    if (!response.ok) {
      throw new Error(`Produk dengan ID ${productId} tidak ditemukan.`);
    }
    const product = await response.json();
    return {
      success: true,
      product: product
    };
  } catch (error) {
    console.error(`Gagal memuat produk ID ${productId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}
