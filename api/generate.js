export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { promptContext, model } = req.body;
  
  // Mengambil API Key dari Environment Variable Vercel
  const apiKey = process.env.SECRET_AI_API_KEY; 

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key server belum dikonfigurasi.' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sac-footprint.vercel.app', 
        'X-Title': 'SAC-Footprint Surabaya'
      },
      body: JSON.stringify({
        model: model || 'meta-llama/llama-3-8b-instruct:free',
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
    return res.status(200).json(data);
  } catch (error) {
    console.error('AI API Error:', error);
    return res.status(500).json({ error: 'Gagal terhubung ke server AI.' });
  }
}

