/* ============================================================
   CelebrateHub - Navigation / Router (API Connected)
   ============================================================ */

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(id);
  if (page) { page.classList.add('active'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
}

async function userTab(tab) {
  document.querySelectorAll('#page-user .tab-pane').forEach(t => t.classList.remove('active'));
  const pane = document.getElementById('utab-' + tab);
  if (pane) pane.classList.add('active');
  document.querySelectorAll('.dash-nav-right a').forEach(a => a.classList.remove('nav-active'));
  switch(tab) {
    case 'home':     await renderUserServices(); break;
    case 'bookings': await renderUserBookings(); break;
    case 'wishlist': await renderUserWishlist(); break;
    case 'profile':  await renderUserProfile();  break;
  }
}

async function vendorTab(tab) {
  document.querySelectorAll('#page-vendor .tab-pane').forEach(t => t.classList.remove('active'));
  const pane = document.getElementById('vtab-' + tab);
  if (pane) pane.classList.add('active');
  document.querySelectorAll('.vendor-nav-links a').forEach(a => a.classList.remove('active'));
  const link = document.querySelector(`.vendor-nav-links a[data-tab="${tab}"]`);
  if (link) link.classList.add('active');
  switch(tab) {
    case 'overview':    await renderVendorOverview();    break;
    case 'myservices':  await renderVendorMyServices();  break;
    case 'add':         clearAddServiceForm();           break;
    case 'requests':    await renderVendorRequests();    break;
  }
}

function goToRegister() { showPage('page-register'); }
function goToLogin()    { showPage('page-login'); }
function goToHome()     { showPage('page-home'); }

function logout() {
  clearToken();
  state.currentUser = null;
  state.currentRole = null;
  state.services    = [];
  state.bookings    = [];
  state.wishlist    = [];
  const le = document.getElementById('login-email');
  const lo = document.getElementById('login-otp');
  if (le) le.value = '';
  if (lo) lo.value = '';
  showPage('page-login');
}

// ---- Auto-restore session on page load ----
window.addEventListener('DOMContentLoaded', async () => {
  const hasSession = loadSession();
  if (hasSession && state.currentRole) {
    // Refresh wishlist
    const wRes = await apiFetch('/users/wishlist');
    if (wRes.ok) state.wishlist = (wRes.data.data || []).map(s => String(s._id));

    if (state.currentRole === 'user') {
      const greet = document.getElementById('user-greeting');
      if (greet) greet.textContent = state.currentUser?.username || 'there';
      await renderUserServices();
      showPage('page-user');
    } else {
      await renderVendorOverview();
      showPage('page-vendor');
    }
  }
});
