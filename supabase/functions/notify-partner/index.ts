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

    console.log(`[NOTIFY] Intentando enviar notificación a User: ${user_id} con ID OneSignal: ${sub.subscription.onesignal_id}`);

    const osApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
    const osAppId = Deno.env.get('NEXT_PUBLIC_ONESIGNAL_APP_ID');

    if (!osApiKey || !osAppId) {
      console.error("[NOTIFY] Error: Faltan secretos ONESIGNAL_REST_API_KEY o NEXT_PUBLIC_ONESIGNAL_APP_ID");
      return new Response(JSON.stringify({ error: 'Configuración incompleta en Supabase Secrets' }), { status: 500 });
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Key ${osApiKey}`
      },
      body: JSON.stringify({
        app_id: osAppId,
        include_subscription_ids: [sub.subscription.onesignal_id],
        contents: { "en": body, "es": body },
        headings: { "en": title, "es": title },
        url: "https://recuperadora-sinquejas.nojauc.easypanel.host/"
      })
    })

    const result = await response.json()
    console.log("[NOTIFY] Respuesta de OneSignal:", JSON.stringify(result))
    
    if (!response.ok) {
      console.error("[NOTIFY] Error en OneSignal:", response.status, result)
    }

    return new Response(JSON.stringify({ success: response.ok, onesignal: result }), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
