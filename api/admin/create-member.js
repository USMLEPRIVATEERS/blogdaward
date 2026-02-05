const { getSupabase } = require('../_lib/supabase');
const { verifyAdmin } = require('../_lib/auth');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Only mentor_marcos can create members
    const admin = await verifyAdmin(req);
    if (!admin || admin.role !== 'mentor_marcos') {
      return res.status(403).json({ error: 'Access denied: only mentor_marcos can create members' });
    }

    const { cpf, email, password, full_name, role } = req.body;

    if (!cpf || !password || !full_name) {
      return res.status(400).json({ error: 'Missing required fields: cpf, password, full_name' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // SECURITY: Validate CPF format (digits only, 11 chars)
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      return res.status(400).json({ error: 'CPF invalido' });
    }

    // SECURITY: Validate role against allowed values
    const ALLOWED_ROLES = ['aluno', 'assessoria', 'externo', 'mentor_iria', 'mentor_marcos', 'mentor_guilherme', 'mentor_romulo'];
    if (role && !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Role invalido' });
    }

    // SECURITY: Sanitize text inputs to prevent stored XSS
    const sanitize = (str) => str ? str.replace(/<[^>]*>/g, '').replace(/on\w+\s*=/gi, '').replace(/javascript:/gi, '') : str;

    const supabase = getSupabase();

    // Check if CPF already exists
    const { data: existingCpf } = await supabase
      .from('users')
      .select('id')
      .eq('cpf', cpf)
      .maybeSingle();

    if (existingCpf) {
      return res.status(409).json({ error: 'CPF ja cadastrado' });
    }

    // Check if email already exists (if provided)
    if (email) {
      const { data: existingEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingEmail) {
        return res.status(409).json({ error: 'Email ja cadastrado' });
      }
    }

    // Hash password server-side with bcrypt (compatible with pgcrypto)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user directly using service role (bypasses RLS and broken SQL functions)
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        cpf: cleanCpf,
        email: email ? sanitize(email.trim()) : null,
        password_hash: passwordHash,
        full_name: sanitize(full_name),
        role: role || 'aluno',
        first_login_completed: false,
        questionnaire_step: 0,
        status: 'active'
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting user:', insertError);
      return res.status(500).json({ error: 'Erro ao criar usuario: ' + insertError.message });
    }

    return res.status(201).json({
      success: true,
      user_id: newUser.id,
      message: 'Membro criado com sucesso'
    });

  } catch (err) {
    console.error('Create member error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
