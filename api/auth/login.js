const { getSupabase } = require('../_lib/supabase');
const { createSessionToken, verifyAuth } = require('../_lib/auth');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action } = req.body;
    const supabase = getSupabase();

    // === LOGIN WITH CPF (all server-side) ===
    if (action === 'loginWithCPF') {
      const { cpf, password } = req.body;
      if (!cpf || !password) {
        return res.status(400).json({ data: null, error: { message: 'CPF e senha são obrigatórios' } });
      }

      const cleanCPF = cpf.replace(/\D/g, '');

      // 1. Find user by CPF (server-side only, never exposed to frontend)
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('cpf', cleanCPF)
        .single();

      if (userError || !user) {
        return res.status(200).json({ data: null, error: { message: 'CPF ou senha incorretos' } });
      }

      if (user.status === 'inactive') {
        return res.status(200).json({ data: null, error: { message: 'Conta inativa. Entre em contato com o administrador.' } });
      }

      let session = null;

      // 2. If user has Supabase Auth, sign in
      if (user.auth_id && user.email) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: password
        });

        if (authError || !authData.user) {
          return res.status(200).json({ data: null, error: { message: 'CPF ou senha incorretos' } });
        }
        session = authData.session;
      } else {
        // 3. Verify password directly with bcryptjs (same library used to hash)
        // This avoids pgcrypto/bcryptjs compatibility issues and
        // bypasses any modified SQL functions in the database
        if (!user.password_hash) {
          return res.status(200).json({ data: null, error: { message: 'CPF ou senha incorretos' } });
        }

        let passwordValid = false;

        if (user.password_hash.startsWith('$2')) {
          // bcrypt hash - verify with bcryptjs
          passwordValid = await bcrypt.compare(password, user.password_hash);
        } else {
          // Legacy hash (base64) - keep backward compatibility
          const legacyHash = Buffer.from(password + '_ward_salt_2024').toString('base64');
          passwordValid = (user.password_hash === legacyHash || user.password_hash === password);
        }

        if (!passwordValid) {
          return res.status(200).json({ data: null, error: { message: 'CPF ou senha incorretos' } });
        }
      }

      // 4. Create ward session token (works for both auth and legacy users)
      const wardToken = createSessionToken(user.id, user.role);

      // 5. Return user data (strip sensitive fields)
      const { password_hash, ...safeUser } = user;

      return res.status(200).json({
        data: {
          user: safeUser,
          session: session,
          wardToken: wardToken
        },
        error: null
      });
    }

    // === LEGACY: signInWithPassword (keep for compatibility) ===
    if (action === 'signInWithPassword') {
      const { email, password } = req.body;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return res.status(200).json({ data: null, error });
      }

      return res.status(200).json({
        data: { user: data.user, session: data.session },
        error: null
      });
    }

    // === SIGN OUT ===
    if (action === 'signOut') {
      const { error } = await supabase.auth.signOut();
      return res.status(200).json({ data: null, error });
    }

    // === GET USER (requires auth) ===
    if (action === 'getUser') {
      const auth = await verifyAuth(req);
      if (!auth) {
        return res.status(200).json({ data: { user: null }, error: null });
      }
      const authToken = req.headers['x-supabase-auth'];
      if (authToken) {
        const authClient = getSupabase(authToken);
        const { data, error } = await authClient.auth.getUser();
        return res.status(200).json({ data, error });
      }
      return res.status(200).json({ data: { user: { id: auth.uid } }, error: null });
    }

    // === UPDATE USER (requires auth) ===
    if (action === 'updateUser') {
      const auth = await verifyAuth(req);
      if (!auth) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const authToken = req.headers['x-supabase-auth'];
      if (!authToken) {
        return res.status(401).json({ error: 'Supabase auth required for updateUser' });
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
