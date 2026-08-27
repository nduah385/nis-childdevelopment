import { createClient, SupabaseAuthAdapter as NeonAuthCompatibilityAdapter } from 'https://cdn.jsdelivr.net/npm/@neondatabase/neon-js@0.7.0-beta/+esm';

const cfg = window.NIS_CONFIG || {};
const VERIFIED = 'verified';
const STATE_ATTR = 'nisSingleAdmin';
let client = null;
let verificationPromise = null;

const shield = document.createElement('style');
shield.textContent = `html:not([data-nis-single-admin="${VERIFIED}"]) #adminDashboard{visibility:hidden!important;pointer-events:none!important}`;
document.head.appendChild(shield);

try {
  if (cfg.neonAuthUrl && cfg.neonDataApiUrl) {
    client = createClient({
      auth: {
        adapter: NeonAuthCompatibilityAdapter(),
        url: cfg.neonAuthUrl,
        allowAnonymous: true,
      },
      dataApi: { url: cfg.neonDataApiUrl },
    });
  }
} catch (error) {
  console.error('Single-admin hardening init failed', error);
}

function setState(value) {
  if (value) document.documentElement.dataset[STATE_ATTR] = value;
  else delete document.documentElement.dataset[STATE_ATTR];
}

function statusMessage(message) {
  const status = document.getElementById('adminLoginStatus');
  if (status && message) status.textContent = message;
}

function markBuild() {
  const marker = document.querySelector('#adminDashboard .mini-label');
  if (marker) marker.textContent = 'Website build v2.3.4 • Neon + R2 • Single Admin';
}

async function lockAdministration(message) {
  setState('locked');
  const dashboard = document.getElementById('adminDashboard');
  const login = document.getElementById('adminLoginView');
  if (dashboard) dashboard.hidden = true;
  if (login) login.hidden = false;
  statusMessage(message || 'Administrator authorisation is required.');
}

async function verifyPrimaryAdministrator() {
  if (verificationPromise) return verificationPromise;
  verificationPromise = (async () => {
    setState('checking');
    if (!client) {
      await lockAdministration('Secure administration is temporarily unavailable.');
      return false;
    }

    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    const session = sessionData?.session;
    if (sessionError || !session?.user?.id) {
      await lockAdministration('Sign in with the authorised primary administrator account.');
      return false;
    }

    const { data: admin, error } = await client
      .from('admin_users')
      .select('id,email,display_name,role,is_active')
      .eq('id', session.user.id)
      .maybeSingle();

    const authorised = !error && admin?.is_active === true && admin?.role === 'super_admin' && String(admin.id) === String(session.user.id);
    if (!authorised) {
      try { await client.auth.signOut(); } catch {}
      await lockAdministration('Access denied. This website is controlled only by its authorised primary administrator.');
      return false;
    }

    setState(VERIFIED);
    statusMessage('');
    markBuild();
    return true;
  })();

  try {
    return await verificationPromise;
  } finally {
    verificationPromise = null;
  }
}

// Block dashboard interaction until the signed-in account has passed the
// single-primary-administrator check. Database policies remain authoritative.
document.addEventListener('click', (event) => {
  const dashboard = event.target?.closest?.('#adminDashboard');
  if (!dashboard || document.documentElement.dataset[STATE_ATTR] === VERIFIED) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  verifyPrimaryAdministrator();
}, true);

if (client?.auth?.onAuthStateChange) {
  client.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      setState('locked');
      return;
    }
    verifyPrimaryAdministrator();
  });
}

const dashboard = document.getElementById('adminDashboard');
if (dashboard) {
  new MutationObserver(() => {
    if (!dashboard.hidden) verifyPrimaryAdministrator();
    markBuild();
  }).observe(dashboard, { attributes: true, attributeFilter: ['hidden'] });
}

const adminNav = document.getElementById('adminNav');
if (adminNav) {
  new MutationObserver(markBuild).observe(adminNav, { childList: true, subtree: true });
}

window.addEventListener('pageshow', () => verifyPrimaryAdministrator(), { once: true });
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => verifyPrimaryAdministrator(), { once: true });
} else {
  verifyPrimaryAdministrator();
}
