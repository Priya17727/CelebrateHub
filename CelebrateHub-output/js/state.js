/* ============================================================
   CelebrateHub - Core State & API Config
   ============================================================ */

var API_BASE = 'http://localhost:5000/api';

var SERVICE_ICONS = {
  'Catering':'🍽️','Photography':'📸','Decoration':'🎨',
  'Birthday Party':'🎂','Venue':'🏛️','Makeup':'💄',
  'Music & DJ':'🎵','Entertainment':'🎪','Transport':'🚗'
};
var PHOTO_BG = {
  'Catering':'#FFF3E0','Photography':'#E3F2FD','Decoration':'#FCE4EC',
  'Birthday Party':'#F3E5F5','Venue':'#E8F5E9','Makeup':'#FFF8E1',
  'Music & DJ':'#E0F7FA','Entertainment':'#EFEBE9','Transport':'#EDE7F6'
};

// ---- State ----
let state = {
  currentUser: null,
  currentRole: null,
  token: null,
  services: [],
  bookings: [],
  wishlist: []
};

function getToken() {
  return state.token || localStorage.getItem('ch_token');
}
function setToken(token) {
  state.token = token;
  localStorage.setItem('ch_token', token);
}
function clearToken() {
  state.token = null;
  localStorage.removeItem('ch_token');
  localStorage.removeItem('ch_user');
  localStorage.removeItem('ch_role');
}
function saveSession(user, role) {
  state.currentUser = user;
  state.currentRole = role;
  localStorage.setItem('ch_user', JSON.stringify(user));
  localStorage.setItem('ch_role', role);
}
function loadSession() {
  const token = localStorage.getItem('ch_token');
  const user  = localStorage.getItem('ch_user');
  const role  = localStorage.getItem('ch_role');
  if (token && user) {
    state.token       = token;
    state.currentUser = JSON.parse(user);
    state.currentRole = role;
    return true;
  }
  return false;
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res  = await fetch(`${API_BASE}${endpoint}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { message: 'Cannot connect to server. Make sure backend is running on port 5000.' } };
  }
}

function isWishlisted(serviceId) {
  return state.wishlist.includes(String(serviceId));
}

function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

loadSession();
