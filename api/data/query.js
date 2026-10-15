const { getSupabase, ALLOWED_TABLES } = require('../_lib/supabase');
const { verifyAuth, verifyAdmin } = require('../_lib/auth');

// =============================================
// SECURITY: Safe columns that users can update on their OWN users row
// =============================================
const USER_SELF_UPDATE_COLUMNS = [
  'diaries_enabled', 'full_name', 'timezone',
  'first_login_completed', 'questionnaire_step',
  // O aluno preenche a propria data de nascimento, pelo questionario ou pela
  // janela do dashboard.
  'birth_date'
];

// =============================================
// SECURITY: Tables that only admins can WRITE to
// =============================================
const ADMIN_WRITE_TABLES = [
  'users', 'mentor_settings', 'mentor_availability_regular',
  'mentor_availability_specific', 'course_videos', 'course_audios',
  'assessments', 'self_assessments', 'self_assessment_questions',
  'self_assessment_tests', 'self_assessment_events',
  'wardpedia_articles', 'wardpedia_steps', 'wardpedia_subjects',
  'wardpedia_systems', 'wardpedia_categories',
  // Progressão dos alunos: só mentores escrevem
  'ward_assessments', 'student_assessment_scores',
  'student_bureaucracy', 'faculty_ecfmg_contacts',
  // Relatório de chamada: quem escreve é o mentor que atendeu. O aluno lê o
  // que é dele (regra em USER_SCOPED_TABLES) e não escreve nada.
  'call_reports'
];

// =============================================
// SECURITY: Parceiro externo (Dr. Andre Donato)
//
// Nao e mentor: nao pode herdar o isAdmin, que libera leitura de tudo e
// escrita em `users`. Ele so enxerga os alunos que o Marcos liberou
// (users.donato_liberado), e so nas tabelas abaixo. O recorte e feito aqui no
// servidor, nao na tela — o filtro e injetado em TODA consulta dele.
//
// Chave = tabela permitida; valor = coluna que diz de quem e a linha.
// =============================================
const PARCEIRO_ROLES = ['parceiro_donato'];

const PARCEIRO_TABLES = {
  users: 'id',
  donato_intake: 'user_id',
  landmarks: 'user_id',
  scheduled_calls: 'student_id',
  call_reports: 'student_id',
  user_preparation_status: 'user_id'
};

// O que ele pode ESCREVER, e em que tabelas. Fora disso, so leitura.
// Ele registra a conversa (call_reports) e marca a chamada dele como feita
// (landmarks). Nunca escreve em `users` nem no formulario do aluno.
const PARCEIRO_WRITE_TABLES = ['call_reports', 'landmarks'];

// =============================================
// SECURITY: Columns that are NEVER returned in responses
// =============================================
const BLOCKED_COLUMNS = ['password_hash'];

// Extra columns blocked for non-admin users
const NON_ADMIN_BLOCKED_COLUMNS = ['password_hash', 'cpf'];

// O parceiro externo tambem nao recebe contato direto nem dado de acesso do
// aluno: a conversa dele passa pela Ward.
const PARCEIRO_BLOCKED_COLUMNS = [
  'password_hash', 'cpf', 'phone', 'whatsapp', 'email', 'auth_id',
  'reset_token', 'reset_token_expires'
];

// =============================================
// SECURITY: Tables where non-admin users can only access their own rows
// These tables have a user_id column that must match the authenticated user
// =============================================
const USER_SCOPED_TABLES = [
  'questionnaire_data', 'schedules', 'schedule_delays',
  'user_preparation_status', 'landmarks',
  'study_diary', 'uworld_diary', 'daily_checkins',
  'user_basic_data', 'user_usmle_data', 'user_uworld_data',
  'user_uworld_progress', 'user_english_level', 'user_anki_data',
  'user_research_data', 'user_research_contacts', 'user_observerships',
  'user_background', 'flash_question_responses',
  'self_assessment_enrollments', 'self_assessment_responses',
  'self_assessment_attempts',
  'assessment_enrollments', 'watched_lessons',
  'user_tutorials', 'mentor_student_tasks',
  'wasa_schedules', 'study_difficulties',
  'wardpedia_comments', 'wardpedia_favorites', 'wardpedia_views',
  // Progressão: se um aluno acessar, só enxerga os próprios dados (mentores veem tudo)
  'student_assessment_scores', 'student_bureaucracy',
  // Criar Teste: cada aluno só enxerga a própria lista de questões usadas
  'qbank_used_questions',
  // Relatório de chamada: estava exposto a QUALQUER usuário logado, que lia
  // (e escrevia) o prontuário de todos os outros alunos. Nenhuma tela de aluno
  // consulta esta tabela, então escopar não tira nada de ninguém.
  'call_reports',
  // Recados do mentor para o aluno, pelo mesmo motivo. Toda leitura já
  // filtrava por user_id na tela; o que faltava era o servidor garantir.
  // O broadcast grava uma linha por aluno, então nada depende de ler as
  // dos outros.
  'messages', 'mentor_messages',
  // Fellow e Alternate: o formulario de pre-chamada e de cada aluno
  'donato_intake'
];

// =============================================
// SECURITY: Owner column per user-scoped table for non-admin SELECT/WRITE
// self-scoping. A table listed here has every non-admin row owned by exactly
// one user via this scalar column, and the frontend already self-scopes its
// reads/writes on it, so enforcing "owner = auth.uid" breaks nothing.
//
// User-scoped tables intentionally OMITTED here have legitimate cross-user
// reads (verified against the frontend) and keep the prior behavior:
//   - wardpedia_comments        (public per-article discussion thread)
//   - self_assessment_enrollments / _responses / _attempts
//     (class-average aggregates + enrollment-based ownership, no flat user_id)
// =============================================
const OWNER_COLUMN = {
  questionnaire_data: 'user_id', schedules: 'user_id', schedule_delays: 'user_id',
  user_preparation_status: 'user_id', landmarks: 'user_id', study_diary: 'user_id',
  uworld_diary: 'user_id', daily_checkins: 'user_id', user_basic_data: 'user_id',
  user_usmle_data: 'user_id', user_uworld_data: 'user_id', user_uworld_progress: 'user_id',
  user_english_level: 'user_id', user_anki_data: 'user_id', user_research_data: 'user_id',
  user_research_contacts: 'user_id', user_observerships: 'user_id', user_background: 'user_id',
  flash_question_responses: 'user_id', watched_lessons: 'user_id', user_tutorials: 'user_id',
  wasa_schedules: 'user_id', study_difficulties: 'user_id', wardpedia_favorites: 'user_id',
  wardpedia_views: 'user_id',
  assessment_enrollments: 'student_id', mentor_student_tasks: 'student_id',
  student_assessment_scores: 'user_id', student_bureaucracy: 'user_id',
  qbank_used_questions: 'user_id',
  donato_intake: 'user_id',
  call_reports: 'student_id',
  messages: 'user_id', mentor_messages: 'user_id',
};

// Operators that can widen scope past an enforced equality; rejected on
// owner-scoped tables for non-admins.
const SCOPE_WIDENING_OPS = ['or', 'not', 'match'];

// =============================================
// SECURITY: Sanitize strings to prevent stored XSS
// Only removes dangerous tags/attributes, preserves safe formatting
// =============================================
function sanitizeValue(val) {
  if (typeof val === 'string') {
    return val
      // Remove dangerous tags entirely (script, iframe, object, embed, form, base)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^>]*\/?>/gi, '')
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
      .replace(/<base\b[^>]*\/?>/gi, '')
      // Remove event handler attributes from remaining tags (onclick, onerror, etc.)
      .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      // Remove javascript: URLs in attributes
      .replace(/javascript\s*:/gi, 'nojs:');
  }
  return val;
}

function sanitizeData(data) {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(sanitizeData);
  if (typeof data === 'object') {
    const sanitized = {};
    for (const [key, val] of Object.entries(data)) {
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }
  return data;
}

// =============================================
// SECURITY: Remove sensitive columns from response data at EVERY nesting depth.
// Recursing is essential: an embedded resource (e.g. select=*,users:user_id(cpf,
// password_hash)) would otherwise smuggle hashes/CPF past a shallow top-level
// strip. `extraCols` lets non-admins additionally strip CPF on every nested
// object, not just the top-level users row.
// =============================================
function stripSensitiveColumns(data, extraCols) {
  const blocked = extraCols && extraCols.length ? BLOCKED_COLUMNS.concat(extraCols) : BLOCKED_COLUMNS;
  const clean = (val) => {
    if (Array.isArray(val)) return val.map(clean);
    if (val && typeof val === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(val)) {
        if (blocked.includes(k)) continue;
        out[k] = clean(v);
      }
      return out;
    }
    return val;
  };
  return clean(data);
}

// =============================================
// SECURITY: Check if filters already contain a user_id restriction
// =============================================
// Normaliza o `data` de um write para uma lista de linhas, so para conferir
// de quem e cada linha antes de gravar.
function sanitizedDataPreview(data) {
  if (!data) return [];
  const d = typeof data === 'string' ? (() => { try { return JSON.parse(data); } catch (e) { return null; } })() : data;
  if (!d) return [];
  return Array.isArray(d) ? d : [d];
}

function hasUserIdFilter(filters) {
  if (!filters || !Array.isArray(filters)) return false;
  return filters.some(f => f.col === 'user_id' && f.type === 'eq');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      table, action, select, data,
      order, limit, range, single, maybeSingle,
      count, upsertOpts
    } = req.body;
    // filters is mutable: we may inject ownership constraints below
    let filters = req.body.filters;

    if (!table || !ALLOWED_TABLES.includes(table)) {
      return res.status(403).json({ error: 'Table not allowed' });
    }

    // Authentication check
    const auth = await verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const isAdmin = auth.role && auth.role.startsWith('mentor_');
    const isParceiro = PARCEIRO_ROLES.includes(auth.role);
    const userId = auth.uid;

    // =============================================
    // SECURITY: Parceiro externo — recorte por aluno liberado
    // =============================================
    if (isParceiro) {
      const parceiroCol = PARCEIRO_TABLES[table];
      if (!parceiroCol) {
        return res.status(403).json({ error: 'Table not allowed for this role' });
      }
      if (action === 'delete') {
        return res.status(403).json({ error: 'Not allowed for this role' });
      }
      if (action !== 'select' && !PARCEIRO_WRITE_TABLES.includes(table)) {
        return res.status(403).json({ error: 'Read-only for this role' });
      }
      // Operadores que poderiam alargar o recorte depois de injetado.
      if (Array.isArray(filters) && filters.some(f => SCOPE_WIDENING_OPS.includes(f.type))) {
        return res.status(403).json({ error: 'Operator not allowed for this role' });
      }

      const db = getSupabase();
      const { data: liberados, error: libErr } = await db
        .from('users').select('id').eq('donato_liberado', true);
      if (libErr) {
        console.error('Parceiro scope error:', libErr);
        return res.status(500).json({ error: 'Failed to resolve partner scope' });
      }
      const ids = (liberados || []).map(r => r.id);
      // Ele sempre enxerga a PROPRIA linha em `users` — e dela que o login e o
      // cabecalho da pagina vivem. Escrever continua barrado.
      if (table === 'users' && !ids.includes(userId)) ids.push(userId);
      // Nenhum aluno liberado: a resposta e vazia, nunca a base inteira.
      if (!ids.length) {
        if (action !== 'select') return res.status(403).json({ error: 'No students released' });
        return res.status(200).json({ data: (single || maybeSingle) ? null : [], count: 0, error: null });
      }

      // Escrita: cada linha tem de ser de um aluno liberado.
      if (action !== 'select' && sanitizedDataPreview(req.body.data).some(row =>
            row && row[parceiroCol] !== undefined && !ids.includes(Number(row[parceiroCol])))) {
        return res.status(403).json({ error: 'Access denied: student not released' });
      }

      filters = [...(filters || []), { type: 'in', col: parceiroCol, val: ids }];
    }

    // =============================================
    // SECURITY: Block non-admin write operations on protected tables
    // Exception: users can update safe columns on their own row
    // =============================================
    if (!isAdmin && !isParceiro && ADMIN_WRITE_TABLES.includes(table)) {
      let allowed = false;
      if (table === 'users' && action === 'update' && data) {
        const updateCols = Object.keys(typeof data === 'string' ? JSON.parse(data) : data);
        const allSafe = updateCols.every(col => USER_SELF_UPDATE_COLUMNS.includes(col));
        const hasOwnIdFilter = filters && filters.some(f => f.col === 'id' && f.type === 'eq' && String(f.val) === String(userId));
        if (allSafe && hasOwnIdFilter) {
          allowed = true;
        }
      }
      if (!allowed) {
        if (action === 'update' || action === 'delete' || action === 'insert' || action === 'upsert') {
          return res.status(403).json({ error: 'Admin access required for this table' });
        }
      }
    }

    // =============================================
    // SECURITY: Users table - allow SELECT but strip PII for non-admin
    // Writing to users table is already blocked by ADMIN_WRITE_TABLES
    // =============================================

    // Delete operations require admin, except own records
    if (action === 'delete') {
      if (!isAdmin) {
        if (!filters || filters.length === 0) {
          return res.status(403).json({ error: 'Admin access required' });
        }
        // Non-admin: enforce user_id or id filter for deletion in scoped tables
        // (id filter ownership is verified later via pre-query). Owner-column
        // tables are fully handled by the comprehensive block below.
        const hasIdFilter = filters && filters.some(f => f.col === 'id' && f.type === 'eq');
        if (USER_SCOPED_TABLES.includes(table) && !OWNER_COLUMN[table] && !hasUserIdFilter(filters) && !hasIdFilter) {
          return res.status(403).json({ error: 'You can only delete your own records' });
        }
      }
    }

    // =============================================
    // SECURITY: Sanitize input data to prevent stored XSS
    // =============================================
    let sanitizedData = data;
    if (data && (action === 'insert' || action === 'update' || action === 'upsert')) {
      sanitizedData = sanitizeData(data);
    }

    // =============================================
    // SECURITY: For user-scoped tables, non-admin users are constrained to their
    // OWN rows on EVERY action.
    //
    // Tables with a known owner column (OWNER_COLUMN) get comprehensive handling:
    //   - SELECT : owner = self is required (validated if present, else injected)
    //   - UPDATE/DELETE : default-deny unless positively owner/id-scoped, then
    //     owner = self is force-ANDed so a neq/in/or filter cannot widen scope
    //   - INSERT/UPSERT : owner is stamped to self; an upsert that would clobber
    //     another user's row (by its conflict target) is rejected
    //   - scope-widening operators (or/not/match) are rejected
    //
    // Tables WITHOUT an owner column here (genuine cross-user reads) keep the
    // prior user_id-based write checks and unrestricted SELECT.
    // =============================================
    if (!isAdmin && !isParceiro && USER_SCOPED_TABLES.includes(table)) {
      const ownerCol = OWNER_COLUMN[table];

      if (ownerCol) {
        // Reject operators that could widen past the enforced equality.
        if (Array.isArray(filters) && filters.some(f => SCOPE_WIDENING_OPS.includes(f.type))) {
          return res.status(403).json({ error: 'Operator not allowed on this table' });
        }

        const ownerFilter = Array.isArray(filters)
          ? filters.find(f => f.col === ownerCol && f.type === 'eq') : null;
        const idFilter = Array.isArray(filters)
          ? filters.find(f => f.col === 'id' && f.type === 'eq') : null;

        if (action === 'select') {
          if (ownerFilter) {
            if (String(ownerFilter.val) !== String(userId)) {
              return res.status(403).json({ error: 'Access denied: not your records' });
            }
          } else {
            filters = [...(filters || []), { col: ownerCol, type: 'eq', val: userId }];
          }
        } else if (action === 'update' || action === 'delete') {
          if (ownerFilter) {
            if (String(ownerFilter.val) !== String(userId)) {
              return res.status(403).json({ error: 'Access denied: not your records' });
            }
          } else if (idFilter) {
            // Verify ownership of the targeted row via pre-query
            const supabaseCheck = getSupabase();
            const { data: record, error: checkError } = await supabaseCheck
              .from(table).select(ownerCol).eq('id', idFilter.val).maybeSingle();
            if (checkError) {
              console.error('Ownership check error:', table, idFilter.val, checkError);
              return res.status(500).json({ error: 'Failed to verify record ownership' });
            }
            if (record && String(record[ownerCol]) !== String(userId)) {
              return res.status(403).json({ error: 'Access denied: record belongs to another user' });
            }
          } else {
            // No positive ownership scoping → default-deny
            return res.status(403).json({ error: 'You can only modify your own records' });
          }
          // Force-AND owner = self regardless of any other caller filters
          filters = [...(filters || []), { col: ownerCol, type: 'eq', val: userId }];
        } else if (action === 'insert' || action === 'upsert') {
          if (sanitizedData) {
            const rows = Array.isArray(sanitizedData) ? sanitizedData : [sanitizedData];
            for (const row of rows) {
              if (!row || typeof row !== 'object') continue;
              if (row[ownerCol] !== undefined && String(row[ownerCol]) !== String(userId)) {
                return res.status(403).json({ error: 'Access denied: cannot write records for other users' });
              }
              row[ownerCol] = userId; // stamp owner; never trust client value
            }
            // An upsert can OVERWRITE an existing row matched by its conflict
            // target. Block clobbering a row owned by another user.
            if (action === 'upsert' && upsertOpts && upsertOpts.onConflict) {
              const conflictCols = String(upsertOpts.onConflict).split(',').map(s => s.trim()).filter(Boolean);
              const supabaseCheck = getSupabase();
              for (const row of rows) {
                if (!row || typeof row !== 'object') continue;
                let q = supabaseCheck.from(table).select(ownerCol);
                let fullyScoped = conflictCols.length > 0;
                for (const c of conflictCols) {
                  if (row[c] === undefined) { fullyScoped = false; break; }
                  q = q.eq(c, row[c]);
                }
                if (!fullyScoped) continue;
                const { data: existing, error: exErr } = await q.maybeSingle();
                if (exErr) {
                  console.error('Upsert ownership check error:', table, exErr);
                  return res.status(500).json({ error: 'Failed to verify record ownership' });
                }
                if (existing && String(existing[ownerCol]) !== String(userId)) {
                  return res.status(403).json({ error: 'Access denied: record belongs to another user' });
                }
              }
            }
          }
        }
      } else {
        // ---- Cross-user-read tables: prior user_id-based write checks only ----
        if (action === 'update' || action === 'delete') {
          const hasIdFilter = filters && filters.some(f => f.col === 'id' && f.type === 'eq');
          if (hasUserIdFilter(filters)) {
            const userIdFilter = filters.find(f => f.col === 'user_id' && f.type === 'eq');
            if (String(userIdFilter.val) !== String(userId)) {
              return res.status(403).json({ error: 'Access denied: user_id mismatch' });
            }
          } else if (hasIdFilter) {
            const recordId = filters.find(f => f.col === 'id' && f.type === 'eq').val;
            const supabaseCheck = getSupabase();
            const { data: record, error: checkError } = await supabaseCheck
              .from(table).select('user_id').eq('id', recordId).maybeSingle();
            if (checkError) {
              console.error('Ownership check error:', table, recordId, checkError);
              return res.status(500).json({ error: 'Failed to verify record ownership' });
            }
            if (record && String(record.user_id) !== String(userId)) {
              return res.status(403).json({ error: 'Access denied: record belongs to another user' });
            }
          } else if (!filters || filters.length === 0) {
            return res.status(403).json({ error: 'Bulk operations not allowed' });
          }
        }
        if (action === 'insert' || action === 'upsert') {
          if (sanitizedData) {
            const rows = Array.isArray(sanitizedData) ? sanitizedData : [sanitizedData];
            for (const row of rows) {
              if (row.user_id && String(row.user_id) !== String(userId)) {
                return res.status(403).json({ error: 'Access denied: cannot insert records for other users' });
              }
            }
          }
        }
      }
    }

    // Always use service role client for database operations.
    // Auth is already verified above via verifyAuth().
    const supabase = getSupabase();

    let query;

    // Build the query based on action
    switch (action) {
      case 'select':
        if (count) {
          query = supabase.from(table).select(select || '*', { count: count, head: count === 'exact' && !select });
        } else {
          query = supabase.from(table).select(select || '*');
        }
        break;
      case 'insert':
        query = supabase.from(table).insert(sanitizedData);
        if (select !== false) query = query.select();
        break;
      case 'update':
        query = supabase.from(table).update(sanitizedData);
        break;
      case 'delete':
        query = supabase.from(table).delete();
        break;
      case 'upsert':
        query = supabase.from(table).upsert(sanitizedData, upsertOpts || {});
        if (select !== false) query = query.select();
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Apply filters
    if (filters && Array.isArray(filters)) {
      for (const f of filters) {
        // SECURITY: Validate filter column names (alphanumeric and underscore only)
        if (f.col && !/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(f.col)) {
          return res.status(400).json({ error: 'Invalid filter column name' });
        }
        switch (f.type) {
          case 'eq': query = query.eq(f.col, f.val); break;
          case 'neq': query = query.neq(f.col, f.val); break;
          case 'gt': query = query.gt(f.col, f.val); break;
          case 'gte': query = query.gte(f.col, f.val); break;
          case 'lt': query = query.lt(f.col, f.val); break;
          case 'lte': query = query.lte(f.col, f.val); break;
          case 'in': query = query.in(f.col, f.val); break;
          case 'is': query = query.is(f.col, f.val); break;
          case 'like': query = query.like(f.col, f.val); break;
          case 'ilike': query = query.ilike(f.col, f.val); break;
          case 'contains': query = query.contains(f.col, f.val); break;
          case 'not': query = query.not(f.col, f.op, f.val); break;
          case 'or':
            query = query.or(f.expr);
            break;
          case 'match': query = query.match(f.val); break;
          // REMOVED: 'filter' operator - too dangerous, allows arbitrary operators
          default:
            // Ignore unknown filter types
            break;
        }
      }
    }

    // Apply modifiers
    if (order) {
      if (Array.isArray(order)) {
        for (const o of order) {
          query = query.order(o.col || o.column, { ascending: o.ascending !== false });
        }
      } else {
        query = query.order(order.col || order.column, { ascending: order.ascending !== false });
      }
    }

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }

    if (range) {
      query = query.range(range.from, range.to);
    }

    if (single) {
      query = query.single();
    } else if (maybeSingle) {
      query = query.maybeSingle();
    }

    const result = await query;

    // Log errors for debugging (server-side only)
    if (result.error) {
      console.error('Query error:', action, table, result.error.message || result.error);
    }

    // =============================================
    // SECURITY: Strip sensitive columns from response (recursively).
    // password_hash is removed for everyone; non-admins also get CPF removed at
    // every depth (covers the users table AND any embedded users(...) join on
    // other tables), closing the embedded-join leak.
    // =============================================
    const extraStrip = isAdmin ? null
      : (isParceiro ? PARCEIRO_BLOCKED_COLUMNS : NON_ADMIN_BLOCKED_COLUMNS)
          .filter(c => !BLOCKED_COLUMNS.includes(c));
    const safeData = stripSensitiveColumns(result.data, extraStrip);

    return res.status(200).json({
      data: safeData,
      error: result.error,
      count: result.count !== undefined ? result.count : undefined
    });

  } catch (err) {
    console.error('Query proxy error:', err);
    // SECURITY: Don't expose error details to client
    return res.status(500).json({ error: 'Internal server error' });
  }
};
