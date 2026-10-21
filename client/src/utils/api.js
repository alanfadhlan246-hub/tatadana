// ====================================================================
// TataDana Client API Client
// ====================================================================

const API_BASE = '/api';

// Tab-Isolated Session Storage (Mencegah konflik akun antara Tab Admin & Tab User)
export function getAuthToken() {
  return sessionStorage.getItem('tatadana_token');
}

export function setAuthToken(token) {
  if (token) {
    sessionStorage.setItem('tatadana_token', token);
  } else {
    sessionStorage.removeItem('tatadana_token');
    // Also clean any legacy localStorage token
    localStorage.removeItem('tatadana_token');
  }
}

export function getCurrentUser() {
  const raw = sessionStorage.getItem('tatadana_user');
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    sessionStorage.setItem('tatadana_user', JSON.stringify(user));
  } else {
    sessionStorage.removeItem('tatadana_user');
    // Also clean any legacy localStorage user
    localStorage.removeItem('tatadana_user');
  }
}

export async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    cache: 'no-store',
    ...options,
    headers
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }));

    if (res.status === 401) {
      // Session expired
      setAuthToken(null);
      setCurrentUser(null);
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }

    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    return {
      ok: false,
      status: 0,
      data: { success: false, message: 'Tidak dapat terhubung ke server TataDana. Pastikan server lokal berjalan.' }
    };
  }
}
