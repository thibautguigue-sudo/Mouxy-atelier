import { NextRequest, NextResponse } from 'next/server';
import { getSession, addParticipant } from '@/lib/redis';
import { generateParticipantId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, participantName, participantId } = body;

    if (!code || !participantName) {
      return NextResponse.json(
        { error: 'Code et nom requis' },
        { status: 400 }
      );
    }

    const normalizedCode = code.toUpperCase().trim();
    
    // Vérifier que la session existe
    const session = await getSession(normalizedCode);
    if (!session) {
      return NextResponse.json(
        { error: 'Session introuvable. Vérifiez le code.' },
        { status: 404 }
      );
    }

    // Générer ou réutiliser l'ID participant
    const finalParticipantId = participantId || generateParticipantId();

    // Enregistrer le participant
    await addParticipant(normalizedCode, {
      id: finalParticipantId,
      name: participantName.trim(),
      joinedAt: Date.now(),
    });

    return NextResponse.json({
      code: normalizedCode,
      participantId: finalParticipantId,
      phase: session.phase,
      gentile: session.gentile,
      communeName: session.communeName,
    });
  } catch (error) {
    console.error('Error joining session:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
