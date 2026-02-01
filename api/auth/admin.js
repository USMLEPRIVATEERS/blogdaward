const { getSupabase } = require('../_lib/supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, userData, userId } = req.body;

    // Verify the requester is an admin/mentor via their auth token
    const authToken = req.headers['x-supabase-auth'];
    const supabase = getSupabase(authToken || null);

    if (action === 'createUser') {
      const { data, error } = await supabase.auth.admin.createUser(userData);
      return res.status(200).json({ data, error });
    }

    if (action === 'deleteUser') {
      const { data, error } = await supabase.auth.admin.deleteUser(userId);
      return res.status(200).json({ data, error });
    }

    if (action === 'updateUserById') {
      const { data, error } = await supabase.auth.admin.updateUserById(userId, userData);
      return res.status(200).json({ data, error });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (err) {
    console.error('Admin auth proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
