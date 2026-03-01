/* ============================================================
   CelebrateHub - User Dashboard Logic (API Connected)
   ============================================================ */

// ---- Normalize service (MongoDB uses _id, old code uses id) ----
function normalizeService(s) {
  return { ...s, id: s._id || s.id };
}

// ---- Render vendor card HTML ----
function vendorCardHTML(raw, showActions = true) {
  const s = normalizeService(raw);
  const wishlisted  = isWishlisted(s.id);
  const ratingStars = s.rating ? `⭐ ${s.rating} (${s.ratingCount})` : 'No ratings yet';
  const photos = (s.photos || []).map(p =>
    `<div class="photo-thumb" style="background:${PHOTO_BG[s.category] || '#f0f0f0'}" title="View photo">${p}</div>`
  ).join('');

  return `
  <div class="vendor-card" id="vcard-${s.id}">
    <div class="vendor-card-header">
      <div>
        <div style="font-size:2.1rem;margin-bottom:4px;">${SERVICE_ICONS[s.category] || '🎉'}</div>
        <span class="vendor-badge">${s.category}</span>
      </div>
      <div class="vendor-price">₹${Number(s.price).toLocaleString()}</div>
    </div>
    <div class="vendor-photos">${photos}</div>
    <div class="vendor-body">
      <div class="vendor-name">${s.name}</div>
      <div class="vendor-meta">
        <span class="meta-tag">📍 ${s.location}</span>
        <span class="meta-tag">${ratingStars}</span>
      </div>
      <p class="vendor-desc">${s.desc || ''}</p>
      <div class="vendor-owner">
        <h4>👤 ${s.owner}</h4>
        <p>📞 ${s.mobile}</p>
      </div>
      ${s.additional ? `<p class="vendor-additional">ℹ️ ${s.additional}</p>` : ''}
      <a class="invite-link" onclick="openPhotosModal('${s.id}')">🖼 View Photos & Invitation Card</a>
      ${showActions ? `
      <div class="vendor-actions">
        <button class="btn-book" onclick="openBookModal('${s.id}')">📅 Book Now</button>
        <button class="btn-wish ${wishlisted ? 'wishlisted' : ''}"
          id="wish-btn-${s.id}"
          onclick="handleWishlist('${s.id}')"
          title="${wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}">
          ${wishlisted ? '❤️' : '🤍'}
        </button>
      </div>` : ''}
    </div>
  </div>`;
}

// ---- Render Services ----
async function renderUserServices() {
  const container = document.getElementById('services-listing');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:40px;">⏳ Loading services...</div>';

  const search      = (document.getElementById('service-search')?.value || '').toLowerCase();
  const typeFilter  = document.getElementById('service-type-filter')?.value || '';
  const priceFilter = document.getElementById('price-filter')?.value || '';

  let query = '?limit=50';
  if (search)      query += `&search=${encodeURIComponent(search)}`;
  if (typeFilter)  query += `&category=${encodeURIComponent(typeFilter)}`;
  if (priceFilter) query += `&priceRange=${priceFilter}`;

  const res = await apiFetch(`/services${query}`);

  if (!res.ok) {
    container.innerHTML = `<div class="no-results"><div class="no-icon">⚠️</div><h3>Could not load services</h3><p>${res.data.message}</p></div>`;
    return;
  }

  const services = res.data.data || [];
  state.services  = services;

  const countEl = document.getElementById('results-count');
  if (countEl) countEl.textContent = `${services.length} service${services.length !== 1 ? 's' : ''} found`;

  if (services.length === 0) {
    container.innerHTML = `<div class="no-results"><div class="no-icon">🔍</div><h3>No services found</h3><p>Try adjusting your search or filters.</p></div>`;
    return;
  }
  container.innerHTML = services.map(s => vendorCardHTML(s, true)).join('');
}

// ---- Wishlist ----
async function handleWishlist(id) {
  const res = await apiFetch(`/users/wishlist/${id}`, { method: 'PUT' });
  if (!res.ok) { showToast('⚠️ ' + (res.data.message || 'Failed')); return; }

  const wishlisted = res.data.wishlisted;
  state.wishlist = (res.data.wishlist || []).map(String);

  const btn = document.getElementById(`wish-btn-${id}`);
  if (btn) {
    btn.classList.toggle('wishlisted', wishlisted);
    btn.innerHTML = wishlisted ? '❤️' : '🤍';
    btn.title = wishlisted ? 'Remove from wishlist' : 'Add to wishlist';
  }
  showToast(wishlisted ? '❤️ Added to wishlist!' : '🤍 Removed from wishlist');
}

async function renderUserWishlist() {
  const container = document.getElementById('wishlist-listing');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:40px;">⏳ Loading wishlist...</div>';

  const res = await apiFetch('/users/wishlist');
  if (!res.ok) {
    container.innerHTML = `<div class="no-results"><div class="no-icon">⚠️</div><h3>Error loading wishlist</h3><p>${res.data.message}</p></div>`;
    return;
  }

  const items = res.data.data || [];
  state.wishlist = items.map(s => String(s._id));

  if (items.length === 0) {
    container.innerHTML = `<div class="no-results"><div class="no-icon">🤍</div><h3>Your wishlist is empty</h3><p>Browse services and tap 🤍 to save your favourites.</p></div>`;
    return;
  }
  container.innerHTML = items.map(s => vendorCardHTML(s, true)).join('');
}

// ---- Bookings ----
async function renderUserBookings() {
  const container = document.getElementById('bookings-listing');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:40px;">⏳ Loading bookings...</div>';

  const res = await apiFetch('/bookings/my');
  if (!res.ok) {
    container.innerHTML = `<div style="text-align:center;padding:60px 20px;"><p style="color:var(--muted);">${res.data.message}</p></div>`;
    return;
  }

  const bookings = res.data.data || [];
  state.bookings = bookings;

  if (bookings.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;">
        <div style="font-size:4rem;margin-bottom:16px;">📋</div>
        <h3 style="font-family:var(--font-display);font-size:1.4rem;margin-bottom:8px;">No bookings yet</h3>
        <p style="color:var(--muted);">Browse services and book your first event!</p>
        <button class="btn-primary" style="margin-top:20px;" onclick="userTab('home')">Browse Services</button>
      </div>`;
    return;
  }

  container.innerHTML = bookings.map(b => {
    const svc      = b.serviceId || {};
    const isPaid   = ['paid','completed'].includes(b.status);
    const canPay   = b.status === 'accepted' && !isPaid;
    const canRate  = isPaid && !b.rating?.stars;
    const canDelete = !['paid','completed'].includes(b.status);

    return `
    <div class="booking-card" id="bcard-${b._id}">
      <div class="booking-icon">${SERVICE_ICONS[svc.category] || '🎉'}</div>
      <div class="booking-info">
        <h3>${svc.name || 'Service'}</h3>
        <p>${svc.category || ''} · 📍 ${svc.location || ''}</p>
        <p>📅 ${new Date(b.eventDate).toLocaleDateString()} &nbsp;·&nbsp; 👥 ${b.guests || '-'} guests &nbsp;·&nbsp; 💰 ₹${Number(svc.price || 0).toLocaleString()}</p>
        ${b.notes ? `<p class="booking-note">📝 ${b.notes}</p>` : ''}
        <span class="booking-status status-${b.status}">${b.status.charAt(0).toUpperCase() + b.status.slice(1)}</span>
        ${b.rating?.stars ? `<div style="margin-top:6px;font-size:0.9rem;">Your rating: ${'⭐'.repeat(b.rating.stars)} ${b.rating.review ? '<em style="color:var(--muted);font-size:0.85rem;">"' + b.rating.review + '"</em>' : ''}</div>` : ''}
      </div>
      <div class="booking-actions">
        ${canPay    ? `<button class="btn-sm btn-success" onclick="openPaymentModal('${b._id}')">💳 Pay</button>` : ''}
        ${isPaid    ? `<span class="paid-badge">✅ Paid</span>` : ''}
        ${canRate   ? `<button class="btn-sm btn-neutral" onclick="openRatingModal('${b._id}')">⭐ Rate</button>` : ''}
        ${canDelete ? `<button class="btn-sm btn-danger" onclick="deleteBooking('${b._id}')">🗑 Delete</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

async function deleteBooking(id) {
  if (!confirm('Remove this booking from your list?')) return;
  const res = await apiFetch(`/bookings/${id}`, { method: 'DELETE' });
  if (!res.ok) { showToast('⚠️ ' + res.data.message); return; }
  showToast('🗑 Booking cancelled.');
  renderUserBookings();
}

// ---- Profile ----
async function renderUserProfile() {
  const res = await apiFetch('/users/profile');
  if (!res.ok) return;

  const u = res.data.data;
  document.getElementById('profile-name').textContent    = u.username || 'User';
  document.getElementById('profile-email-h').textContent = u.email    || '';
  document.getElementById('pd-username').textContent     = u.username || 'N/A';
  document.getElementById('pd-email').textContent        = u.email    || 'N/A';
  document.getElementById('pd-mobile').textContent       = u.mobile   || 'Not set';
  document.getElementById('pd-role').textContent         = state.currentRole === 'vendor' ? 'Vendor' : 'Customer';

  const myBookings = u.recentBookings || [];
  document.getElementById('pd-bookings').textContent = myBookings.length;

  const miniContainer = document.getElementById('profile-bookings-mini');
  if (!miniContainer) return;
  miniContainer.innerHTML = myBookings.length === 0
    ? '<p style="color:var(--muted);">No bookings yet.</p>'
    : myBookings.map(b => {
        const svc = b.serviceId || {};
        return `
          <div class="mini-booking">
            <div>
              <strong>${svc.name || 'Service'}</strong><br>
              <span>${new Date(b.eventDate || b.createdAt).toLocaleDateString()} · ${svc.category || ''}</span>
            </div>
            <span class="booking-status status-${b.status}">${b.status}</span>
          </div>`;
      }).join('');
}
