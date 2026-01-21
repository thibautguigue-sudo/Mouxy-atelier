'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getStoredParticipantId,
  setStoredParticipantId,
  setStoredParticipantName,
  setStoredSessionCode,
  generateParticipantId,
} from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'choose' | 'join' | 'create'>('choose');
  const [sessionCode, setSessionCode] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [gentile, setGentile] = useState('Moussards');
  const [communeName, setCommuneName] = useState('Mouxy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionCode.trim() || !participantName.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/session/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: sessionCode.toUpperCase().trim(),
          participantName: participantName.trim(),
          participantId: getStoredParticipantId() || generateParticipantId(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la connexion');
        return;
      }

      // Stocker les infos
      setStoredParticipantId(data.participantId);
      setStoredParticipantName(participantName.trim());
      setStoredSessionCode(data.code);

      // Rediriger vers la sélection de groupe
      router.push(`/s/${data.code}`);
    } catch (err) {
      setError('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      setError('Veuillez définir une clé admin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminKey: adminKey.trim(),
          gentile: gentile.trim() || 'Moussards',
          communeName: communeName.trim() || 'Mouxy',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la création');
        return;
      }

      // Rediriger vers le dashboard admin
      router.push(`/s/${data.code}/admin?key=${adminKey.trim()}`);
    } catch (err) {
      setError('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 flex flex-col items-center justify-center">
      {!isOnline && (
        <div className="offline-banner">
          ⚠️ Vous êtes hors ligne
        </div>
      )}

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🗳️ Atelier Nom de Liste
          </h1>
          <p className="text-gray-600">
            Choisissons ensemble le nom de notre liste municipale
          </p>
        </div>

        {mode === 'choose' && (
          <div className="card space-y-4">
            <button
              onClick={() => setMode('join')}
              className="btn btn-primary w-full"
            >
              📱 Rejoindre une session
            </button>
            <button
              onClick={() => setMode('create')}
              className="btn btn-secondary w-full"
            >
              ⚙️ Créer une session (Admin)
            </button>
          </div>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoinSession} className="card space-y-4">
            <button
              type="button"
              onClick={() => setMode('choose')}
              className="text-blue-600 text-sm mb-2"
            >
              ← Retour
            </button>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code de session
              </label>
              <input
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                placeholder="Ex: MUXILA23"
                className="input uppercase"
                maxLength={10}
                autoComplete="off"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Votre prénom
              </label>
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Ex: Marie"
                className="input"
                maxLength={30}
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !isOnline}
              className="btn btn-primary w-full"
            >
              {loading ? '⏳ Connexion...' : '🚀 Rejoindre'}
            </button>
          </form>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreateSession} className="card space-y-4">
            <button
              type="button"
              onClick={() => setMode('choose')}
              className="text-blue-600 text-sm mb-2"
            >
              ← Retour
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clé admin (à mémoriser !)
              </label>
              <input
                type="text"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Ex: mouxy2026"
                className="input"
                maxLength={30}
                autoComplete="off"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Cette clé sera nécessaire pour accéder au dashboard admin
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la commune
              </label>
              <input
                type="text"
                value={communeName}
                onChange={(e) => setCommuneName(e.target.value)}
                placeholder="Ex: Mouxy"
                className="input"
                maxLength={30}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gentilé (nom des habitants)
              </label>
              <input
                type="text"
                value={gentile}
                onChange={(e) => setGentile(e.target.value)}
                placeholder="Ex: Moussards"
                className="input"
                maxLength={30}
              />
              <p className="text-xs text-gray-500 mt-1">
                Pourra être utilisé dans les propositions de noms
              </p>
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !isOnline}
              className="btn btn-success w-full"
            >
              {loading ? '⏳ Création...' : '✨ Créer la session'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          Atelier Muxila • Sessions expirables (8h)
        </p>
      </div>
    </main>
  );
}
