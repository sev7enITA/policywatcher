/**
 * PolicyWatcher - AI Chat API
 *
 * @route POST /api/chat
 *
 * Accepts a natural-language question and an optional list of policy IDs,
 * retrieves the relevant policy texts from the database, and forwards them
 * as context to Google Gemini to produce an AI-generated answer.
 *
 * @auth    None (public endpoint).
 * @rateLimit 10 requests / minute per IP (AI inference is expensive).
 *
 * @body {{ question: string; policyIds?: string[] }}
 * @returns {{ answer: string }}
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { answerPolicyQuestion } from '@/lib/gemini';
import { rateLimit } from '@/lib/rateLimit';

/**
 * Handles a POST request to answer a user question about tracked policies.
 *
 * @param request - The incoming Next.js request containing `question` and optional `policyIds`.
 * @returns A JSON response with the AI-generated `answer`, or an error object.
 */
export async function POST(request: NextRequest) {
  // Rate limit: AI is expensive. 10 questions/min per IP.
  const limited = rateLimit(request, { intervalMs: 60_000, max: 10, name: 'chat' });
  if (limited) return limited;

  try {
    const { question, policyIds } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: "Il parametro 'question' è richiesto." },
        { status: 400 }
      );
    }

    // Fetch relevant policies context
    let policiesToQuery: any[] = [];

    if (policyIds && policyIds.length > 0) {
      policiesToQuery = await db.policy.findMany({
        where: {
          id: { in: policyIds },
        },
        include: {
          company: true,
        },
      });
    } else {
      // Fetch latest policies for all companies
      policiesToQuery = await db.policy.findMany({
        include: {
          company: true,
        },
      });
    }

    const contextPolicies = policiesToQuery.map((p: any) => ({
      company: p.company.name,
      policyName: p.name,
      text: p.currentText,
    }));

    if (contextPolicies.length === 0) {
      return NextResponse.json({
        answer: 'Nessun contesto policy disponibile per rispondere alla domanda.',
      });
    }

    const answer = await answerPolicyQuestion(question, contextPolicies);

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: `Errore durante l'elaborazione della domanda: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
