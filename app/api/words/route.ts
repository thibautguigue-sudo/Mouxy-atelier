import { NextRequest, NextResponse } from 'next/server';
import { addWord, getWords, getPhase, sessionExists } from '@/lib/redis';
import { validateWord } from '@/lib/utils';
import { WordTag, WORD_TAGS } from '@/lib/types';

// GET - Récupérer tous les mots
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

    const normalizedCode = code.toUpperCase();
    
    if (!await sessionExists(normalizedCode)) {
      return NextResponse.json(
        { error: 'Session introuvable' },
        { status: 404 }
      );
    }

    const words = await getWords(normalizedCode);
    return NextResponse.json({ words });
  } catch (error) {
    console.error('Error getting words:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Ajouter un mot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, word, tag } = body;

    if (!code || !word || !tag) {
      return NextResponse.json(
        { error: 'Code, mot et tag requis' },
        { status: 400 }
      );
    }

    const normalizedCode = code.toUpperCase();

    // Vérifier que la session existe
    if (!await sessionExists(normalizedCode)) {
      return NextResponse.json(
        { error: 'Session introuvable' },
        { status: 404 }
      );
    }

    // Vérifier qu'on est en phase 1
    const phase = await getPhase(normalizedCode);
    if (phase !== 'phase1') {
      return NextResponse.json(
        { error: 'Les mots ne peuvent être ajoutés qu\'en phase 1' },
        { status: 400 }
      );
    }

    // Valider le tag
    if (!WORD_TAGS.includes(tag as WordTag)) {
      return NextResponse.json(
        { error: 'Tag invalide' },
        { status: 400 }
      );
    }

    // Valider le mot
    const validation = validateWord(word);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Ajouter le mot
    const newCount = await addWord(normalizedCode, word.trim(), tag as WordTag);

    return NextResponse.json({
      success: true,
      word: word.trim().toLowerCase(),
      tag,
      count: newCount,
    });
  } catch (error) {
    console.error('Error adding word:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
