const { getSupabase, ALLOWED_TABLES } = require('../_lib/supabase');
const { verifyAuth, verifyAdmin } = require('../_lib/auth');

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

    // Delete operations require admin/mentor
    if (action === 'delete') {
      const admin = await verifyAdmin(req);
      if (!admin) {
        // Allow students to delete their own records (check via filters)
        // but not bulk deletes without filters
        if (!filters || filters.length === 0) {
          return res.status(403).json({ error: 'Admin access required' });
        }
      }
    }

    // Always use service role client for database operations.
    // Auth is already verified above via verifyAuth().
    // Passing the user's Supabase JWT here would override the service role
    // Authorization header, causing failures when the JWT expires.
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
        query = supabase.from(table).insert(data);
        if (select !== false) query = query.select();
        break;
      case 'update':
        query = supabase.from(table).update(data);
        break;
      case 'delete':
        query = supabase.from(table).delete();
        break;
      case 'upsert':
        query = supabase.from(table).upsert(data, upsertOpts || {});
        if (select !== false) query = query.select();
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Apply filters
    if (filters && Array.isArray(filters)) {
      for (const f of filters) {
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
          case 'or': query = query.or(f.expr); break;
          case 'match': query = query.match(f.val); break;
          case 'filter': query = query.filter(f.col, f.op, f.val); break;
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

    return res.status(200).json({
      data: result.data,
      error: result.error,
      count: result.count !== undefined ? result.count : undefined
    });

  } catch (err) {
    console.error('Query proxy error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
