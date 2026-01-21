'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FinalResults } from '@/lib/types';
import { FORM_COLORS } from '@/lib/utils';
import WordCloud from '@/components/WordCloud';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionCode = params.sessionCode as string;

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<FinalResults | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResults();
  }, [sessionCode]);

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/session?code=${sessionCode}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      // Récupérer les résultats finaux via l'API admin (sans clé pour les résultats publics)
      // On utilise ici l'API shortlist qui contient les votes
      const shortlistRes = await fetch(`/api/shortlist?code=${sessionCode}`);
      const shortlistData = await shortlistRes.json();

      if (shortlistRes.ok && shortlistData.shortlist) {
        // Trier par votes R2 puis R1
        const sorted = [...shortlistData.shortlist].sort((a, b) => {
          const voteDiff = (b.votesR2 || 0) - (a.votesR2 || 0);
          if (voteDiff !== 0) return voteDiff;
          return (b.votesR1 || 0) - (a.votesR1 || 0);
        });

        if (sorted.length >= 3) {
          setResults({
            top1: sorted[0],
            alt1: sorted[1],
            alt2: sorted[2],
            wordsCloud: [],
            allProposals: [],
            sessionInfo: {
              code: sessionCode,
              adminKey: '',
              phase: 'done',
              createdAt: Date.now(),
              gentile: data.gentile,
              communeName: data.communeName,
            },
            completedAt: Date.now(),
          });
        }
      }

      // Récupérer les mots
      const wordsRes = await fetch(`/api/words?code=${sessionCode}`);
      const wordsData = await wordsRes.json();

      if (wordsRes.ok && results) {
        setResults(prev => prev ? { ...prev, wordsCloud: wordsData.words } : null);
      }

      setLoading(false);
    } catch (err) {
      setError('Erreur de chargement');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p>Chargement des résultats...</p>
        </div>
      </main>
    );
  }

  if (error || !results) {
    return (
      <main className="min-h-screen p-4 flex items-center justify-center">
        <div className="card text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-red-600 mb-4">{error || 'Résultats non disponibles'}</p>
          <button onClick={() => router.push(`/s/${sessionCode}`)} className="btn btn-secondary">
            Retour
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 Résultats
          </h1>
          <p className="text-gray-600">Session {sessionCode}</p>
        </div>

        {/* TOP 1 */}
        <div className="card mb-4 border-4 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50">
          <div className="text-center">
            <div className="text-4xl mb-2">🥇</div>
            <div className="text-xs text-yellow-600 font-semibold uppercase tracking-wide mb-1">
              Nom choisi
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {results.top1.name}
            </h2>
            {results.top1.finalSubtitle && (
              <p className="text-lg italic text-gray-700 mb-2">
                {results.top1.finalSubtitle}
              </p>
            )}
            <p className="text-sm text-gray-600 mb-3">
              {results.top1.justification}
            </p>
            <div className="flex justify-center gap-2 text-sm">
              <span className="bg-yellow-200 px-2 py-1 rounded">
                Tour 2: {results.top1.votesR2} votes
              </span>
              <span className="bg-gray-200 px-2 py-1 rounded">
                Tour 1: {results.top1.votesR1} votes
              </span>
            </div>
            {results.top1.risk && (
              <p className="text-xs text-orange-600 mt-3">
                ⚠️ Point de vigilance : {results.top1.risk}
              </p>
            )}
          </div>
        </div>

        {/* Alternatives */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* ALT 1 */}
          <div className="card border-2 border-gray-300 bg-gray-50">
            <div className="text-center">
              <div className="text-2xl mb-1">🥈</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Alternative 1
              </div>
              <h3 className="font-bold text-gray-900 mb-1">
                {results.alt1.name}
              </h3>
              {results.alt1.finalSubtitle && (
                <p className="text-xs italic text-gray-600">
                  {results.alt1.finalSubtitle}
                </p>
              )}
              <div className="text-xs text-gray-500 mt-2">
                {results.alt1.votesR2} / {results.alt1.votesR1} votes
              </div>
            </div>
          </div>

          {/* ALT 2 */}
          <div className="card border-2 border-gray-300 bg-gray-50">
            <div className="text-center">
              <div className="text-2xl mb-1">🥉</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Alternative 2
              </div>
              <h3 className="font-bold text-gray-900 mb-1">
                {results.alt2.name}
              </h3>
              {results.alt2.finalSubtitle && (
                <p className="text-xs italic text-gray-600">
                  {results.alt2.finalSubtitle}
                </p>
              )}
              <div className="text-xs text-gray-500 mt-2">
                {results.alt2.votesR2} / {results.alt2.votesR1} votes
              </div>
            </div>
          </div>
        </div>

        {results.wordsCloud && results.wordsCloud.length > 0 && (
          <div className="card">
            <h3 className="font-semibold mb-2 text-center">💭 Nuage de mots</h3>
            <WordCloud words={results.wordsCloud} maxWords={25} showCounts={false} />
          </div>
        )}

        <div className="text-center mt-6 space-y-3">
          <button
            onClick={() => router.push(`/s/${sessionCode}`)}
            className="btn btn-secondary w-full"
          >
            ← Retour à la session
          </button>
        </div>
      </div>
    </main>
  );
}
