import { NextRequest, NextResponse } from 'next/server';
import { 
  getSession, 
  setPhase, 
  getWords, 
  getProposals, 
  getShortlist,
  setShortlist,
  getVoteResults,
  getVoterCount,
  getParticipants,
  setFinalResults,
  getFinalResults,
  updateShortlistItem,
} from '@/lib/redis';
import { Phase, ShortlistItem, FinalResults } from '@/lib/types';

// GET - Récupérer toutes les données admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const adminKey = searchParams.get('key');

    if (!code || !adminKey) {
      return NextResponse.json(
        { error: 'Code et clé admin requis' },
        { status: 400 }
      );
    }

    const normalizedCode = code.toUpperCase();
    const session = await getSession(normalizedCode);

    if (!session) {
      return NextResponse.json(
        { error: 'Session introuvable' },
        { status: 404 }
      );
    }

    if (session.adminKey !== adminKey) {
      return NextResponse.json(
        { error: 'Clé admin invalide' },
        { status: 403 }
      );
    }

    // Récupérer toutes les données
    const words = await getWords(normalizedCode);
    const proposals = await getProposals(normalizedCode);
    const shortlist = await getShortlist(normalizedCode);
    const participants = await getParticipants(normalizedCode);
    const votesR1 = await getVoteResults(normalizedCode, 1);
    const votesR2 = await getVoteResults(normalizedCode, 2);
    const voterCountR1 = await getVoterCount(normalizedCode, 1);
    const voterCountR2 = await getVoterCount(normalizedCode, 2);
    const finalResults = await getFinalResults(normalizedCode);

    // Enrichir la shortlist avec les votes
    const enrichedShortlist = shortlist.map(item => ({
      ...item,
      votesR1: votesR1.get(item.id) || 0,
      votesR2: votesR2.get(item.id) || 0,
    }));

    return NextResponse.json({
      session: {
        code: session.code,
        phase: session.phase,
        gentile: session.gentile,
        communeName: session.communeName,
        createdAt: session.createdAt,
      },
      words,
      proposals,
      shortlist: enrichedShortlist,
      participants,
      voterCountR1,
      voterCountR2,
      finalResults,
    });
  } catch (error) {
    console.error('Error getting admin data:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Actions admin (changer phase, publier shortlist, etc.)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, adminKey, action, data } = body;

    if (!code || !adminKey || !action) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    const normalizedCode = code.toUpperCase();
    const session = await getSession(normalizedCode);

    if (!session) {
      return NextResponse.json(
        { error: 'Session introuvable' },
        { status: 404 }
      );
    }

    if (session.adminKey !== adminKey) {
      return NextResponse.json(
        { error: 'Clé admin invalide' },
        { status: 403 }
      );
    }

    switch (action) {
      case 'setPhase': {
        const validPhases: Phase[] = ['lobby', 'phase1', 'phase2', 'vote1', 'vote2', 'done'];
        if (!validPhases.includes(data.phase)) {
          return NextResponse.json(
            { error: 'Phase invalide' },
            { status: 400 }
          );
        }
        await setPhase(normalizedCode, data.phase);
        return NextResponse.json({ success: true, phase: data.phase });
      }

      case 'publishShortlist': {
        if (!data.items || !Array.isArray(data.items)) {
          return NextResponse.json(
            { error: 'Liste de propositions requise' },
            { status: 400 }
          );
        }
        
        // Valider et formater les items
        const shortlistItems: ShortlistItem[] = data.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          justification: item.justification,
          subtitle: item.subtitle,
          groupId: item.groupId,
          form: item.form,
        }));

        await setShortlist(normalizedCode, shortlistItems);
        return NextResponse.json({ success: true, count: shortlistItems.length });
      }

      case 'updateShortlistItem': {
        if (!data.itemId || !data.updates) {
          return NextResponse.json(
            { error: 'itemId et updates requis' },
            { status: 400 }
          );
        }
        await updateShortlistItem(normalizedCode, data.itemId, data.updates);
        return NextResponse.json({ success: true });
      }

      case 'finalize': {
        // Finaliser les résultats
        const { top1, alt1, alt2 } = data;
        
        if (!top1 || !alt1 || !alt2) {
          return NextResponse.json(
            { error: 'Top1, alt1 et alt2 requis' },
            { status: 400 }
          );
        }

        const words = await getWords(normalizedCode);
        const proposals = await getProposals(normalizedCode);

        const finalResults: FinalResults = {
          top1,
          alt1,
          alt2,
          wordsCloud: words,
          allProposals: proposals,
          sessionInfo: session,
          completedAt: Date.now(),
        };

        await setFinalResults(normalizedCode, finalResults);
        await setPhase(normalizedCode, 'done');

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: 'Action inconnue' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in admin action:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
