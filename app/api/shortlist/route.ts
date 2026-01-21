import { NextRequest, NextResponse } from 'next/server';
import { getShortlist, sessionExists, getVoteResults } from '@/lib/redis';

// GET - Récupérer la shortlist publique
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

    const shortlist = await getShortlist(normalizedCode);
    const votesR1 = await getVoteResults(normalizedCode, 1);
    const votesR2 = await getVoteResults(normalizedCode, 2);

    // Enrichir avec les votes
    const enrichedShortlist = shortlist.map(item => ({
      ...item,
      votesR1: votesR1.get(item.id) || 0,
      votesR2: votesR2.get(item.id) || 0,
    }));

    return NextResponse.json({ shortlist: enrichedShortlist });
  } catch (error) {
    console.error('Error getting shortlist:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
