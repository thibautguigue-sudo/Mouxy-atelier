'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getStoredParticipantId, getStoredParticipantName, FORM_COLORS } from '@/lib/utils';
import { Phase, ShortlistItem } from '@/lib/types';
import PhaseIndicator from '@/components/PhaseIndicator';
import OfflineIndicator, { useOnlineStatus } from '@/components/OfflineIndicator';
import Toast, { useToast } from '@/components/Toast';

export default function VotePage() {
  const params = useParams();
  const router = useRouter();
  const sessionCode = params.sessionCode as string;
  
  const isOnline = useOnlineStatus();
  const { toast, showToast, hideToast } = useToast();

  const [phase, setPhase] = useState<Phase>('lobby');
  const [participantId, setParticipantId] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hasVotedR1, setHasVotedR1] = useState(false);
  const [hasVotedR2, setHasVotedR2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voterCount, setVoterCount] = useState(0);

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
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [sessionCode]);

  const fetchData = useCallback(async () => {
    const pid = getStoredParticipantId();
    try {
      const res = await fetch(`/api/vote?code=${sessionCode}&participantId=${pid}`);
      const data = await res.json();
      
      if (res.ok) {
        setPhase(data.phase);
        setShortlist(data.shortlist);
        setHasVotedR1(data.hasVotedR1);
        setHasVotedR2(data.hasVotedR2);
        setVoterCount(data.phase === 'vote1' ? data.voterCountR1 : data.voterCountR2);
      }
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setLoading(false);
    }
  }, [sessionCode]);

  // Redirection si pas en phase de vote
  useEffect(() => {
    if (phase === 'done') {
      router.push(`/s/${sessionCode}/results`);
    }
    if (phase !== 'vote1' && phase !== 'vote2' && phase !== 'done' && !loading) {
      router.push(`/s/${sessionCode}`);
    }
  }, [phase, loading, router, sessionCode]);

  const toggleSelection = (id: string) => {
    const currentRound = phase === 'vote1' ? 1 : 2;
    const maxVotes = currentRound === 1 ? 3 : 1;

    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      if (selectedIds.length < maxVotes) {
        setSelectedIds([...selectedIds, id]);
      } else {
        showToast(`Maximum ${maxVotes} vote${maxVotes > 1 ? 's' : ''} pour ce tour`, 'info');
      }
    }
  };

  const handleSubmitVote = async () => {
    if (selectedIds.length === 0) {
      showToast('Sélectionnez au moins une proposition', 'error');
      return;
    }

    const currentRound = phase === 'vote1' ? 1 : 2;

    setSubmitting(true);

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: sessionCode,
          participantId,
          proposalIds: selectedIds,
          round: currentRound,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Vote enregistré !', 'success');
        setSelectedIds([]);
        fetchData();
      } else {
        showToast(data.error || 'Erreur lors du vote', 'error');
      }
    } catch (err) {
      showToast('Erreur réseau', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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

  const currentRound = phase === 'vote1' ? 1 : 2;
  const hasVoted = currentRound === 1 ? hasVotedR1 : hasVotedR2;
  const maxVotes = currentRound === 1 ? 3 : 1;

  // Pour le round 2, ne montrer que le top 3
  let displayedShortlist = shortlist;
  if (phase === 'vote2') {
    displayedShortlist = [...shortlist]
      .sort((a, b) => (b.votesR1 || 0) - (a.votesR1 || 0))
      .slice(0, 3);
  }

  return (
    <main className="min-h-screen p-4 pb-24">
      <OfflineIndicator />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="max-w-lg mx-auto">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold">Session {sessionCode}</h1>
          <p className="text-gray-600">{participantName}</p>
        </div>

        <PhaseIndicator phase={phase} className="mb-4" />

        {hasVoted ? (
          <div className="card text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-semibold mb-2">Vote enregistré !</h2>
            <p className="text-gray-600 mb-4">
              Merci pour votre participation au tour {currentRound}.
              <br />
              {phase === 'vote1' && "Le tour 2 arrive bientôt."}
            </p>
            <div className="bg-gray-100 rounded-lg p-3">
              <span className="text-sm text-gray-600">
                {voterCount} personne{voterCount > 1 ? 's ont' : ' a'} voté
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="card mb-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">
                  {currentRound === 1 
                    ? `Choisissez jusqu'à ${maxVotes} noms`
                    : 'Votez pour votre favori'
                  }
                </h2>
                <span className="text-sm text-gray-500">
                  {selectedIds.length}/{maxVotes}
                </span>
              </div>

              <div className="space-y-3">
                {displayedShortlist.map((item, index) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleSelection(item.id)}
                      className={`
                        w-full text-left p-4 rounded-xl border-2 transition-all
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`
                          w-6 h-6 rounded-full border-2 flex items-center justify-center
                          ${isSelected 
                            ? 'bg-blue-500 border-blue-500 text-white' 
                            : 'border-gray-300'
                          }
                        `}>
                          {isSelected && '✓'}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-lg">{item.name}</div>
                          {item.subtitle && (
                            <div className="text-sm italic text-gray-600">{item.subtitle}</div>
                          )}
                          <div className="text-sm text-gray-500 mt-1">
                            {item.justification}
                          </div>
                          {phase === 'vote2' && (
                            <div className="text-xs text-gray-400 mt-1">
                              Tour 1 : {item.votesR1} vote{(item.votesR1 || 0) > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                        <span className={`
                          group-badge group-badge-${item.groupId}
                          text-xs
                        `}>
                          G{item.groupId}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
              <div className="max-w-lg mx-auto">
                <button
                  onClick={handleSubmitVote}
                  disabled={submitting || !isOnline || selectedIds.length === 0}
                  className="btn btn-primary w-full text-xl"
                >
                  {submitting 
                    ? '⏳ Envoi...' 
                    : `🗳️ Voter (${selectedIds.length}/${maxVotes})`
                  }
                </button>
              </div>
            </div>
          </>
        )}

        <div className="text-center mt-6">
          <button
            onClick={() => router.push(`/s/${sessionCode}`)}
            className="text-gray-500 text-sm underline"
          >
            ← Retour
          </button>
        </div>
      </div>
    </main>
  );
}
