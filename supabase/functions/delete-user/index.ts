import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, startupIds } = await req.json();
    console.log('Function invoked with:', { userId, startupIds });
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (userId) {
      console.log(`Starting deletion for user: ${userId}`);

      // Step 1: Delete all connections involving the user
      console.log('Step 1: Deleting user connections...');
      const { error: connErrorA } = await supabaseAdmin.from('connections').delete().eq('user_a', userId);
      if (connErrorA) throw new Error(`Failed to delete connections (user_a): ${connErrorA.message}`);
      const { error: connErrorB } = await supabaseAdmin.from('connections').delete().eq('user_b', userId);
      if (connErrorB) throw new Error(`Failed to delete connections (user_b): ${connErrorB.message}`);
      console.log('Step 1: Connections deleted successfully.');

      // Step 2: Delete likes given by the user
      console.log('Step 2: Deleting video pitch likes...');
      const { error: likesError } = await supabaseAdmin.from('video_pitch_likes').delete().eq('user_id', userId);
      if (likesError) throw new Error(`Failed to delete video pitch likes: ${likesError.message}`);
      console.log('Step 2: Likes deleted successfully.');

      // Step 3: Delete video pitches created by the user.
      console.log('Step 3: Deleting video pitches...');
      const { error: pitchesError } = await supabaseAdmin.from('video_pitches').delete().eq('user_id', userId);
      if (pitchesError) throw new Error(`Failed to delete video pitches: ${pitchesError.message}`);
      console.log('Step 3: Pitches deleted successfully.');

      // Step 4: Delete startups founded by the user.
      console.log('Step 4: Deleting startups...');
      const { error: startupsError } = await supabaseAdmin.from('startups').delete().eq('founder_id', userId);
      if (startupsError) throw new Error(`Failed to delete startups: ${startupsError.message}`);
      console.log('Step 4: Startups deleted successfully.');

      // Step 5: Delete the user from auth, which cascades to 'profiles' and 'startup_team_members'
      console.log('Step 5: Deleting user from auth...');
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) throw new Error(`Failed to delete user from auth: ${authError.message}`);
      console.log('Step 5: Auth user deleted successfully.');

      return new Response(JSON.stringify({ message: `User ${userId} deleted successfully` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else if (startupIds && Array.isArray(startupIds) && startupIds.length > 0) {
      console.log(`Starting deletion for startups: ${startupIds.join(', ')}`);
      
      // The schema has ON DELETE CASCADE for relationships to startups, so a direct delete is enough.
      const { error } = await supabaseAdmin.from('startups').delete().in('id', startupIds);
      if (error) {
        console.error('Error deleting startups:', error);
        throw new Error(`Failed to delete startup(s): ${error.message}`);
      }
      console.log('Startups deleted successfully.');

      return new Response(JSON.stringify({ message: `Startup(s) deleted successfully` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else {
      throw new Error('A valid userId or a non-empty startupIds array must be provided');
    }

  } catch (error) {
    console.error('An unhandled error occurred:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, 
    });
  }
});
