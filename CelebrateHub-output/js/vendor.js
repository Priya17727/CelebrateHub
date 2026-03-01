/* ============================================================
   CelebrateHub - Vendor Dashboard Logic (API Connected)
   ============================================================ */

function showAlert(id, msg, type) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}
function clearAlert(id) {
  const el = document.getElementById(id); if (el) el.innerHTML = '';
}

// ---- Overview ----
async function renderVendorOverview() {
  const statsRes = await apiFetch('/users/vendor/stats');
  if (statsRes.ok) {
    const s = statsRes.data.data;
    setEl('vendor-stat-services', s.services);
    setEl('vendor-stat-pending',  s.pending);
    setEl('vendor-stat-accepted', s.accepted);
  }

  const container = document.getElementById('vendor-nearby-grid');
  if (container) {
    const res = await apiFetch('/services?limit=4');
    if (res.ok) {
      const services = res.data.data || [];
      state.services = services;
      container.innerHTML = services.length
        ? services.map(s => vendorCardHTML(s, false)).join('')
        : '<p style="text-align:center;color:var(--muted);grid-column:1/-1;padding:40px;">No services on platform yet.</p>';
    }
  }
}

// ---- My Services ----
async function renderVendorMyServices() {
  const container = document.getElementById('vendor-my-services-grid');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:40px;grid-column:1/-1;">⏳ Loading your services...</div>';

  const res = await apiFetch('/services/vendor/mine');
  if (!res.ok) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--danger);">${res.data.message}</div>`;
    return;
  }

  const services = res.data.data || [];
  if (services.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
        <div style="font-size:4rem;margin-bottom:16px;">🗂</div>
        <h3 style="font-family:var(--font-display);font-size:1.4rem;margin-bottom:8px;">No services yet</h3>
        <p style="color:var(--muted);">Click "Add Service" to list your first service.</p>
        <button class="btn-primary" style="margin-top:20px;" onclick="switchVTab('add')">+ Add Service</button>
      </div>`;
    return;
  }

  container.innerHTML = services.map(s => `
    <div class="vendor-card">
      <div class="vendor-card-header">
        <div>
          <div style="font-size:2.1rem;margin-bottom:4px;">${SERVICE_ICONS[s.category] || '🎉'}</div>
          <span class="vendor-badge">${s.category}</span>
        </div>
        <div class="vendor-price">₹${Number(s.price).toLocaleString()}</div>
      </div>
      <div class="vendor-body">
        <div class="vendor-name">${s.name}</div>
        <div class="vendor-meta">
          <span class="meta-tag">📍 ${s.location}</span>
          <span class="meta-tag">⭐ ${s.rating || 0} (${s.ratingCount || 0})</span>
        </div>
        <p class="vendor-desc">${s.desc || ''}</p>
        <div class="vendor-owner"><h4>👤 ${s.owner}</h4><p>📞 ${s.mobile}</p></div>
        ${s.additional ? `<p class="vendor-additional">ℹ️ ${s.additional}</p>` : ''}
        <div style="margin-top:12px;">
          <button class="btn-sm btn-danger" style="width:100%" onclick="deleteVendorService('${s._id}')">🗑 Remove Service</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function deleteVendorService(id) {
  if (!confirm('Are you sure you want to remove this service?')) return;
  const res = await apiFetch(`/services/${id}`, { method: 'DELETE' });
  if (!res.ok) { showToast('⚠️ ' + res.data.message); return; }
  showToast('🗑 Service removed successfully.');
  renderVendorMyServices();
  renderVendorOverview();
}

// ---- Add Service ----
function clearAddServiceForm() {
  ['svc-name','svc-location','svc-price','svc-owner','svc-mobile','svc-desc','svc-invite','svc-photos','svc-additional']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  clearAlert('add-service-alert');
}

async function addVendorService() {
  const name       = document.getElementById('svc-name')?.value.trim();
  const category   = document.getElementById('svc-category')?.value;
  const location   = document.getElementById('svc-location')?.value.trim();
  const price      = document.getElementById('svc-price')?.value;
  const owner      = document.getElementById('svc-owner')?.value.trim();
  const mobile     = document.getElementById('svc-mobile')?.value.trim();
  const desc       = document.getElementById('svc-desc')?.value.trim();
  const invite     = document.getElementById('svc-invite')?.value.trim();
  const photosRaw  = document.getElementById('svc-photos')?.value || '';
  const additional = document.getElementById('svc-additional')?.value.trim();

  if (!name || !location || !price || !owner || !mobile) {
    showAlert('add-service-alert', '⚠️ Please fill in all required fields: Name, Location, Price, Owner Name, Mobile.', 'error');
    return;
  }
  if (isNaN(price) || Number(price) <= 0) {
    showAlert('add-service-alert', '⚠️ Please enter a valid price greater than 0.', 'error');
    return;
  }

  showAlert('add-service-alert', '⏳ Publishing your service...', 'info');

  const res = await apiFetch('/services', {
    method: 'POST',
    body: JSON.stringify({
      name, category, location,
      price: Number(price),
      owner, mobile, desc, invite,
      photos: photosRaw.split(',').map(p => p.trim()).filter(Boolean),
      additional
    })
  });

  if (!res.ok) {
    showAlert('add-service-alert', '❌ ' + (res.data.message || 'Failed to publish service.'), 'error');
    return;
  }

  showAlert('add-service-alert', '🎉 Service published! Customers can now find and book it.', 'success');
  clearAddServiceForm();

  setTimeout(() => {
    clearAlert('add-service-alert');
    switchVTab('myservices');
  }, 2000);
}

// ---- Booking Requests ----
async function renderVendorRequests() {
  const container = document.getElementById('vendor-requests-list');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:40px;">⏳ Loading requests...</div>';

  const res = await apiFetch('/bookings/vendor/requests');
  if (!res.ok) {
    container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--danger);">${res.data.message}</div>`;
    return;
  }

  const requests = res.data.data || [];
  if (requests.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;">
        <div style="font-size:4rem;margin-bottom:16px;">📩</div>
        <h3 style="font-family:var(--font-display);font-size:1.4rem;margin-bottom:8px;">No requests yet</h3>
        <p style="color:var(--muted);">When customers book your services, requests will appear here.</p>
      </div>`;
    return;
  }

  container.innerHTML = requests.map(r => {
    const svc  = r.serviceId || {};
    const user = r.userId    || {};
    return `
    <div class="request-card" id="rcard-${r._id}">
      <div class="booking-icon">${SERVICE_ICONS[svc.category] || '🎉'}</div>
      <div class="booking-info">
        <h3>${svc.name || 'Service'}</h3>
        <p>👤 Customer: <strong>${user.username || user.email || 'Anonymous'}</strong></p>
        <p>📅 Date: ${new Date(r.eventDate).toLocaleDateString()} &nbsp;·&nbsp; 👥 ${r.guests || '-'} guests</p>
        <p>💰 Amount: ₹${Number(svc.price || 0).toLocaleString()}</p>
        ${r.notes ? `<p class="booking-note">📝 "${r.notes}"</p>` : ''}
        <span class="booking-status status-${r.status}">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span>
      </div>
      <div class="request-actions">
        ${r.status === 'pending' ? `
          <button class="btn-sm btn-success" onclick="handleBookingRequest('${r._id}', 'accept')">✅ Accept</button>
          <button class="btn-sm btn-danger"  onclick="handleBookingRequest('${r._id}', 'reject')">❌ Reject</button>
        ` : r.status === 'accepted'
          ? '<span style="color:var(--success);font-weight:700;">✅ Accepted</span>'
          : '<span style="color:var(--danger);font-weight:700;">❌ Rejected</span>'}
      </div>
    </div>`;
  }).join('');
}

async function handleBookingRequest(id, action) {
  const res = await apiFetch(`/bookings/${id}/respond`, {
    method: 'PUT',
    body: JSON.stringify({ action })
  });
  if (!res.ok) { showToast('⚠️ ' + res.data.message); return; }
  showToast(action === 'accept' ? '✅ Booking accepted!' : '❌ Booking rejected.');
  renderVendorRequests();
  renderVendorOverview();
}

// ---- Utility ----
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
