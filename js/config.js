// Configuração da API — detecta ambiente automaticamente
const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api'
    : '/api';

// Chaves públicas (não contêm segredos)
const STRIPE_PK = window.location.hostname === 'localhost'
    ? 'pk_test_...'
    : 'pk_live_...';

// CSRF token — obtido da API no arranque
let CSRF_TOKEN = '';

async function fetchCsrfToken() {
  try {
    const res = await fetch(API_BASE + '/csrf-token');
    if (res.ok) {
      const data = await res.json();
      CSRF_TOKEN = data.csrf_token;
    }
  } catch (e) {
    // CSRF token será obtido no login admin
  }
}

fetchCsrfToken();