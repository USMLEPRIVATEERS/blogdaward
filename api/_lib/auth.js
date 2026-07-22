const { getSupabase } = require('./supabase');
const crypto = require('crypto');

// SECURITY: The ward session token is HMAC-signed. The signing secret must be
// a SERVER-ONLY secret. The Supabase ANON key is designed to be publishable, so
// it must NOT be the primary signing secret (a leaked anon key would let anyone
// forge an admin token). Prefer a dedicated WARD_SESSION_SECRET, then fall back
// to the service-role key (server-only), and only as a last resort the anon key.
// Rotating the secret invalidates existing tokens; since tokens already expire
// every 24h this is at most a one-time re-login (no worse than normal expiry).
const SESSION_SECRET =
  process.env.WARD_SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'fallback';
const TOKEN_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// SECURITY: canonical mentor/admin roles (no open-ended startsWith matching)
const MENTOR_ROLES = ['mentor_marcos', 'mentor_iria', 'mentor_guilherme', 'mentor_fernando'];

/**
 * Create a signed session token for a user (works for both auth and legacy users)
 */
function createSessionToken(userId, role) {
  const payload = JSON.stringify({
    uid: userId,
    role: role,
    iat: Date.now()
  });
  const sig = crypto.createHmac('sha256', SESSION_SECRET)
    .update(payload).digest('hex');
  return Buffer.from(payload).toString('base64') + '.' + sig;
}

/**
 * Verify a ward session token
 * Returns { uid, role, iat } or null
 */
function verifySessionToken(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const payload = Buffer.from(parts[0], 'base64').toString();
    const sig = crypto.createHmac('sha256', SESSION_SECRET)
      .update(payload).digest('hex');
    if (sig !== parts[1]) return null;
    const data = JSON.parse(payload);
    if (Date.now() - data.iat > TOKEN_MAX_AGE) return null;
    return data;
  } catch (e) {
    return null;
  }
}

/**
 * Verify request authentication.
 * Checks ward session token first, then Supabase auth token.
 * Returns { uid, role } or null.
 */
async function verifyAuth(req) {
  // Check ward session token (works for both legacy and auth users)
  const wardToken = req.headers['x-ward-token'];
  const session = verifySessionToken(wardToken);
  if (session) return session;

  // Fallback: check Supabase auth token
  const supaToken = req.headers['x-supabase-auth'];
  if (supaToken) {
    try {
      const supabase = getSupabase(supaToken);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        // Look up role from users table
        const db = getSupabase();
        const { data: dbUser } = await db.from('users')
          .select('id, role').eq('auth_id', user.id).single();
        return { uid: dbUser ? dbUser.id : user.id, role: dbUser ? dbUser.role : 'unknown' };
      }
    } catch (e) {}
  }

  return null;
}

/**
 * Verify admin/mentor access.
 * SECURITY: Re-derives the role from the DATABASE (not the token) so a stale or
 * downgraded role cannot retain admin access for the life of the token, and the
 * check is anchored to the live source of truth. Uses a canonical mentor set.
 * Returns { uid, role } with the DB role, or null.
 */
async function verifyAdmin(req) {
  const auth = await verifyAuth(req);
  if (!auth) return null;
  try {
    const db = getSupabase();
    const { data: dbUser, error } = await db
      .from('users').select('id, role').eq('id', auth.uid).single();
    if (error || !dbUser) return null;
    if (MENTOR_ROLES.includes(dbUser.role)) {
      return { uid: dbUser.id, role: dbUser.role };
    }
    return null;
  } catch (e) {
    return null;
  }
}

module.exports = { verifyAuth, verifyAdmin, createSessionToken, verifySessionToken, MENTOR_ROLES };
