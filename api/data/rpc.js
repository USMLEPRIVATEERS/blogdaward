const { getSupabase, ALLOWED_RPCS } = require('../_lib/supabase');
const { verifyAuth, verifyAdmin } = require('../_lib/auth');
const { enforceLoginRateLimit, getClientIp, checkRateLimit } = require('../_lib/ratelimit');

// RPCs that don't require authentication
const PUBLIC_RPCS = ['secure_login', 'secure_register'];

// RPCs that require admin/mentor authentication (mentor_marcos specifically)
const ADMIN_RPCS = ['update_password_secure'];

// RPCs that require any mentor role (not students)
const MENTOR_RPCS = ['list_users'];

// =============================================
// SECURITY: RPCs whose "identity" parameter must be bound to the authenticated
// user (auth.uid) and NEVER trusted from the client. Without this, a student
// could pass a mentor's id (or a victim's id) to bypass the SQL permission
// checks (can_access_user_data / is_user_mentor) and read/write arbitrary data.
// p_target_user_id intentionally stays client-supplied so a real mentor can
// still target a student (the SQL verifies the bound requester is a mentor).
// =============================================
const RPC_IDENTITY_PARAM = {
  get_questionnaire_data: 'p_requesting_user_id',
  save_questionnaire_data: 'p_requesting_user_id',
  list_users: 'p_requesting_user_id',
  change_password: 'p_user_id',
};

// SECURITY: roles that may be assigned at registration time
const ALLOWED_ROLES = ['aluno', 'assessoria', 'externo', 'mentor_iria', 'mentor_marcos', 'mentor_guilherme', 'mentor_fernando'];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { function_name, params } = req.body;

    if (!function_name || !ALLOWED_RPCS.includes(function_name)) {
      return res.status(403).json({ error: 'Function not allowed' });
    }

    // SECURITY: throttle the unauthenticated public RPCs (login/register).
    if (function_name === 'secure_login') {
      const cpf = params && params.p_cpf ? String(params.p_cpf).replace(/\D/g, '') : null;
      const rl = enforceLoginRateLimit(req, cpf);
      if (!rl.ok) {
        res.setHeader('Retry-After', String(rl.retryAfter));
        return res.status(429).json({ data: null, error: { message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' } });
      }
    } else if (function_name === 'secure_register') {
      const reg = checkRateLimit(`register:ip:${getClientIp(req)}`, { max: 10, windowMs: 60 * 60 * 1000 });
      if (!reg.allowed) {
        res.setHeader('Retry-After', String(reg.retryAfter));
        return res.status(429).json({ data: null, error: { message: 'Muitas tentativas. Aguarde e tente novamente.' } });
      }
    }

    // Authenticated identity for this request (null for public RPCs)
    let auth = null;

    // Check auth for non-public RPCs
    if (!PUBLIC_RPCS.includes(function_name)) {
      // Admin RPCs require mentor_marcos role specifically
      if (ADMIN_RPCS.includes(function_name)) {
        auth = await verifyAdmin(req);
        if (!auth || auth.role !== 'mentor_marcos') {
          return res.status(403).json({ error: 'Admin access required' });
        }
      } else if (MENTOR_RPCS.includes(function_name)) {
        // Mentor-only RPCs (e.g. list_users leaks all CPF/email) require a mentor
        auth = await verifyAdmin(req);
        if (!auth) {
          return res.status(403).json({ error: 'Mentor access required' });
        }
      } else {
        auth = await verifyAuth(req);
        if (!auth) {
          return res.status(401).json({ error: 'Authentication required' });
        }
      }
    }

    // =============================================
    // SECURITY: secure_register role gating.
    // Normalize the effective role first so an omitted/blank/non-externo p_role
    // cannot bypass the gate. Only mentor_marcos may create non-external users;
    // for any other caller force the role to 'externo' (the only role the public
    // register flow ever creates) so the DB default 'aluno' is unreachable.
    // =============================================
    let effectiveParams = params || {};
    if (function_name === 'secure_register') {
      const requestedRole = (effectiveParams.p_role && String(effectiveParams.p_role).trim()) || 'externo';
      if (!ALLOWED_ROLES.includes(requestedRole)) {
        return res.status(400).json({ error: 'Role invalido' });
      }
      if (requestedRole !== 'externo') {
        const admin = await verifyAdmin(req);
        if (!admin || admin.role !== 'mentor_marcos') {
          return res.status(403).json({ error: 'Only mentor_marcos can create non-external users' });
        }
        effectiveParams = { ...effectiveParams, p_role: requestedRole };
      } else {
        // Force externo for any non-admin caller
        effectiveParams = { ...effectiveParams, p_role: 'externo' };
      }
    }

    // =============================================
    // SECURITY: bind identity params to the authenticated user.
    // =============================================
    const idParam = RPC_IDENTITY_PARAM[function_name];
    if (idParam && auth) {
      effectiveParams = { ...effectiveParams, [idParam]: auth.uid };
    }

    // Always use service role client for RPC operations.
    // Auth is already verified above. Passing an expired user JWT
    // would override the service role Authorization header.
    const supabase = getSupabase();

    const { data, error } = await supabase.rpc(function_name, effectiveParams);

    return res.status(200).json({ data, error });

  } catch (err) {
    console.error('RPC proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
