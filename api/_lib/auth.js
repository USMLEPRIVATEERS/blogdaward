const { getSupabase } = require('./supabase');
const crypto = require('crypto');

const SESSION_SECRET = process.env.SUPABASE_ANON_KEY || 'fallback';
const TOKEN_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

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
 */
async function verifyAdmin(req) {
  const auth = await verifyAuth(req);
  if (!auth) return null;
  if (auth.role && auth.role.startsWith('mentor_')) return auth;
  return null;
}

module.exports = { verifyAuth, verifyAdmin, createSessionToken, verifySessionToken };
