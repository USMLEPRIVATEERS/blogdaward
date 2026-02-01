const { getSupabase, ALLOWED_RPCS } = require('../_lib/supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { function_name, params } = req.body;

    if (!function_name || !ALLOWED_RPCS.includes(function_name)) {
      return res.status(403).json({ error: 'Function not allowed' });
    }

    const authToken = req.headers['x-supabase-auth'];
    const supabase = getSupabase(authToken || null);

    const { data, error } = await supabase.rpc(function_name, params || {});

    return res.status(200).json({ data, error });

  } catch (err) {
    console.error('RPC proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
