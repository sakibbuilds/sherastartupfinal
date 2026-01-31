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
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (userId) {
      // 1. Delete associated startups
      const { error: startupError } = await supabaseAdmin
        .from('startups')
        .delete()
        .eq('founder_id', userId);
      if (startupError) console.warn(`Could not delete startups for user ${userId}:`, startupError.message);

      // 2. Delete the user from auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) {
        throw new Error(`Failed to delete user from auth: ${authError.message}`);
      }

      return new Response(JSON.stringify({ message: `User ${userId} and their startups deleted successfully` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else if (startupIds && Array.isArray(startupIds) && startupIds.length > 0) {
      // Delete one or more startups
      const { error } = await supabaseAdmin
        .from('startups')
        .delete()
        .in('id', startupIds);
      if (error) throw error;

      return new Response(JSON.stringify({ message: `Startup(s) deleted successfully` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else {
      return new Response(JSON.stringify({ error: 'userId or startupIds must be provided' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
