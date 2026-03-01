/* ============================================================
   CelebrateHub - Modals Logic (API Connected)
   ============================================================ */

let _currentBookServiceId = null;
let _currentPayBookingId  = null;
let _currentRatingBookingId = null;
let _currentRatingValue     = 0;

// ---- Modal helpers ----
function openModal(id)  {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('hidden'); el.style.display = 'flex'; }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('hidden'); el.style.display = 'none'; }
}

// ---- Alert helpers (self-contained so no auth.js dependency) ----
function showAlert(id, msg, type) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="alert alert-${type}" style="margin-bottom:12px;">${msg}</div>`;
}
function clearAlert(id) {
  const el = document.getElementById(id); if (el) el.innerHTML = '';
}

// Close modal when clicking backdrop
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
    e.target.style.display = 'none';
  }
});

// ============================================================
// BOOK MODAL
// ============================================================
function openBookModal(serviceId) {
  _currentBookServiceId = serviceId;

  // Find service from state
  const s = state.services.find(x => String(x._id || x.id) === String(serviceId));
  if (!s) {
    showToast('⚠️ Service not found. Please refresh the page.');
    return;
  }

  // Populate service info
  const infoEl = document.getElementById('book-service-info');
  if (infoEl) {
    infoEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="font-size:2.5rem;">${SERVICE_ICONS[s.category] || '🎉'}</div>
        <div>
          <strong style="font-size:1.05rem;">${s.name}</strong><br>
          <span style="color:var(--muted);font-size:0.88rem;">${s.category} · 📍 ${s.location}</span><br>
          <span style="color:var(--gold);font-weight:800;font-size:1.05rem;">₹${Number(s.price).toLocaleString()}</span>
        </div>
      </div>`;
  }

  // Set min date to today
  const dateInput = document.getElementById('book-date');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

  // Clear form fields
  ['book-date', 'book-guests', 'book-notes'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });

  clearAlert('book-alert');
  openModal('book-modal');
}

async function confirmBooking() {
  const date   = document.getElementById('book-date')?.value;
  const guests = document.getElementById('book-guests')?.value;
  const notes  = document.getElementById('book-notes')?.value || '';

  if (!date) {
    showAlert('book-alert', '⚠️ Please select an event date.', 'error'); return;
  }
  if (!guests || Number(guests) < 1) {
    showAlert('book-alert', '⚠️ Please enter number of guests.', 'error'); return;
  }

  showAlert('book-alert', '⏳ Confirming your booking...', 'info');

  const res = await apiFetch('/bookings', {
    method: 'POST',
    body: JSON.stringify({
      serviceId: _currentBookServiceId,
      eventDate: date,
      guests:    Number(guests),
      notes
    })
  });

  if (!res.ok) {
    showAlert('book-alert', '❌ ' + (res.data.message || 'Booking failed.'), 'error');
    return;
  }

  closeModal('book-modal');
  showToast('✅ Booking confirmed! Waiting for vendor approval.');
}

// ============================================================
// PAYMENT MODAL
// ============================================================
function openPaymentModal(bookingId) {
  _currentPayBookingId = bookingId;
  const b = state.bookings.find(x => String(x._id || x.id) === String(bookingId));
  if (!b) { showToast('⚠️ Booking not found.'); return; }

  const svc = b.serviceId || {};
  const infoEl = document.getElementById('pay-booking-info');
  if (infoEl) {
    infoEl.innerHTML = `
      <div>
        <strong>${svc.name || 'Service'}</strong><br>
        <span style="color:var(--muted);font-size:0.88rem;">
          📅 ${new Date(b.eventDate).toLocaleDateString()} · ${svc.category || ''}
        </span><br>
        <span style="color:var(--gold);font-weight:800;font-size:1.2rem;">
          Total: ₹${Number(svc.price || 0).toLocaleString()}
        </span>
      </div>`;
  }

  ['pay-card', 'pay-expiry', 'pay-cvv', 'pay-name'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  clearAlert('pay-alert');
  openModal('payment-modal');
}

async function completePayment() {
  const card   = document.getElementById('pay-card')?.value.trim();
  const expiry = document.getElementById('pay-expiry')?.value.trim();
  const cvv    = document.getElementById('pay-cvv')?.value.trim();
  const name   = document.getElementById('pay-name')?.value.trim();

  if (!card || !expiry || !cvv || !name) {
    showAlert('pay-alert', '⚠️ Please fill in all payment details.', 'error'); return;
  }

  showAlert('pay-alert', '⏳ Processing payment...', 'info');

  const res = await apiFetch(`/bookings/${_currentPayBookingId}/pay`, {
    method: 'PUT',
    body: JSON.stringify({ method: 'Card', transactionId: `TXN${Date.now()}` })
  });

  if (!res.ok) {
    showAlert('pay-alert', '❌ ' + (res.data.message || 'Payment failed.'), 'error'); return;
  }

  closeModal('payment-modal');
  showToast('💳 Payment successful! Thank you.');
  renderUserBookings();
}

// ============================================================
// RATING MODAL
// ============================================================
function openRatingModal(bookingId) {
  _currentRatingBookingId = bookingId;
  _currentRatingValue     = 0;

  const b = state.bookings.find(x => String(x._id || x.id) === String(bookingId));
  if (!b) { showToast('⚠️ Booking not found.'); return; }

  const svc = b.serviceId || {};
  const nameEl = document.getElementById('rate-service-name');
  if (nameEl) nameEl.textContent = svc.name || 'Service';

  resetStars(); const _rv = document.getElementById("rate-review"); if(_rv) _rv.value = "";
  clearAlert('rate-alert');
  openModal('rating-modal');
}

function resetStars() {
  document.querySelectorAll('#rating-modal .star').forEach(s => s.classList.remove('active'));
  _currentRatingValue = 0;
}
function hoverStar(val) {
  document.querySelectorAll('#rating-modal .star').forEach((s, i) =>
    s.classList.toggle('active', i < val));
}
function clickStar(val) {
  _currentRatingValue = val;
  document.querySelectorAll('#rating-modal .star').forEach((s, i) =>
    s.classList.toggle('active', i < val));
}

async function submitRating() {
  if (_currentRatingValue === 0) {
    showAlert('rate-alert', '⚠️ Please click a star to rate.', 'error'); return;
  }

  showAlert('rate-alert', '⏳ Submitting rating...', 'info');

  const res = await apiFetch(`/bookings/${_currentRatingBookingId}/rate`, {
    method: 'PUT',
    body: JSON.stringify({ stars: _currentRatingValue, review: (document.getElementById("rate-review") || {}).value || undefined })
  });

  if (!res.ok) {
    showAlert('rate-alert', '❌ ' + (res.data.message || 'Rating failed.'), 'error'); return;
  }

  closeModal('rating-modal');
  showToast('⭐ Rating submitted! Thank you.');
  renderUserBookings();
}

// ============================================================
// PHOTOS MODAL
// ============================================================
function openPhotosModal(serviceId) {
  const s = state.services.find(x => String(x._id || x.id) === String(serviceId));
  if (!s) return;

  const titleEl = document.getElementById('photos-modal-title');
  if (titleEl) titleEl.textContent = s.name;

  const galleryEl = document.getElementById('photos-gallery');
  if (galleryEl) {
    galleryEl.innerHTML = (s.photos || []).map(p => `
      <div style="background:${PHOTO_BG[s.category]||'#f0f0f0'};border-radius:12px;height:110px;
           display:flex;align-items:center;justify-content:center;font-size:2.8rem;
           cursor:pointer;transition:transform 0.2s;"
           onmouseover="this.style.transform='scale(1.06)'"
           onmouseout="this.style.transform='scale(1)'">${p}</div>
    `).join('');
  }

  const inviteEl = document.getElementById('invite-card-content');
  if (inviteEl) {
    inviteEl.innerHTML = `
      <div style="font-size:1.8rem;margin-bottom:10px;">🎉</div>
      <h3 style="font-family:var(--font-display);font-size:1.3rem;margin-bottom:8px;">${s.name}</h3>
      <p style="opacity:0.82;margin-bottom:14px;font-size:0.95rem;">${s.invite || 'You are warmly invited!'}</p>
      <div style="border-top:1px solid rgba(255,255,255,0.2);padding-top:12px;font-size:0.82rem;opacity:0.68;">
        📍 ${s.location} &nbsp;·&nbsp; 📞 ${s.mobile}
      </div>`;
  }

  openModal('photos-modal');
}

// ============================================================
// TOAST
// ============================================================
function showToast(message) {
  const existing = document.getElementById('ch-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'ch-toast';
  toast.style.cssText = `
    position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
    background:var(--deep);color:#fff;padding:14px 26px;
    border-radius:30px;font-weight:600;z-index:99999;
    box-shadow:0 8px 30px rgba(0,0,0,0.3);
    border-left:4px solid var(--gold);
    font-family:var(--font-body);font-size:0.92rem;
    animation:toastIn 0.3s ease;white-space:nowrap;
  `;
  toast.innerHTML = message;

  if (!document.getElementById('toast-style')) {
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.textContent = `@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3000);
}
