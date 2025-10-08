import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0-rc.10'

serve(async (req) => {
  try {
    const { userData, password } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.createUser({
      email: userData.email,
      password: password,
      email_confirm: true, // Optionally, you can require email confirmation
    })

    if (authError) {
      throw new Error(`Auth error: ${authError.message}`)
    }

    const userId = authData.user.id;

    // Add the user data to the 'users' table
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert([{ ...userData, id: userId }])

    if (dbError) {
      // If the database insert fails, you might want to delete the user from Auth to keep things consistent
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw new Error(`Database error: ${dbError.message}`)
    }

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
