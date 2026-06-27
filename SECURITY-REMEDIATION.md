# Ward Academy — Security Remediation (API proxy layer)

This documents the response to the penetration-test report by Gabriel Magalhães Batista
(2026-02-04). **All fixes live in the `api/` proxy layer. No Supabase RLS was enabled or
changed** — RLS stays disabled by design, as the platform requires.

The proxy (`api/data/query.js`, `api/data/rpc.js`, `api/auth/*`) is the **only** path from the
browser to the database (the frontend `window.supabase` is a thin shim that POSTs to `/api/*`;
there is no anon key or direct Supabase client in the frontend). So authorization must be — and
now is — enforced in the proxy.

## Status of the reported findings

| Finding | Verdict | Notes |
|---|---|---|
| **A. BOLA — update any `users` row / escalate `role`** | Already fixed | `query.js` only lets a non-admin update a safe column set on their **own** id; `role`/`email`/`cpf`/`password_hash` are not writable. |
| **B. Auth downgrade (null `auth_id` + injected hash)** | Already fixed | `auth_id`/`password_hash` are not writable by non-admins, so the downgrade can't be triggered. |
| **C. SELECT leaks `password_hash`/CPF** | Fixed + extended | Direct `users` strip already existed; **now also closes the `list_users` RPC leak and embedded-join leaks** (see below). |
| **D. No rate limiting** | Fixed (best-effort) | Added throttling to login + public RPCs. |

## What this change set fixes (all verified with unit tests)

1. **RPC identity binding** (`api/data/rpc.js`) — `get_questionnaire_data`, `save_questionnaire_data`,
   `list_users`, `change_password` no longer trust the client-supplied requester id; it is forced to
   the authenticated `auth.uid`. `list_users` is now mentor-only. *Closes: read/write of any user's
   questionnaire, mass CPF/email dump, cross-user password reset.*
2. **Read-path IDOR** (`api/data/query.js`) — non-admin `SELECT` on user-scoped PII tables is now
   constrained to the caller's own rows (owner column `= auth.uid`). The report missed this; it was
   the widest hole (any student could read everyone's diaries, questionnaire, scores, etc.).
3. **Write-path hardening** (`api/data/query.js`) — non-admin `UPDATE`/`DELETE` are default-deny unless
   positively owner/id-scoped, and the owner filter is **force-ANDed** so a `neq`/`in`/`or` filter
   can't widen scope; `INSERT`/`UPSERT` stamp the owner to self and reject upserts that would clobber
   another user's row; scope-widening operators (`or`/`not`/`match`) are rejected on these tables.
4. **Embedded-join leak** (`api/data/query.js`) — the response sanitizer now recurses, so
   `password_hash` is stripped for everyone and CPF for non-admins at **every** nesting depth
   (e.g. `select=*,users:user_id(cpf,password_hash)` can no longer smuggle secrets).
5. **Session-token secret** (`api/_lib/auth.js`) — the HMAC secret now prefers `WARD_SESSION_SECRET`,
   then the server-only service-role key, instead of the publishable anon key. `verifyAdmin` re-derives
   the role from the **database** (not the token) and uses a canonical mentor allow-list.
6. **Rate limiting** (`api/_lib/ratelimit.js` + login/rpc) — login (`loginWithCPF`,
   `signInWithPassword`) and the public RPCs (`secure_login`, `secure_register`) are throttled by
   source IP and target CPF, returning `429` + `Retry-After`.
7. **`secure_register` gating** (`api/data/rpc.js`) — an omitted/blank/`aluno` role can no longer slip
   past the mentor gate; non-mentor callers are forced to `externo`, and the role is allow-listed.

Mentor/admin behavior is unchanged: mentors (`isAdmin`) bypass the per-user scoping and keep their
cross-user dashboards. The self-scoping table set was chosen from a per-table audit of how the
frontend actually reads each table, so legitimately-shared tables (wiki comments, self-assessment
class averages) are intentionally **excluded** from self-scoping.

## Operational note (one step recommended)

- Set a dedicated **`WARD_SESSION_SECRET`** env var (32+ random bytes) in every environment
  (production + previews). Until then the token is signed with the service-role key, which is already
  a strict improvement over the anon key. Rotating the signing secret logs users out once — no worse
  than the normal 24h token expiry.
- The rate limiter is **in-memory / per-instance** (serverless). It meaningfully blocks single-source
  brute force but for guaranteed global limits, back it with Upstash Redis or Vercel KV using the same
  keys.

## Deferred (recommended follow-ups — not in this change set)

- **Community-table write policy** (blog, kanban, research, networking, messages): a student can still
  insert/update/delete rows in these shared tables forging author/owner. Fixing safely requires a
  per-table owner-column policy mapped from each `js/app.js` write site (and `research_projects` write
  semantics are entangled with the recent deletion-permission work), so it needs its own careful pass.
- **Token revocation** (`token_version`/`jti`) for server-side logout-all on password/role change.
  Lower urgency now that the signing secret is server-only.
- **`verify_password` legacy/plaintext acceptance** in SQL — a DB function change (RLS-free) to drop
  the base64/plaintext fallback once all hashes are bcrypt.
