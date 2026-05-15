/**
 * FinAnalytica — Cloudflare Worker Proxy para API de Anthropic
 *
 * INSTRUCCIONES (5 minutos, gratis, sin tarjeta):
 * ────────────────────────────────────────────────
 * 1. Ve a https://workers.cloudflare.com → crea cuenta
 * 2. "Create a Worker" → borra el ejemplo → pega este archivo completo
 * 3. "Save and Deploy"
 * 4. Copia la URL: https://NOMBRE.TU-USUARIO.workers.dev
 * 5. En FinAnalytica → ⚙️ → pega esa URL en "URL del Proxy" → Guardar
 *
 * Plan gratuito: 100,000 requests/día
 */

export default {
  async fetch(request) {

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key, Anthropic-Version',
    };

    // Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // GET: health check — abre la URL en el browser para verificar que funciona
    if (request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok', service: 'FinAnalytica Proxy' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: { message: 'Método no permitido' } }), {
        status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Leer API key
    const apiKey = request.headers.get('X-Api-Key') || request.headers.get('x-api-key') || '';
    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      return new Response(JSON.stringify({ error: { message: 'API key inválida o no proporcionada' } }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Leer body
    let bodyText = '';
    try {
      bodyText = await request.text();
    } catch (e) {
      return new Response(JSON.stringify({ error: { message: 'Error leyendo el body: ' + e.message } }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!bodyText || !bodyText.trim()) {
      return new Response(JSON.stringify({ error: { message: 'Body vacío' } }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validar JSON
    try { JSON.parse(bodyText); } catch (e) {
      return new Response(JSON.stringify({ error: { message: 'Body no es JSON válido' } }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Llamar a Anthropic
    let anthropicResponse;
    try {
      anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: bodyText,
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: { message: 'Error conectando con Anthropic: ' + e.message } }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Leer y devolver respuesta
    let responseText = '';
    try {
      responseText = await anthropicResponse.text();
    } catch (e) {
      return new Response(JSON.stringify({ error: { message: 'Error leyendo respuesta de Anthropic: ' + e.message } }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(responseText, {
      status: anthropicResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  },
};
