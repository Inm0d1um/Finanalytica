/**
 * FinAnalytica — Cloudflare Worker Proxy para API de Anthropic
 *
 * GitHub Pages solo sirve archivos estáticos — no puede hacer llamadas
 * server-side. Este Worker actúa como intermediario gratuito.
 *
 * INSTRUCCIONES (5 minutos, gratis, sin tarjeta):
 * ────────────────────────────────────────────────
 * 1. Ve a https://workers.cloudflare.com y crea una cuenta
 * 2. Clic en "Create a Worker"
 * 3. Borra el código de ejemplo y pega TODO este archivo
 * 4. Clic en "Save and Deploy"
 * 5. Copia la URL: https://finanalytica-proxy.TU-USUARIO.workers.dev
 * 6. En FinAnalytica → ⚙️ → pega esa URL en "URL del Proxy"
 *
 * Plan gratuito: 100,000 requests/día — más que suficiente.
 */

export default {
  async fetch(request) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key, Anthropic-Version',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: { message: 'Método no permitido' } }), {
        status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = request.headers.get('X-Api-Key') || '';
    if (!apiKey.startsWith('sk-ant-')) {
      return new Response(JSON.stringify({ error: { message: 'API key inválida' } }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const body = await request.text();
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body,
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: { message: 'Error del proxy: ' + err.message } }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
