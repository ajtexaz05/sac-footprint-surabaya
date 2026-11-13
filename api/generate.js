export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { promptContext, model } = req.body;
  
  // Mengambil API Key dari Environment Variable Vercel
  const apiKey = process.env.SECRET_AI_API_KEY; 

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key server belum dikonfigurasi pada environment variable Vercel (SECRET_AI_API_KEY).' });
  }

  try {
    // Base URL resmi OpenAgentic: https://openagentic.id/api/v1
    const response = await fetch('https://openagentic.id/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'kimi-k3-1-pro',
        messages: [
          {
            role: 'system',
            content: 'Anda adalah AI Asisten Analisis Spasial dan Emisi. Berikan jawaban dalam 4 poin: 📊 Kondisi & Ringkasan Angka Terkini, 🔍 Analisis Dinamika & Sumber Emisi Surabaya, ⚠️ Dampak Lingkungan & Kesehatan Masyarakat, 💡 Rekomendasi Kebijakan Mitigasi Pemkot Surabaya.'
          },
          { 
            role: 'user', 
            content: promptContext 
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('OpenAgentic API Error Response:', data);
      return res.status(response.status || 500).json({ 
        error: data?.error?.message || data?.error || 'Gagal menerima respon valid dari OpenAgentic.' 
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('AI API Server Error:', error);
    return res.status(500).json({ error: 'Gagal terhubung ke server AI OpenAgentic.' });
  }
}
