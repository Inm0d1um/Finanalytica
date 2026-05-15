/**
 * FinAnalytica — Vercel Serverless Proxy para API de Anthropic
 *
 * INSTRUCCIONES DE DESPLIEGUE (3 minutos, gratis):
 * ─────────────────────────────────────────────────
 * 1. Asegúrate de que este archivo esté en la carpeta /api/ de tu repo
 * 2. Ve a vercel.com → importa tu repositorio de GitHub
 * 3. Clic en Deploy (sin cambiar nada)
 * 4. Vercel te da una URL: https://finanalytica.vercel.app
 * 5. En FinAnalytica → ⚙️ Configuración → URL del proxy:
 *    https://finanalytica.vercel.app/api/proxy
 *
 * Plan gratuito de Vercel:
 * - 100 GB de bandwidth/mes
 * - Serverless functions incluidas
 * - Sin tarjeta de crédito requerida
 */

export default async function handler(req, res) {
  // CORS — permite cualquier origen (puedes restringir a tu dominio)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key, Anthropic-Version');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Método no permitido' } });
  }

  const apiKey = req.headers['x-api-key'] || '';

  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    return res.status(401).json({ error: { message: 'API key inválida o no proporcionada' } });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (err) {
    return res.status(500).json({ error: { message: 'Error del proxy: ' + err.message } });
  }
}
