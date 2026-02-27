// Edge Function: manage-users
// Permite que mentores criem e gerenciem usuarios de forma segura
// A chave service_role fica apenas no servidor (seguro)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header (user's JWT)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with user's JWT to check permissions
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Client with user's permissions (to verify they're a mentor)
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Client with admin permissions (to create users)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get the current user
    const { data: { user: authUser }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !authUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is a mentor
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('auth_id', authUser.id)
      .single()

    if (userError || !currentUser?.role?.startsWith('mentor')) {
      return new Response(
        JSON.stringify({ error: 'Only mentors can manage users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { action, ...params } = await req.json()

    switch (action) {
      case 'create': {
        // Create a new user
        const { email, password, full_name, role = 'aluno', cpf } = params

        if (!email || !password) {
          return new Response(
            JSON.stringify({ error: 'Email and password are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Create user in Supabase Auth
        const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto-confirm email
          user_metadata: { full_name, role }
        })

        if (createAuthError) {
          return new Response(
            JSON.stringify({ error: createAuthError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Create user in our users table
        const { data: userData, error: createUserError } = await supabaseAdmin
          .from('users')
          .insert({
            auth_id: authData.user.id,
            email,
            full_name,
            role,
            cpf: cpf || null,
            password_hash: 'managed_by_supabase_auth', // Placeholder - auth handled by Supabase
            first_login_completed: false,
            questionnaire_step: 0
          })
          .select()
          .single()

        if (createUserError) {
          // Rollback: delete auth user if our user creation failed
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
          return new Response(
            JSON.stringify({ error: createUserError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, user: userData }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete': {
        // Delete a user
        const { user_id } = params

        if (!user_id) {
          return new Response(
            JSON.stringify({ error: 'user_id is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get the user's auth_id first
        const { data: userToDelete } = await supabaseAdmin
          .from('users')
          .select('auth_id')
          .eq('id', user_id)
          .single()

        // Delete from our users table (cascades to related data)
        const { error: deleteUserError } = await supabaseAdmin
          .from('users')
          .delete()
          .eq('id', user_id)

        if (deleteUserError) {
          return new Response(
            JSON.stringify({ error: deleteUserError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Delete from Supabase Auth if they have an auth_id
        if (userToDelete?.auth_id) {
          await supabaseAdmin.auth.admin.deleteUser(userToDelete.auth_id)
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_password': {
        // Update user's password
        const { user_id, new_password } = params

        if (!user_id || !new_password) {
          return new Response(
            JSON.stringify({ error: 'user_id and new_password are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get the user's auth_id
        const { data: userToUpdate } = await supabaseAdmin
          .from('users')
          .select('auth_id')
          .eq('id', user_id)
          .single()

        if (!userToUpdate?.auth_id) {
          return new Response(
            JSON.stringify({ error: 'User not found or not migrated to auth' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update password in Supabase Auth
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userToUpdate.auth_id,
          { password: new_password }
        )

        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'migrate_existing': {
        // Migrate existing user to Supabase Auth (one-time migration)
        const { user_id, password } = params

        if (!user_id || !password) {
          return new Response(
            JSON.stringify({ error: 'user_id and password are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get the existing user
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', user_id)
          .single()

        if (!existingUser) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (existingUser.auth_id) {
          return new Response(
            JSON.stringify({ error: 'User already migrated' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Create user in Supabase Auth
        const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
          email: existingUser.email,
          password,
          email_confirm: true,
          user_metadata: { full_name: existingUser.full_name, role: existingUser.role }
        })

        if (createAuthError) {
          return new Response(
            JSON.stringify({ error: createAuthError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update our users table with auth_id
        await supabaseAdmin
          .from('users')
          .update({ auth_id: authData.user.id })
          .eq('id', user_id)

        return new Response(
          JSON.stringify({ success: true, auth_id: authData.user.id }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
