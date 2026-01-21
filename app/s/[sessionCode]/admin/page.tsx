'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Phase, Word, Proposal, ShortlistItem, FORM_TYPES, WORD_TAGS } from '@/lib/types';
import { TAG_COLORS, FORM_COLORS, GROUP_NAMES, formatDate } from '@/lib/utils';
import WordCloud from '@/components/WordCloud';
import Toast, { useToast } from '@/components/Toast';

interface AdminData {
  session: {
    code: string;
    phase: Phase;
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
  finalResults: any;
}

const PHASES: { value: Phase; label: string; icon: string }[] = [
  { value: 'lobby', label: 'Lobby', icon: '⏳' },
  { value: 'phase1', label: 'Phase 1 - Mots', icon: '💭' },
  { value: 'phase2', label: 'Phase 2 - Noms', icon: '✍️' },
  { value: 'vote1', label: 'Vote Tour 1', icon: '🗳️' },
  { value: 'vote2', label: 'Vote Tour 2', icon: '🗳️' },
  { value: 'done', label: 'Terminé', icon: '✅' },
];

export default function AdminPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionCode = params.sessionCode as string;
  const adminKey = searchParams.get('key') || '';

  const { toast, showToast, hideToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<AdminData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'words' | 'proposals' | 'shortlist' | 'votes'>('overview');
  const [selectedForShortlist, setSelectedForShortlist] = useState<Set<string>>(new Set());
  const [filterTag, setFilterTag] = useState<string>('all');
  const [filterForm, setFilterForm] = useState<string>('all');

  // Fetch data
  const fetchData = useCallback(async () => {
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
  }, [sessionCode, adminKey]);

  useEffect(() => {
    if (!adminKey) {
      setError('Clé admin requise');
      setLoading(false);
      return;
    }
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData, adminKey]);

  // Change phase
  const handleSetPhase = async (newPhase: Phase) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: sessionCode,
          adminKey,
          action: 'setPhase',
          data: { phase: newPhase },
        }),
      });

      if (res.ok) {
        showToast(`Phase changée : ${newPhase}`, 'success');
        fetchData();
      } else {
        const json = await res.json();
        showToast(json.error || 'Erreur', 'error');
      }
    } catch (err) {
      showToast('Erreur réseau', 'error');
    }
  };

  // Publish shortlist
  const handlePublishShortlist = async () => {
    if (selectedForShortlist.size === 0) {
      showToast('Sélectionnez des propositions', 'error');
      return;
    }

    const items = data?.proposals
      .filter(p => selectedForShortlist.has(p.id))
      .map(p => ({
        id: p.id,
        name: p.name,
        justification: p.justification,
        subtitle: p.subtitle,
        groupId: p.groupId,
        form: p.form,
      }));

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: sessionCode,
          adminKey,
          action: 'publishShortlist',
          data: { items },
        }),
      });

      if (res.ok) {
        showToast(`Shortlist publiée (${items?.length} propositions)`, 'success');
        fetchData();
      } else {
        const json = await res.json();
        showToast(json.error || 'Erreur', 'error');
      }
    } catch (err) {
      showToast('Erreur réseau', 'error');
    }
  };

  // Toggle shortlist selection
  const toggleShortlistSelection = (id: string) => {
    const newSet = new Set(selectedForShortlist);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      if (newSet.size < 12) {
        newSet.add(id);
      } else {
        showToast('Maximum 12 propositions', 'info');
      }
    }
    setSelectedForShortlist(newSet);
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

  const filteredProposals = data.proposals.filter(p => {
    if (filterForm !== 'all' && p.form !== filterForm) return false;
    return true;
  });

  return (
    <main className="min-h-screen p-4 bg-gray-100">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow p-4 mb-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Admin • {data.session.code}</h1>
              <p className="text-gray-600">
                {data.session.communeName} • {data.participants.length} participants
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/s/${sessionCode}/export?key=${adminKey}`}
                className="btn btn-secondary text-sm"
              >
                📄 Export
              </a>
              <a
                href={`/s/${sessionCode}/results`}
                target="_blank"
                className="btn btn-secondary text-sm"
              >
                👁️ Résultats
              </a>
            </div>
          </div>
        </div>

        {/* Phase Control */}
        <div className="bg-white rounded-xl shadow p-4 mb-4">
          <h2 className="font-semibold mb-3">Pilotage des phases</h2>
          <div className="flex flex-wrap gap-2">
            {PHASES.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => handleSetPhase(value)}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all
                  ${data.session.phase === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                  }
                `}
              >
                {icon} {label}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Phase actuelle : <strong>{data.session.phase}</strong>
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow mb-4 overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
              { id: 'words', label: `Mots (${data.words.length})`, icon: '💭' },
              { id: 'proposals', label: `Propositions (${data.proposals.length})`, icon: '✍️' },
              { id: 'shortlist', label: `Shortlist (${data.shortlist.length})`, icon: '📋' },
              { id: 'votes', label: 'Votes', icon: '🗳️' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  px-4 py-3 font-medium whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-blue-600">{data.participants.length}</div>
                  <div className="text-sm text-blue-700">Participants</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-purple-600">{data.words.length}</div>
                  <div className="text-sm text-purple-700">Mots uniques</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-600">{data.proposals.length}</div>
                  <div className="text-sm text-green-700">Propositions</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-orange-600">{data.shortlist.length}</div>
                  <div className="text-sm text-orange-700">En shortlist</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-yellow-600">{data.voterCountR1}</div>
                  <div className="text-sm text-yellow-700">Votants Tour 1</div>
                </div>
                <div className="bg-pink-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-pink-600">{data.voterCountR2}</div>
                  <div className="text-sm text-pink-700">Votants Tour 2</div>
                </div>
              </div>
            )}

            {/* WORDS TAB */}
            {activeTab === 'words' && (
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setFilterTag('all')}
                    className={`px-3 py-1 rounded-full text-sm ${filterTag === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
                  >
                    Tous
                  </button>
                  {WORD_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setFilterTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm ${filterTag === tag ? TAG_COLORS[tag] : 'bg-gray-200'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <WordCloud 
                  words={data.words} 
                  filterTag={filterTag as any} 
                  maxWords={100} 
                />
              </div>
            )}

            {/* PROPOSALS TAB */}
            {activeTab === 'proposals' && (
              <div>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <select
                    value={filterForm}
                    onChange={(e) => setFilterForm(e.target.value)}
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="all">Toutes les formes</option>
                    {FORM_TYPES.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-500">
                    {selectedForShortlist.size}/12 sélectionnées pour shortlist
                  </span>
                  <button
                    onClick={handlePublishShortlist}
                    disabled={selectedForShortlist.size === 0}
                    className="btn btn-primary text-sm ml-auto"
                  >
                    📋 Publier shortlist
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">✓</th>
                        <th className="p-2 text-left">Nom</th>
                        <th className="p-2 text-left">Sous-titre</th>
                        <th className="p-2 text-left">Justification</th>
                        <th className="p-2 text-left">Forme</th>
                        <th className="p-2 text-left">Groupe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProposals.map(p => (
                        <tr 
                          key={p.id} 
                          className={`border-b hover:bg-gray-50 ${selectedForShortlist.has(p.id) ? 'bg-blue-50' : ''}`}
                        >
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={selectedForShortlist.has(p.id)}
                              onChange={() => toggleShortlistSelection(p.id)}
                              className="w-5 h-5"
                            />
                          </td>
                          <td className="p-2 font-medium">{p.name}</td>
                          <td className="p-2 text-gray-600 italic">{p.subtitle || '-'}</td>
                          <td className="p-2 text-gray-600 max-w-xs truncate">{p.justification}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${FORM_COLORS[p.form]}`}>
                              {FORM_TYPES.find(f => f.value === p.form)?.label}
                            </span>
                          </td>
                          <td className="p-2">
                            <span className={`group-badge group-badge-${p.groupId}`}>
                              {p.groupId}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SHORTLIST TAB */}
            {activeTab === 'shortlist' && (
              <div>
                {data.shortlist.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Aucune proposition en shortlist.
                    <br />
                    Allez dans l'onglet Propositions pour en sélectionner.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {[...data.shortlist]
                      .sort((a, b) => (b.votesR2 || 0) - (a.votesR2 || 0) || (b.votesR1 || 0) - (a.votesR1 || 0))
                      .map((item, index) => (
                        <div
                          key={item.id}
                          className={`
                            p-4 rounded-lg border-2
                            ${index === 0 ? 'border-yellow-400 bg-yellow-50' : ''}
                            ${index === 1 ? 'border-gray-400 bg-gray-50' : ''}
                            ${index === 2 ? 'border-orange-400 bg-orange-50' : ''}
                            ${index > 2 ? 'border-gray-200' : ''}
                          `}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-lg font-bold mr-2">#{index + 1}</span>
                              <span className="font-semibold">{item.name}</span>
                              {item.subtitle && (
                                <span className="text-gray-600 italic ml-2">— {item.subtitle}</span>
                              )}
                            </div>
                            <div className="flex gap-2 text-sm">
                              <span className="bg-blue-100 px-2 py-1 rounded">
                                R1: {item.votesR1 || 0}
                              </span>
                              <span className="bg-green-100 px-2 py-1 rounded">
                                R2: {item.votesR2 || 0}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{item.justification}</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* VOTES TAB */}
            {activeTab === 'votes' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Tour 1 • {data.voterCountR1} votants</h3>
                  {data.shortlist.length > 0 ? (
                    <div className="space-y-2">
                      {[...data.shortlist]
                        .sort((a, b) => (b.votesR1 || 0) - (a.votesR1 || 0))
                        .map(item => (
                          <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="truncate">{item.name}</span>
                            <span className="font-bold ml-2">{item.votesR1 || 0}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Pas encore de shortlist</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Tour 2 • {data.voterCountR2} votants</h3>
                  {data.shortlist.length > 0 ? (
                    <div className="space-y-2">
                      {[...data.shortlist]
                        .sort((a, b) => (b.votesR2 || 0) - (a.votesR2 || 0))
                        .slice(0, 3)
                        .map((item, idx) => (
                          <div 
                            key={item.id} 
                            className={`
                              flex justify-between items-center p-2 rounded
                              ${idx === 0 ? 'bg-yellow-100' : 'bg-gray-50'}
                            `}
                          >
                            <span className="truncate">
                              {idx === 0 && '🥇 '}
                              {idx === 1 && '🥈 '}
                              {idx === 2 && '🥉 '}
                              {item.name}
                            </span>
                            <span className="font-bold ml-2">{item.votesR2 || 0}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Pas encore de shortlist</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* QR Code info */}
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-sm text-gray-600">
            URL à partager : <strong>https://[votre-domaine]/s/{sessionCode}</strong>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Créez un QR code avec cette URL pour les participants
          </p>
        </div>
      </div>
    </main>
  );
}
