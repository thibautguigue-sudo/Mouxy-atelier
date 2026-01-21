'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getStoredParticipantName, GROUP_NAMES } from '@/lib/utils';
import PhaseIndicator from '@/components/PhaseIndicator';
import OfflineIndicator from '@/components/OfflineIndicator';
import { Phase } from '@/lib/types';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionCode = params.sessionCode as string;
  
  const [participantName, setParticipantName] = useState('');
  const [phase, setPhase] = useState<Phase>('lobby');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const name = getStoredParticipantName();
    if (name) setParticipantName(name);

    // Récupérer les infos de session
    fetchSessionInfo();
  }, [sessionCode]);

  const fetchSessionInfo = async () => {
    try {
      const res = await fetch(`/api/session?code=${sessionCode}`);
      const data = await res.json();
      
      if (res.ok) {
        setPhase(data.phase);
      } else {
        setError(data.error || 'Session introuvable');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroup = (groupId: number) => {
    router.push(`/s/${sessionCode}/g/${groupId}`);
  };

  const handleGoToVote = () => {
    router.push(`/s/${sessionCode}/vote`);
  };

  const handleGoToResults = () => {
    router.push(`/s/${sessionCode}/results`);
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

  if (error) {
    return (
      <main className="min-h-screen p-4 flex items-center justify-center">
        <div className="card text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="btn btn-secondary"
          >
            Retour à l'accueil
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4">
      <OfflineIndicator />
      
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Session {sessionCode}
          </h1>
          {participantName && (
            <p className="text-gray-600">Bienvenue, {participantName} !</p>
          )}
        </div>

        <PhaseIndicator phase={phase} className="mb-6" />

        {/* Sélection des phases/actions selon la phase active */}
        {(phase === 'lobby' || phase === 'phase1' || phase === 'phase2') && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">
              Choisissez votre groupe
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5].map((groupId) => (
                <button
                  key={groupId}
                  onClick={() => handleSelectGroup(groupId)}
                  className={`
                    btn text-white text-xl font-bold
                    ${groupId === 1 ? 'bg-blue-500 hover:bg-blue-600' : ''}
                    ${groupId === 2 ? 'bg-green-500 hover:bg-green-600' : ''}
                    ${groupId === 3 ? 'bg-orange-500 hover:bg-orange-600' : ''}
                    ${groupId === 4 ? 'bg-purple-500 hover:bg-purple-600' : ''}
                    ${groupId === 5 ? 'bg-pink-500 hover:bg-pink-600 col-span-2' : ''}
                  `}
                >
                  {GROUP_NAMES[groupId]}
                </button>
              ))}
            </div>
          </div>
        )}

        {(phase === 'vote1' || phase === 'vote2') && (
          <div className="card text-center">
            <h2 className="text-lg font-semibold mb-4">
              🗳️ C'est l'heure du vote !
            </h2>
            <button
              onClick={handleGoToVote}
              className="btn btn-primary w-full text-xl"
            >
              Voter maintenant
            </button>
          </div>
        )}

        {phase === 'done' && (
          <div className="card text-center">
            <h2 className="text-lg font-semibold mb-4">
              ✅ L'atelier est terminé
            </h2>
            <button
              onClick={handleGoToResults}
              className="btn btn-success w-full text-xl"
            >
              Voir les résultats
            </button>
          </div>
        )}

        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 text-sm underline"
          >
            ← Quitter la session
          </button>
        </div>
      </div>
    </main>
  );
}
