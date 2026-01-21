'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Word, Proposal, ShortlistItem, FORM_TYPES } from '@/lib/types';
import { TAG_COLORS, formatDate } from '@/lib/utils';

interface ExportData {
  session: {
    code: string;
    phase: string;
    gentile: string;
    communeName: string;
    createdAt: number;
  };
  words: Word[];
  proposals: Proposal[];
  shortlist: ShortlistItem[];
  participants: any[];
  voterCountR1: number;
  voterCountR2: number;
}

export default function ExportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionCode = params.sessionCode as string;
  const adminKey = searchParams.get('key') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<ExportData | null>(null);

  useEffect(() => {
    if (!adminKey) {
      setError('Clé admin requise');
      setLoading(false);
      return;
    }
    fetchData();
  }, [sessionCode, adminKey]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/admin?code=${sessionCode}&key=${adminKey}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Erreur');
        return;
      }

      setData(json);
      setLoading(false);
    } catch (err) {
      setError('Erreur de connexion');
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
        <div className="card text-center max-w-md">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => router.push('/')} className="btn btn-secondary">
            Retour à l'accueil
          </button>
        </div>
      </main>
    );
  }

  if (!data) return null;

  // Trier la shortlist par votes R2 puis R1
  const sortedShortlist = [...data.shortlist].sort((a, b) => {
    const diff = (b.votesR2 || 0) - (a.votesR2 || 0);
    if (diff !== 0) return diff;
    return (b.votesR1 || 0) - (a.votesR1 || 0);
  });

  const top1 = sortedShortlist[0];
  const alt1 = sortedShortlist[1];
  const alt2 = sortedShortlist[2];

  // Grouper les mots par tag
  const wordsByTag: Record<string, Word[]> = {};
  data.words.forEach(w => {
    if (!wordsByTag[w.tag]) wordsByTag[w.tag] = [];
    wordsByTag[w.tag].push(w);
  });

  // Trier les mots par count décroissant
  Object.values(wordsByTag).forEach(arr => arr.sort((a, b) => b.count - a.count));

  return (
    <>
      {/* Bouton d'impression - caché à l'impression */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => router.back()}
          className="btn btn-secondary"
        >
          ← Retour
        </button>
        <button
          onClick={handlePrint}
          className="btn btn-primary"
        >
          🖨️ Imprimer / PDF
        </button>
      </div>

      <main className="export-page p-8 max-w-4xl mx-auto bg-white">
        {/* En-tête */}
        <header className="text-center mb-8 pb-6 border-b-2 border-gray-300">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🗳️ Atelier Nom de Liste
          </h1>
          <p className="text-lg text-gray-600">
            {data.session.communeName} • Session {data.session.code}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Gentilé : <strong>{data.session.gentile}</strong>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Généré le {formatDate(Date.now())}
          </p>
        </header>

        {/* Statistiques */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">📊 Statistiques de l'atelier</h2>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-3 print:border print:border-gray-300">
              <div className="text-2xl font-bold text-blue-600">{data.participants.length}</div>
              <div className="text-sm text-blue-700">Participants</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 print:border print:border-gray-300">
              <div className="text-2xl font-bold text-purple-600">{data.words.length}</div>
              <div className="text-sm text-purple-700">Mots</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 print:border print:border-gray-300">
              <div className="text-2xl font-bold text-green-600">{data.proposals.length}</div>
              <div className="text-sm text-green-700">Propositions</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 print:border print:border-gray-300">
              <div className="text-2xl font-bold text-orange-600">{data.voterCountR2}</div>
              <div className="text-sm text-orange-700">Votants (T2)</div>
            </div>
          </div>
        </section>

        {/* Résultats - Podium */}
        <section className="mb-8 page-break-after">
          <h2 className="text-xl font-bold mb-4 text-gray-800">🏆 Résultats du vote</h2>
          
          {top1 ? (
            <div className="space-y-4">
              {/* TOP 1 */}
              <div className="border-4 border-yellow-400 bg-yellow-50 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">🥇</div>
                <div className="text-xs text-yellow-600 font-semibold uppercase tracking-wide mb-2">
                  Nom choisi
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {top1.name}
                </h3>
                {top1.finalSubtitle && (
                  <p className="text-lg italic text-gray-700 mb-2">
                    {top1.finalSubtitle}
                  </p>
                )}
                {top1.subtitle && !top1.finalSubtitle && (
                  <p className="text-lg italic text-gray-700 mb-2">
                    {top1.subtitle}
                  </p>
                )}
                <p className="text-sm text-gray-600 mb-3">{top1.justification}</p>
                <div className="flex justify-center gap-4 text-sm">
                  <span className="bg-yellow-200 px-3 py-1 rounded">
                    Tour 2: {top1.votesR2 || 0} votes
                  </span>
                  <span className="bg-gray-200 px-3 py-1 rounded">
                    Tour 1: {top1.votesR1 || 0} votes
                  </span>
                </div>
                {top1.risk && (
                  <p className="text-sm text-orange-600 mt-4 border-t pt-3">
                    ⚠️ Point de vigilance : {top1.risk}
                  </p>
                )}
              </div>

              {/* Alternatives */}
              <div className="grid grid-cols-2 gap-4">
                {alt1 && (
                  <div className="border-2 border-gray-300 bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-2xl mb-1">🥈</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      Alternative 1
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{alt1.name}</h4>
                    {(alt1.finalSubtitle || alt1.subtitle) && (
                      <p className="text-sm italic text-gray-600 mb-2">
                        {alt1.finalSubtitle || alt1.subtitle}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">{alt1.justification}</p>
                    <div className="text-xs text-gray-400 mt-2">
                      T2: {alt1.votesR2 || 0} • T1: {alt1.votesR1 || 0}
                    </div>
                  </div>
                )}

                {alt2 && (
                  <div className="border-2 border-gray-300 bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-2xl mb-1">🥉</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      Alternative 2
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{alt2.name}</h4>
                    {(alt2.finalSubtitle || alt2.subtitle) && (
                      <p className="text-sm italic text-gray-600 mb-2">
                        {alt2.finalSubtitle || alt2.subtitle}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">{alt2.justification}</p>
                    <div className="text-xs text-gray-400 mt-2">
                      T2: {alt2.votesR2 || 0} • T1: {alt2.votesR1 || 0}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">Pas encore de résultats</p>
          )}
        </section>

        {/* Nuage de mots */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">💭 Nuage de mots</h2>
          
          {Object.entries(wordsByTag).map(([tag, words]) => (
            <div key={tag} className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">
                {tag} ({words.length} mots)
              </h3>
              <div className="flex flex-wrap gap-2">
                {words.slice(0, 20).map(w => (
                  <span
                    key={`${w.tag}-${w.word}`}
                    className="inline-block px-2 py-1 rounded text-sm bg-gray-100 border border-gray-200"
                    style={{ fontSize: `${Math.min(1.5, 0.8 + w.count * 0.1)}rem` }}
                  >
                    {w.word} <span className="text-gray-400">({w.count})</span>
                  </span>
                ))}
              </div>
            </div>
          ))}

          {data.words.length === 0 && (
            <p className="text-gray-500">Aucun mot collecté</p>
          )}
        </section>

        {/* Classement complet */}
        <section className="mb-8 page-break-before">
          <h2 className="text-xl font-bold mb-4 text-gray-800">📋 Classement complet (shortlist)</h2>
          
          {sortedShortlist.length > 0 ? (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left border">#</th>
                  <th className="p-2 text-left border">Nom</th>
                  <th className="p-2 text-left border">Sous-titre</th>
                  <th className="p-2 text-left border">Justification</th>
                  <th className="p-2 text-center border">T1</th>
                  <th className="p-2 text-center border">T2</th>
                </tr>
              </thead>
              <tbody>
                {sortedShortlist.map((item, index) => (
                  <tr key={item.id} className={index < 3 ? 'bg-yellow-50' : ''}>
                    <td className="p-2 border font-bold">{index + 1}</td>
                    <td className="p-2 border font-medium">{item.name}</td>
                    <td className="p-2 border text-gray-600 italic">
                      {item.finalSubtitle || item.subtitle || '-'}
                    </td>
                    <td className="p-2 border text-gray-600 text-xs">{item.justification}</td>
                    <td className="p-2 border text-center">{item.votesR1 || 0}</td>
                    <td className="p-2 border text-center font-bold">{item.votesR2 || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Aucune proposition en shortlist</p>
          )}
        </section>

        {/* Toutes les propositions */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            📝 Toutes les propositions ({data.proposals.length})
          </h2>
          
          {data.proposals.length > 0 ? (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-1 text-left border">Nom</th>
                  <th className="p-1 text-left border">Forme</th>
                  <th className="p-1 text-left border">Groupe</th>
                  <th className="p-1 text-left border">Justification</th>
                </tr>
              </thead>
              <tbody>
                {data.proposals.map(p => (
                  <tr key={p.id}>
                    <td className="p-1 border font-medium">{p.name}</td>
                    <td className="p-1 border">
                      {FORM_TYPES.find(f => f.value === p.form)?.label || p.form}
                    </td>
                    <td className="p-1 border text-center">G{p.groupId}</td>
                    <td className="p-1 border text-gray-600">{p.justification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Aucune proposition</p>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 pt-4 border-t mt-8">
          <p>Document généré par Atelier Nom de Liste • {new Date().toLocaleDateString('fr-FR')}</p>
          <p>Session {data.session.code} • {data.participants.length} participants</p>
        </footer>
      </main>

      {/* Styles d'impression */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .export-page {
            max-width: 100%;
            padding: 0;
            margin: 0;
          }
          
          .page-break-after {
            page-break-after: always;
          }
          
          .page-break-before {
            page-break-before: always;
          }
          
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          thead {
            display: table-header-group;
          }
          
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>
    </>
  );
}
