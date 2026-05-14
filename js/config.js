// Configuração da API — detecta ambiente automaticamente
const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api'
    : '/api';

// CSRF token — obtido da API no arranque com retry
let CSRF_TOKEN = '';

async function fetchCsrfToken(retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(API_BASE + '/csrf-token');
      if (res.ok) {
        const data = await res.json();
        CSRF_TOKEN = data.csrf_token;
        return;
      }
    } catch (e) {
      if (i < retries) {
        await new Promise(r => setTimeout(r, 500 * (i + 1)));
        continue;
      }
    }
  }
  console.warn('Aura NØVA: Não foi possível obter o token CSRF. Algumas operações podem falhar.');
}

fetchCsrfToken();