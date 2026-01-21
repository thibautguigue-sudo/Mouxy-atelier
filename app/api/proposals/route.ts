import { NextRequest, NextResponse } from 'next/server';
import { addProposal, getProposals, getPhase, sessionExists, updateProposal } from '@/lib/redis';
import { validateProposalName, validateJustification, generateProposalId } from '@/lib/utils';
import { FormType, FORM_TYPES, Proposal } from '@/lib/types';

// GET - Récupérer toutes les propositions
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

    const proposals = await getProposals(normalizedCode);
    
    // Filtrer les propositions fusionnées pour l'affichage
    const activeProposals = proposals.filter(p => !p.mergedInto);
    
    return NextResponse.json({ 
      proposals: activeProposals,
      allProposals: proposals,
    });
  } catch (error) {
    console.error('Error getting proposals:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Ajouter une proposition
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, justification, subtitle, groupId, form, participantId } = body;

    if (!code || !name || !justification || !groupId || !form || !participantId) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
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

    // Vérifier qu'on est en phase 2
    const phase = await getPhase(normalizedCode);
    if (phase !== 'phase2') {
      return NextResponse.json(
        { error: 'Les propositions ne peuvent être ajoutées qu\'en phase 2' },
        { status: 400 }
      );
    }

    // Valider la forme
    const validForms = FORM_TYPES.map(f => f.value);
    if (!validForms.includes(form as FormType)) {
      return NextResponse.json(
        { error: 'Forme invalide' },
        { status: 400 }
      );
    }

    // Valider le groupe
    if (groupId < 1 || groupId > 5) {
      return NextResponse.json(
        { error: 'Groupe invalide (1-5)' },
        { status: 400 }
      );
    }

    // Valider le nom
    const nameValidation = validateProposalName(name);
    if (!nameValidation.valid) {
      return NextResponse.json(
        { error: nameValidation.error },
        { status: 400 }
      );
    }

    // Valider la justification
    const justValidation = validateJustification(justification);
    if (!justValidation.valid) {
      return NextResponse.json(
        { error: justValidation.error },
        { status: 400 }
      );
    }

    // Créer la proposition
    const proposal: Proposal = {
      id: generateProposalId(),
      name: name.trim(),
      justification: justification.trim(),
      subtitle: subtitle?.trim() || undefined,
      groupId: parseInt(groupId),
      form: form as FormType,
      participantId,
      createdAt: Date.now(),
    };

    await addProposal(normalizedCode, proposal);

    return NextResponse.json({
      success: true,
      proposal,
    });
  } catch (error) {
    console.error('Error adding proposal:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour une proposition (admin)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, proposalId, updates, adminKey } = body;

    if (!code || !proposalId || !updates) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    const normalizedCode = code.toUpperCase();

    // TODO: Vérifier adminKey dans un vrai cas
    // Pour simplifier ici, on fait confiance

    await updateProposal(normalizedCode, proposalId, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating proposal:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
