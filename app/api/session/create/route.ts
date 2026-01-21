import { NextRequest, NextResponse } from 'next/server';
import { createSession, sessionExists } from '@/lib/redis';
import { generateSessionCode } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminKey, gentile, communeName } = body;

    if (!adminKey || adminKey.length < 4) {
      return NextResponse.json(
        { error: 'La clé admin doit faire au moins 4 caractères' },
        { status: 400 }
      );
    }

    // Générer un code unique
    let code = generateSessionCode();
    let attempts = 0;
    while (await sessionExists(code) && attempts < 10) {
      code = generateSessionCode();
      attempts++;
    }

    if (attempts >= 10) {
      return NextResponse.json(
        { error: 'Impossible de générer un code unique, réessayez' },
        { status: 500 }
      );
    }

    // Créer la session
    const session = await createSession(
      code,
      adminKey,
      gentile || 'Moussards',
      communeName || 'Mouxy'
    );

    return NextResponse.json({
      code: session.code,
      phase: session.phase,
      gentile: session.gentile,
      communeName: session.communeName,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création' },
      { status: 500 }
    );
  }
}
