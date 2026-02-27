const { getSupabase, ALLOWED_RPCS } = require('../_lib/supabase');
const { verifyAuth, verifyAdmin } = require('../_lib/auth');

// RPCs that don't require authentication
const PUBLIC_RPCS = ['secure_login', 'secure_register'];

// RPCs that require admin/mentor authentication
const ADMIN_RPCS = ['update_password_secure'];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { function_name, params } = req.body;

    if (!function_name || !ALLOWED_RPCS.includes(function_name)) {
      return res.status(403).json({ error: 'Function not allowed' });
    }

    // Check auth for non-public RPCs
    if (!PUBLIC_RPCS.includes(function_name)) {
      // Admin RPCs require mentor_marcos role specifically
      if (ADMIN_RPCS.includes(function_name)) {
        const admin = await verifyAdmin(req);
        if (!admin || admin.role !== 'mentor_marcos') {
          return res.status(403).json({ error: 'Admin access required' });
        }
      } else {
        const auth = await verifyAuth(req);
        if (!auth) {
          return res.status(401).json({ error: 'Authentication required' });
        }
      }
    }

    // secure_register with non-externo role requires mentor_marcos
    if (function_name === 'secure_register' && params && params.p_role && params.p_role !== 'externo') {
      const admin = await verifyAdmin(req);
      if (!admin || admin.role !== 'mentor_marcos') {
        return res.status(403).json({ error: 'Only mentor_marcos can create non-external users' });
      }
    }

    // Always use service role client for RPC operations.
    // Auth is already verified above. Passing an expired user JWT
    // would override the service role Authorization header.
    const supabase = getSupabase();

    const { data, error } = await supabase.rpc(function_name, params || {});

    return res.status(200).json({ data, error });

  } catch (err) {
    console.error('RPC proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
