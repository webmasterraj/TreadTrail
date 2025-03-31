import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the request body
    const { userId } = await req.json()

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get the user making the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Security check - users can only delete themselves
    if (user.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'You can only delete your own account' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete user data from all tables
    // Delete user workout history
    const { error: workoutHistoryError } = await supabaseAdmin
      .from('workout_history')
      .delete()
      .eq('user_id', userId)
    if (workoutHistoryError) {
      console.error('Error deleting workout history:', workoutHistoryError)
    }
    
    // Delete user settings
    const { error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .delete()
      .eq('id', userId)
    if (settingsError) {
      console.error('Error deleting user settings:', settingsError)
    }
    
    // Delete favorites
    const { error: favoritesError } = await supabaseAdmin
      .from('user_favorite_workouts')
      .delete()
      .eq('user_id', userId)    
    if (favoritesError) {
      console.error('Error deleting user favorites:', favoritesError)
    }

    // Delete premium subscriptions
    const { error: premiumError } = await supabaseAdmin
      .from('premium_subscriptions')
      .delete()
      .eq('user_id', userId)
    if (premiumError) {
      console.error('Error deleting premium subscriptions:', premiumError)
    }

    // Delete from the users table
    const { error: userTableError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)
    if (userTableError) {
      console.error('Error deleting users table:', userTableError)
    }

    // Delete the user from Supabase auth using admin call
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
