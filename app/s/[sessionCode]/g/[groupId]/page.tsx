'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  getStoredParticipantId, 
  getStoredParticipantName,
  GROUP_NAMES,
  TAG_COLORS,
  FORM_COLORS,
  validateWord,
  validateProposalName,
  validateJustification,
} from '@/lib/utils';
import { Phase, Word, WordTag, WORD_TAGS, FormType, FORM_TYPES, Proposal } from '@/lib/types';
import PhaseIndicator from '@/components/PhaseIndicator';
import WordCloud from '@/components/WordCloud';
import OfflineIndicator, { useOnlineStatus } from '@/components/OfflineIndicator';
import Toast, { useToast } from '@/components/Toast';

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const sessionCode = params.sessionCode as string;
  const groupId = parseInt(params.groupId as string);
  
  const isOnline = useOnlineStatus();
  const { toast, showToast, hideToast } = useToast();

  // États généraux
  const [phase, setPhase] = useState<Phase>('lobby');
  const [participantId, setParticipantId] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionInfo, setSessionInfo] = useState<{ gentile: string; communeName: string } | null>(null);

  // États Phase 1
  const [newWord, setNewWord] = useState('');
  const [selectedTag, setSelectedTag] = useState<WordTag>('Rassembler');
  const [words, setWords] = useState<Word[]>([]);
  const [submittingWord, setSubmittingWord] = useState(false);

  // États Phase 2
  const [selectedForm, setSelectedForm] = useState<FormType | null>(null);
  const [proposalName, setProposalName] = useState('');
  const [proposalJustification, setProposalJustification] = useState('');
  const [proposalSubtitle, setProposalSubtitle] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [myProposals, setMyProposals] = useState<Proposal[]>([]);

  // Initialisation
  useEffect(() => {
    const pid = getStoredParticipantId();
    const pname = getStoredParticipantName();
    
    if (!pid) {
      router.push('/');
      return;
    }
    
    setParticipantId(pid);
    setParticipantName(pname || 'Participant');
    
    fetchData();
    
    // Polling pour la mise à jour
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [sessionCode, groupId]);

  const fetchData = useCallback(async () => {
    try {
      // Récupérer les infos de session
      const sessionRes = await fetch(`/api/session?code=${sessionCode}`);
      const sessionData = await sessionRes.json();
      
      if (!sessionRes.ok) {
        setError(sessionData.error);
        return;
      }
      
      setPhase(sessionData.phase);
      setSessionInfo({
        gentile: sessionData.gentile,
        communeName: sessionData.communeName,
      });
      
      // Récupérer les mots
      const wordsRes = await fetch(`/api/words?code=${sessionCode}`);
      const wordsData = await wordsRes.json();
      if (wordsRes.ok) {
        setWords(wordsData.words);
      }
      
      // Récupérer les propositions
      const proposalsRes = await fetch(`/api/proposals?code=${sessionCode}`);
      const proposalsData = await proposalsRes.json();
      if (proposalsRes.ok) {
        const mine = proposalsData.proposals.filter(
          (p: Proposal) => p.participantId === getStoredParticipantId()
        );
        setMyProposals(mine);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setLoading(false);
    }
  }, [sessionCode]);

  // Soumission d'un mot (Phase 1)
  const handleSubmitWord = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateWord(newWord);
    if (!validation.valid) {
      showToast(validation.error!, 'error');
      return;
    }

    setSubmittingWord(true);
    
    try {
      const res = await fetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: sessionCode,
          word: newWord.trim(),
          tag: selectedTag,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(`"${newWord}" ajouté !`, 'success');
        setNewWord('');
        fetchData();
      } else {
        showToast(data.error || 'Erreur', 'error');
      }
    } catch (err) {
      showToast('Erreur réseau', 'error');
    } finally {
      setSubmittingWord(false);
    }
  };

  // Soumission d'une proposition (Phase 2)
  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedForm) {
      showToast('Choisissez une forme', 'error');
      return;
    }

    const nameValidation = validateProposalName(proposalName);
    if (!nameValidation.valid) {
      showToast(nameValidation.error!, 'error');
      return;
    }

    const justValidation = validateJustification(proposalJustification);
    if (!justValidation.valid) {
      showToast(justValidation.error!, 'error');
      return;
    }

    if (myProposals.length >= 5) {
      showToast('Maximum 5 propositions par personne', 'error');
      return;
    }

    setSubmittingProposal(true);

    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: sessionCode,
          name: proposalName.trim(),
          justification: proposalJustification.trim(),
          subtitle: proposalSubtitle.trim() || undefined,
          groupId,
          form: selectedForm,
          participantId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Proposition envoyée !', 'success');
        setProposalName('');
        setProposalJustification('');
        setProposalSubtitle('');
        fetchData();
      } else {
        showToast(data.error || 'Erreur', 'error');
      }
    } catch (err) {
      showToast('Erreur réseau', 'error');
    } finally {
      setSubmittingProposal(false);
    }
  };

  // Redirection vers le vote si nécessaire
  useEffect(() => {
    if (phase === 'vote1' || phase === 'vote2') {
      router.push(`/s/${sessionCode}/vote`);
    }
    if (phase === 'done') {
      router.push(`/s/${sessionCode}/results`);
    }
  }, [phase, router, sessionCode]);

  if (loading) {
    return (
      <main className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p>Chargement...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-4 flex items-center justify-center">
        <div className="card text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => router.push('/')} className="btn btn-secondary">
            Retour
          </button>
        </div>
      </main>
    );
  }

  const groupColors: Record<number, string> = {
    1: 'border-blue-500 bg-blue-50',
    2: 'border-green-500 bg-green-50',
    3: 'border-orange-500 bg-orange-50',
    4: 'border-purple-500 bg-purple-50',
    5: 'border-pink-500 bg-pink-50',
  };

  return (
    <main className="min-h-screen p-4 pb-20">
      <OfflineIndicator />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className={`rounded-xl border-2 p-3 mb-4 ${groupColors[groupId]}`}>
          <div className="flex justify-between items-center">
            <div>
              <span className="font-bold text-lg">{GROUP_NAMES[groupId]}</span>
              <span className="text-gray-600 ml-2">• {participantName}</span>
            </div>
            <button
              onClick={() => router.push(`/s/${sessionCode}`)}
              className="text-sm text-gray-500"
            >
              Changer
            </button>
          </div>
        </div>

        <PhaseIndicator phase={phase} className="mb-4" />

        {/* PHASE LOBBY */}
        {phase === 'lobby' && (
          <div className="card text-center">
            <div className="text-6xl mb-4 animate-pulse-soft">⏳</div>
            <h2 className="text-xl font-semibold mb-2">En attente</h2>
            <p className="text-gray-600">
              L'animateur va bientôt lancer l'atelier.
              <br />
              Restez sur cette page.
            </p>
          </div>
        )}

        {/* PHASE 1 - BRAINSTORM */}
        {phase === 'phase1' && (
          <>
            <form onSubmit={handleSubmitWord} className="card mb-4">
              <h2 className="font-semibold mb-3">
                Proposez un mot pour {sessionInfo?.communeName}
              </h2>

              <div className="mb-3">
                <input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="Ex: dynamique, solidarité..."
                  className="input"
                  maxLength={30}
                  disabled={!isOnline}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">Catégorie :</label>
                <div className="flex flex-wrap gap-2">
                  {WORD_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(tag)}
                      className={`
                        px-3 py-2 rounded-lg border-2 text-sm font-medium
                        transition-all
                        ${selectedTag === tag 
                          ? `${TAG_COLORS[tag]} ring-2 ring-offset-1` 
                          : 'bg-gray-50 border-gray-200'
                        }
                      `}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingWord || !isOnline || !newWord.trim()}
                className="btn btn-primary w-full"
              >
                {submittingWord ? '⏳ Envoi...' : '➕ Ajouter ce mot'}
              </button>
            </form>

            <div className="card">
              <h3 className="font-semibold mb-2">
                Nuage de mots ({words.length})
              </h3>
              <WordCloud words={words} maxWords={30} />
            </div>
          </>
        )}

        {/* PHASE 2 - PROPOSITIONS */}
        {phase === 'phase2' && (
          <>
            <div className="card mb-4">
              <h2 className="font-semibold mb-3">
                Choisissez une forme de nom
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Gentilé : <strong>{sessionInfo?.gentile}</strong> • 
                Commune : <strong>{sessionInfo?.communeName}</strong>
              </p>

              <div className="space-y-2 mb-4">
                {FORM_TYPES.map((form) => (
                  <button
                    key={form.value}
                    type="button"
                    onClick={() => setSelectedForm(form.value)}
                    className={`
                      w-full text-left p-3 rounded-lg border-2 transition-all
                      ${selectedForm === form.value 
                        ? `${FORM_COLORS[form.value]} border-current ring-2` 
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="font-medium">{form.label}</div>
                    <div className="text-xs text-gray-500">{form.examples}</div>
                  </button>
                ))}
              </div>

              {selectedForm && (
                <form onSubmit={handleSubmitProposal} className="border-t pt-4 mt-4">
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">
                      Nom de la liste *
                    </label>
                    <input
                      type="text"
                      value={proposalName}
                      onChange={(e) => setProposalName(e.target.value)}
                      placeholder="Ex: Ensemble pour Mouxy"
                      className="input"
                      maxLength={60}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">
                      Justification * <span className="text-gray-400">({proposalJustification.length}/140)</span>
                    </label>
                    <textarea
                      value={proposalJustification}
                      onChange={(e) => setProposalJustification(e.target.value)}
                      placeholder="Pourquoi ce nom ? (obligatoire)"
                      className="input min-h-[80px]"
                      maxLength={140}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Sous-titre <span className="text-gray-400">(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={proposalSubtitle}
                      onChange={(e) => setProposalSubtitle(e.target.value)}
                      placeholder="Ex: Pour un avenir partagé"
                      className="input"
                      maxLength={60}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingProposal || !isOnline || !proposalName.trim() || !proposalJustification.trim()}
                    className="btn btn-primary w-full"
                  >
                    {submittingProposal ? '⏳ Envoi...' : '📤 Soumettre cette proposition'}
                  </button>

                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Vous pouvez soumettre jusqu'à 5 propositions ({myProposals.length}/5)
                  </p>
                </form>
              )}
            </div>

            {myProposals.length > 0 && (
              <div className="card">
                <h3 className="font-semibold mb-2">Mes propositions</h3>
                <ul className="space-y-2">
                  {myProposals.map((p) => (
                    <li key={p.id} className={`p-3 rounded-lg ${FORM_COLORS[p.form]} border`}>
                      <div className="font-medium">{p.name}</div>
                      {p.subtitle && <div className="text-sm italic">{p.subtitle}</div>}
                      <div className="text-xs text-gray-600 mt-1">{p.justification}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="card mt-4">
              <h3 className="font-semibold mb-2">Mots inspirants</h3>
              <WordCloud words={words} maxWords={20} showCounts={false} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
