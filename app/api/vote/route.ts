import { NextRequest, NextResponse } from 'next/server';
import { 
  recordVote, 
  hasVoted, 
  getVoteResults, 
  getVoterCount,
  getShortlist,
  getPhase,
  sessionExists,
  updateShortlistItem
} from '@/lib/redis';

// GET - Vérifier si déjà voté et obtenir les résultats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const participantId = searchParams.get('participantId');
    const round = searchParams.get('round');

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

    const phase = await getPhase(normalizedCode);
    const shortlist = await getShortlist(normalizedCode);
    
    // Vérifier si le participant a voté
    let hasVotedR1 = false;
    let hasVotedR2 = false;
    if (participantId) {
      hasVotedR1 = await hasVoted(normalizedCode, 1, participantId);
      hasVotedR2 = await hasVoted(normalizedCode, 2, participantId);
    }

    // Récupérer les résultats des votes
    const votesR1 = await getVoteResults(normalizedCode, 1);
    const votesR2 = await getVoteResults(normalizedCode, 2);
    const voterCountR1 = await getVoterCount(normalizedCode, 1);
    const voterCountR2 = await getVoterCount(normalizedCode, 2);

    // Enrichir la shortlist avec les votes
    const enrichedShortlist = shortlist.map(item => ({
      ...item,
      votesR1: votesR1.get(item.id) || 0,
      votesR2: votesR2.get(item.id) || 0,
    }));

    return NextResponse.json({
      phase,
      shortlist: enrichedShortlist,
      hasVotedR1,
      hasVotedR2,
      voterCountR1,
      voterCountR2,
    });
  } catch (error) {
    console.error('Error getting vote status:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Enregistrer un vote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, participantId, proposalIds, round } = body;

    if (!code || !participantId || !proposalIds || !round) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    const normalizedCode = code.toUpperCase();
    const roundNum = parseInt(round) as 1 | 2;

    if (roundNum !== 1 && roundNum !== 2) {
      return NextResponse.json(
        { error: 'Round invalide (1 ou 2)' },
        { status: 400 }
      );
    }

    // Vérifier la session
    if (!await sessionExists(normalizedCode)) {
      return NextResponse.json(
        { error: 'Session introuvable' },
        { status: 404 }
      );
    }

    // Vérifier la phase
    const phase = await getPhase(normalizedCode);
    const expectedPhase = roundNum === 1 ? 'vote1' : 'vote2';
    if (phase !== expectedPhase) {
      return NextResponse.json(
        { error: `Le vote du tour ${roundNum} n'est pas ouvert` },
        { status: 400 }
      );
    }

    // Vérifier le nombre de votes
    const maxVotes = roundNum === 1 ? 3 : 1;
    if (proposalIds.length > maxVotes) {
      return NextResponse.json(
        { error: `Maximum ${maxVotes} vote(s) pour le tour ${roundNum}` },
        { status: 400 }
      );
    }

    if (proposalIds.length === 0) {
      return NextResponse.json(
        { error: 'Vous devez voter pour au moins une proposition' },
        { status: 400 }
      );
    }

    // Vérifier que les propositions sont dans la shortlist
    const shortlist = await getShortlist(normalizedCode);
    const shortlistIds = shortlist.map(s => s.id);
    
    // Pour le round 2, vérifier que c'est dans le top 3
    if (roundNum === 2) {
      const votesR1 = await getVoteResults(normalizedCode, 1);
      const sortedByVotes = shortlist
        .map(s => ({ ...s, votes: votesR1.get(s.id) || 0 }))
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 3);
      const top3Ids = sortedByVotes.map(s => s.id);
      
      for (const id of proposalIds) {
        if (!top3Ids.includes(id)) {
          return NextResponse.json(
            { error: 'Vote invalide - proposition hors du Top 3' },
            { status: 400 }
          );
        }
      }
    } else {
      for (const id of proposalIds) {
        if (!shortlistIds.includes(id)) {
          return NextResponse.json(
            { error: 'Vote invalide - proposition non shortlistée' },
            { status: 400 }
          );
        }
      }
    }

    // Enregistrer le vote
    const success = await recordVote(normalizedCode, roundNum, participantId, proposalIds);

    if (!success) {
      return NextResponse.json(
        { error: 'Vous avez déjà voté pour ce tour' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
