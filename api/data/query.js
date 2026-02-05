const { getSupabase, ALLOWED_TABLES } = require('../_lib/supabase');
const { verifyAuth, verifyAdmin } = require('../_lib/auth');

// =============================================
// SECURITY: Tables that only admins can WRITE to
// =============================================
const ADMIN_WRITE_TABLES = [
  'users', 'mentor_settings', 'mentor_availability_regular',
  'mentor_availability_specific', 'course_videos', 'course_audios',
  'assessments', 'self_assessments', 'self_assessment_questions',
  'self_assessment_tests', 'self_assessment_events'
];

// =============================================
// SECURITY: Columns that are NEVER returned in responses
// =============================================
const BLOCKED_COLUMNS = ['password_hash'];

// Extra columns blocked for non-admin users
const NON_ADMIN_BLOCKED_COLUMNS = ['password_hash', 'cpf'];

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
  'wasa_schedules', 'study_difficulties'
];

// =============================================
// SECURITY: Strip HTML tags from strings to prevent stored XSS
// =============================================
function sanitizeValue(val) {
  if (typeof val === 'string') {
    // Remove HTML tags and dangerous attributes
    return val
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/javascript:/gi, '');
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
// SECURITY: Remove sensitive columns from response data
// =============================================
function stripSensitiveColumns(data) {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map(row => stripSensitiveColumns(row));
  }
  if (typeof data === 'object') {
    const cleaned = { ...data };
    for (const col of BLOCKED_COLUMNS) {
      delete cleaned[col];
    }
    return cleaned;
  }
  return data;
}

// =============================================
// SECURITY: Check if filters already contain a user_id restriction
// =============================================
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
      table, action, select, filters, data,
      order, limit, range, single, maybeSingle,
      count, upsertOpts
    } = req.body;

    if (!table || !ALLOWED_TABLES.includes(table)) {
      return res.status(403).json({ error: 'Table not allowed' });
    }

    // Authentication check
    const auth = await verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const isAdmin = auth.role && auth.role.startsWith('mentor_');
    const userId = auth.uid;

    // =============================================
    // SECURITY: Block non-admin write operations on protected tables
    // =============================================
    if (!isAdmin && ADMIN_WRITE_TABLES.includes(table)) {
      if (action === 'update' || action === 'delete' || action === 'insert' || action === 'upsert') {
        return res.status(403).json({ error: 'Admin access required for this table' });
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
        // Non-admin: enforce user_id filter for deletion in scoped tables
        if (USER_SCOPED_TABLES.includes(table) && !hasUserIdFilter(filters)) {
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
    // SECURITY: For user-scoped tables, non-admin users:
    // - INSERT: user_id in data must match authenticated user (if present)
    // - UPDATE/DELETE: must have user_id filter matching auth user,
    //   OR an id filter (ownership verified via pre-query)
    // =============================================
    if (!isAdmin && USER_SCOPED_TABLES.includes(table)) {
      if (action === 'update' || action === 'delete') {
        const hasIdFilter = filters && filters.some(f => f.col === 'id' && f.type === 'eq');
        if (hasUserIdFilter(filters)) {
          // Verify the user_id in the filter matches the authenticated user
          const userIdFilter = filters.find(f => f.col === 'user_id' && f.type === 'eq');
          if (String(userIdFilter.val) !== String(userId)) {
            return res.status(403).json({ error: 'Access denied: user_id mismatch' });
          }
        } else if (hasIdFilter) {
          // Update/delete by primary key - verify ownership via pre-query
          const recordId = filters.find(f => f.col === 'id' && f.type === 'eq').val;
          const supabaseCheck = getSupabase();
          const { data: record } = await supabaseCheck
            .from(table).select('user_id').eq('id', recordId).maybeSingle();
          if (record && String(record.user_id) !== String(userId)) {
            return res.status(403).json({ error: 'Access denied: record belongs to another user' });
          }
        } else if (!filters || filters.length === 0) {
          // No filters at all - block bulk operations
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

    // =============================================
    // SECURITY: Strip sensitive columns from response
    // Non-admins also get CPF stripped from users table queries
    // =============================================
    let safeData = stripSensitiveColumns(result.data);
    if (table === 'users' && !isAdmin && safeData) {
      const stripExtra = (row) => {
        if (!row || typeof row !== 'object') return row;
        const cleaned = { ...row };
        for (const col of NON_ADMIN_BLOCKED_COLUMNS) delete cleaned[col];
        return cleaned;
      };
      safeData = Array.isArray(safeData) ? safeData.map(stripExtra) : stripExtra(safeData);
    }

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
