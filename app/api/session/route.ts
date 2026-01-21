import { NextRequest, NextResponse } from 'next/server';
import { getSession, getPhase, getParticipants } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Code de session requis' },
        { status: 400 }
      );
    }

    const session = await getSession(code.toUpperCase());
    if (!session) {
      return NextResponse.json(
        { error: 'Session introuvable' },
        { status: 404 }
      );
    }

    const phase = await getPhase(code.toUpperCase());
    const participants = await getParticipants(code.toUpperCase());

    return NextResponse.json({
      code: session.code,
      phase,
      gentile: session.gentile,
      communeName: session.communeName,
      participantCount: participants.length,
      createdAt: session.createdAt,
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
