import { SYSTEM_INSTRUCTION, AI_CONFIG, isQuotaError } from '../src/utils/aiPrompt.js';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS,POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request body' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const { promptContext, model } = body || {};
  const apiKey = process.env.SECRET_AI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          'API Key server belum dikonfigurasi pada Environment Variables Vercel (SECRET_AI_API_KEY).',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  if (!promptContext) {
    return new Response(
      JSON.stringify({ error: 'Parameter promptContext wajib disertakan.' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  const encoder = new TextEncoder();
  let heartbeatTimer = null;
  const abortController = new AbortController();

  const stream = new ReadableStream({
    async start(controller) {
      // 1. Kirim initial keep-alive segera (< 10ms) agar memenuhi syarat TTFB 25s Vercel Edge
      controller.enqueue(encoder.encode(': keep-alive start\n\n'));
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ status: 'thinking' })}\n\n`)
      );

      // 2. Heartbeat berkala setiap 3 detik untuk menjaga socket tetap aktif di Edge & browser
      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive ping\n\n'));
        } catch {
          clearInterval(heartbeatTimer);
        }
      }, 3000);

      try {
        let targetModel = model || AI_CONFIG.model;
        if (targetModel === 'kimi-k3-1-pro') targetModel = AI_CONFIG.model;

        const openAgenticRes = await fetch(
          'https://openagentic.id/api/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            signal: abortController.signal,
            body: JSON.stringify({
              model: targetModel,
              stream: true,
              messages: [
                { role: 'system', content: SYSTEM_INSTRUCTION },
                { role: 'user', content: promptContext },
              ],
              max_tokens: AI_CONFIG.maxTokens,
              temperature: AI_CONFIG.temperature,
            }),
          }
        );

        if (!openAgenticRes.ok) {
          clearInterval(heartbeatTimer);
          const errText = await openAgenticRes.text();
          let errMsg = `Error dari OpenAgentic (Status ${openAgenticRes.status})`;
          let quotaDetected = false;
          try {
            const errJson = JSON.parse(errText);
            errMsg = errJson?.error?.message || errMsg;
            quotaDetected = isQuotaError(openAgenticRes.status, errMsg);
          } catch {
            /* ignore json error */
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: errMsg,
                isQuotaExhausted: quotaDetected,
              })}\n\n`
            )
          );
          controller.close();
          return;
        }

        const reader = openAgenticRes.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let contentDelivered = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;

            if (trimmed.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const delta = parsed.choices?.[0]?.delta;

                if (delta?.content) {
                  contentDelivered = true;
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ content: delta.content })}\n\n`
                    )
                  );
                }
              } catch {
                /* ignore incomplete chunk */
              }
            }
          }
        }

        clearInterval(heartbeatTimer);

        if (!contentDelivered) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error:
                  'Server AI membutuhkan waktu penalaran lebih lama. Silakan klik Perbarui Analisis sekali lagi.',
              })}\n\n`
            )
          );
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        clearInterval(heartbeatTimer);
        try {
          const isAbort =
            err.name === 'AbortError' || abortController.signal.aborted;
          const errorText = isAbort
            ? 'Koneksi penalaran dibatalkan.'
            : 'Terjadi gangguan koneksi ke server AI: ' + err.message;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorText })}\n\n`)
          );
          controller.close();
        } catch {
          /* ignore controller closed */
        }
      }
    },
    cancel() {
      clearInterval(heartbeatTimer);
      if (!abortController.signal.aborted) {
        abortController.abort();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
