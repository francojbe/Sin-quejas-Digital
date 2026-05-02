import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, title, body } = await req.json()

    const { data: sub } = await supabaseClient
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', user_id)
      .single()

    if (!sub || !sub.subscription?.onesignal_id) {
      return new Response(JSON.stringify({ error: 'No OneSignal ID found' }), { status: 404 })
    }

    console.log(`Intentando enviar notificación a User: ${user_id} con ID: ${sub.subscription.onesignal_id}`);

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": "Key os_v2_app_o2w6xa6c3rfx5nybvcfev7nzivb32225iq2uqkuh2h3o3lqhfvuno2gmh727owisao6cerrvf7nw6iggrh5ornth6a4cyc6xrx5633a"
      },
      body: JSON.stringify({
        app_id: "76adeb83-c2dc-4b7e-b701-a88a4afdb945",
        include_subscription_ids: [sub.subscription.onesignal_id],
        contents: { "en": body, "es": body },
        headings: { "en": title, "es": title },
        url: "https://recuperadora-sinquejas.nojauc.easypanel.host/"
      })
    })

    const result = await response.json()
    console.log("OneSignal Response Details:", JSON.stringify(result))
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
