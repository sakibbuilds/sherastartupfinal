import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { video_id } = await req.json();
    
    if (!video_id) {
      console.error('Missing video_id');
      return new Response(
        JSON.stringify({ error: 'video_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP from headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
    
    console.log(`Tracking view for video ${video_id} from IP ${ip}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this IP has viewed this video in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: existingView } = await supabase
      .from('video_view_logs')
      .select('id, viewed_at')
      .eq('video_id', video_id)
      .eq('ip_address', ip)
      .single();

    if (existingView) {
      const lastViewed = new Date(existingView.viewed_at);
      const now = new Date();
      const hoursSinceLastView = (now.getTime() - lastViewed.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastView < 24) {
        console.log(`IP ${ip} already viewed video ${video_id} ${hoursSinceLastView.toFixed(1)} hours ago, skipping count`);
        return new Response(
          JSON.stringify({ counted: false, message: 'View already counted within 24 hours' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update the viewed_at timestamp and increment view count
      console.log(`IP ${ip} last viewed over 24h ago, updating timestamp and counting view`);
      
      await supabase
        .from('video_view_logs')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', existingView.id);
    } else {
      // Insert new view log
      console.log(`First view from IP ${ip} for video ${video_id}`);
      
      const { error: insertError } = await supabase
        .from('video_view_logs')
        .insert({ video_id, ip_address: ip });
      
      if (insertError) {
        console.error('Error inserting view log:', insertError);
      }
    }

    // Increment view count on the video
    const { data: video } = await supabase
      .from('video_pitches')
      .select('views_count')
      .eq('id', video_id)
      .single();

    if (video) {
      const { error: updateError } = await supabase
        .from('video_pitches')
        .update({ views_count: (video.views_count || 0) + 1 })
        .eq('id', video_id);

      if (updateError) {
        console.error('Error updating view count:', updateError);
      } else {
        console.log(`View count incremented for video ${video_id}`);
      }
    }

    return new Response(
      JSON.stringify({ counted: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in track-view:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});