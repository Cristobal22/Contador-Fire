import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0-rc.10'

serve(async (req) => {
  try {
    const { userData, password } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // 1. Create the user in Supabase Auth using the admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: password,
      email_confirm: false, // User is created by an admin, so we auto-confirm
    })

    if (authError) {
      // This will catch issues like duplicate emails
      throw new Error(`Auth error: ${authError.message}`)
    }

    if (!authData || !authData.user) {
        throw new Error('Authentication failed: user data not returned after creation.');
    }

    const userId = authData.user.id;

    // 2. Add the user profile to the public 'users' table
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert([{ ...userData, id: userId }])

    if (dbError) {
      // If the database insert fails, roll back by deleting the user from Auth
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw new Error(`Database error: ${dbError.message}`)
    }

    // 3. Return the newly created user's profile
    return new Response(JSON.stringify({ user: { ...userData, id: userId } }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
