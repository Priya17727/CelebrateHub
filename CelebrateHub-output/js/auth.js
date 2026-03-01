/* ============================================================
   CelebrateHub - Auth Logic (API Connected)
   ============================================================ */

// ---- Register ----
async function sendOTP() {
  const mobile = document.getElementById('reg-mobile').value.trim();
  const hint   = document.getElementById('otp-hint');
  if (!mobile) { showAlert('register-alert', 'Please enter your mobile number first.', 'error'); return; }

  hint.innerHTML = '⏳ Sending OTP...';
  const res = await apiFetch('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile })
  });
  hint.innerHTML = res.ok
    ? '✅ OTP sent! For demo, use <strong>123456</strong>'
    : `❌ ${res.data.message}`;
}

async function doRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const mobile   = document.getElementById('reg-mobile').value.trim();
  const otp      = document.getElementById('reg-otp').value.trim();

  if (!username || !email || !mobile || !otp) {
    showAlert('register-alert', 'Please fill in all fields.', 'error'); return;
  }
  if (!isValidEmail(email)) {
    showAlert('register-alert', 'Please enter a valid email address.', 'error'); return;
  }

  showAlert('register-alert', '⏳ Creating account...', 'info');

  const res = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, mobile, otp })
  });

  if (!res.ok) {
    showAlert('register-alert', res.data.message || 'Registration failed.', 'error'); return;
  }

  showAlert('register-alert', '🎉 Account created! Redirecting to login...', 'success');
  ['reg-username','reg-email','reg-mobile','reg-otp'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const hint = document.getElementById('otp-hint');
  if (hint) hint.innerHTML = '';

  setTimeout(() => { clearAlert('register-alert'); showPage('page-login'); }, 1800);
}

// ---- Login ----
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const otp   = document.getElementById('login-otp').value.trim();

  if (!email || !otp) {
    showAlert('login-alert', 'Please enter your email and OTP.', 'error'); return;
  }
  if (!isValidEmail(email)) {
    showAlert('login-alert', 'Please enter a valid email address.', 'error'); return;
  }

  showAlert('login-alert', '⏳ Logging in...', 'info');

  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, otp })
  });

  if (!res.ok) {
    showAlert('login-alert', res.data.message || 'Login failed.', 'error'); return;
  }

  const { token, data: user } = res.data;
  setToken(token);
  state.currentUser = user;

  // Load wishlist from server
  const wRes = await apiFetch('/users/wishlist');
  if (wRes.ok) {
    state.wishlist = (wRes.data.data || []).map(s => String(s._id));
  }

  clearAlert('login-alert');
  showPage('page-role');
}

// ---- Role Selection ----
async function selectRole(role) {
  showAlert('role-alert', '⏳ Setting role...', 'info');

  const res = await apiFetch('/auth/select-role', {
    method: 'PUT',
    body: JSON.stringify({ role })
  });

  if (!res.ok) {
    // Role endpoint needs auth — if 403, just proceed with local role
  }

  state.currentRole = role;
  saveSession(state.currentUser, role);

  clearAlert('role-alert');

  if (role === 'user') {
    const greet = document.getElementById('user-greeting');
    if (greet) greet.textContent = state.currentUser?.username || 'there';
    await renderUserServices();
    showPage('page-user');
  } else {
    await renderVendorOverview();
    showPage('page-vendor');
  }
}

// ---- Helpers ----
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showAlert(containerId, message, type) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

function clearAlert(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = '';
}
