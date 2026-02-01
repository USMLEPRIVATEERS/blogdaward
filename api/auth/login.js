const { getSupabase } = require('../_lib/supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, action } = req.body;

    const supabase = getSupabase();

    if (action === 'signInWithPassword') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(200).json({ data: null, error });
      }

      return res.status(200).json({
        data: {
          user: data.user,
          session: data.session
        },
        error: null
      });
    }

    if (action === 'signOut') {
      const { error } = await supabase.auth.signOut();
      return res.status(200).json({ data: null, error });
    }

    if (action === 'getUser') {
      const authToken = req.headers['x-supabase-auth'];
      if (!authToken) {
        return res.status(200).json({ data: { user: null }, error: null });
      }
      const authClient = getSupabase(authToken);
      const { data, error } = await authClient.auth.getUser();
      return res.status(200).json({ data, error });
    }

    if (action === 'updateUser') {
      const authToken = req.headers['x-supabase-auth'];
      if (!authToken) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const authClient = getSupabase(authToken);
      const { data, error } = await authClient.auth.updateUser(req.body.userData);
      return res.status(200).json({ data, error });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (err) {
    console.error('Auth proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
