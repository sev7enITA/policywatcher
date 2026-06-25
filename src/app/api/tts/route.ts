import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

/**
 * PolicyWatcher - Text-to-Speech API
 *
 * @route POST /api/tts
 *
 * Converts text to natural-sounding speech using Google Cloud Text-to-Speech API.
 * Strips markdown formatting for clean spoken output. Supports English and Italian
 * with Google Neural2 voices.
 *
 * @auth    None (public endpoint).
 * @rateLimit 10 requests / hour per IP (TTS incurs API cost).
 *
 * @body {{ text: string, lang?: 'en' | 'it' }}
 * @returns Binary `audio/mpeg` stream, or a JSON error object.
 */
export async function POST(request: NextRequest) {
  // Rate limit: TTS costs API money. 10/hour per IP.
  const limited = rateLimit(request, {
    intervalMs: 60 * 60 * 1000,
    max: 10,
    name: 'tts',
  });
  if (limited) return limited;

  try {
    const { text, lang = 'en' } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing "text" parameter.' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_TTS_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No TTS API key configured. Set GOOGLE_TTS_API_KEY or GEMINI_API_KEY.' },
        { status: 500 }
      );
    }

    // Clean markdown artifacts for spoken output
    const cleanText = text
      .replace(/[#*`_~]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/- /g, '. ')
      .trim()
      .substring(0, 5000); // TTS API limit

    // Select natural-sounding Neural2 voices
    const voiceConfig = lang === 'it'
      ? { languageCode: 'it-IT', name: 'it-IT-Neural2-A' }
      : { languageCode: 'en-US', name: 'en-US-Neural2-F' };

    const ttsPayload = {
      input: { text: cleanText },
      voice: {
        ...voiceConfig,
        ssmlGender: 'FEMALE',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0,
        effectsProfileId: ['small-bluetooth-speaker-class-device'],
      },
    };

    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ttsPayload),
      }
    );

    if (!ttsResponse.ok) {
      const errBody = await ttsResponse.text();
      console.error('Google TTS API error:', ttsResponse.status, errBody);

      // If TTS API is not enabled or key doesn't have permission, return a clear message
      if (ttsResponse.status === 403 || ttsResponse.status === 401) {
        return NextResponse.json(
          {
            error: 'TTS API not enabled or key lacks permission. Enable "Cloud Text-to-Speech API" in Google Cloud Console.',
            fallback: true,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: `TTS API error: ${ttsResponse.status}` },
        { status: 502 }
      );
    }

    const data = await ttsResponse.json();

    if (!data.audioContent) {
      return NextResponse.json({ error: 'No audio content returned.' }, { status: 500 });
    }

    // Convert base64 audio to binary
    const audioBuffer = Buffer.from(data.audioContent, 'base64');

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('TTS route error:', error);
    return NextResponse.json(
      { error: `TTS processing error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
